import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { generatedProjectPlanRecordSchema, type GeneratedPlan, type GeneratedProjectPlanRecord, renderPlanMarkdown } from "@/lib/plans/plan-schema";
import { projectSchema, type Project, type ProjectIntake } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";

type StoreShape = {
  projects: Project[];
  plans: GeneratedProjectPlanRecord[];
};

const configuredDataFile = process.env.BOARDSMITH_DATA_FILE?.trim();
const dataFile = configuredDataFile && configuredDataFile.length > 0 ? configuredDataFile : path.join(process.cwd(), ".data", "boardsmith.json");

let writeQueue: Promise<unknown> = Promise.resolve();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Project;
        Update: Partial<Project>;
        Relationships: [];
      };
      generated_project_plans: {
        Row: Omit<GeneratedProjectPlanRecord, "plan_json" | "build_model_json"> & { plan_json: Json; build_model_json: Json | null };
        Insert: Omit<GeneratedProjectPlanRecord, "plan_json" | "build_model_json"> & { plan_json: Json; build_model_json: Json | null };
        Update: Partial<Omit<GeneratedProjectPlanRecord, "plan_json" | "build_model_json"> & { plan_json: Json; build_model_json: Json | null }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_generated_plan_atomic: {
        Args: {
          p_project_id: string;
          p_plan_id: string;
          p_created_at: string;
          p_model_name: string;
          p_plan_json: Json;
          p_build_model_json: Json | null;
          p_plan_markdown: string;
          p_warnings: Json;
          p_assumptions: Json;
          p_confidence_level: GeneratedPlan["confidence_level"];
        };
        Returns: (Omit<GeneratedProjectPlanRecord, "plan_json" | "build_model_json"> & { plan_json: Json; build_model_json: Json | null })[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function isSupabasePersistenceConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured.");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

function normalizeProjectRow(row: unknown): Project {
  const record = row as Record<string, unknown>;
  return projectSchema.parse({
    ...record,
    safety_flags: Array.isArray(record.safety_flags) ? record.safety_flags : [],
  });
}

function normalizePlanRow(row: unknown): GeneratedProjectPlanRecord {
  return generatedProjectPlanRecordSchema.parse(row);
}

async function readLocalStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      projects: parsed.projects.map((project) => projectSchema.parse(project)),
      plans: parsed.plans.map((plan) => generatedProjectPlanRecordSchema.parse(plan)),
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { projects: [], plans: [] };
    }

    throw error;
  }
}

async function writeLocalStore(store: StoreShape): Promise<void> {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

async function mutateLocalStore<T>(mutator: (store: StoreShape) => T | Promise<T>): Promise<T> {
  const next = writeQueue.then(async () => {
    const store = await readLocalStore();
    const result = await mutator(store);
    await writeLocalStore(store);
    return result;
  });

  writeQueue = next.catch(() => undefined);
  return next;
}

export async function listProjects(): Promise<Project[]> {
  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase().from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((project) => normalizeProjectRow(project));
  }

  const store = await readLocalStore();
  return [...store.projects].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getProject(projectId: string): Promise<Project | null> {
  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase().from("projects").select("*").eq("id", projectId).maybeSingle();
    if (error) throw new Error(error.message);
    const row: unknown = data;
    if (row === null) return null;
    return normalizeProjectRow(row);
  }

  const store = await readLocalStore();
  return store.projects.find((project) => project.id === projectId) ?? null;
}

export async function createProject(input: ProjectIntake): Promise<Project> {
  const now = new Date().toISOString();
  const flags = calculateSafetyReviewFlags(input);
  const project = projectSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    status: "draft",
    safety_review_required: flags.length > 0,
    safety_flags: flags.map((flag) => flag.label),
  });

  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase().from("projects").insert(project).select("*").single();
    if (error) throw new Error(error.message);
    return normalizeProjectRow(data);
  }

  return mutateLocalStore((store) => {
    store.projects.push(project);
    return project;
  });
}

export async function duplicateProject(projectId: string): Promise<Project | null> {
  const sourceProject = await getProject(projectId);
  if (!sourceProject) return null;

  return createProject({
    title: copyProjectTitle(sourceProject.title),
    project_type: sourceProject.project_type,
    skill_level: sourceProject.skill_level,
    width_inches: sourceProject.width_inches,
    height_inches: sourceProject.height_inches,
    depth_inches: sourceProject.depth_inches,
    material_thickness_inches: sourceProject.material_thickness_inches,
    material_type: sourceProject.material_type,
    tools_available: sourceProject.tools_available,
    style_notes: sourceProject.style_notes,
    intended_use: sourceProject.intended_use,
  });
}

export async function listGeneratedPlans(projectId: string): Promise<GeneratedProjectPlanRecord[]> {
  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase()
      .from("generated_project_plans")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((plan) => normalizePlanRow(plan));
  }

  const store = await readLocalStore();
  return store.plans.filter((plan) => plan.project_id === projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function saveGeneratedPlan(params: {
  projectId: string;
  modelName: string;
  plan: GeneratedPlan;
  buildModel?: BoardsmithBuildModel | null;
}): Promise<GeneratedProjectPlanRecord> {
  const now = new Date().toISOString();
  const record = generatedProjectPlanRecordSchema.parse({
    id: crypto.randomUUID(),
    project_id: params.projectId,
    created_at: now,
    model_name: params.modelName,
    plan_json: params.plan,
    build_model_json: params.buildModel ?? null,
    plan_markdown: renderPlanMarkdown(params.plan),
    validation_status: "valid",
    warnings: params.plan.safety_notes,
    assumptions: params.plan.assumptions,
    confidence_level: params.plan.confidence_level,
    is_latest: true,
  });

  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase()
      .rpc("save_generated_plan_atomic", {
        p_project_id: params.projectId,
        p_plan_id: record.id,
        p_created_at: now,
        p_model_name: record.model_name,
        p_plan_json: record.plan_json as Json,
        p_build_model_json: (record.build_model_json as Json | null) ?? null,
        p_plan_markdown: record.plan_markdown,
        p_warnings: record.warnings as Json,
        p_assumptions: record.assumptions as Json,
        p_confidence_level: record.confidence_level,
      })
      .single();
    if (error) throw new Error(error.message);

    return normalizePlanRow(data);
  }

  return mutateLocalStore((store) => {
    const project = store.projects.find((candidate) => candidate.id === params.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    for (const plan of store.plans) {
      if (plan.project_id === params.projectId) {
        plan.is_latest = false;
      }
    }

    project.status = "plan_generated";
    project.updated_at = now;
    store.plans.push(record);
    return record;
  });
}

function copyProjectTitle(title: string): string {
  const suffix = " copy";
  const maxTitleLength = 120;
  const baseTitle = title.trim();
  if (baseTitle.length + suffix.length <= maxTitleLength) {
    return `${baseTitle}${suffix}`;
  }

  return `${baseTitle.slice(0, maxTitleLength - suffix.length).trimEnd()}${suffix}`;
}
