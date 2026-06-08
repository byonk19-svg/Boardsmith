import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { generatedProjectPlanRecordSchema, type GeneratedPlan, type GeneratedProjectPlanRecord, renderPlanMarkdown } from "@/lib/plans/plan-schema";
import { projectBuildLogSchema, projectNotesSchema, projectSchema, type Project, type ProjectBuildLogInput, type ProjectIntake } from "@/lib/projects/types";
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
type ProjectRow = Omit<Project, "build_completed_at"> & { build_completed_at: string | null };
type ProjectInsert = Omit<
  Project,
  "notes" | "build_completed" | "build_completed_at" | "build_actual_material" | "build_plan_changes" | "build_lessons_learned" | "archived_at"
> & {
  notes?: string;
  build_completed?: boolean;
  build_completed_at?: string | null;
  build_actual_material?: string;
  build_plan_changes?: string;
  build_lessons_learned?: string;
};
type ProjectUpdate = Partial<Omit<Project, "build_completed_at"> & { build_completed_at: string | null }>;

type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
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
    notes: typeof record.notes === "string" ? record.notes : "",
    build_completed: typeof record.build_completed === "boolean" ? record.build_completed : false,
    build_completed_at: typeof record.build_completed_at === "string" ? record.build_completed_at : "",
    build_actual_material: typeof record.build_actual_material === "string" ? record.build_actual_material : "",
    build_plan_changes: typeof record.build_plan_changes === "string" ? record.build_plan_changes : "",
    build_lessons_learned: typeof record.build_lessons_learned === "string" ? record.build_lessons_learned : "",
    archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
  });
}

function normalizePlanRow(row: unknown): GeneratedProjectPlanRecord {
  return generatedProjectPlanRecordSchema.parse(row);
}

function projectInsertRow(project: Project): ProjectInsert {
  const { notes, build_completed, build_completed_at, build_actual_material, build_plan_changes, build_lessons_learned, archived_at, ...insertableProject } = project;
  void notes;
  void build_completed;
  void build_completed_at;
  void build_actual_material;
  void build_plan_changes;
  void build_lessons_learned;
  void archived_at;
  return insertableProject;
}

async function readLocalStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      projects: parsed.projects.map((project) => normalizeProjectRow(project)),
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
    const { data, error } = await getSupabase().from("projects").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((project) => normalizeProjectRow(project));
  }

  const store = await readLocalStore();
  return [...store.projects].sort(compareProjectsByRecentUpdate);
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
    const { data, error } = await getSupabase().from("projects").insert(projectInsertRow(project)).select("*").single();
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

export async function updateProjectNotes(projectId: string, notes: string): Promise<Project | null> {
  const parsedNotes = projectNotesSchema.parse(notes);
  const now = new Date().toISOString();

  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase().from("projects").update({ notes: parsedNotes }).eq("id", projectId).select("*").single();
    if (error) throw new Error(error.message);
    return normalizeProjectRow(data);
  }

  return mutateLocalStore((store) => {
    const project = store.projects.find((candidate) => candidate.id === projectId);
    if (!project) return null;

    project.notes = parsedNotes;
    project.updated_at = now;
    return project;
  });
}

export async function updateProjectBuildLog(projectId: string, input: ProjectBuildLogInput): Promise<Project | null> {
  const parsedBuildLog = projectBuildLogSchema.parse(input);
  const now = new Date().toISOString();

  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase()
      .from("projects")
      .update({
        build_completed: parsedBuildLog.build_completed,
        build_completed_at: parsedBuildLog.build_completed_at.length > 0 ? parsedBuildLog.build_completed_at : null,
        build_actual_material: parsedBuildLog.build_actual_material,
        build_plan_changes: parsedBuildLog.build_plan_changes,
        build_lessons_learned: parsedBuildLog.build_lessons_learned,
      })
      .eq("id", projectId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeProjectRow(data);
  }

  return mutateLocalStore((store) => {
    const project = store.projects.find((candidate) => candidate.id === projectId);
    if (!project) return null;

    project.build_completed = parsedBuildLog.build_completed;
    project.build_completed_at = parsedBuildLog.build_completed_at;
    project.build_actual_material = parsedBuildLog.build_actual_material;
    project.build_plan_changes = parsedBuildLog.build_plan_changes;
    project.build_lessons_learned = parsedBuildLog.build_lessons_learned;
    project.updated_at = now;
    return project;
  });
}

export async function archiveProject(projectId: string): Promise<Project | null> {
  const archivedAt = new Date().toISOString();

  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase().from("projects").update({ archived_at: archivedAt }).eq("id", projectId).select("*").single();
    if (error) throw new Error(error.message);
    return normalizeProjectRow(data);
  }

  return mutateLocalStore((store) => {
    const project = store.projects.find((candidate) => candidate.id === projectId);
    if (!project) return null;

    project.archived_at = archivedAt;
    project.updated_at = archivedAt;
    return project;
  });
}

export async function restoreProject(projectId: string): Promise<Project | null> {
  const now = new Date().toISOString();

  if (isSupabasePersistenceConfigured()) {
    const { data, error } = await getSupabase().from("projects").update({ archived_at: null }).eq("id", projectId).select("*").single();
    if (error) throw new Error(error.message);
    return normalizeProjectRow(data);
  }

  return mutateLocalStore((store) => {
    const project = store.projects.find((candidate) => candidate.id === projectId);
    if (!project) return null;

    project.archived_at = null;
    project.updated_at = now;
    return project;
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

function compareProjectsByRecentUpdate(a: Project, b: Project): number {
  const updatedComparison = b.updated_at.localeCompare(a.updated_at);
  if (updatedComparison !== 0) return updatedComparison;

  const createdComparison = b.created_at.localeCompare(a.created_at);
  if (createdComparison !== 0) return createdComparison;

  return a.title.localeCompare(b.title);
}
