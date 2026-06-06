import type { BoardsmithBuildModel, BuildModelSafetyFlag } from "@/lib/build-model/build-model-schema";
import type { CutListReviewSummary } from "@/lib/plans/cut-list-review";
import type { MaterialReviewSummary } from "@/lib/plans/material-summary";
import type { GeneratedPlanReviewSummary } from "@/lib/plans/plan-quality";

export type PlanActionChecklistCategory =
  | "dimensions"
  | "materials"
  | "cuts"
  | "safety"
  | "hardware"
  | "mounting"
  | "finish"
  | "general";

export type PlanActionChecklistPriority = "required" | "recommended" | "info";

export type PlanActionChecklistItem = {
  id: string;
  label: string;
  detail: string;
  category: PlanActionChecklistCategory;
  priority: PlanActionChecklistPriority;
};

export type PlanActionChecklistInput = {
  buildModel: BoardsmithBuildModel;
  materialReview: MaterialReviewSummary;
  cutListReview: CutListReviewSummary | null;
  planReview: GeneratedPlanReviewSummary | null;
};

const genericMaterialReviewNotes = new Set(["Verify materials before purchasing or cutting."]);

const priorityOrder: Record<PlanActionChecklistPriority, number> = {
  required: 0,
  recommended: 1,
  info: 2,
};

function uniqueItems(items: PlanActionChecklistItem[]): PlanActionChecklistItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function hasSafetyCategory(flags: BuildModelSafetyFlag[], categories: BuildModelSafetyFlag["category"][]): boolean {
  return flags.some((flag) => categories.includes(flag.category));
}

function hardwareDetail(buildModel: BoardsmithBuildModel): string {
  const hardwareCount = buildModel.hardware.length;
  const connectionCount = buildModel.connections.length;
  if (hardwareCount > 0 && connectionCount > 0) {
    return `Review ${hardwareCount.toString()} hardware or fastener item${hardwareCount === 1 ? "" : "s"} used by modeled connections.`;
  }

  if (hardwareCount > 0) {
    return `Review ${hardwareCount.toString()} hardware or fastener item${hardwareCount === 1 ? "" : "s"} before assembly.`;
  }

  return "Review fastener choices before assembly.";
}

function cutListDetail(summary: CutListReviewSummary): string {
  const rows = summary.piecesNeedingReview;
  const rowLabel = rows === 1 ? "row needs" : "rows need";
  return `${rows.toString()} cut-list ${rowLabel} review before cutting.`;
}

function materialReviewSignals(summary: MaterialReviewSummary): string[] {
  return summary.reviewNotes
    .filter((note) => !genericMaterialReviewNotes.has(note))
    .filter((note) => {
      const normalized = note.toLowerCase();
      return (
        normalized.includes("unknown") ||
        normalized.includes("unresolved") ||
        normalized.includes("quantity to review") ||
        normalized.includes("confirm thickness") ||
        normalized.includes("review whether") ||
        normalized.includes("suitable for this project")
      );
    });
}

function defaultChecklist(): PlanActionChecklistItem[] {
  return [
    {
      id: "default_verify_dimensions",
      label: "Verify dimensions against the real space and material.",
      detail: "Measure the installation area and actual stock before marking or cutting.",
      category: "dimensions",
      priority: "recommended",
    },
    {
      id: "default_review_tool_safety",
      label: "Review tool safety and material condition.",
      detail: "Inspect material and use appropriate PPE, guards, clamps, and tool manuals.",
      category: "safety",
      priority: "recommended",
    },
    {
      id: "default_dry_fit",
      label: "Dry fit before final assembly.",
      detail: "Test piece fit and hardware placement before glue, finish, or final fasteners.",
      category: "general",
      priority: "recommended",
    },
    {
      id: "default_review_before_cutting_or_mounting",
      label: "Review before cutting or mounting.",
      detail: "Pause before irreversible steps and check dimensions, fasteners, and setup one more time.",
      category: "cuts",
      priority: "recommended",
    },
  ];
}

