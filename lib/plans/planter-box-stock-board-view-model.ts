import type { BoardsmithBuildModel, BuildModelMaterial } from "@/lib/build-model/build-model-schema";
import {
  createPlanterBoxCutDiagramViewModel,
  type PlanterBoxCutDiagramViewModel,
  type PlanterBoxCutPieceGroup,
} from "@/lib/plans/planter-box-cut-diagram-view-model";

export type PlanterBoxStockBoardStatus = "ready" | "needs_review" | "unsupported";

export type PlanterBoxStockBoardPiece = {
  id: string;
  partLabel: string;
  printLabel: string;
  label: string;
  quantity: number;
  quantityLabel: string;
  dimensionsLabel: string;
  needsReview: boolean;
  reviewReasons: string[];
};

export type PlanterBoxStockBoardMaterialGroup = {
  id: string;
  materialId: string | null;
  displayName: string;
  materialTypeLabel: string;
  thickness: {
    valueInches: number | null;
    label: string;
    status: "known" | "missing";
  };
  pieces: PlanterBoxStockBoardPiece[];
  totalPieces: number;
  totalPiecesLabel: string;
  buyingNotes: string[];
  reviewReasons: string[];
};

export type PlanterBoxStockBoardViewModel = {
  projectType: string;
  status: PlanterBoxStockBoardStatus;
  materialGroups: PlanterBoxStockBoardMaterialGroup[];
  totalPieces: number;
  reviewReasons: string[];
  buyingNotes: string[];
  badges: string[];
  renderLabels: {
    title: "Planter Box Buying Plan";
    summary: string;
    fallbackMessage: string | null;
  };
};

type MaterialGroupAccumulator = Omit<PlanterBoxStockBoardMaterialGroup, "totalPieces" | "totalPiecesLabel">;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function idPart(value: string): string {
  return normalize(value).replaceAll(" ", "_") || "material_to_review";
}

function materialTypeLabel(material: BuildModelMaterial | null): string {
  if (!material) return "material type to review";
  return material.materialType.replaceAll("_", " ");
}

function formatThickness(material: BuildModelMaterial | null): PlanterBoxStockBoardMaterialGroup["thickness"] {
  const value = material?.nominalThicknessInches ?? null;
  return {
    valueInches: value,
    label: value ? `${value.toString()} in thick` : "thickness needs review",
    status: value ? "known" : "missing",
  };
}

function materialForPiece(piece: PlanterBoxCutPieceGroup, buildModel: BoardsmithBuildModel): BuildModelMaterial | null {
  const materialIds = uniqueStrings(
    piece.pieceIds.map((pieceId) => buildModel.pieces.find((buildPiece) => buildPiece.id === pieceId)?.materialId ?? "").filter(Boolean),
  );

  if (materialIds.length === 1) {
    return buildModel.materials.find((material) => material.id === materialIds[0]) ?? null;
  }

  return buildModel.materials.find((material) => material.label === piece.materialLabel) ?? null;
}

function pieceFromCutGroup(piece: PlanterBoxCutPieceGroup): PlanterBoxStockBoardPiece {
  return {
    id: piece.id,
    partLabel: piece.partLabel,
    printLabel: piece.printLabel,
    label: piece.label,
    quantity: piece.quantity,
    quantityLabel: piece.quantityLabel,
    dimensionsLabel: piece.dimensionsLabel,
    needsReview: piece.needsReview,
    reviewReasons: piece.reviewReasons,
  };
}

function materialReviewReasons(material: BuildModelMaterial | null, thickness: PlanterBoxStockBoardMaterialGroup["thickness"]): string[] {
  if (!material) return ["Material assignment needs review."];

  return uniqueStrings([
    ...(thickness.status === "missing" ? [`Confirm thickness for ${material.label}.`] : []),
    ...(material.materialType === "unknown" ? [`Confirm material type for ${material.label}.`] : []),
    ...(!material.recommendedForProject ? [`Review whether ${material.label} is suitable for outdoor planter use.`] : []),
    ...material.notes.filter((note) => /outdoor|rot|water|finish|review/i.test(note)),
  ]);
}

function groupBuyingNotes(group: MaterialGroupAccumulator): string[] {
  const pieceSummary = group.pieces.map((piece) => `${piece.printLabel} - ${piece.quantityLabel}: ${piece.dimensionsLabel}`);

  return uniqueStrings([
    `Planter panels from this material: ${pieceSummary.join("; ")}.`,
    "Modeled planter panels are panel envelopes; if actual stock board width is smaller than the modeled panel height or bottom depth, plan assembled boards, slats, or courses before buying.",
    "Compare panel dimensions with actual stock board width before purchase; this packet does not calculate course counts or optimize cuts.",
    "Choose stock board size after confirming actual board width, thickness, length, condition, and outdoor suitability.",
    "This is a planning aid only and does not choose a retailer, checkout item, optimized layout, or exact stock length.",
    ...group.buyingNotes,
  ]);
}

