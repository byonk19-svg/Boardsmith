import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";

export type PlanterBoxPartScheduleStatus = "ready" | "needs_review" | "unsupported";

export type PlanterBoxPartScheduleRow = {
  pieceId: string;
  partLabel: string;
  printLabel: string;
  pieceLabel: string;
  quantity: number;
  dimensions: string;
  materialLabel: string;
  reviewOnly: boolean;
  notes: string[];
};

export type PlanterBoxPartScheduleViewModel = {
  status: PlanterBoxPartScheduleStatus;
  projectType: BoardsmithBuildModel["project"]["projectType"];
  rows: PlanterBoxPartScheduleRow[];
  assignedParts: PlanterBoxPartScheduleRow[];
  reviewMessages: string[];
  renderLabels: {
    title: string;
    summary: string;
  };
};

const expectedPlanterPieceIds = ["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"] as const;

const partLabels: Record<(typeof expectedPlanterPieceIds)[number], string> = {
  front_panel: "Part A",
  back_panel: "Part B",
  left_side_panel: "Part C",
  right_side_panel: "Part D",
  bottom_panel: "Part E",
};

export function createPlanterBoxPartScheduleViewModel(params: { buildModel: BoardsmithBuildModel }): PlanterBoxPartScheduleViewModel {
  const { buildModel } = params;

  if (buildModel.project.projectType !== "planter_box") {
    return {
      status: "unsupported",
      projectType: buildModel.project.projectType,
      rows: [],
      assignedParts: [],
      reviewMessages: ["Planter-box packet parts are available only for the planter box template."],
      renderLabels: {
        title: "Planter box parts",
        summary: "Planter-box packet parts are available only for the planter box template.",
      },
    };
  }

  const materialLabels = new Map(buildModel.materials.map((material) => [material.id, material.label]));
  const piecesById = new Map(buildModel.pieces.map((piece) => [piece.id, piece]));
  const rows = expectedPlanterPieceIds.flatMap((pieceId) => {
    const piece = piecesById.get(pieceId);
    return piece ? [createRow(piece, partLabels[pieceId], materialLabels)] : [];
  });
  const missingPieces = expectedPlanterPieceIds.filter((pieceId) => !piecesById.has(pieceId));
  const rowsNeedingDimensions = rows.filter((row) => row.reviewOnly);
  const reviewMessages = [
    ...missingPieces.map((pieceId) => `${formatPieceId(pieceId)} needs modeling before this planter packet can be treated as complete.`),
    ...rowsNeedingDimensions.map((row) => `${row.printLabel} needs length, width, and thickness before cutting.`),
    ...buildModel.unresolvedQuestions,
    ...buildModel.safety.flags.map((flag) => flag.message),
  ];
  const status: PlanterBoxPartScheduleStatus = reviewMessages.length > 0 ? "needs_review" : "ready";

  return {
    status,
    projectType: buildModel.project.projectType,
    rows,
    assignedParts: rows,
    reviewMessages: Array.from(new Set(reviewMessages)),
    renderLabels: {
      title: "Planter box parts",
      summary:
        status === "ready"
          ? "Planter box panel labels are ready for review."
          : "Planter box panel labels need review before cutting or assembly.",
    },
  };
}

function createRow(piece: BuildModelPiece, partLabel: string, materialLabels: Map<string, string>): PlanterBoxPartScheduleRow {
  const dimensionsKnown = piece.dimensions.lengthInches !== null && piece.dimensions.widthInches !== null && piece.dimensions.thicknessInches !== null;
  const pieceLabel = piece.label.trim() || "Planter box panel";

  return {
    pieceId: piece.id,
    partLabel,
    printLabel: `${partLabel} - ${pieceLabel}`,
    pieceLabel,
    quantity: piece.quantity,
    dimensions: dimensionsKnown
      ? `${formatDimension(piece.dimensions.lengthInches)} x ${formatDimension(piece.dimensions.widthInches)} x ${formatDimension(piece.dimensions.thicknessInches)} in`
      : "Dimensions need review",
    materialLabel: piece.materialId ? (materialLabels.get(piece.materialId) ?? "Material needs review") : "Material needs review",
    reviewOnly: !dimensionsKnown || piece.materialId === null,
    notes: piece.notes,
  };
}

function formatDimension(value: number | null): string {
  return value === null ? "review" : Number(value.toFixed(3)).toString();
}

function formatPieceId(pieceId: string): string {
  return pieceId
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
