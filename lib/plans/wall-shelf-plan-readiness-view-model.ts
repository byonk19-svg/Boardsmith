import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { WallShelfBuildStepViewModel } from "@/lib/plans/wall-shelf-build-step-view-model";
import type { WallShelfCutDiagramViewModel } from "@/lib/plans/wall-shelf-cut-diagram-view-model";
import type { WallShelfDiagramViewModel } from "@/lib/plans/wall-shelf-diagram-view-model";
import type { WallShelfStockBoardViewModel } from "@/lib/plans/wall-shelf-stock-board-view-model";
import { findShelfLayoutIssues } from "@/lib/projects/shelf-layout-validation";
import type { Project } from "@/lib/projects/types";

export type WallShelfPlanReadinessStatus = "build_ready" | "needs_review" | "blocked" | "unsupported";
export type WallShelfPlanReadinessSeverity = "info" | "review" | "blocker";
export type WallShelfPlanReadinessSection = "dimensions" | "support/frame" | "cuts" | "buying plan" | "mounting" | "safety";

export type WallShelfPlanReadinessAction = {
  id: string;
  title: string;
  explanation: string;
  suggestedAction: string;
  relatedSection: WallShelfPlanReadinessSection;
  severity: WallShelfPlanReadinessSeverity;
  printLabel: string;
};

export type WallShelfPlanReadinessViewModel = {
  projectType: string;
  status: WallShelfPlanReadinessStatus;
  summary: string;
  actions: WallShelfPlanReadinessAction[];
  badges: string[];
  renderLabels: {
    title: "Plan Readiness / Next Actions";
    statusLabel: string;
    summaryLabel: string;
  };
};

type WallShelfReadinessProjectInput = Pick<
  Project,
  | "project_type"
  | "title"
  | "width_inches"
  | "height_inches"
  | "depth_inches"
  | "material_thickness_inches"
  | "material_type"
  | "shelf_layout"
  | "shelf_count"
  | "shelf_spacing_inches"
  | "style_notes"
  | "intended_use"
  | "safety_flags"
>;

function uniqueActions(actions: WallShelfPlanReadinessAction[]): WallShelfPlanReadinessAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function hasText(values: string[], terms: RegExp): boolean {
  return terms.test(values.join(" ").toLowerCase());
}

function supportFrameAction(severity: WallShelfPlanReadinessSeverity = "review"): WallShelfPlanReadinessAction {
  return {
    id: "support_frame_design",
    title: "Support/frame design needs review",
    explanation: "Connected shelf units need an explicit support method before the plan can be treated as complete.",
    suggestedAction: "Choose whether this is separate wall shelves, bracket-supported shelves, or a connected unit with side supports.",
    relatedSection: "support/frame",
    severity,
    printLabel: "Choose support/frame style",
  };
}

function stockBoardAction(severity: WallShelfPlanReadinessSeverity): WallShelfPlanReadinessAction {
  return {
    id: "stock_board_selection",
    title: "Stock board size needs selection",
    explanation: "The buying plan groups pieces by material, but it does not choose a store board, exact stock length, or optimized cut layout.",
    suggestedAction: "Choose available board size/stock length before treating the buying plan as final.",
    relatedSection: "buying plan",
    severity,
    printLabel: "Choose stock board length",
  };
}

function mountingSupportAction(severity: WallShelfPlanReadinessSeverity = "review"): WallShelfPlanReadinessAction {
  return {
    id: "mounting_support_method",
    title: "Mounting/support method unresolved",
    explanation: "Wall shelves need manual review of brackets, cleats, anchors, studs, fasteners, expected load, and wall type.",
    suggestedAction: "Confirm support method before mounting.",
    relatedSection: "mounting",
    severity,
    printLabel: "Confirm mounting/support",
  };
}

function cutDimensionAction(severity: WallShelfPlanReadinessSeverity): WallShelfPlanReadinessAction {
  return {
    id: "cut_dimensions_review",
    title: "Cut dimensions need review",
    explanation: "One or more modeled pieces has missing, placeholder, or review-only dimensions.",
    suggestedAction: "Confirm every missing length, width, thickness, or placeholder piece before cutting.",
    relatedSection: "cuts",
    severity,
    printLabel: "Confirm cut dimensions",
  };
}

function safetyAction(): WallShelfPlanReadinessAction {
  return {
    id: "safety_review",
    title: "Safety review still applies",
    explanation: "Boardsmith is a planning aid and cannot verify wall safety, load capacity, material condition, tool setup, or site conditions.",
    suggestedAction: "Review safety notes and use your own judgment before cutting, mounting, loading, or using the shelf.",
    relatedSection: "safety",
    severity: "info",
    printLabel: "Review safety notes",
  };
}

function statusFor(actions: WallShelfPlanReadinessAction[]): WallShelfPlanReadinessStatus {
  if (actions.some((action) => action.severity === "blocker")) return "blocked";
  if (actions.some((action) => action.severity === "review")) return "needs_review";
  return "build_ready";
}

function summaryFor(status: WallShelfPlanReadinessStatus): string {
  if (status === "unsupported") return "Plan readiness actions are available for wall shelf build models only.";
  if (status === "blocked") return "Resolve blockers before treating this as a build packet.";
  if (status === "needs_review") return "Review these items before shopping, cutting, assembling, or mounting.";
  return "No blocking wall-shelf readiness issues found. Keep normal builder review before cutting or mounting.";
}

