import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";

export type WallShelfPartScheduleStatus = "ready" | "needs_review" | "unsupported";
export type WallShelfPartRole = "shelf_board" | "support_frame" | "support_frame_placeholder" | "other";
export type WallShelfPartDimensionStatus = "known" | "missing";

export type WallShelfPartDimension = {
  valueInches: number | null;
  label: string;
  status: WallShelfPartDimensionStatus;
};

export type WallShelfPartScheduleRow = {
  id: string;
  partLabel: string | null;
  badgeLabel: string | null;
  printLabel: string;
  displayName: string;
  role: WallShelfPartRole;
  quantity: number;
  quantityLabel: string;
  materialLabel: string;
  dimensions: {
    length: WallShelfPartDimension;
    width: WallShelfPartDimension;
    thickness: WallShelfPartDimension;
  };
  dimensionsLabel: string;
  pieceIds: string[];
  relatedBuildModelPieceKeys: string[];
  needsReview: boolean;
  reviewReasons: string[];
};

export type WallShelfPartScheduleViewModel = {
  projectType: string;
  status: WallShelfPartScheduleStatus;
  rows: WallShelfPartScheduleRow[];
  assignedParts: WallShelfPartScheduleRow[];
  reviewRows: WallShelfPartScheduleRow[];
  warnings: string[];
  renderLabels: {
    title: "Part Schedule";
    summary: string;
    fallbackMessage: string | null;
  };
};

type GroupAccumulator = {
  key: string;
  displayName: string;
  role: WallShelfPartRole;
  quantity: number;
  materialLabel: string;
  dimensions: WallShelfPartScheduleRow["dimensions"];
  pieceIds: string[];
  reviewReasons: string[];
};

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function idPart(value: string): string {
  return normalize(value).replaceAll(" ", "_") || "piece";
}

function formatInches(value: number | null): string {
  return value ? `${value.toString()} in` : "missing";
}

function dimension(value: number | null): WallShelfPartDimension {
  return {
    valueInches: value,
    label: formatInches(value),
    status: value ? "known" : "missing",
  };
}

function dimensionsLabel(dimensions: WallShelfPartScheduleRow["dimensions"]): string {
  return `${dimensions.length.label} x ${dimensions.width.label} x ${dimensions.thickness.label}`;
}

export function wallShelfPartRole(piece: BuildModelPiece): WallShelfPartRole {
  const text = `${piece.id} ${piece.label} ${piece.pieceType}`.toLowerCase();
  if (piece.id === "side_support_frame_placeholder") return "support_frame_placeholder";
  if (/\bshelf\b/.test(text) && !/\bbottom\b/.test(text)) return "shelf_board";
  if (/\b(side supports?|support frames?|frames?|uprights?|cleats?|standards?|rails?)\b/.test(text)) return "support_frame";
  return "other";
}

function materialLabelFor(piece: BuildModelPiece, buildModel: BoardsmithBuildModel): string {
  return buildModel.materials.find((material) => material.id === piece.materialId)?.label ?? piece.materialId ?? "material to review";
}

function groupingDisplayName(label: string): string {
  const trimmed = label.trim() || "Unnamed piece";
  if (/^shelf boards$/i.test(trimmed)) return "Shelf board";
  return trimmed;
}

function displayNameForQuantity(label: string, role: WallShelfPartRole, quantity: number): string {
  const trimmed = label.trim() || "Unnamed piece";
  if (role === "shelf_board" && quantity > 1 && /^shelf board$/i.test(trimmed)) return "Shelf boards";
  return trimmed;
}

function missingDimensionReasons(piece: BuildModelPiece): string[] {
  return [
    piece.dimensions.lengthInches ? null : "length missing",
    piece.dimensions.widthInches ? null : "width missing",
    piece.dimensions.thicknessInches ? null : "thickness missing",
  ].filter((item): item is string => Boolean(item));
}

function reviewReasonsFor(piece: BuildModelPiece, role: WallShelfPartRole): string[] {
  return [
    ...missingDimensionReasons(piece),
    ...(role === "support_frame_placeholder" ? ["Support/frame design needs review; no part label assigned yet."] : []),
    ...piece.notes.filter((note) => /review|verify|unresolved|placeholder|missing|needs/i.test(note)),
  ];
}

function groupKey(params: {
  displayName: string;
  role: WallShelfPartRole;
  materialLabel: string;
  dimensions: WallShelfPartScheduleRow["dimensions"];
}): string {
  return [
    normalize(params.displayName),
    params.role,
    normalize(params.materialLabel),
    params.dimensions.length.valueInches?.toString() ?? "missing",
    params.dimensions.width.valueInches?.toString() ?? "missing",
    params.dimensions.thickness.valueInches?.toString() ?? "missing",
  ].join("|");
}

