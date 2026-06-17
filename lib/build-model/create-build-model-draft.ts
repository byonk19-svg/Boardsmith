import {
  parseBoardsmithBuildModel,
  type BoardsmithBuildModel,
  type BuildModelMaterial,
  type BuildModelSafetyFlag,
} from "@/lib/build-model/build-model-schema";
import {
  positiveOrNull,
  toStableSnakeCaseId,
  type BuildModelDraftProject,
} from "@/lib/build-model/build-model-draft-primitives";
import { createSupportedProjectTypeDraftParts } from "@/lib/build-model/supported-project-type-drafting";
import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { projectTypes, type ProjectType } from "@/lib/projects/types";
import { analyzeWallShelfMountingIntent } from "@/lib/projects/wall-shelf-intent";
import type { SafetyReviewFlag } from "@/lib/safety/safety-review";
import { getTemplateHint, type TemplateHint } from "@/lib/templates/template-hints";

export { toStableSnakeCaseId, type BuildModelDraftProject } from "@/lib/build-model/build-model-draft-primitives";

const genericDisclaimer = "Boardsmith build models are review aids. Verify dimensions, tools, materials, and safety requirements before building.";
const noLoadDisclaimer = "Boardsmith cannot verify load capacity, wall mounting safety, child safety, or structural performance.";

function isSupportedProjectType(projectType: string): projectType is ProjectType {
  return projectTypes.some((supportedType) => supportedType === projectType);
}

function isWallGuidance(message: string): boolean {
  return /\b(wall|mount|mounted|mounting|bracket|anchor|stud)\b/.test(message.toLowerCase());
}

function materialTypeFromLabel(label: string): BuildModelMaterial["materialType"] {
  const normalized = label.toLowerCase();
  if (normalized.includes("plywood")) return "plywood";
  if (normalized.includes("mdf")) return "mdf";
  if (normalized.includes("hardwood") || normalized.includes("oak") || normalized.includes("maple") || normalized.includes("walnut")) return "hardwood";
  if (normalized.includes("pine") || normalized.includes("cedar") || normalized.includes("fir")) return "softwood";
  if (normalized.includes("wood") || normalized.includes("board")) return "solid_wood";
  if (normalized.trim().length === 0) return "unknown";
  return "other";
}

function createPrimaryMaterial(project: BuildModelDraftProject): BuildModelMaterial {
  const label = project.material_type.trim() || "Unknown material";

  return {
    id: toStableSnakeCaseId(label),
    label,
    materialType: materialTypeFromLabel(label),
    nominalThicknessInches: positiveOrNull(project.material_thickness_inches),
    recommendedForProject: materialTypeFromLabel(label) !== "unknown",
    notes: ["Derived from project intake material type."],
  };
}

function mapSafetyFlag(flag: SafetyReviewFlag): BuildModelSafetyFlag {
  const categoryByCode: Record<string, BuildModelSafetyFlag["category"]> = {
    wall_mounting: "wall_mounting",
    child_or_baby_use: "child_use",
    seating_or_load_bearing: "seating",
    ladder_or_platform: "ladder_or_platform",
    heavy_shelving: "heavy_shelving",
    electrical_or_lighted: "electrical",
    outdoor_load_exposure: "outdoor_exposure",
    unclear_dimensions: "unclear_dimensions",
    missing_material_thickness: "missing_material_thickness",
    shelf_layout_missing: "unclear_dimensions",
    shelf_height_impossible: "unclear_dimensions",
    connected_shelf_support_incomplete: "wall_mounting",
  };

  const highReviewCodes = new Set([
    "wall_mounting",
    "child_or_baby_use",
    "seating_or_load_bearing",
    "ladder_or_platform",
    "heavy_shelving",
    "shelf_layout_missing",
    "shelf_height_impossible",
    "connected_shelf_support_incomplete",
  ]);
  const category = categoryByCode[flag.code] ?? "other";

  return {
    id: toStableSnakeCaseId(flag.code),
    category,
    severity: highReviewCodes.has(flag.code) ? "high_review" : "caution",
    message: flag.label,
    recommendedAction: flag.reason,
  };
}

