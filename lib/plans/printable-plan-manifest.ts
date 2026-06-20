import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { createBuildStepCards, type BuildStepCard } from "@/lib/plans/build-step-cards";
import { buildWallShelfDiagramModel, type WallShelfDiagramModel } from "@/lib/diagrams/wall-shelf-diagram-model";
import { summarizeCutListReview, type CutListReviewSummary } from "@/lib/plans/cut-list-review";
import { summarizeExportReadiness, type ExportReadinessSummary } from "@/lib/plans/export-readiness";
import { summarizeMaterialReview, type MaterialReviewSummary } from "@/lib/plans/material-summary";
import { createPlanterBoxCutDiagramViewModel, type PlanterBoxCutDiagramViewModel } from "@/lib/plans/planter-box-cut-diagram-view-model";
import { createPlanterBoxPartScheduleViewModel, type PlanterBoxPartScheduleViewModel } from "@/lib/plans/planter-box-part-schedule-view-model";
import { createPlanterBoxStockBoardViewModel, type PlanterBoxStockBoardViewModel } from "@/lib/plans/planter-box-stock-board-view-model";
import { createPlanActionChecklist, type PlanActionChecklistItem } from "@/lib/plans/plan-action-checklist";
import { createPlanDiagrams, type PlanningDiagramSummary } from "@/lib/plans/plan-diagrams";
import { summarizeGeneratedPlanReview, type GeneratedPlanReviewSummary } from "@/lib/plans/plan-quality";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import { createWallShelfBuildStepViewModel, type WallShelfBuildStepViewModel } from "@/lib/plans/wall-shelf-build-step-view-model";
import { createWallShelfCutDiagramViewModel, type WallShelfCutDiagramViewModel } from "@/lib/plans/wall-shelf-cut-diagram-view-model";
import { createWallShelfDiagramViewModel, type WallShelfDiagramViewModel } from "@/lib/plans/wall-shelf-diagram-view-model";
import { createWallShelfPartScheduleViewModel, wallShelfPartRole, type WallShelfPartScheduleViewModel } from "@/lib/plans/wall-shelf-part-schedule-view-model";
import { createWallShelfPlanReadinessViewModel, type WallShelfPlanReadinessViewModel } from "@/lib/plans/wall-shelf-plan-readiness-view-model";
import { createWallShelfStockBoardViewModel, type WallShelfStockBoardViewModel } from "@/lib/plans/wall-shelf-stock-board-view-model";
import { findShelfLayoutIssues, hasConnectedShelfSupportPlaceholder, hasImpossibleShelfHeight } from "@/lib/projects/shelf-layout-validation";
import { formatToolLabel, projectTypeLabels, type Project } from "@/lib/projects/types";
import { analyzeWallShelfMountingIntent } from "@/lib/projects/wall-shelf-intent";

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
  planterBoxCutDiagramViewModel: PlanterBoxCutDiagramViewModel;
  planterBoxPartScheduleViewModel: PlanterBoxPartScheduleViewModel;
  planterBoxStockBoardViewModel: PlanterBoxStockBoardViewModel;
  wallShelfCutDiagramViewModel: WallShelfCutDiagramViewModel;
  wallShelfDiagramViewModel: WallShelfDiagramViewModel;
  wallShelfPartScheduleViewModel: WallShelfPartScheduleViewModel;
  wallShelfPlanReadinessViewModel: WallShelfPlanReadinessViewModel;
  wallShelfBuildStepViewModel: WallShelfBuildStepViewModel;
  wallShelfStockBoardViewModel: WallShelfStockBoardViewModel;
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
  if (hasImpossibleShelfHeight(project)) {
    return `${project.width_inches.toString()} x total height needs review x ${project.depth_inches.toString()} in`;
  }

  return `${project.width_inches.toString()} x ${project.height_inches.toString()} x ${project.depth_inches.toString()} in`;
}

function formatProjectDimensionFacts(project: Project): { label: string; value: string }[] {
  const totalHeightValue = hasImpossibleShelfHeight(project) ? "Total height needs review" : `${project.height_inches.toString()} in`;

  if (project.project_type === "simple_shelf") {
    if (project.shelf_layout === "single_shelf") {
      return [
        { label: "Shelf width", value: `${project.width_inches.toString()} in` },
        { label: "Shelf depth from wall", value: `${project.depth_inches.toString()} in` },
        { label: "Board thickness", value: `${project.material_thickness_inches.toString()} in` },
      ];
    }

    if (project.shelf_layout === "multiple_separate_shelves") {
      return [
        { label: "Shelf width", value: `${project.width_inches.toString()} in` },
        { label: "Shelf count", value: project.shelf_count ? project.shelf_count.toString() : "Shelf count needs review" },
        { label: "Shelf depth from wall", value: `${project.depth_inches.toString()} in` },
        { label: "Board thickness", value: `${project.material_thickness_inches.toString()} in` },
      ];
    }

    return [
      { label: "Shelf width", value: `${project.width_inches.toString()} in` },
      { label: "Total project height", value: totalHeightValue },
      { label: "Shelf depth from wall", value: `${project.depth_inches.toString()} in` },
      { label: "Board thickness", value: `${project.material_thickness_inches.toString()} in` },
    ];
  }

  return [
    { label: "Width", value: `${project.width_inches.toString()} in` },
    { label: "Height", value: totalHeightValue },
    { label: "Depth", value: `${project.depth_inches.toString()} in` },
    { label: "Material thickness", value: `${project.material_thickness_inches.toString()} in` },
  ];
}

