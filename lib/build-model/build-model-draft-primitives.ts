import type {
  BoardsmithBuildModel,
  BuildModelConnection,
  BuildModelHardware,
  BuildModelOperation,
  BuildModelPiece,
} from "@/lib/build-model/build-model-schema";
import type { Project, ProjectType, SkillLevel } from "@/lib/projects/types";

export type BuildModelDraftProject = Omit<
  Pick<
    Project,
    | "id"
    | "title"
    | "project_type"
    | "skill_level"
    | "width_inches"
    | "height_inches"
    | "depth_inches"
    | "material_thickness_inches"
    | "material_type"
    | "shelf_layout"
    | "shelf_count"
    | "shelf_spacing_inches"
    | "tools_available"
    | "style_notes"
    | "intended_use"
  >,
  "project_type" | "skill_level" | "width_inches" | "height_inches" | "depth_inches" | "material_thickness_inches"
> & {
  project_type: ProjectType;
  skill_level: SkillLevel;
  width_inches: number | null;
  height_inches: number | null;
  depth_inches: number | null;
  material_thickness_inches: number | null;
};

export type BuildModelDraftParts = {
  pieces: BuildModelPiece[];
  hardware: BuildModelHardware[];
  connections: BuildModelConnection[];
  operations: BuildModelOperation[];
  assumptions: string[];
  unresolvedQuestions: string[];
  exportReadiness: BoardsmithBuildModel["exportReadiness"];
};

export function toStableSnakeCaseId(value: string): string {
  const id = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

  return /^[a-z]/.test(id) ? id : `item_${id || "unknown"}`;
}

export function positiveOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function textIncludes(project: BuildModelDraftProject, terms: RegExp): boolean {
  return terms.test(`${project.title} ${project.style_notes} ${project.intended_use}`.toLowerCase());
}

export function makeBuildModelPiece(params: {
  id: string;
  label: string;
  quantity?: number;
  pieceType: BuildModelPiece["pieceType"];
  materialId: string | null;
  lengthInches: number | null;
  widthInches: number | null;
  thicknessInches: number | null;
  grainDirection?: BuildModelPiece["grainDirection"];
  notes?: string[];
}): BuildModelPiece {
  return {
    id: params.id,
    label: params.label,
    quantity: params.quantity ?? 1,
    pieceType: params.pieceType,
    materialId: params.materialId,
    dimensions: {
      lengthInches: positiveOrNull(params.lengthInches),
      widthInches: positiveOrNull(params.widthInches),
      thicknessInches: positiveOrNull(params.thicknessInches),
    },
    grainDirection: params.grainDirection ?? "unknown",
    notes: params.notes ?? [],
  };
}

export function createBuildModelHardware(params: {
  id: string;
  label: string;
  hardwareType: BuildModelHardware["hardwareType"];
  quantity?: number | null;
  sizeDescription?: string | null;
  required?: boolean;
  notes?: string[];
}): BuildModelHardware {
  return {
    id: params.id,
    label: params.label,
    quantity: params.quantity ?? null,
    hardwareType: params.hardwareType,
    sizeDescription: params.sizeDescription ?? null,
    required: params.required ?? true,
    notes: params.notes ?? [],
  };
}

export function createBuildModelOperation(params: {
  id: string;
  sequenceNumber: number;
  operationType: BuildModelOperation["operationType"];
  title: string;
  description: string;
  pieceIds: string[];
  toolNames?: string[];
  safetyNotes?: string[];
  estimatedMinutes?: number | null;
}): BuildModelOperation {
  return {
    id: params.id,
    sequenceNumber: params.sequenceNumber,
    operationType: params.operationType,
    title: params.title,
    description: params.description,
    pieceIds: params.pieceIds,
    toolNames: params.toolNames ?? [],
    safetyNotes: params.safetyNotes ?? [],
    estimatedMinutes: params.estimatedMinutes ?? null,
  };
}
