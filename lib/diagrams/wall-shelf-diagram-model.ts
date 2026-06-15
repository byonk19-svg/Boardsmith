import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { CutListReviewSummary } from "@/lib/plans/cut-list-review";
import { createWallShelfDiagramViewModel, type WallShelfDiagramViewModel } from "@/lib/plans/wall-shelf-diagram-view-model";
import type { Project, ShelfLayoutOption } from "@/lib/projects/types";

export type WallShelfDiagramStatus = "ready" | "needs_shelf_count" | "needs_dimensions";
export type WallShelfSupportStatus = "separate_shelf_placeholders" | "support_to_review" | "not_wall_mounted";

export type WallShelfPartScheduleRow = {
  partLabel: string | null;
  badgeLabel: string | null;
  printLabel: string;
  label: string;
  quantity: number;
  dimensionsLabel: string;
  materialLabel: string;
};

export type WallShelfDiagramModel = {
  projectType: "simple_shelf";
  viewModel: WallShelfDiagramViewModel;
  status: WallShelfDiagramStatus;
  fallbackMessage: string | null;
  shelfLayout: ShelfLayoutOption | "unknown";
  shelfCount: number | null;
  shelfWidthInches: number | null;
  shelfDepthInches: number | null;
  boardThicknessInches: number | null;
  totalProjectHeightInches: number | null;
  shelfSpacingInches: number | null;
  materialLabel: string;
  supportStatus: WallShelfSupportStatus;
  supportLabel: string;
  reviewItems: string[];
  partSchedule: WallShelfPartScheduleRow[];
};

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function formatDimensionValue(value: number | null): string {
  return value ? `${value.toString()} in` : "to verify";
}

function partDimensionsLabel(model: WallShelfDiagramModel): string {
  return `${formatDimensionValue(model.shelfWidthInches)} x ${formatDimensionValue(model.shelfDepthInches)} x ${formatDimensionValue(model.boardThicknessInches)}`;
}

function shelfPieceQuantity(buildModel: BoardsmithBuildModel): number | null {
  const shelfPiece = buildModel.pieces.find((piece) => /\bshelf\b/i.test(`${piece.id} ${piece.label}`));
  return positiveInteger(shelfPiece?.quantity);
}

function shelfCountFor(project: Project, buildModel: BoardsmithBuildModel): number | null {
  const structuredCount = positiveInteger(project.shelf_count);
  if (structuredCount) return structuredCount;
  if (project.shelf_layout === "single_shelf") return 1;
  if (project.shelf_layout === "multiple_separate_shelves" || project.shelf_layout === "multi_shelf_unit") return null;
  return shelfPieceQuantity(buildModel);
}

function isBookLedgeBuildModel(buildModel: BoardsmithBuildModel): boolean {
  const pieceIds = new Set(buildModel.pieces.map((piece) => piece.id));
  return pieceIds.has("front_lip") && pieceIds.has("back_rail") && pieceIds.has("bottom_shelf_board");
}

function supportStatusFor(project: Project, buildModel: BoardsmithBuildModel): WallShelfSupportStatus {
  const hasWallHardware = buildModel.hardware.some((item) => ["bracket", "anchor", "hanger"].includes(item.hardwareType));
  if (!hasWallHardware) return "not_wall_mounted";
  if (project.shelf_layout === "multiple_separate_shelves") return "separate_shelf_placeholders";
  return "support_to_review";
}

function supportLabelFor(status: WallShelfSupportStatus): string {
  if (status === "separate_shelf_placeholders") return "bracket placeholders - verify final hardware";
  if (status === "not_wall_mounted") return "no wall support modeled";
  return "support method to verify";
}

function reviewItemsFor(project: Project, buildModel: BoardsmithBuildModel, supportStatus: WallShelfSupportStatus): string[] {
  const baseItems = [
    ...(supportStatus === "not_wall_mounted" ? [] : ["Each shelf needs a verified support method."]),
    "Confirm bracket, cleat, side-support, or frame type.",
    "Confirm studs or anchors appropriate for wall type.",
    "Confirm hardware and expected load suitability before mounting.",
    "Confirm shelf spacing and placement before drilling.",
  ];
  const modelItems = [
    ...buildModel.unresolvedQuestions,
    ...buildModel.safety.flags.map((flag) => flag.message),
    ...project.safety_flags,
  ];

  return [...new Set([...baseItems, ...modelItems])];
}

