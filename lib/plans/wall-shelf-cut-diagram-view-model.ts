import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { findShelfLayoutIssues, hasConnectedShelfSupportPlaceholder } from "@/lib/projects/shelf-layout-validation";
import type { Project } from "@/lib/projects/types";

export type WallShelfCutDiagramStatus = "ready" | "needs_review" | "unsupported";
export type WallShelfCutPieceRole = "shelf_board" | "support_frame" | "support_frame_placeholder" | "other";
export type WallShelfCutDimensionStatus = "known" | "missing";

export type WallShelfCutDimension = {
  valueInches: number | null;
  label: string;
  status: WallShelfCutDimensionStatus;
};

export type WallShelfCutPieceGroup = {
  id: string;
  pieceIds: string[];
  label: string;
  role: WallShelfCutPieceRole;
  quantity: number;
  quantityLabel: string;
  materialLabel: string;
  dimensions: {
    length: WallShelfCutDimension;
    width: WallShelfCutDimension;
    thickness: WallShelfCutDimension;
  };
  dimensionsLabel: string;
  needsReview: boolean;
  reviewReasons: string[];
};

export type WallShelfCutDiagramViewModel = {
  projectType: string;
  status: WallShelfCutDiagramStatus;
  materialGroups: {
    id: string;
    materialLabel: string;
    pieces: WallShelfCutPieceGroup[];
  }[];
  pieceGroups: WallShelfCutPieceGroup[];
  totalCutPieces: number;
  readyCutPieces: number;
  reviewCutPieces: number;
  missingDimensions: string[];
  warnings: string[];
  badges: string[];
  renderLabels: {
    title: "Cut layout diagram";
    summary: string;
    fallbackMessage: string | null;
  };
};

type WallShelfCutProjectInput = Pick<
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
>;

type GroupAccumulator = {
  key: string;
  label: string;
  role: WallShelfCutPieceRole;
  quantity: number;
  materialLabel: string;
  dimensions: WallShelfCutPieceGroup["dimensions"];
  pieceIds: string[];
  reviewReasons: string[];
};

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function formatInches(value: number | null): string {
  return value ? `${value.toString()} in` : "missing";
}

function dimension(value: number | null): WallShelfCutDimension {
  return {
    valueInches: value,
    label: formatInches(value),
    status: value ? "known" : "missing",
  };
}

function dimensionLabel(dimensions: WallShelfCutPieceGroup["dimensions"]): string {
  return `${dimensions.length.label} x ${dimensions.width.label} x ${dimensions.thickness.label}`;
}

function pieceRole(piece: BuildModelPiece): WallShelfCutPieceRole {
  const text = `${piece.id} ${piece.label} ${piece.pieceType}`.toLowerCase();
  if (piece.id === "side_support_frame_placeholder") return "support_frame_placeholder";
  if (/\bshelf\b/.test(text) && !/\bbottom\b/.test(text)) return "shelf_board";
  if (/\b(side support|support frame|frame|upright|cleat|standard|rail)\b/.test(text)) return "support_frame";
  return "other";
}

function materialLabelFor(piece: BuildModelPiece, buildModel: BoardsmithBuildModel): string {
  return buildModel.materials.find((material) => material.id === piece.materialId)?.label ?? piece.materialId ?? "material to review";
}

function safePieceLabel(label: string, quantity: number): string {
  const trimmed = label.trim() || "Unnamed piece";
  if (quantity > 1 && /^shelf board$/i.test(trimmed)) return "Shelf boards";
  return trimmed;
}

function groupingLabel(label: string): string {
  const trimmed = label.trim() || "Unnamed piece";
  if (/^shelf boards$/i.test(trimmed)) return "Shelf board";
  return trimmed;
}

function missingDimensionReasons(piece: BuildModelPiece): string[] {
  return [
    piece.dimensions.lengthInches ? null : "length missing",
    piece.dimensions.widthInches ? null : "width missing",
    piece.dimensions.thicknessInches ? null : "thickness missing",
  ].filter((item): item is string => Boolean(item));
}

function reviewReasonsFor(piece: BuildModelPiece, role: WallShelfCutPieceRole): string[] {
  return [
    ...missingDimensionReasons(piece),
    ...(role === "support_frame_placeholder" ? ["Support/frame design needs review"] : []),
    ...piece.notes.filter((note) => /review|verify|unresolved|placeholder|missing|needs/i.test(note)),
  ];
}

function groupKey(params: {
  label: string;
  role: WallShelfCutPieceRole;
  materialLabel: string;
  dimensions: WallShelfCutPieceGroup["dimensions"];
}): string {
  return [
    normalize(params.label),
    params.role,
    normalize(params.materialLabel),
    params.dimensions.length.valueInches?.toString() ?? "missing",
    params.dimensions.width.valueInches?.toString() ?? "missing",
    params.dimensions.thickness.valueInches?.toString() ?? "missing",
  ].join("|");
}