function materialGroupsFor(params: {
  buildModel: BoardsmithBuildModel;
  cutViewModel: PlanterBoxCutDiagramViewModel;
}): PlanterBoxStockBoardMaterialGroup[] {
  const groups = new Map<string, MaterialGroupAccumulator>();

  for (const piece of params.cutViewModel.pieceGroups) {
    const material = materialForPiece(piece, params.buildModel);
    const displayName = material?.label ?? piece.materialLabel;
    const key = material?.id ?? idPart(displayName);
    const thickness = formatThickness(material);
    const reviewReasons = uniqueStrings([...materialReviewReasons(material, thickness), ...piece.reviewReasons]);
    const buyingNotes = piece.label.toLowerCase().includes("bottom") ? ["Bottom panel drainage layout can change the final cut and finish review."] : [];
    const existing = groups.get(key);

    if (existing) {
      existing.pieces.push(pieceFromCutGroup(piece));
      existing.reviewReasons = uniqueStrings([...existing.reviewReasons, ...reviewReasons]);
      existing.buyingNotes = uniqueStrings([...existing.buyingNotes, ...buyingNotes]);
      continue;
    }

    groups.set(key, {
      id: key,
      materialId: material?.id ?? null,
      displayName,
      materialTypeLabel: materialTypeLabel(material),
      thickness,
      pieces: [pieceFromCutGroup(piece)],
      buyingNotes,
      reviewReasons,
    });
  }

  return [...groups.values()].map((group) => {
    const totalPieces = group.pieces.reduce((total, piece) => total + piece.quantity, 0);
    return {
      ...group,
      totalPieces,
      totalPiecesLabel: `${totalPieces.toString()} ${totalPieces === 1 ? "piece" : "pieces"}`,
      buyingNotes: groupBuyingNotes(group),
      reviewReasons: uniqueStrings(group.reviewReasons),
    };
  });
}

function reviewReasonsFor(params: {
  buildModel: BoardsmithBuildModel;
  cutViewModel: PlanterBoxCutDiagramViewModel;
  materialGroups: PlanterBoxStockBoardMaterialGroup[];
}): string[] {
  return uniqueStrings([
    ...params.materialGroups.flatMap((group) => group.reviewReasons),
    ...params.cutViewModel.warnings,
    ...params.cutViewModel.missingDimensions.map((message) => `Resolve cut dimension before buying: ${message}.`),
    ...params.buildModel.unresolvedQuestions,
    ...params.buildModel.safety.flags.map((flag) => flag.message),
    ...params.buildModel.connections.flatMap((connection) => connection.safetyNotes),
  ]);
}

function summaryFor(status: PlanterBoxStockBoardStatus, materialGroups: PlanterBoxStockBoardMaterialGroup[], reviewReasons: string[]): string {
  if (status === "unsupported") return "Buying plan is available for planter-box build models only.";
  if (materialGroups.length === 0) return "Add modeled planter panels before creating a buying plan.";
  if (reviewReasons.length > 0) return "Planter buying plan needs review before purchasing material.";
  return "Planter buying plan from Build Model panels.";
}

function fallbackMessageFor(status: PlanterBoxStockBoardStatus, materialGroups: PlanterBoxStockBoardMaterialGroup[], reviewReasons: string[]): string | null {
  if (status === "unsupported") return "Stock-board planning is available for planter-box build models only.";
  if (materialGroups.length === 0) return "No modeled planter panels are available for a buying plan yet.";
  if (reviewReasons.length > 0) return "Review outdoor exposure, drainage, liner choice, finish, fasteners, and stock length before using this as a purchase checklist.";
  return null;
}

export function createPlanterBoxStockBoardViewModel(params: {
  buildModel: BoardsmithBuildModel;
  cutViewModel?: PlanterBoxCutDiagramViewModel;
}): PlanterBoxStockBoardViewModel {
  const { buildModel } = params;
  const unsupported = buildModel.project.projectType !== "planter_box";
  const cutViewModel = params.cutViewModel ?? createPlanterBoxCutDiagramViewModel({ buildModel });
  const materialGroups = unsupported ? [] : materialGroupsFor({ buildModel, cutViewModel });
  const reviewReasons = unsupported ? [] : reviewReasonsFor({ buildModel, cutViewModel, materialGroups });
  const totalPieces = materialGroups.reduce((total, group) => total + group.totalPieces, 0);
  const status: PlanterBoxStockBoardStatus = unsupported ? "unsupported" : materialGroups.length === 0 || reviewReasons.length > 0 ? "needs_review" : "ready";

  return {
    projectType: buildModel.project.projectType,
    status,
    materialGroups,
    totalPieces,
    reviewReasons,
    buyingNotes: uniqueStrings([
      "Use this as a material planning aid, not a retail checkout list or optimized cut plan.",
      "Modeled planter panels may need assembled boards, slats, or courses when actual stock board width is smaller than the panel height or bottom depth.",
      "Choose stock length after confirming available boards and the final planter panel layout.",
      "Outdoor planter use requires material, fastener, finish, drainage, and liner review before purchase.",
      ...materialGroups.flatMap((group) => group.buyingNotes),
    ]),
    badges: [
      ...(status === "needs_review" ? ["Needs review"] : []),
      ...(reviewReasons.some((reason) => /drain|liner/i.test(reason)) ? ["Drainage review"] : []),
      ...(reviewReasons.some((reason) => /outdoor|water|soil|finish/i.test(reason)) ? ["Outdoor review"] : []),
      ...(materialGroups.length > 0 ? ["Build Model materials"] : []),
      "Not optimized",
    ],
    renderLabels: {
      title: "Planter Box Buying Plan",
      summary: summaryFor(status, materialGroups, reviewReasons),
      fallbackMessage: fallbackMessageFor(status, materialGroups, reviewReasons),
    },
  };
}