function partScheduleFor(model: WallShelfDiagramModel): WallShelfPartScheduleRow[] {
  const rows = model.viewModel.visibleBoards
    .filter((piece) => piece.role === "shelf_board" || piece.role === "support_frame" || piece.role === "support_frame_placeholder")
    .map((piece) => ({
      partLabel: piece.partLabel,
      badgeLabel: piece.badgeLabel,
      printLabel: piece.printLabel,
      label: piece.label,
      quantity: piece.quantity,
      dimensionsLabel: piece.dimensionsLabel,
      materialLabel: piece.materialLabel,
    }));

  if (rows.length > 0) return rows;

  return [
    {
      label: model.shelfCount && model.shelfCount > 1 ? "Shelf boards" : "Shelf board",
      partLabel: "Part A",
      badgeLabel: "A",
      printLabel: `Part A - ${model.shelfCount && model.shelfCount > 1 ? "Shelf boards" : "Shelf board"}`,
      quantity: model.shelfCount ?? 1,
      dimensionsLabel: partDimensionsLabel(model),
      materialLabel: model.materialLabel,
    },
  ];
}

function fallbackMessage(model: Pick<WallShelfDiagramModel, "shelfLayout" | "shelfCount" | "shelfWidthInches" | "shelfDepthInches" | "boardThicknessInches">): string | null {
  if (model.shelfLayout !== "single_shelf" && !model.shelfCount) return "Add shelf count to render a shelf layout diagram.";
  if (!model.shelfWidthInches || !model.shelfDepthInches || !model.boardThicknessInches) {
    return "Add shelf width, depth, and board thickness to render shelf diagrams.";
  }
  return null;
}

function statusFor(message: string | null): WallShelfDiagramStatus {
  if (!message) return "ready";
  if (message.includes("shelf count")) return "needs_shelf_count";
  return "needs_dimensions";
}

export function buildWallShelfDiagramModel(params: {
  project: Project;
  buildModel: BoardsmithBuildModel;
  cutList: CutListReviewSummary | null;
  viewModel?: WallShelfDiagramViewModel;
}): WallShelfDiagramModel | null {
  const { project, buildModel } = params;
  if (project.project_type !== "simple_shelf") return null;
  if (isBookLedgeBuildModel(buildModel)) return null;

  const viewModel = params.viewModel ?? createWallShelfDiagramViewModel({ project, buildModel });
  const supportStatus = supportStatusFor(project, buildModel);
  const baseModel: WallShelfDiagramModel = {
    projectType: "simple_shelf",
    viewModel,
    status: "ready",
    fallbackMessage: null,
    shelfLayout: project.shelf_layout ?? "unknown",
    shelfCount: viewModel.shelfCount ?? shelfCountFor(project, buildModel),
    shelfWidthInches: viewModel.dimensions.width.valueInches,
    shelfDepthInches: viewModel.dimensions.depth.valueInches,
    boardThicknessInches: viewModel.dimensions.boardThickness.valueInches,
    totalProjectHeightInches: viewModel.dimensions.height.valueInches,
    shelfSpacingInches: positiveNumber(project.shelf_spacing_inches),
    materialLabel: viewModel.visibleBoards.at(0)?.materialLabel ?? buildModel.materials.at(0)?.label ?? project.material_type,
    supportStatus,
    supportLabel: viewModel.supportFrameReview.needsReview ? viewModel.supportFrameReview.label : supportLabelFor(supportStatus),
    reviewItems: [...new Set([...viewModel.warnings, ...reviewItemsFor(project, buildModel, supportStatus)])],
    partSchedule: [],
  };
  const message = viewModel.renderLabels.fallbackMessage ?? fallbackMessage(baseModel);
  const model = {
    ...baseModel,
    status: statusFor(message),
    fallbackMessage: message,
  };

  return {
    ...model,
    partSchedule: partScheduleFor(model),
  };
}
