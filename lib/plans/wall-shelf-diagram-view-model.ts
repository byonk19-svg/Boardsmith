import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { createWallShelfPartScheduleViewModel } from "@/lib/plans/wall-shelf-part-schedule-view-model";
import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { findShelfLayoutIssues, hasConnectedShelfSupportPlaceholder } from "@/lib/projects/shelf-layout-validation";
import type { Project } from "@/lib/projects/types";

export type WallShelfDiagramViewStatus = "ready" | "needs_review" | "unsupported";
export type WallShelfDiagramLayout = "single_shelf" | "multiple_separate_shelves" | "connected_shelf_unit" | "unknown";
export type WallShelfDiagramDimensionStatus = "known" | "missing" | "needs_review";
export type WallShelfDiagramPieceRole = "shelf_board" | "support_frame" | "support_frame_placeholder" | "other";

export type WallShelfDiagramDimension = {
  valueInches: number | null;
  label: string;
  status: WallShelfDiagramDimensionStatus;
  reviewReason: string | null;
};

export type WallShelfDiagramVisiblePiece = {
  id: string;
  partLabel: string | null;
  badgeLabel: string | null;
  printLabel: string;
  label: string;
  quantity: number;
  role: WallShelfDiagramPieceRole;
  dimensionsLabel: string;
  materialLabel: string;
  needsReview: boolean;
  warnings: string[];
};

export type WallShelfSupportFrameReview = {
  required: boolean;
  needsReview: boolean;
  label: "No support/frame review required" | "Support/frame design needs review" | "Support/frame pieces modeled for review";
  reasons: string[];
};

export type WallShelfDiagramViewModel = {
  projectType: string;
  status: WallShelfDiagramViewStatus;
  layout: WallShelfDiagramLayout;
  shelfCount: number | null;
  dimensions: {
    width: WallShelfDiagramDimension;
    depth: WallShelfDiagramDimension;
    height: WallShelfDiagramDimension;
    boardThickness: WallShelfDiagramDimension;
  };
  visibleBoards: WallShelfDiagramVisiblePiece[];
  supportFrameReview: WallShelfSupportFrameReview;
  missingDimensions: string[];
  warnings: string[];
  badges: string[];
  renderLabels: {
    title: "Wall shelf diagram";
    shelfCountLabel: string;
    supportLabel: string | null;
    fallbackMessage: string | null;
  };
};

type WallShelfDiagramProjectInput = Pick<
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

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function formatInches(value: number | null): string {
  return value ? `${value.toString()} in` : "to verify";
}

function dimensionLabel(label: "Width" | "Depth" | "Height" | "Material thickness", value: number | null): string {
  return value ? `${label} ${value.toString()} in` : `${label} to verify`;
}

function createDimension(params: {
  label: "Width" | "Depth" | "Height" | "Material thickness";
  value: number | null;
  needsReview?: boolean;
  reviewLabel?: string;
  reviewReason?: string;
}): WallShelfDiagramDimension {
  if (params.needsReview) {
    return {
      valueInches: null,
      label: params.reviewLabel ?? `${params.label} needs review`,
      status: "needs_review",
      reviewReason: params.reviewReason ?? null,
    };
  }

  if (!params.value) {
    return {
      valueInches: null,
      label: `${params.label} to verify`,
      status: "missing",
      reviewReason: null,
    };
  }

  return {
    valueInches: params.value,
    label: dimensionLabel(params.label, params.value),
    status: "known",
    reviewReason: null,
  };
}

function inferProjectInput(buildModel: BoardsmithBuildModel): WallShelfDiagramProjectInput {
  return {
    project_type: buildModel.project.projectType,
    title: buildModel.project.title,
    width_inches: buildModel.dimensions.widthInches ?? 0,
    height_inches: buildModel.dimensions.heightInches ?? 0,
    depth_inches: buildModel.dimensions.depthInches ?? 0,
    material_thickness_inches: buildModel.dimensions.materialThicknessInches ?? 0,
    material_type: buildModel.materials[0]?.label ?? "material to review",
    shelf_layout: undefined,
    shelf_count: shelfPieceQuantity(buildModel) ?? undefined,
    shelf_spacing_inches: undefined,
    style_notes: "",
    intended_use: buildModel.project.intendedUse ?? "",
    safety_flags: buildModel.safety.flags.map((flag) => flag.message),
  };
}

function shelfPieceQuantity(buildModel: BoardsmithBuildModel): number | null {
  const shelfPiece = buildModel.pieces.find((piece) => pieceRole(piece) === "shelf_board");
  return positiveInteger(shelfPiece?.quantity);
}