function groupPieces(buildModel: BoardsmithBuildModel): WallShelfCutPieceGroup[] {
  const groups = new Map<string, GroupAccumulator>();

  for (const piece of buildModel.pieces) {
    const role = pieceRole(piece);
    const materialLabel = materialLabelFor(piece, buildModel);
    const dimensions = {
      length: dimension(positiveNumber(piece.dimensions.lengthInches)),
      width: dimension(positiveNumber(piece.dimensions.widthInches)),
      thickness: dimension(positiveNumber(piece.dimensions.thicknessInches)),
    };
    const label = groupingLabel(piece.label);
    const key = groupKey({ label, role, materialLabel, dimensions });
    const existing = groups.get(key);

    if (existing) {
      existing.quantity += piece.quantity;
      existing.pieceIds.push(piece.id);
      existing.reviewReasons = [...new Set([...existing.reviewReasons, ...reviewReasonsFor(piece, role)])];
      continue;
    }

    groups.set(key, {
      key,
      label,
      role,
      quantity: piece.quantity,
      materialLabel,
      dimensions,
      pieceIds: [piece.id],
      reviewReasons: reviewReasonsFor(piece, role),
    });
  }

  return [...groups.values()].map((group, index) => {
    const reasons = [...new Set(group.reviewReasons)];
    return {
      id: `cut_group_${index.toString()}_${normalize(group.label).replaceAll(" ", "_") || "piece"}`,
      pieceIds: group.pieceIds,
      label: safePieceLabel(group.label, group.quantity),
      role: group.role,
      quantity: group.quantity,
      quantityLabel: `Qty ${group.quantity.toString()}`,
      materialLabel: group.materialLabel,
      dimensions: group.dimensions,
      dimensionsLabel: dimensionLabel(group.dimensions),
      needsReview: reasons.length > 0,
      reviewReasons: reasons,
    };
  });
}

function materialGroupsFor(pieceGroups: WallShelfCutPieceGroup[]): WallShelfCutDiagramViewModel["materialGroups"] {
  const groups = new Map<string, WallShelfCutPieceGroup[]>();

  for (const piece of pieceGroups) {
    const key = normalize(piece.materialLabel) || "material-to-review";
    groups.set(key, [...(groups.get(key) ?? []), piece]);
  }

  return [...groups.entries()].map(([id, pieces]) => ({
    id,
    materialLabel: pieces[0]?.materialLabel ?? "material to review",
    pieces,
  }));
}

function fallbackMessageFor(status: WallShelfCutDiagramStatus, pieceGroups: WallShelfCutPieceGroup[], warnings: string[]): string | null {
  if (status === "unsupported") return "Cut diagrams are available for wall shelf build models only.";
  if (pieceGroups.length === 0) return "Add modeled pieces before rendering a cut layout.";
  if (warnings.length > 0) return "Review cut dimensions before treating this as a complete cut layout.";
  return null;
}

function summaryFor(pieceGroups: WallShelfCutPieceGroup[], reviewCutPieces: number): string {
  if (pieceGroups.length === 0) return "No modeled cut pieces are available yet.";
  if (reviewCutPieces > 0) return "Cut layout needs review before cutting.";
  return "Cut layout from Build Model pieces.";
}

export function createWallShelfCutDiagramViewModel(params: {
  project: WallShelfCutProjectInput;
  buildModel: BoardsmithBuildModel;
}): WallShelfCutDiagramViewModel {
  const { project, buildModel } = params;
  const unsupported = project.project_type !== "simple_shelf" || buildModel.project.projectType !== "simple_shelf";
  const pieceGroups = unsupported ? [] : groupPieces(buildModel);
  const layoutIssues = unsupported ? [] : findShelfLayoutIssues(project);
  const missingDimensions = pieceGroups.flatMap((piece) =>
    piece.reviewReasons
      .filter((reason) => /missing/i.test(reason))
      .map((reason) => `${piece.label}: ${reason}`),
  );
  const supportFrameNeedsReview = pieceGroups.some((piece) => piece.role === "support_frame_placeholder") || hasConnectedShelfSupportPlaceholder(buildModel);
  const warnings = [
    ...layoutIssues.map((issue) => issue.label),
    ...layoutIssues.map((issue) => issue.recommendedAction),
    ...pieceGroups.flatMap((piece) => piece.reviewReasons),
    ...(supportFrameNeedsReview ? ["Support/frame design needs review"] : []),
  ];
  const dedupedWarnings = [...new Set(warnings)];
  const reviewCutPieces = pieceGroups.filter((piece) => piece.needsReview).length;
  const status: WallShelfCutDiagramStatus = unsupported ? "unsupported" : pieceGroups.length === 0 || dedupedWarnings.length > 0 ? "needs_review" : "ready";

  return {
    projectType: project.project_type,
    status,
    materialGroups: materialGroupsFor(pieceGroups),
    pieceGroups,
    totalCutPieces: pieceGroups.reduce((total, piece) => total + piece.quantity, 0),
    readyCutPieces: pieceGroups.filter((piece) => !piece.needsReview).reduce((total, piece) => total + piece.quantity, 0),
    reviewCutPieces,
    missingDimensions: [...new Set(missingDimensions)],
    warnings: dedupedWarnings,
    badges: [
      ...(status === "needs_review" ? ["Needs review"] : []),
      ...(supportFrameNeedsReview ? ["Support/frame review"] : []),
      ...(pieceGroups.length > 0 ? ["Build Model cuts"] : []),
    ],
    renderLabels: {
      title: "Cut layout diagram",
      summary: summaryFor(pieceGroups, reviewCutPieces),
      fallbackMessage: fallbackMessageFor(status, pieceGroups, dedupedWarnings),
    },
  };
}
