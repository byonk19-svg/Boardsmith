import type { BoardsmithBuildModel, BuildModelMaterial } from "@/lib/build-model/build-model-schema";
import type { WallShelfCutDiagramViewModel, WallShelfCutPieceGroup } from "@/lib/plans/wall-shelf-cut-diagram-view-model";
import { createWallShelfCutDiagramViewModel } from "@/lib/plans/wall-shelf-cut-diagram-view-model";
import { findShelfLayoutIssues, hasConnectedShelfSupportPlaceholder } from "@/lib/projects/shelf-layout-validation";
import type { Project } from "@/lib/projects/types";

export type WallShelfStockBoardStatus = "ready" | "needs_review" | "unsupported";
export type WallShelfStockBoardDimensionStatus = "known" | "missing";

export type WallShelfStockBoardPiece = {
  id: string;
  partLabel: string | null;
  badgeLabel: string | null;
  printLabel: string;
  label: string;
  quantity: number;
  quantityLabel: string;
  dimensionsLabel: string;
  needsReview: boolean;
  reviewReasons: string[];
};

export type WallShelfStockBoardMaterialGroup = {
  id: string;
  materialId: string | null;
  displayName: string;
  materialTypeLabel: string;
  thickness: {
    valueInches: number | null;
    label: string;
    status: WallShelfStockBoardDimensionStatus;
  };
  pieces: WallShelfStockBoardPiece[];
  totalPieces: number;
  totalPiecesLabel: string;
  buyingNotes: string[];
  reviewReasons: string[];
};

export type WallShelfBuyingDecision = {
  id: "stock_board_selection" | "hardware_site_review" | "support_frame_review" | "finish_exposure_review";
  label: string;
  detail: string;
  statusLabel: "Select before buying" | "Review before buying" | "Resolve before buying";
};

export type WallShelfStockBoardViewModel = {
  projectType: string;
  status: WallShelfStockBoardStatus;
  materialGroups: WallShelfStockBoardMaterialGroup[];
  totalPieces: number;
  buyingDecisions: WallShelfBuyingDecision[];
  reviewReasons: string[];
  buyingNotes: string[];
  badges: string[];
  renderLabels: {
    title: "Buying Plan";
    summary: string;
    fallbackMessage: string | null;
  };
};

type WallShelfStockBoardProjectInput = Pick<
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

type MaterialGroupAccumulator = {
  id: string;
  materialId: string | null;
  displayName: string;
  materialTypeLabel: string;
  thickness: WallShelfStockBoardMaterialGroup["thickness"];
  pieces: WallShelfStockBoardPiece[];
  reviewReasons: string[];
  buyingNotes: string[];
};

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

function formatThickness(material: BuildModelMaterial | null): WallShelfStockBoardMaterialGroup["thickness"] {
  const value = material?.nominalThicknessInches ?? null;
  return {
    valueInches: value,
    label: value ? `${value.toString()} in thick` : "thickness needs review",
    status: value ? "known" : "missing",
  };
}

function pieceFromCutGroup(piece: WallShelfCutPieceGroup): WallShelfStockBoardPiece {
  return {
    id: piece.id,
    partLabel: piece.partLabel,
    badgeLabel: piece.badgeLabel,
    printLabel: piece.printLabel,
    label: piece.label,
    quantity: piece.quantity,
    quantityLabel: piece.quantityLabel,
    dimensionsLabel: piece.dimensionsLabel,
    needsReview: piece.needsReview,
    reviewReasons: piece.reviewReasons,
  };
}

function materialForPiece(piece: WallShelfCutPieceGroup, buildModel: BoardsmithBuildModel): BuildModelMaterial | null {
  const materialIds = uniqueStrings(
    piece.pieceIds
      .map((pieceId) => buildModel.pieces.find((buildPiece) => buildPiece.id === pieceId)?.materialId ?? "")
      .filter(Boolean),
  );

  if (materialIds.length === 1) {
    return buildModel.materials.find((material) => material.id === materialIds[0]) ?? null;
  }

  return buildModel.materials.find((material) => material.label === piece.materialLabel) ?? null;
}