function missingDimensionQuestions(project: BuildModelDraftProject): string[] {
  const questions: string[] = [];
  if (!positiveOrNull(project.width_inches)) questions.push("What is the finished project width?");
  if (!positiveOrNull(project.height_inches)) questions.push("What is the finished project height?");
  if ((project.project_type === "simple_shelf" || project.project_type === "planter_box") && !positiveOrNull(project.depth_inches)) {
    questions.push("What is the finished project depth?");
  }
  if (!positiveOrNull(project.material_thickness_inches)) questions.push("What material thickness should be used?");
  return questions;
}

function confidenceFor(project: BuildModelDraftProject, safetyFlags: BuildModelSafetyFlag[], unresolvedQuestions: string[]): BoardsmithBuildModel["confidence"] {
  const hasHighReview = safetyFlags.some((flag) => flag.severity === "high_review");
  const hasMissingCoreData = !positiveOrNull(project.width_inches) || !positiveOrNull(project.height_inches) || !positiveOrNull(project.material_thickness_inches);
  const shelfMissingMountingContext = project.project_type === "simple_shelf" && (hasHighReview || !positiveOrNull(project.depth_inches));
  const shelfLayoutMissing = analyzeShelfLayoutIntent(project).missingShelfCount;

  if (hasHighReview || hasMissingCoreData || shelfMissingMountingContext || shelfLayoutMissing || unresolvedQuestions.length >= 3) {
    return {
      level: "low",
      reasons: shelfLayoutMissing
        ? ["Shelf count/layout is missing, so Boardsmith cannot treat this as a complete shelf plan."]
        : ["Important dimensions, mounting details, or safety review items remain unresolved."],
    };
  }

  return {
    level: "medium",
    reasons: ["The draft is deterministic and conservative; builder review is still required."],
  };
}

export function createBuildModelDraft(
  project: BuildModelDraftProject,
  templateHint: TemplateHint = getTemplateHint(project.project_type),
  safetyFlags: SafetyReviewFlag[] = [],
): BoardsmithBuildModel {
  if (!isSupportedProjectType(project.project_type)) {
    throw new Error(`Unsupported project type: ${String(project.project_type)}`);
  }

  const material = createPrimaryMaterial(project);
  const wallMounted = analyzeWallShelfMountingIntent(project).wallMounted || safetyFlags.some((flag) => flag.code === "wall_mounting");
  const mappedSafetyFlags = safetyFlags.map((flag) => mapSafetyFlag(flag));
  const parts = createSupportedProjectTypeDraftParts({
    project,
    materialId: material.id,
    templateHint,
    wallMounted,
  });
  const unresolvedQuestions = [...new Set([...missingDimensionQuestions(project), ...parts.unresolvedQuestions])];
  const templateAssumptions =
    !wallMounted && project.project_type === "simple_shelf"
      ? [...templateHint.assumptions, ...templateHint.cautions].filter((message) => !isWallGuidance(message))
      : [...templateHint.assumptions, ...templateHint.cautions];
  const assumptions = [...new Set([...templateAssumptions, ...parts.assumptions])];
  const reviewRequired = mappedSafetyFlags.length > 0 || wallMounted || project.project_type === "planter_box";
  const safetyDisclaimers = [
    genericDisclaimer,
    noLoadDisclaimer,
    ...(wallMounted ? ["Wall mounting requires manual review of hardware, anchors, studs, and wall structure."] : []),
  ];
  const confidence = confidenceFor(project, mappedSafetyFlags, unresolvedQuestions);

  return parseBoardsmithBuildModel({
    schemaVersion: "1.0",
    units: "inches",
    project: {
      projectId: project.id,
      projectType: project.project_type,
      title: project.title,
      intendedUse: project.intended_use || null,
      skillLevel: project.skill_level,
    },
    dimensions: {
      widthInches: positiveOrNull(project.width_inches),
      heightInches: positiveOrNull(project.height_inches),
      depthInches: positiveOrNull(project.depth_inches),
      materialThicknessInches: positiveOrNull(project.material_thickness_inches),
    },
    pieces: parts.pieces,
    materials: [material],
    hardware: parts.hardware,
    connections: parts.connections,
    operations: parts.operations,
    safety: {
      reviewRequired,
      flags: mappedSafetyFlags,
      disclaimers: safetyDisclaimers,
    },
    assumptions,
    unresolvedQuestions,
    exportReadiness: parts.exportReadiness,
    confidence,
  });
}
