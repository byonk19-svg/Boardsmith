import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import {
  createWallShelfPartScheduleViewModel,
  type WallShelfPartRole,
  type WallShelfPartScheduleRow,
  type WallShelfPartScheduleViewModel,
} from "@/lib/plans/wall-shelf-part-schedule-view-model";
import { findShelfLayoutIssues, hasConnectedShelfSupportPlaceholder } from "@/lib/projects/shelf-layout-validation";
import type { Project } from "@/lib/projects/types";

export type WallShelfCutDiagramStatus = "ready" | "needs_review" | "unsupported";
export type WallShelfCutPieceRole = WallShelfPartRole;
export type WallShelfCutDimensionStatus = "known" | "missing";

export type WallShelfCutDimension = {
  valueInches: number | null;
  label: string;
  status: WallShelfCutDimensionStatus;
};

export type WallShelfCutPieceGroup = {
  id: string;
  pieceIds: string[];
  partLabel: string | null;
  badgeLabel: string | null;
  printLabel: string;
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
  partSchedule: WallShelfPartScheduleViewModel;
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

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cutGroupFromPart(row: WallShelfPartScheduleRow): WallShelfCutPieceGroup {
  return {
    id: row.id.replace(/^part_group_/, "cut_group_"),
    pieceIds: row.pieceIds,
    partLabel: row.partLabel,
    badgeLabel: row.badgeLabel,
    printLabel: row.printLabel,
    label: row.displayName,
    role: row.role,
    quantity: row.quantity,
    quantityLabel: row.quantityLabel,
    materialLabel: row.materialLabel,
    dimensions: row.dimensions,
    dimensionsLabel: row.dimensionsLabel,
    needsReview: row.needsReview,
    reviewReasons: row.reviewReasons,
  };
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
  const partSchedule = createWallShelfPartScheduleViewModel({ buildModel });
  const pieceGroups = unsupported ? [] : partSchedule.rows.map(cutGroupFromPart);
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
    partSchedule,
    renderLabels: {
      title: "Cut layout diagram",
      summary: summaryFor(pieceGroups, reviewCutPieces),
      fallbackMessage: fallbackMessageFor(status, pieceGroups, dedupedWarnings),
    },
  };
}