function partLabelForIndex(index: number): { partLabel: string; badgeLabel: string } {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let value = index;
  let badge = "";

  do {
    badge = alphabet[value % alphabet.length] + badge;
    value = Math.floor(value / alphabet.length) - 1;
  } while (value >= 0);

  return {
    partLabel: `Part ${badge}`,
    badgeLabel: badge,
  };
}

function shouldAssignPartLabel(role: WallShelfPartRole): boolean {
  return role !== "support_frame_placeholder";
}

function groupPieces(buildModel: BoardsmithBuildModel): GroupAccumulator[] {
  const groups = new Map<string, GroupAccumulator>();

  for (const piece of buildModel.pieces) {
    const role = wallShelfPartRole(piece);
    const materialLabel = materialLabelFor(piece, buildModel);
    const dimensions = {
      length: dimension(positiveNumber(piece.dimensions.lengthInches)),
      width: dimension(positiveNumber(piece.dimensions.widthInches)),
      thickness: dimension(positiveNumber(piece.dimensions.thicknessInches)),
    };
    const displayName = groupingDisplayName(piece.label);
    const key = groupKey({ displayName, role, materialLabel, dimensions });
    const existing = groups.get(key);
    const reviewReasons = reviewReasonsFor(piece, role);

    if (existing) {
      existing.quantity += piece.quantity;
      existing.pieceIds.push(piece.id);
      existing.reviewReasons = [...new Set([...existing.reviewReasons, ...reviewReasons])];
      continue;
    }

    groups.set(key, {
      key,
      displayName,
      role,
      quantity: piece.quantity,
      materialLabel,
      dimensions,
      pieceIds: [piece.id],
      reviewReasons,
    });
  }

  return [...groups.values()];
}

function rowsFor(buildModel: BoardsmithBuildModel): WallShelfPartScheduleRow[] {
  let assignedIndex = 0;

  return groupPieces(buildModel).map((group, index) => {
    const reasons = [...new Set(group.reviewReasons)];
    const assignPartLabel = shouldAssignPartLabel(group.role);
    const assigned = assignPartLabel ? partLabelForIndex(assignedIndex) : null;
    if (assignPartLabel) assignedIndex += 1;

    const displayName = displayNameForQuantity(group.displayName, group.role, group.quantity);
    const printLabel = assigned ? `${assigned.partLabel} - ${displayName}` : `${displayName} - review only`;

    return {
      id: `part_group_${index.toString()}_${idPart(displayName)}`,
      partLabel: assigned?.partLabel ?? null,
      badgeLabel: assigned?.badgeLabel ?? null,
      printLabel,
      displayName,
      role: group.role,
      quantity: group.quantity,
      quantityLabel: `Qty ${group.quantity.toString()}`,
      materialLabel: group.materialLabel,
      dimensions: group.dimensions,
      dimensionsLabel: dimensionsLabel(group.dimensions),
      pieceIds: group.pieceIds,
      relatedBuildModelPieceKeys: group.pieceIds,
      needsReview: reasons.length > 0,
      reviewReasons: reasons,
    };
  });
}

function summaryFor(status: WallShelfPartScheduleStatus, rows: WallShelfPartScheduleRow[], warnings: string[]): string {
  if (status === "unsupported") return "Part schedule is available for wall shelf build models only.";
  if (rows.length === 0) return "Add modeled pieces before assigning part labels.";
  if (warnings.length > 0) return "Part schedule needs review before cutting or assembly.";
  return "Part labels from Build Model pieces.";
}

function fallbackMessageFor(status: WallShelfPartScheduleStatus, rows: WallShelfPartScheduleRow[], warnings: string[]): string | null {
  if (status === "unsupported") return "Part labels are available for wall shelf build models only.";
  if (rows.length === 0) return "No modeled pieces are available for part labels yet.";
  if (warnings.length > 0) return "Resolve review-only or missing part details before treating the packet as complete.";
  return null;
}

export function createWallShelfPartScheduleViewModel(params: {
  buildModel: BoardsmithBuildModel;
}): WallShelfPartScheduleViewModel {
  const { buildModel } = params;
  const unsupported = buildModel.project.projectType !== "simple_shelf";
  const rows = unsupported ? [] : rowsFor(buildModel);
  const warnings = unsupported ? [] : [...new Set(rows.flatMap((row) => row.reviewReasons))];
  const status: WallShelfPartScheduleStatus = unsupported ? "unsupported" : rows.length === 0 || warnings.length > 0 ? "needs_review" : "ready";

  return {
    projectType: buildModel.project.projectType,
    status,
    rows,
    assignedParts: rows.filter((row) => row.partLabel),
    reviewRows: rows.filter((row) => !row.partLabel || row.needsReview),
    warnings,
    renderLabels: {
      title: "Part Schedule",
      summary: summaryFor(status, rows, warnings),
      fallbackMessage: fallbackMessageFor(status, rows, warnings),
    },
  };
}
