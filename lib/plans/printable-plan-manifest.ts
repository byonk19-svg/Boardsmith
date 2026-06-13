import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { createBuildStepCards, type BuildStepCard } from "@/lib/plans/build-step-cards";
import { buildWallShelfDiagramModel, type WallShelfDiagramModel } from "@/lib/diagrams/wall-shelf-diagram-model";
import { summarizeCutListReview, type CutListReviewSummary } from "@/lib/plans/cut-list-review";
import { summarizeExportReadiness, type ExportReadinessSummary } from "@/lib/plans/export-readiness";
import { summarizeMaterialReview, type MaterialReviewSummary } from "@/lib/plans/material-summary";
import { createPlanActionChecklist, type PlanActionChecklistItem } from "@/lib/plans/plan-action-checklist";
import { createPlanDiagrams, type PlanningDiagramSummary } from "@/lib/plans/plan-diagrams";
import { summarizeGeneratedPlanReview, type GeneratedPlanReviewSummary } from "@/lib/plans/plan-quality";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import { formatToolLabel, projectTypeLabels, type Project } from "@/lib/projects/types";

export type PrintablePlanBuildModelSource = "saved" | "derived";

export type PrintablePlanManifestInput = {
  project: Project;
  planRecord: GeneratedProjectPlanRecord | null;
  buildModel: BoardsmithBuildModel;
  buildModelSource: PrintablePlanBuildModelSource;
};

export type PrintablePlanManifest = {
  manifestVersion: "1.0";
  project: {
    id: string;
    title: string;
    projectType: Project["project_type"];
    projectTypeLabel: string;
    skillLevel: Project["skill_level"];
    status: Project["status"];
    intake: {
      dimensions: string;
      dimensionFacts: { label: string; value: string }[];
      material: string;
      tools: string[];
      intendedUse: string;
      styleNotes: string | null;
      safetyReviewRequired: boolean;
      safetyFlags: string[];
    };
  };
  generatedPlan: {
    id: string;
    createdAt: string;
    modelName: string;
    summary: string;
    confidenceLevel: GeneratedPlan["confidence_level"];
    estimatedDifficulty: GeneratedPlan["estimated_difficulty"];
    estimatedTime: string;
  } | null;
  buildModel: {
    available: boolean;
    source: PrintablePlanBuildModelSource;
    schemaVersion: BoardsmithBuildModel["schemaVersion"];
    units: BoardsmithBuildModel["units"];
    confidenceLevel: BoardsmithBuildModel["confidence"]["level"];
    pieceCount: number;
    materialCount: number;
    operationCount: number;
  };
  materials: MaterialReviewSummary;
  cutList: CutListReviewSummary | null;
  planningDiagrams: PlanningDiagramSummary;
  wallShelfDiagram: WallShelfDiagramModel | null;
  buildStepCards: BuildStepCard[];
  actionChecklist: PlanActionChecklistItem[];
  planReview: GeneratedPlanReviewSummary | null;
  exportReadiness: ExportReadinessSummary | null;
  sections: {
    projectSummary: string | null;
    buildSteps: GeneratedPlan["assembly_steps"];
    modeledOperations: BoardsmithBuildModel["operations"];
    safetyNotes: string[];
    safetyFlags: BoardsmithBuildModel["safety"]["flags"];
    assumptions: string[];
    unresolvedQuestions: string[];
    finishingSteps: string[];
    beginnerTips: string[];
    futureExportReadinessNotes: string[];
    tools: string[];
  };
  disclaimers: string[];
  futureExportNotes: string[];
};

function formatProjectDimensions(project: Project): string {
  return `${project.width_inches.toString()} x ${project.height_inches.toString()} x ${project.depth_inches.toString()} in`;
}