function formatProjectMaterial(project: Project): string {
  return `${project.material_type}, ${project.material_thickness_inches.toString()} in thick`;
}

function generatedPlanSummary(planRecord: GeneratedProjectPlanRecord | null, project: Project, buildModel: BoardsmithBuildModel) {
  if (!planRecord) return null;

  const staleFreestandingPattern = /\bfreestanding\b|\bnon-mounted\b/i;
  const wallShelfMountingReview = analyzeWallShelfMountingIntent(project).wallMounted;
  const summary = hasConnectedShelfSupportPlaceholder(buildModel)
    ? "This saved plan needs support/frame review before it can be treated as a complete connected shelf unit. Confirm total height, side supports/frame, mounting method, and cut dimensions before building."
    : wallShelfMountingReview && staleFreestandingPattern.test(planRecord.plan_json.project_summary)
      ? "This saved wall-shelf plan needs mounting/support review before installation. Confirm support method, wall type, fasteners, expected load, and finish before building."
    : planRecord.plan_json.project_summary;

  return {
    id: planRecord.id,
    createdAt: planRecord.created_at,
    modelName: planRecord.model_name,
    summary,
    confidenceLevel: planRecord.confidence_level,
    estimatedDifficulty: planRecord.plan_json.estimated_difficulty,
    estimatedTime: planRecord.plan_json.estimated_time,
  };
}

function filterStaleWallShelfCopy(messages: string[], project: Project, buildModel: BoardsmithBuildModel): string[] {
  const wallShelfMountingReview = analyzeWallShelfMountingIntent(project).wallMounted;
  if (!hasConnectedShelfSupportPlaceholder(buildModel) && !wallShelfMountingReview) {
    return messages;
  }

  const staleFreestandingPattern = /\bfreestanding\b|\bnon-mounted\b/i;
  return messages.filter((message) => !staleFreestandingPattern.test(message));
}

function filterStaleWallShelfSummary(summary: string | null, project: Project, buildModel: BoardsmithBuildModel): string | null {
  if (!summary) return null;
  const staleFreestandingPattern = /\bfreestanding\b|\bnon-mounted\b/i;
  if ((hasConnectedShelfSupportPlaceholder(buildModel) || analyzeWallShelfMountingIntent(project).wallMounted) && staleFreestandingPattern.test(summary)) {
    return "This wall-shelf plan needs mounting/support review before installation.";
  }

  return summary;
}

