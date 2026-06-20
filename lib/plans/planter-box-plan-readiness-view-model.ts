import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { PlanterBoxCutDiagramViewModel } from "@/lib/plans/planter-box-cut-diagram-view-model";
import type { PlanterBoxStockBoardViewModel } from "@/lib/plans/planter-box-stock-board-view-model";
import type { Project } from "@/lib/projects/types";

export type PlanterBoxPlanReadinessStatus = "build_ready" | "needs_review" | "unsupported";
export type PlanterBoxPlanReadinessSeverity = "info" | "review";
export type PlanterBoxPlanReadinessSection = "dimensions" | "drainage" | "finish" | "cuts" | "buying plan" | "connections" | "safety";

export type PlanterBoxPlanReadinessAction = {
  id: string;
  title: string;
  explanation: string;
  suggestedAction: string;
  relatedSection: PlanterBoxPlanReadinessSection;
  severity: PlanterBoxPlanReadinessSeverity;
  printLabel: string;
};

export type PlanterBoxPlanReadinessViewModel = {
  projectType: string;
  status: PlanterBoxPlanReadinessStatus;
  summary: string;
  actions: PlanterBoxPlanReadinessAction[];
  badges: string[];
  renderLabels: {
    title: "Plan Readiness / Next Actions";
    statusLabel: string;
    summaryLabel: string;
  };
};

type PlanterReadinessProjectInput = Pick<
  Project,
  "project_type" | "width_inches" | "height_inches" | "depth_inches" | "material_thickness_inches" | "material_type" | "intended_use" | "style_notes" | "safety_flags"
>;

function uniqueActions(actions: PlanterBoxPlanReadinessAction[]): PlanterBoxPlanReadinessAction[] {
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

function action(params: PlanterBoxPlanReadinessAction): PlanterBoxPlanReadinessAction {
  return params;
}

function statusFor(actions: PlanterBoxPlanReadinessAction[]): PlanterBoxPlanReadinessStatus {
  return actions.some((item) => item.severity === "review") ? "needs_review" : "build_ready";
}

function statusLabelFor(status: PlanterBoxPlanReadinessStatus): string {
  if (status === "unsupported") return "Unsupported";
  if (status === "needs_review") return "Needs review";
  return "Ready for review";
}

function summaryFor(status: PlanterBoxPlanReadinessStatus): string {
  if (status === "unsupported") return "Plan readiness actions are available for planter-box build models only.";
  if (status === "needs_review") return "Review drainage, liner, outdoor exposure, finish, material, cuts, and connections before building.";
  return "No blocking planter-box readiness issues found. Keep normal builder review before cutting or planting.";
}

function badgesFor(status: PlanterBoxPlanReadinessStatus, actions: PlanterBoxPlanReadinessAction[]): string[] {
  return [
    statusLabelFor(status),
    ...(actions.some((item) => item.relatedSection === "drainage") ? ["Drainage"] : []),
    ...(actions.some((item) => item.relatedSection === "finish") ? ["Outdoor finish"] : []),
    ...(actions.some((item) => item.relatedSection === "cuts") ? ["Cut review"] : []),
    ...(actions.some((item) => item.relatedSection === "connections") ? ["Connections"] : []),
  ];
}

function dimensionNeedsReview(project: PlanterReadinessProjectInput, cutViewModel: PlanterBoxCutDiagramViewModel): boolean {
  return (
    project.width_inches <= 0 ||
    project.height_inches <= 0 ||
    project.depth_inches <= 0 ||
    project.material_thickness_inches <= 0 ||
    cutViewModel.missingDimensions.length > 0 ||
    hasText(cutViewModel.warnings, /dimension|missing|material/i)
  );
}

export function createPlanterBoxPlanReadinessViewModel(params: {
  project: PlanterReadinessProjectInput;
  buildModel: BoardsmithBuildModel;
  cutViewModel: PlanterBoxCutDiagramViewModel;
  stockBoardViewModel: PlanterBoxStockBoardViewModel;
}): PlanterBoxPlanReadinessViewModel {
  const { project, buildModel, cutViewModel } = params;
  const unsupported = project.project_type !== "planter_box" || buildModel.project.projectType !== "planter_box";

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

  const actions: PlanterBoxPlanReadinessAction[] = [];

  if (dimensionNeedsReview(project, cutViewModel)) {
    actions.push(
      action({
        id: "planter_cut_dimensions_review",
        title: "Panel dimensions and material need review",
        explanation: "Planter panel cuts need confirmed length, width, thickness, material, and quantity before cutting.",
        suggestedAction: "Confirm every panel dimension and material against the actual stock before cutting.",
        relatedSection: "cuts",
        severity: "review",
        printLabel: "Confirm panel cuts",
      }),
    );
  }

  actions.push(
    action({
      id: "planter_drainage_liner_review",
      title: "Drainage and liner approach needs review",
      explanation: "Soil and water can change the bottom-panel layout, drainage holes, liner choice, and finish plan.",
      suggestedAction: "Choose drainage-hole layout, liner approach, and whether the bottom panel needs extra review before assembly.",
      relatedSection: "drainage",
      severity: "review",
      printLabel: "Confirm drainage/liner",
    }),
    action({
      id: "planter_outdoor_finish_review",
      title: "Outdoor material and finish need review",
      explanation: "Outdoor planter use needs material, fastener, finish, and corrosion review before purchase or assembly.",
      suggestedAction: "Confirm material suitability, compatible fasteners, finish, and cure time for soil and outdoor exposure.",
      relatedSection: "finish",
      severity: "review",
      printLabel: "Review outdoor finish",
    }),
    action({
      id: "planter_stock_board_selection",
      title: "Stock board selection needs review",
      explanation: "The buying plan groups modeled panels but does not choose a store board, exact stock length, or optimized cut plan.",
      suggestedAction: "Choose available stock length only after confirming the panel layout and material suitability.",
      relatedSection: "buying plan",
      severity: "review",
      printLabel: "Choose stock board length",
    }),
    action({
      id: "planter_connection_review",
      title: "Panel connections need manual review",
      explanation: "The packet labels panels and cuts, but it does not certify joinery, fastener spacing, glue choice, or hardware suitability.",
      suggestedAction: "Confirm how panels attach to one another before assembly, especially around wet soil and outdoor exposure.",
      relatedSection: "connections",
      severity: "review",
      printLabel: "Confirm panel connections",
    }),
  );

  if (buildModel.safety.reviewRequired || buildModel.safety.flags.length > 0) {
    actions.push(
      action({
        id: "planter_safety_review",
        title: "Safety review still applies",
        explanation: "Boardsmith is a planning aid and cannot verify material condition, tool setup, fastener suitability, or site conditions.",
        suggestedAction: "Review safety notes and use your own judgment before cutting, assembling, finishing, or using the planter.",
        relatedSection: "safety",
        severity: "info",
        printLabel: "Review safety notes",
      }),
    );
  }

  const orderedActions = uniqueActions(actions).sort((left, right) => {
    const severityOrder: Record<PlanterBoxPlanReadinessSeverity, number> = { review: 0, info: 1 };
    const sectionOrder: Record<PlanterBoxPlanReadinessSection, number> = {
      dimensions: 0,
      cuts: 1,
      drainage: 2,
      finish: 3,
      "buying plan": 4,
      connections: 5,
      safety: 6,
    };
    return severityOrder[left.severity] - severityOrder[right.severity] || sectionOrder[left.relatedSection] - sectionOrder[right.relatedSection];
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