function materialReviewReasons(material: BuildModelMaterial | null, thickness: WallShelfStockBoardMaterialGroup["thickness"]): string[] {
  if (!material) return ["Material assignment needs review."];

  return uniqueStrings([
    ...(thickness.status === "missing" ? [`Confirm thickness for ${material.label}.`] : []),
    ...(material.materialType === "unknown" ? [`Confirm material type for ${material.label}.`] : []),
    ...(!material.recommendedForProject ? [`Review whether ${material.label} is suitable for this project.`] : []),
  ]);
}

function groupBuyingNotes(group: MaterialGroupAccumulator): string[] {
  const pieceSummary = group.pieces.map((piece) => `${piece.printLabel} - ${piece.quantityLabel}: ${piece.dimensionsLabel}`);

  return uniqueStrings([
    `Pieces to get from this material: ${pieceSummary.join("; ")}.`,
    "Stock board size needs selection from available lumber after confirming the actual board width, thickness, length, and condition.",
    "This is not a cut optimizer and does not choose a store board, price, vendor, or exact stock length.",
    ...group.buyingNotes,
  ]);
}

function materialGroupsFor(params: {
  buildModel: BoardsmithBuildModel;
  cutViewModel: WallShelfCutDiagramViewModel;
}): WallShelfStockBoardMaterialGroup[] {
  const groups = new Map<string, MaterialGroupAccumulator>();
  for (const piece of params.cutViewModel.pieceGroups) {
    const material = materialForPiece(piece, params.buildModel);
    const displayName = material?.label ?? piece.materialLabel;
    const key = material?.id ?? idPart(displayName);
    const thickness = formatThickness(material);
    const existing = groups.get(key);
    const reviewReasons = uniqueStrings([...materialReviewReasons(material, thickness), ...piece.reviewReasons]);
    const buyingNotes = piece.role === "support_frame_placeholder" ? ["Support/frame pieces may add material after the support design is confirmed."] : [];

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
      reviewReasons,
      buyingNotes,
    });
  }

  return [...groups.values()].map((group) => {
    const totalPieces = group.pieces.reduce((total, piece) => total + piece.quantity, 0);
    return {
      id: group.id,
      materialId: group.materialId,
      displayName: group.displayName,
      materialTypeLabel: group.materialTypeLabel,
      thickness: group.thickness,
      pieces: group.pieces,
      totalPieces,
      totalPiecesLabel: `${totalPieces.toString()} ${totalPieces === 1 ? "piece" : "pieces"}`,
      buyingNotes: groupBuyingNotes(group),
      reviewReasons: uniqueStrings(group.reviewReasons),
    };
  });
}

function reviewReasonsFor(params: {
  project: WallShelfStockBoardProjectInput;
  buildModel: BoardsmithBuildModel;
  cutViewModel: WallShelfCutDiagramViewModel;
  materialGroups: WallShelfStockBoardMaterialGroup[];
}): string[] {
  const layoutIssues = findShelfLayoutIssues(params.project);
  const connectedShelfUnit = params.project.shelf_layout === "multi_shelf_unit" && Boolean(params.project.shelf_count && params.project.shelf_count > 1);
  const supportModeled = params.cutViewModel.pieceGroups.some((piece) => piece.role === "support_frame" && !piece.needsReview);
  const supportNeedsReview = supportNeedsReviewFor({
    buildModel: params.buildModel,
    cutViewModel: params.cutViewModel,
    connectedShelfUnit,
    supportModeled,
    layoutIssueCodes: layoutIssues.map((issue) => issue.code),
  });

  return uniqueStrings([
    ...layoutIssues.map((issue) => issue.label),
    ...layoutIssues.map((issue) => issue.recommendedAction),
    ...params.materialGroups.flatMap((group) => group.reviewReasons),
    ...params.cutViewModel.missingDimensions.map((message) => `Resolve cut dimension before buying: ${message}.`),
    ...(supportNeedsReview ? ["Support/frame pieces may add material; confirm support/frame design before treating this buying plan as complete."] : []),
  ]);
}