function formatProjectDimensionFacts(project: Project): { label: string; value: string }[] {
  if (project.project_type === "simple_shelf") {
    return [
      { label: "Shelf width", value: `${project.width_inches.toString()} in` },
      { label: "Total project height", value: `${project.height_inches.toString()} in` },
      { label: "Shelf depth from wall", value: `${project.depth_inches.toString()} in` },
      { label: "Board thickness", value: `${project.material_thickness_inches.toString()} in` },
    ];
  }

  return [
    { label: "Width", value: `${project.width_inches.toString()} in` },
    { label: "Height", value: `${project.height_inches.toString()} in` },
    { label: "Depth", value: `${project.depth_inches.toString()} in` },
    { label: "Material thickness", value: `${project.material_thickness_inches.toString()} in` },
  ];
}

function formatProjectMaterial(project: Project): string {
  return `${project.material_type}, ${project.material_thickness_inches.toString()} in thick`;
}

function generatedPlanSummary(planRecord: GeneratedProjectPlanRecord | null) {
  if (!planRecord) return null;

  return {
    id: planRecord.id,
    createdAt: planRecord.created_at,
    modelName: planRecord.model_name,
    summary: planRecord.plan_json.project_summary,
    confidenceLevel: planRecord.confidence_level,
    estimatedDifficulty: planRecord.plan_json.estimated_difficulty,
    estimatedTime: planRecord.plan_json.estimated_time,
  };
}

function planSections(plan: GeneratedPlan | null, buildModel: BoardsmithBuildModel): PrintablePlanManifest["sections"] {
  return {
    projectSummary: plan?.project_summary ?? null,
    buildSteps: plan?.assembly_steps ?? [],
    modeledOperations: buildModel.operations,
    safetyNotes: plan?.safety_notes ?? [],
    safetyFlags: buildModel.safety.flags,
    assumptions: [...new Set([...(plan?.assumptions ?? []), ...buildModel.assumptions])],
    unresolvedQuestions: buildModel.unresolvedQuestions,
    finishingSteps: plan?.finishing_steps ?? [],
    beginnerTips: plan?.beginner_tips ?? [],
    futureExportReadinessNotes: [...new Set([...(plan?.svg_readiness_notes ?? []), ...buildModel.exportReadiness.notes])],
    tools: (plan?.tools ?? []).map(formatToolLabel),
  };
}

function baseDisclaimers(buildModel: BoardsmithBuildModel): string[] {
  return [
    "Boardsmith plans are planning aids, not professional engineering reviews.",
    "Verify dimensions, materials, hardware, tool setup, and site conditions before cutting or building.",
    "This MVP uses browser print only; no PDF or CAD download is generated.",
    ...buildModel.safety.disclaimers,
  ];
}

function futureExportNotes(planRecord: GeneratedProjectPlanRecord | null, exportReadiness: ExportReadinessSummary | null): string[] {
  if (!planRecord || !exportReadiness) {
    return ["Generate and validate a plan before using the browser-print build sheet."];
  }

  const notes = [
    "Advanced output checks can be reviewed later; no files or downloads are created here.",
    ...exportReadiness.exportReadinessNotes,
    ...exportReadiness.topMessages,
  ];

  if (exportReadiness.exportCandidates.length > 0) {
    notes.push(`Future output candidates for later review: ${exportReadiness.exportCandidates.join(", ")}.`);
  }

  return [...new Set(notes)];
}

