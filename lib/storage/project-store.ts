import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { generatedProjectPlanRecordSchema, type GeneratedPlan, type GeneratedProjectPlanRecord, renderPlanMarkdown } from "@/lib/plans/plan-schema";
import { projectSchema, type Project, type ProjectIntake } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";

type StoreShape = {
  projects: Project[];
  plans: GeneratedProjectPlanRecord[];
};

const dataFile = path.join(process.cwd(), ".data", "woodcut-wizard.json");

let writeQueue: Promise<unknown> = Promise.resolve();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        Row: Omit<GeneratedProjectPlanRecord, "plan_json"> & { plan_json: Json };
        Insert: Omit<GeneratedProjectPlanRecord, "plan_json"> & { plan_json: Json };
        Update: Partial<Omit<GeneratedProjectPlanRecord, "plan_json"> & { plan_json: Json }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function hasSupabaseConfig(): boolean {
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
  if (hasSupabaseConfig()) {
    const { data, error } = await getSupabase().from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((project) => normalizeProjectRow(project));
  }

  const store = await readLocalStore();
  return [...store.projects].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getProject(projectId: string): Promise<Project | null> {
  if (hasSupabaseConfig()) {
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

  if (hasSupabaseConfig()) {
    const { data, error } = await getSupabase().from("projects").insert(project).select("*").single();
    if (error) throw new Error(error.message);
    return normalizeProjectRow(data);
  }

  return mutateLocalStore((store) => {
    store.projects.push(project);
    return project;
  });
}

export async function listGeneratedPlans(projectId: string): Promise<GeneratedProjectPlanRecord[]> {
  if (hasSupabaseConfig()) {
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
}): Promise<GeneratedProjectPlanRecord> {
  const now = new Date().toISOString();
  const record = generatedProjectPlanRecordSchema.parse({
    id: crypto.randomUUID(),
    project_id: params.projectId,
    created_at: now,
    model_name: params.modelName,
    plan_json: params.plan,
    plan_markdown: renderPlanMarkdown(params.plan),
    validation_status: "valid",
    warnings: params.plan.safety_notes,
    assumptions: params.plan.assumptions,
    confidence_level: params.plan.confidence_level,
    is_latest: true,
  });

  if (hasSupabaseConfig()) {
    const supabase = getSupabase();
    const { error: unsetError } = await supabase
      .from("generated_project_plans")
      .update({ is_latest: false })
      .eq("project_id", params.projectId);
    if (unsetError) throw new Error(unsetError.message);

    const { data, error } = await supabase.from("generated_project_plans").insert(record as Database["public"]["Tables"]["generated_project_plans"]["Insert"]).select("*").single();
    if (error) throw new Error(error.message);

    const { error: projectError } = await supabase
      .from("projects")
      .update({ status: "plan_generated", updated_at: now })
      .eq("id", params.projectId);
    if (projectError) throw new Error(projectError.message);

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