function supportNeedsReviewFor(params: {
  buildModel: BoardsmithBuildModel;
  cutViewModel: WallShelfCutDiagramViewModel;
  connectedShelfUnit: boolean;
  supportModeled: boolean;
  layoutIssueCodes: string[];
}): boolean {
  return (
    (params.connectedShelfUnit && !params.supportModeled) ||
    hasConnectedShelfSupportPlaceholder(params.buildModel) ||
    params.cutViewModel.pieceGroups.some((piece) => piece.role === "support_frame_placeholder") ||
    params.layoutIssueCodes.includes("connected_shelf_support_incomplete")
  );
}

function hardwareDecisionLabel(project: WallShelfStockBoardProjectInput): string {
  if (project.shelf_layout === "multiple_separate_shelves") return "Per-shelf hardware/site review";
  if (project.shelf_layout === "multi_shelf_unit") return "Support and wall-fastener review";
  return "Mounting hardware/site review";
}

function hardwareDecisionDetail(buildModel: BoardsmithBuildModel): string {
  const hardwareLabels = uniqueStrings(buildModel.hardware.map((item) => item.label));
  const siteReview = "Confirm suitability for the wall structure, support method, expected load, fasteners, and site conditions before buying.";

  if (hardwareLabels.length === 0) {
    return `No bracket, cleat, anchor, or fastener is selected yet. ${siteReview}`;
  }

  return `Build Model hardware to review: ${hardwareLabels.join(", ")}. ${siteReview}`;
}

function hasFinishExposureReview(project: WallShelfStockBoardProjectInput): boolean {
  return /\b(bathroom|humid|humidity|moisture|wet|outdoor|outside|laundry|kitchen|sink|toilet|shower)\b/i.test(
    [project.title, project.intended_use, project.style_notes, project.material_type].join(" "),
  );
}

function stockBoardDecisionDetail(materialGroups: WallShelfStockBoardMaterialGroup[]): string {
  const materials = uniqueStrings(materialGroups.map((group) => group.displayName));
  const materialText = materials.length > 0 ? ` for ${materials.join(", ")}` : "";
  return `Choose actual stock board length and board condition${materialText} after confirming the final cut layout. This is not a store-board pick and does not arrange cuts on a full board.`;
}

function buyingDecisionsFor(params: {
  project: WallShelfStockBoardProjectInput;
  buildModel: BoardsmithBuildModel;
  cutViewModel: WallShelfCutDiagramViewModel;
  materialGroups: WallShelfStockBoardMaterialGroup[];
}): WallShelfBuyingDecision[] {
  if (params.materialGroups.length === 0) return [];

  const layoutIssues = findShelfLayoutIssues(params.project);
  const connectedShelfUnit = params.project.shelf_layout === "multi_shelf_unit" && Boolean(params.project.shelf_count && params.project.shelf_count > 1);
  const supportModeled = params.cutViewModel.pieceGroups.some((piece) => piece.role === "support_frame" && !piece.needsReview);
  const supportNeedsReview = supportNeedsReviewFor({
    buildModel: params.buildModel,
    cutViewModel: params.cutViewModel,
    connectedShelfUnit,
    supportModeled,
    layoutIssueCodes: layoutIssues.map((issue) => issue.code),
  });

  return [
    {
      id: "stock_board_selection",
      label: "Stock board selection",
      detail: stockBoardDecisionDetail(params.materialGroups),
      statusLabel: "Select before buying",
    },
    ...(supportNeedsReview
      ? [
          {
            id: "support_frame_review" as const,
            label: "Support/frame may change the list",
            detail: "Confirm side supports, frame, cleat, bracket, or another support method before treating the material list as complete.",
            statusLabel: "Resolve before buying" as const,
          },
        ]
      : []),
    {
      id: "hardware_site_review",
      label: hardwareDecisionLabel(params.project),
      detail: hardwareDecisionDetail(params.buildModel),
      statusLabel: "Review before buying",
    },
    ...(hasFinishExposureReview(params.project)
      ? [
          {
            id: "finish_exposure_review" as const,
            label: "Finish/exposure review",
            detail: "Confirm finish, humidity or outdoor exposure, material suitability, and corrosion-resistant hardware needs before buying. Boardsmith does not verify waterproofing or durability.",
            statusLabel: "Review before buying" as const,
          },
        ]
      : []),
  ];
}