export function createPlanActionChecklist({
  buildModel,
  materialReview,
  cutListReview,
  planReview,
}: PlanActionChecklistInput): PlanActionChecklistItem[] {
  const items: PlanActionChecklistItem[] = [];
  const safetyFlags = buildModel.safety.flags;

  if (
    buildModel.dimensions.widthInches === null ||
    buildModel.dimensions.heightInches === null ||
    buildModel.dimensions.depthInches === null ||
    hasSafetyCategory(safetyFlags, ["unclear_dimensions"])
  ) {
    items.push({
      id: "confirm_final_dimensions",
      label: "Confirm final dimensions before cutting.",
      detail: "Check the plan dimensions against the real space, real stock, and any missing measurements.",
      category: "dimensions",
      priority: "required",
    });
  }

  if (
    buildModel.dimensions.materialThicknessInches === null ||
    buildModel.materials.some((material) => material.nominalThicknessInches === null) ||
    hasSafetyCategory(safetyFlags, ["missing_material_thickness"])
  ) {
    items.push({
      id: "verify_material_thickness",
      label: "Verify material thickness against actual stock.",
      detail: "Measure the board, sheet, or panel thickness before marking joinery, cut sizes, or fasteners.",
      category: "materials",
      priority: "required",
    });
  }

  if (hasSafetyCategory(safetyFlags, ["wall_mounting"])) {
    items.push({
      id: "review_wall_mounting",
      label: "Review wall mounting details.",
      detail: "Verify studs, anchors, fasteners, wall condition, and placement before drilling or hanging.",
      category: "mounting",
      priority: "required",
    });
  }

  if (
    hasSafetyCategory(safetyFlags, [
      "child_use",
      "seating",
      "ladder_or_platform",
      "heavy_shelving",
      "electrical",
      "outdoor_exposure",
      "structural_unknown",
    ])
  ) {
    items.push({
      id: "review_safety_flags",
      label: "Review child-adjacent or load-related safety flags.",
      detail: "Read each flagged safety note and decide what needs manual review before use.",
      category: "safety",
      priority: "required",
    });
  }

  if (buildModel.unresolvedQuestions.length > 0) {
    items.push({
      id: "resolve_open_questions",
      label: "Review unresolved questions.",
      detail: `${buildModel.unresolvedQuestions.length.toString()} question${buildModel.unresolvedQuestions.length === 1 ? "" : "s"} still need builder review before the plan is used.`,
      category: "general",
      priority: "required",
    });
  }

  if (cutListReview && (cutListReview.piecesNeedingReview > 0 || cutListReview.warnings.length > 0)) {
    items.push({
      id: "check_cut_list_review_rows",
      label: "Check cut-list rows marked as needing review.",
      detail: cutListDetail(cutListReview),
      category: "cuts",
      priority: "required",
    });
  }

  if (buildModel.hardware.length > 0 || buildModel.connections.some((connection) => connection.hardwareIds.length > 0)) {
    items.push({
      id: "verify_hardware_fasteners",
      label: "Verify hardware and fasteners before assembly.",
      detail: hardwareDetail(buildModel),
      category: "hardware",
      priority: "recommended",
    });
  }

  const materialSignals = materialReviewSignals(materialReview);
  if (materialSignals.length > 0) {
    items.push({
      id: "review_material_assumptions",
      label: "Review material assumptions before purchasing.",
      detail: materialSignals[0] ?? "Inspect material notes and confirm the selected stock is appropriate before buying or cutting.",
      category: "materials",
      priority: "recommended",
    });
  }

  if (materialReview.finishSupplies.length > 0) {
    items.push({
      id: "review_finish_supplies",
      label: "Review finish and drying details.",
      detail: "Check finish labels, ventilation, drying time, and compatibility before applying finish.",
      category: "finish",
      priority: "recommended",
    });
  }

  if (planReview && planReview.blockingIssueCount > 0 && items.length === 0) {
    items.push({
      id: "review_plan_messages",
      label: "Review plan messages before building.",
      detail: planReview.topMessages[0] ?? "The generated plan has review messages that need attention.",
      category: "general",
      priority: "required",
    });
  }

  const unique = uniqueItems(items).sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority]);
  return unique.length > 0 ? unique : defaultChecklist();
}