function shelfCountFor(project: WallShelfDiagramProjectInput, buildModel: BoardsmithBuildModel): number | null {
  const structuredCount = positiveInteger(project.shelf_count);
  if (structuredCount) return structuredCount;
  if (project.shelf_layout === "single_shelf") return 1;
  return shelfPieceQuantity(buildModel);
}

function layoutFor(project: WallShelfDiagramProjectInput, shelfCount: number | null): WallShelfDiagramLayout {
  if (project.shelf_layout === "single_shelf") return "single_shelf";
  if (project.shelf_layout === "multiple_separate_shelves") return "multiple_separate_shelves";
  if (project.shelf_layout === "multi_shelf_unit") return "connected_shelf_unit";
  if (shelfCount === 1) return "single_shelf";
  if (shelfCount && shelfCount > 1) return "multiple_separate_shelves";
  return "unknown";
}

function materialLabelForPiece(piece: BuildModelPiece, buildModel: BoardsmithBuildModel, fallback: string): string {
  return buildModel.materials.find((material) => material.id === piece.materialId)?.label ?? fallback;
}

function pieceRole(piece: BuildModelPiece): WallShelfDiagramPieceRole {
  const text = `${piece.id} ${piece.label} ${piece.pieceType}`.toLowerCase();
  if (piece.id === "side_support_frame_placeholder") return "support_frame_placeholder";
  if (/\bshelf\b/.test(text) && !/\bbottom\b/.test(text)) return "shelf_board";
  if (/\b(side supports?|support frames?|frames?|uprights?|cleats?|standards?|rails?)\b/.test(text)) return "support_frame";
  return "other";
}

function pieceDimensionsLabel(piece: BuildModelPiece): string {
  return `${formatInches(piece.dimensions.lengthInches)} x ${formatInches(piece.dimensions.widthInches)} x ${formatInches(piece.dimensions.thicknessInches)}`;
}

function visibleBoardsFor(buildModel: BoardsmithBuildModel, materialFallback: string): WallShelfDiagramVisiblePiece[] {
  const partSchedule = createWallShelfPartScheduleViewModel({ buildModel });

  return buildModel.pieces.map((piece) => {
    const role = pieceRole(piece);
    const part = partSchedule.rows.find((row) => row.pieceIds.includes(piece.id)) ?? null;
    const missingDimensions = [
      piece.dimensions.lengthInches ? null : "length to verify",
      piece.dimensions.widthInches ? null : "width to verify",
      piece.dimensions.thicknessInches ? null : "thickness to verify",
    ].filter((item): item is string => Boolean(item));
    const placeholderReview = role === "support_frame_placeholder";

    return {
      id: piece.id,
      partLabel: part?.partLabel ?? null,
      badgeLabel: part?.badgeLabel ?? null,
      printLabel: part?.printLabel ?? piece.label,
      label: piece.label,
      quantity: piece.quantity,
      role,
      dimensionsLabel: pieceDimensionsLabel(piece),
      materialLabel: materialLabelForPiece(piece, buildModel, materialFallback),
      needsReview: placeholderReview || missingDimensions.length > 0,
      warnings: [
        ...missingDimensions,
        ...(placeholderReview ? ["Support/frame design needs review"] : []),
        ...piece.notes.filter((note) => /review|verify|unresolved|needs/i.test(note)),
      ],
    };
  });
}

function supportFrameReviewFor(params: {
  layout: WallShelfDiagramLayout;
  shelfCount: number | null;
  buildModel: BoardsmithBuildModel;
  layoutIssueReasons: string[];
}): WallShelfSupportFrameReview {
  const supportPieces = params.buildModel.pieces.filter((piece) => pieceRole(piece) === "support_frame");
  const supportPlaceholders = params.buildModel.pieces.filter((piece) => pieceRole(piece) === "support_frame_placeholder");
  const requiresConnectedSupport = params.layout === "connected_shelf_unit" && Boolean(params.shelfCount && params.shelfCount > 1);
  const modeledSupportPieces = supportPieces.filter(
    (piece) => piece.dimensions.lengthInches && piece.dimensions.widthInches && piece.dimensions.thicknessInches,
  );
  const needsReview = requiresConnectedSupport && (modeledSupportPieces.length === 0 || supportPlaceholders.length > 0);

  if (!requiresConnectedSupport) {
    return {
      required: false,
      needsReview: false,
      label: "No support/frame review required",
      reasons: params.layoutIssueReasons,
    };
  }

  if (!needsReview) {
    return {
      required: true,
      needsReview: false,
      label: "Support/frame pieces modeled for review",
      reasons: params.layoutIssueReasons,
    };
  }

  return {
    required: true,
    needsReview: true,
    label: "Support/frame design needs review",
    reasons: [
      "Connected shelf units need modeled side supports, frame, cleat, brackets, or another support method before the packet is complete.",
      ...params.layoutIssueReasons,
      ...(hasConnectedShelfSupportPlaceholder(params.buildModel) ? ["Side support/frame placeholders are review-only pieces."] : []),
    ],
  };
}