function summaryFor(status: WallShelfStockBoardStatus, materialGroups: WallShelfStockBoardMaterialGroup[], reviewReasons: string[]): string {
  if (status === "unsupported") return "Buying plan is available for wall shelf build models only.";
  if (materialGroups.length === 0) return "Add modeled pieces before creating a buying plan.";
  if (reviewReasons.length > 0) return "Buying plan needs review before purchasing material.";
  return "Buying plan from Build Model pieces.";
}

function layoutAwareFallbackMessage(project: WallShelfStockBoardProjectInput): string {
  if (project.shelf_layout === "multi_shelf_unit") {
    return "Review support/frame design, dimensions, finish, and stock length before using this as a purchase checklist.";
  }

  if (project.shelf_layout === "multiple_separate_shelves") {
    return "Review per-shelf mounting hardware, bracket count, dimensions, finish, and stock length before using this as a purchase checklist.";
  }

  return "Review mounting hardware/support method, dimensions, finish, and stock length before using this as a purchase checklist.";
}

function fallbackMessageFor(
  project: WallShelfStockBoardProjectInput,
  status: WallShelfStockBoardStatus,
  materialGroups: WallShelfStockBoardMaterialGroup[],
  reviewReasons: string[],
): string | null {
  if (status === "unsupported") return "Stock-board planning is available for wall shelf build models only.";
  if (materialGroups.length === 0) return "No modeled pieces are available for a buying plan yet.";
  if (reviewReasons.length > 0) return layoutAwareFallbackMessage(project);
  return null;
}

export function createWallShelfStockBoardViewModel(params: {
  project: WallShelfStockBoardProjectInput;
  buildModel: BoardsmithBuildModel;
  cutViewModel?: WallShelfCutDiagramViewModel;
}): WallShelfStockBoardViewModel {
  const { project, buildModel } = params;
  const unsupported = project.project_type !== "simple_shelf" || buildModel.project.projectType !== "simple_shelf";
  const cutViewModel = params.cutViewModel ?? createWallShelfCutDiagramViewModel({ project, buildModel });
  const materialGroups = unsupported ? [] : materialGroupsFor({ buildModel, cutViewModel });
  const reviewReasons = unsupported ? [] : reviewReasonsFor({ project, buildModel, cutViewModel, materialGroups });
  const buyingDecisions = unsupported ? [] : buyingDecisionsFor({ project, buildModel, cutViewModel, materialGroups });
  const totalPieces = materialGroups.reduce((total, group) => total + group.totalPieces, 0);
  const status: WallShelfStockBoardStatus = unsupported ? "unsupported" : materialGroups.length === 0 || reviewReasons.length > 0 ? "needs_review" : "ready";

  return {
    projectType: project.project_type,
    status,
    materialGroups,
    totalPieces,
    buyingDecisions,
    reviewReasons,
    buyingNotes: uniqueStrings([
      "Use this as a material planning aid, not a shopping cart or optimized cut plan.",
      "Choose stock length after confirming available boards and your final cut layout.",
      ...materialGroups.flatMap((group) => group.buyingNotes),
    ]),
    badges: [
      ...(status === "needs_review" ? ["Needs review"] : []),
      ...(reviewReasons.some((reason) => /support|frame/i.test(reason)) ? ["Support/frame review"] : []),
      ...(materialGroups.length > 0 ? ["Build Model materials"] : []),
      "Not optimized",
    ],
    renderLabels: {
      title: "Buying Plan",
      summary: summaryFor(status, materialGroups, reviewReasons),
      fallbackMessage: fallbackMessageFor(project, status, materialGroups, reviewReasons),
    },
  };
}