function planSections(plan: GeneratedPlan | null, project: Project, buildModel: BoardsmithBuildModel): PrintablePlanManifest["sections"] {
  return {
    projectSummary: filterStaleWallShelfSummary(plan?.project_summary ?? null, project, buildModel),
    buildSteps: plan?.assembly_steps ?? [],
    modeledOperations: buildModel.operations,
    safetyNotes: filterStaleWallShelfCopy(plan?.safety_notes ?? [], project, buildModel),
    safetyFlags: buildModel.safety.flags,
    assumptions: filterStaleWallShelfCopy([...new Set([...(plan?.assumptions ?? []), ...buildModel.assumptions])], project, buildModel),
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
  const issues = findShelfLayoutIssues(project);
  const supportFrameLengthInches = hasImpossibleShelfHeight(project) ? null : project.height_inches;
  const existingSafetyFlagIds = new Set(buildModel.safety.flags.map((flag) => flag.id));
  const issueFlags = issues
    .filter((issue) => !existingSafetyFlagIds.has(issue.code))
    .map((issue) => ({
      id: issue.code,
      category: issue.code === "shelf_height_impossible" ? ("unclear_dimensions" as const) : ("wall_mounting" as const),
      severity: "high_review" as const,
      message: issue.label,
      recommendedAction: issue.recommendedAction,
    }));
  const supportPlaceholder =
    project.shelf_layout === "multi_shelf_unit" && !hasConnectedShelfSupportPlaceholder(buildModel) && !hasModeledSupportFrame(buildModel)
      ? [
          {
            id: "side_support_frame_placeholder",
            label: "Side support/frame placeholders",
            quantity: 2,
            pieceType: "other" as const,
            materialId: buildModel.materials[0]?.id ?? null,
            dimensions: {
              lengthInches: supportFrameLengthInches,
              widthInches: project.depth_inches,
              thicknessInches: project.material_thickness_inches,
            },
            grainDirection: "length" as const,
            notes: [
              "Connected shelf unit support/frame details are unresolved.",
              ...(supportFrameLengthInches ? [] : ["Total height needs review before support/frame piece dimensions can be trusted."]),
              "Confirm side supports, frame, cleats, or bracket design before cutting or assembly.",
            ],
          },
        ]
      : [];

  return {
    ...buildModel,
    pieces: [...buildModel.pieces, ...supportPlaceholder],
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
    operations: [
      ...buildModel.operations,
      ...(supportPlaceholder.length > 0 && !buildModel.operations.some((operation) => operation.id === "confirm_support_frame_design")
        ? [
            {
              id: "confirm_support_frame_design",
              sequenceNumber: buildModel.operations.length + 1,
              operationType: "inspect" as const,
              title: "Confirm support/frame design before assembly",
              description:
                "Choose verified side supports, frame, cleat, bracket, or other support method before assembling or mounting this connected shelf unit.",
              pieceIds: ["shelf_board", "side_support_frame_placeholder"],
              toolNames: [],
              safetyNotes: ["Do not treat shelf boards alone as a complete connected shelf unit."],
              estimatedMinutes: null,
            },
          ]
        : []),
    ],
    safety: {
      ...buildModel.safety,
      reviewRequired: buildModel.safety.reviewRequired || issueFlags.length > 0,
      flags: [...buildModel.safety.flags, ...issueFlags],
    },
    unresolvedQuestions: [
      ...buildModel.unresolvedQuestions,
      ...issues.map((issue) => issue.recommendedAction).filter((message) => !buildModel.unresolvedQuestions.includes(message)),
    ],
    confidence:
      issueFlags.length > 0
        ? {
            level: "low" as const,
            reasons: [...buildModel.confidence.reasons, "Shelf layout dimensions or support/frame details need review before this is a complete build packet."],
          }
        : buildModel.confidence,
  };
}

function hasModeledSupportFrame(buildModel: BoardsmithBuildModel): boolean {
  return buildModel.pieces.some((piece) => wallShelfPartRole(piece) === "support_frame");
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
  const materials = summarizeMaterialReview(plan, reviewBuildModel, { wallMountingReview: analyzeWallShelfMountingIntent(project).wallMounted });
  const cutList = plan ? summarizeCutListReview(plan, reviewBuildModel) : null;
  const planterBoxPartScheduleViewModel = createPlanterBoxPartScheduleViewModel({ buildModel: reviewBuildModel });
  const planterBoxCutDiagramViewModel = createPlanterBoxCutDiagramViewModel({ buildModel: reviewBuildModel });
  const planterBoxStockBoardViewModel = createPlanterBoxStockBoardViewModel({
    buildModel: reviewBuildModel,
    cutViewModel: planterBoxCutDiagramViewModel,
  });
  const wallShelfPartScheduleViewModel = createWallShelfPartScheduleViewModel({ buildModel: reviewBuildModel });
  const wallShelfCutDiagramViewModel = createWallShelfCutDiagramViewModel({ project, buildModel: reviewBuildModel });
  const wallShelfDiagramViewModel = createWallShelfDiagramViewModel({ project, buildModel: reviewBuildModel });
  const wallShelfStockBoardViewModel = createWallShelfStockBoardViewModel({
    project,
    buildModel: reviewBuildModel,
    cutViewModel: wallShelfCutDiagramViewModel,
  });
  const wallShelfBuildStepViewModel = createWallShelfBuildStepViewModel({
    project,
    buildModel: reviewBuildModel,
    diagramViewModel: wallShelfDiagramViewModel,
    cutViewModel: wallShelfCutDiagramViewModel,
  });
  const wallShelfPlanReadinessViewModel = createWallShelfPlanReadinessViewModel({
    project,
    buildModel: reviewBuildModel,
    diagramViewModel: wallShelfDiagramViewModel,
    cutViewModel: wallShelfCutDiagramViewModel,
    stockBoardViewModel: wallShelfStockBoardViewModel,
    buildStepViewModel: wallShelfBuildStepViewModel,
  });
  const wallShelfDiagram = buildWallShelfDiagramModel({ project, buildModel: reviewBuildModel, cutList, viewModel: wallShelfDiagramViewModel });
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
    generatedPlan: generatedPlanSummary(planRecord, project, reviewBuildModel),
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
    planningDiagrams: createPlanDiagrams(reviewBuildModel, { wallShelfViewModel: wallShelfDiagramViewModel }),
    planterBoxCutDiagramViewModel,
    planterBoxPartScheduleViewModel,
    planterBoxStockBoardViewModel,
    wallShelfCutDiagramViewModel,
    wallShelfDiagramViewModel,
    wallShelfPartScheduleViewModel,
    wallShelfPlanReadinessViewModel,
    wallShelfBuildStepViewModel,
    wallShelfStockBoardViewModel,
    wallShelfDiagram,
    buildStepCards:
      wallShelfBuildStepViewModel.status === "unsupported" && plan
        ? createBuildStepCards(plan.assembly_steps, reviewBuildModel)
        : wallShelfBuildStepViewModel.stepCards,
    actionChecklist,
    planReview,
    exportReadiness,
    sections: planSections(plan, project, reviewBuildModel),
    disclaimers: [...new Set(baseDisclaimers(reviewBuildModel))],
    futureExportNotes: futureExportNotes(planRecord, exportReadiness),
  };
}