function fallbackMessageFor(params: {
  unsupported: boolean;
  missingDimensions: string[];
  invalidHeight: boolean;
  missingShelfCount: boolean;
}): string | null {
  if (params.unsupported) return "Wall shelf diagrams are available only for the wall shelf template.";
  if (params.invalidHeight) return "Add valid total height to render full layout.";
  if (params.missingShelfCount) return "Add shelf count to render a shelf layout diagram.";
  if (params.missingDimensions.length > 0) return "Add shelf width, depth, and board thickness to render shelf diagrams.";
  return null;
}

export function createWallShelfDiagramViewModel(params: {
  project?: WallShelfDiagramProjectInput;
  buildModel: BoardsmithBuildModel;
}): WallShelfDiagramViewModel {
  const { buildModel } = params;
  const project = params.project ?? inferProjectInput(buildModel);
  const unsupported = project.project_type !== "simple_shelf" || buildModel.project.projectType !== "simple_shelf";
  const shelfIntent = analyzeShelfLayoutIntent(project);
  const shelfCount = shelfCountFor(project, buildModel);
  const layout = layoutFor(project, shelfCount);
  const layoutIssues = unsupported ? [] : findShelfLayoutIssues(project);
  const invalidHeightIssue = layoutIssues.find((issue) => issue.code === "shelf_height_impossible") ?? null;
  const layoutIssueReasons = layoutIssues.map((issue) => issue.recommendedAction);
  const width = positiveNumber(project.width_inches) ?? positiveNumber(buildModel.dimensions.widthInches);
  const depth = positiveNumber(project.depth_inches) ?? positiveNumber(buildModel.dimensions.depthInches);
  const boardThickness = positiveNumber(project.material_thickness_inches) ?? positiveNumber(buildModel.dimensions.materialThicknessInches);
  const height = invalidHeightIssue ? null : positiveNumber(project.height_inches) ?? positiveNumber(buildModel.dimensions.heightInches);
  const dimensions = {
    width: createDimension({ label: "Width", value: width }),
    depth: createDimension({ label: "Depth", value: depth }),
    height: createDimension({
      label: "Height",
      value: height,
      needsReview: Boolean(invalidHeightIssue),
      reviewLabel: "Total height needs review",
      reviewReason: invalidHeightIssue?.recommendedAction,
    }),
    boardThickness: createDimension({ label: "Material thickness", value: boardThickness }),
  };
  const missingDimensions = [
    dimensions.width.status === "missing" ? "Shelf width needs review" : null,
    dimensions.depth.status === "missing" ? "Shelf depth needs review" : null,
    dimensions.boardThickness.status === "missing" ? "Board thickness needs review" : null,
    dimensions.height.status === "missing" && layout !== "single_shelf" ? "Total height needs review" : null,
    dimensions.height.status === "needs_review" ? "Total height needs review" : null,
  ].filter((item): item is string => Boolean(item));
  const missingShelfCount = shelfIntent.missingShelfCount || (layout !== "single_shelf" && !shelfCount);
  const supportFrameReview = supportFrameReviewFor({
    layout,
    shelfCount,
    buildModel,
    layoutIssueReasons,
  });
  const fallbackMessage = fallbackMessageFor({
    unsupported,
    missingDimensions,
    invalidHeight: Boolean(invalidHeightIssue),
    missingShelfCount,
  });
  const status: WallShelfDiagramViewStatus = unsupported ? "unsupported" : fallbackMessage ? "needs_review" : "ready";
  const shelfCountLabel = shelfCount ? `${shelfCount.toString()} ${shelfCount === 1 ? "shelf" : "shelves"}` : "Shelf count needs review";

  return {
    projectType: project.project_type,
    status,
    layout,
    shelfCount,
    dimensions,
    visibleBoards: visibleBoardsFor(buildModel, project.material_type),
    supportFrameReview,
    missingDimensions,
    warnings: [
      ...layoutIssues.map((issue) => issue.label),
      ...layoutIssueReasons,
      ...(supportFrameReview.needsReview ? supportFrameReview.reasons : []),
    ],
    badges: [
      ...(status === "needs_review" ? ["Needs review"] : []),
      ...(supportFrameReview.needsReview ? ["Support/frame review"] : []),
      ...(layout === "connected_shelf_unit" ? ["Connected shelf unit"] : []),
    ],
    renderLabels: {
      title: "Wall shelf diagram",
      shelfCountLabel,
      supportLabel: supportFrameReview.needsReview ? supportFrameReview.label : null,
      fallbackMessage,
    },
  };
}