function normalizeShelfSupportModel(project: Project, buildModel: BoardsmithBuildModel): BoardsmithBuildModel {
  if (project.project_type !== "simple_shelf" || !project.shelf_layout || !project.shelf_count || project.shelf_count <= 1) {
    return buildModel;
  }

  const shelfPieceQuantity = buildModel.pieces.find((piece) => piece.id === "shelf_board")?.quantity ?? project.shelf_count;
  const shelfCount = Math.max(project.shelf_count, shelfPieceQuantity);

  return {
    ...buildModel,
    hardware: buildModel.hardware.map((item) => {
      if (item.id !== "wall_brackets") return item;

      if (project.shelf_layout === "multiple_separate_shelves") {
        return {
          ...item,
          label: "Wall bracket placeholders",
          quantity: shelfCount * 2,
          notes: [
            `Cautious placeholder only: assumes 2 brackets per shelf, so ${shelfCount.toString()} shelves means ${(shelfCount * 2).toString()} brackets before final review.`,
            "Final hardware quantity depends on bracket type, expected load, wall structure, and support design.",
          ],
        };
      }

      return {
        ...item,
        label: "Support method to review",
        quantity: null,
        notes: [
          "Connected shelf units need verified side supports, frame, cleat, brackets, or another support method before hardware quantity can be trusted.",
          "Final hardware quantity depends on bracket type, expected load, wall structure, and support design.",
        ],
      };
    }),
    connections: buildModel.connections.map((connection) =>
      connection.id === "wall_brackets_to_shelf_board"
        ? {
            ...connection,
            safetyNotes: ["Each shelf needs a verified support method before mounting or loading."],
            notes:
              project.shelf_layout === "multi_shelf_unit"
                ? ["Connected shelf unit support/frame details are not specified; do not rely on a fixed bracket count."]
                : connection.notes,
          }
        : connection,
    ),
  };
}

export function createPrintablePlanManifest({
  project,
  planRecord,
  buildModel,
  buildModelSource,
}: PrintablePlanManifestInput): PrintablePlanManifest {
  const reviewBuildModel = normalizeShelfSupportModel(project, buildModel);
  const plan = planRecord?.plan_json ?? null;
  const planReview = plan ? summarizeGeneratedPlanReview(plan, reviewBuildModel, { buildModelSource }) : null;
  const exportReadiness = plan ? summarizeExportReadiness(plan, reviewBuildModel, { buildModelSource }) : null;
  const materials = summarizeMaterialReview(plan, reviewBuildModel);
  const cutList = plan ? summarizeCutListReview(plan, reviewBuildModel) : null;
  const wallShelfDiagram = buildWallShelfDiagramModel({ project, buildModel: reviewBuildModel, cutList });
  const actionChecklist = createPlanActionChecklist({
    buildModel: reviewBuildModel,
    materialReview: materials,
    cutListReview: cutList,
    planReview,
  });

  return {
    manifestVersion: "1.0",
    project: {
      id: project.id,
      title: project.title,
      projectType: project.project_type,
      projectTypeLabel: projectTypeLabels[project.project_type],
      skillLevel: project.skill_level,
      status: project.status,
      intake: {
        dimensions: formatProjectDimensions(project),
        dimensionFacts: formatProjectDimensionFacts(project),
        material: formatProjectMaterial(project),
        tools: project.tools_available.map(formatToolLabel),
        intendedUse: project.intended_use,
        styleNotes: project.style_notes || null,
        safetyReviewRequired: project.safety_review_required,
        safetyFlags: project.safety_flags,
      },
    },
    generatedPlan: generatedPlanSummary(planRecord),
    buildModel: {
      available: true,
      source: buildModelSource,
      schemaVersion: reviewBuildModel.schemaVersion,
      units: reviewBuildModel.units,
      confidenceLevel: reviewBuildModel.confidence.level,
      pieceCount: reviewBuildModel.pieces.length,
      materialCount: reviewBuildModel.materials.length,
      operationCount: reviewBuildModel.operations.length,
    },
    materials,
    cutList,
    planningDiagrams: createPlanDiagrams(reviewBuildModel),
    wallShelfDiagram,
    buildStepCards: plan ? createBuildStepCards(plan.assembly_steps, reviewBuildModel) : [],
    actionChecklist,
    planReview,
    exportReadiness,
    sections: planSections(plan, reviewBuildModel),
    disclaimers: [...new Set(baseDisclaimers(reviewBuildModel))],
    futureExportNotes: futureExportNotes(planRecord, exportReadiness),
  };
}
