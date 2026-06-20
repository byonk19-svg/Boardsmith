import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import {
  createPlanterBoxPartScheduleViewModel,
  type PlanterBoxPartScheduleRow,
  type PlanterBoxPartScheduleViewModel,
} from "@/lib/plans/planter-box-part-schedule-view-model";

export type PlanterBoxCutDiagramStatus = "ready" | "needs_review" | "unsupported";

export type PlanterBoxCutPieceGroup = {
  id: string;
  pieceIds: string[];
  partLabel: string;
  badgeLabel: string;
  printLabel: string;
  label: string;
  quantity: number;
  quantityLabel: string;
  materialLabel: string;
  dimensionsLabel: string;
  needsReview: boolean;
  reviewReasons: string[];
};

export type PlanterBoxCutDiagramViewModel = {
  projectType: string;
  status: PlanterBoxCutDiagramStatus;
  materialGroups: {
    id: string;
    materialLabel: string;
    pieces: PlanterBoxCutPieceGroup[];
  }[];
  pieceGroups: PlanterBoxCutPieceGroup[];
  totalCutPieces: number;
  readyCutPieces: number;
  reviewCutPieces: number;
  missingDimensions: string[];
  warnings: string[];
  badges: string[];
  partSchedule: PlanterBoxPartScheduleViewModel;
  renderLabels: {
    title: "Planter box cut layout";
    summary: string;
    fallbackMessage: string | null;
  };
};

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cutGroupFromPart(row: PlanterBoxPartScheduleRow): PlanterBoxCutPieceGroup {
  const reviewReasons = uniqueStrings([
    ...(row.reviewOnly ? [`${row.printLabel} needs confirmed dimensions and material before cutting.`] : []),
    ...row.notes.filter((note) => /drain|outdoor|water|finish|review/i.test(note)),
  ]);

  return {
    id: `cut_group_${row.pieceId}`,
    pieceIds: [row.pieceId],
    partLabel: row.partLabel,
    badgeLabel: row.partLabel,
    printLabel: row.printLabel,
    label: row.pieceLabel,
    quantity: row.quantity,
    quantityLabel: `${row.quantity.toString()}x`,
    materialLabel: row.materialLabel,
    dimensionsLabel: row.dimensions,
    needsReview: row.reviewOnly || reviewReasons.length > 0,
    reviewReasons,
  };
}

function materialGroupsFor(pieceGroups: PlanterBoxCutPieceGroup[]): PlanterBoxCutDiagramViewModel["materialGroups"] {
  const groups = new Map<string, PlanterBoxCutPieceGroup[]>();

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

function fallbackMessageFor(status: PlanterBoxCutDiagramStatus, pieceGroups: PlanterBoxCutPieceGroup[], warnings: string[]): string | null {
  if (status === "unsupported") return "Planter box cut layouts are available for planter-box build models only.";
  if (pieceGroups.length === 0) return "Add modeled planter panels before rendering a cut layout.";
  if (warnings.length > 0) return "Review drainage, outdoor exposure, and cut dimensions before treating this as a complete cut layout.";
  return null;
}

function summaryFor(pieceGroups: PlanterBoxCutPieceGroup[], reviewCutPieces: number): string {
  if (pieceGroups.length === 0) return "No modeled planter panels are available yet.";
  if (reviewCutPieces > 0) return "Planter cut layout needs review before cutting.";
  return "Planter cut layout from Build Model panels.";
}

export function createPlanterBoxCutDiagramViewModel(params: { buildModel: BoardsmithBuildModel }): PlanterBoxCutDiagramViewModel {
  const { buildModel } = params;
  const unsupported = buildModel.project.projectType !== "planter_box";
  const partSchedule = createPlanterBoxPartScheduleViewModel({ buildModel });
  const pieceGroups = unsupported ? [] : partSchedule.rows.map(cutGroupFromPart);
  const missingDimensions = pieceGroups
    .filter((piece) => /need review/i.test(piece.dimensionsLabel) || piece.reviewReasons.some((reason) => /dimension|material/i.test(reason)))
    .map((piece) => `${piece.printLabel}: ${piece.dimensionsLabel}`);
  const warnings = unsupported
    ? []
    : uniqueStrings([
        ...partSchedule.reviewMessages,
        ...pieceGroups.flatMap((piece) => piece.reviewReasons),
        ...buildModel.connections.flatMap((connection) => [...connection.safetyNotes, ...connection.notes]),
      ]);
  const reviewCutPieces = pieceGroups.filter((piece) => piece.needsReview).length;
  const status: PlanterBoxCutDiagramStatus = unsupported ? "unsupported" : pieceGroups.length === 0 || warnings.length > 0 ? "needs_review" : "ready";

  return {
    projectType: buildModel.project.projectType,
    status,
    materialGroups: materialGroupsFor(pieceGroups),
    pieceGroups,
    totalCutPieces: pieceGroups.reduce((total, piece) => total + piece.quantity, 0),
    readyCutPieces: pieceGroups.filter((piece) => !piece.needsReview).reduce((total, piece) => total + piece.quantity, 0),
    reviewCutPieces,
    missingDimensions: uniqueStrings(missingDimensions),
    warnings,
    badges: [
      ...(status === "needs_review" ? ["Needs review"] : []),
      ...(warnings.some((warning) => /drain|liner/i.test(warning)) ? ["Drainage review"] : []),
      ...(warnings.some((warning) => /outdoor|water|soil|finish/i.test(warning)) ? ["Outdoor review"] : []),
      ...(pieceGroups.length > 0 ? ["Build Model panels"] : []),
    ],
    partSchedule,
    renderLabels: {
      title: "Planter box cut layout",
      summary: summaryFor(pieceGroups, reviewCutPieces),
      fallbackMessage: fallbackMessageFor(status, pieceGroups, warnings),
    },
  };
}