function statusLabelFor(status: WallShelfPlanReadinessStatus): string {
  if (status === "unsupported") return "Unsupported";
  if (status === "blocked") return "Blocked";
  if (status === "needs_review") return "Needs review";
  return "Ready for review";
}

function badgesFor(status: WallShelfPlanReadinessStatus, actions: WallShelfPlanReadinessAction[]): string[] {
  return [
    statusLabelFor(status),
    ...(actions.some((action) => action.relatedSection === "dimensions") ? ["Dimensions"] : []),
    ...(actions.some((action) => action.relatedSection === "support/frame") ? ["Support/frame"] : []),
    ...(actions.some((action) => action.relatedSection === "buying plan") ? ["Buying plan"] : []),
    ...(actions.some((action) => action.relatedSection === "mounting") ? ["Mounting"] : []),
  ];
}

export function createWallShelfPlanReadinessViewModel(params: {
  project: WallShelfReadinessProjectInput;
  buildModel: BoardsmithBuildModel;
  diagramViewModel: WallShelfDiagramViewModel;
  cutViewModel: WallShelfCutDiagramViewModel;
  stockBoardViewModel: WallShelfStockBoardViewModel;
  buildStepViewModel: WallShelfBuildStepViewModel;
}): WallShelfPlanReadinessViewModel {
  const { project, buildModel, diagramViewModel, cutViewModel, stockBoardViewModel, buildStepViewModel } = params;
  const unsupported = project.project_type !== "simple_shelf" || buildModel.project.projectType !== "simple_shelf";

  if (unsupported) {
    return {
      projectType: project.project_type,
      status: "unsupported",
      summary: summaryFor("unsupported"),
      actions: [],
      badges: ["Unsupported"],
      renderLabels: {
        title: "Plan Readiness / Next Actions",
        statusLabel: statusLabelFor("unsupported"),
        summaryLabel: summaryFor("unsupported"),
      },
    };
  }

  const layoutIssues = findShelfLayoutIssues(project);
  const actions: WallShelfPlanReadinessAction[] = [];

  for (const issue of layoutIssues) {
    if (issue.code === "shelf_height_impossible") {
      actions.push({
        id: "total_height_review",
        title: "Total project height looks too small",
        explanation: issue.message,
        suggestedAction: issue.recommendedAction,
        relatedSection: "dimensions",
        severity: "blocker",
        printLabel: "Enter full top-to-bottom height",
      });
    }

    if (issue.code === "connected_shelf_support_incomplete") {
      actions.push(supportFrameAction());
    }
  }

  if (diagramViewModel.dimensions.height.status === "needs_review" && !actions.some((action) => action.id === "total_height_review")) {
    actions.push({
      id: "total_height_review",
      title: "Total project height needs review",
      explanation: "The shelf layout cannot be rendered as a trustworthy build packet until total height is confirmed.",
      suggestedAction: diagramViewModel.dimensions.height.reviewReason ?? "Enter the full top-to-bottom height of the shelf unit, such as 60 in.",
      relatedSection: "dimensions",
      severity: "blocker",
      printLabel: "Enter full top-to-bottom height",
    });
  }

  if (diagramViewModel.supportFrameReview.needsReview || hasText(stockBoardViewModel.reviewReasons, /support|frame|connected shelf/)) {
    actions.push(supportFrameAction());
  }

  if (cutViewModel.missingDimensions.length > 0 || hasText(cutViewModel.warnings, /missing|placeholder|dimension/)) {
    actions.push(cutDimensionAction(actions.some((action) => action.severity === "blocker") ? "blocker" : "review"));
  }

  if (stockBoardViewModel.status !== "unsupported" && stockBoardViewModel.materialGroups.length > 0) {
    actions.push(stockBoardAction(stockBoardViewModel.status === "needs_review" ? "review" : "info"));
  }

  const mountingSignals = [
    ...project.safety_flags,
    ...buildModel.safety.flags.map((flag) => `${flag.category} ${flag.message} ${flag.recommendedAction}`),
    ...buildModel.unresolvedQuestions,
    ...buildModel.hardware.flatMap((hardware) => [hardware.label, ...hardware.notes]),
    ...buildStepViewModel.reviewBlockers,
  ];
  if (hasText(mountingSignals, /wall|mount|anchor|stud|fastener|bracket|cleat|support|load/)) {
    actions.push(mountingSupportAction(diagramViewModel.supportFrameReview.needsReview ? "review" : "info"));
  }

  if (buildModel.safety.reviewRequired || buildModel.safety.flags.length > 0) {
    actions.push(safetyAction());
  }

  const orderedActions = uniqueActions(actions).sort((a, b) => {
    const severityOrder: Record<WallShelfPlanReadinessSeverity, number> = { blocker: 0, review: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  const status = statusFor(orderedActions);
  const summary = summaryFor(status);

  return {
    projectType: project.project_type,
    status,
    summary,
    actions: orderedActions,
    badges: badgesFor(status, orderedActions),
    renderLabels: {
      title: "Plan Readiness / Next Actions",
      statusLabel: statusLabelFor(status),
      summaryLabel: summary,
    },
  };
}
