import type { CutListReviewSummary } from "@/lib/plans/cut-list-review";
import type { PrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";

export type PrintablePlanPacketFamily = "wall_shelf" | "planter_box" | "generic";

export const corePacketSectionTitles = {
  buildSnapshot: "Build Snapshot",
  heroVisual: "Hero Visual",
  projectVisuals: "Project Visuals / Diagrams",
  checkBeforeBuilding: "Check Before Building",
  materialsAndParts: "Materials and Parts",
  cutChecklist: "Cut Checklist",
  buyingPlan: "Buying Plan",
  buildGuide: "Build Guide",
  referenceReviewNotes: "Reference Review Notes",
} as const;

export const corePacketSectionOrder = [
  corePacketSectionTitles.buildSnapshot,
  corePacketSectionTitles.heroVisual,
  corePacketSectionTitles.projectVisuals,
  corePacketSectionTitles.checkBeforeBuilding,
  corePacketSectionTitles.materialsAndParts,
  corePacketSectionTitles.cutChecklist,
  corePacketSectionTitles.buyingPlan,
  corePacketSectionTitles.buildGuide,
  corePacketSectionTitles.referenceReviewNotes,
] as const;

export type PrintablePlanPacketPartRow = {
  id: string;
  displayName: string;
  printLabel: string;
  quantity: number;
  quantityLabel: string;
  dimensionsLabel: string;
  materialLabel: string;
};

export type PrintablePlanPacketSummary = {
  family: PrintablePlanPacketFamily;
  assignedParts: PrintablePlanPacketPartRow[];
  partRows: PrintablePlanPacketPartRow[];
  cutWarnings: string[];
  cutWarningCount: number;
  majorPieceLabels: string[];
};

type CutListItem = CutListReviewSummary["items"][number];

function normalizePartText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function partQuantity(rowQuantityLabel: string): number | null {
  const value = Number.parseInt(rowQuantityLabel.replace(/[^0-9]+/g, ""), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function mapPlanterPartRow(row: PrintablePlanManifest["planterBoxPartScheduleViewModel"]["rows"][number]): PrintablePlanPacketPartRow {
  return {
    id: row.pieceId,
    displayName: row.pieceLabel,
    printLabel: row.printLabel,
    quantity: row.quantity,
    quantityLabel: `${row.quantity.toString()}x`,
    dimensionsLabel: row.dimensions,
    materialLabel: row.materialLabel,
  };
}

function familyFor(manifest: PrintablePlanManifest): PrintablePlanPacketFamily {
  if (manifest.wallShelfPartScheduleViewModel.status !== "unsupported" || manifest.wallShelfCutDiagramViewModel.status !== "unsupported") {
    return "wall_shelf";
  }

  if (manifest.planterBoxPartScheduleViewModel.status !== "unsupported" || manifest.planterBoxCutDiagramViewModel.status !== "unsupported") {
    return "planter_box";
  }

  return "generic";
}

function assignedPartsFor(manifest: PrintablePlanManifest): PrintablePlanPacketPartRow[] {
  if (manifest.wallShelfPartScheduleViewModel.assignedParts.length > 0) {
    return manifest.wallShelfPartScheduleViewModel.assignedParts;
  }

  if (manifest.planterBoxPartScheduleViewModel.assignedParts.length > 0) {
    return manifest.planterBoxPartScheduleViewModel.assignedParts.map(mapPlanterPartRow);
  }

  return [];
}

function partRowsFor(manifest: PrintablePlanManifest): PrintablePlanPacketPartRow[] {
  if (manifest.wallShelfPartScheduleViewModel.rows.length > 0) {
    return manifest.wallShelfPartScheduleViewModel.rows;
  }

  if (manifest.planterBoxPartScheduleViewModel.rows.length > 0) {
    return manifest.planterBoxPartScheduleViewModel.rows.map(mapPlanterPartRow);
  }

  return [];
}

function cutWarningsFor(manifest: PrintablePlanManifest): string[] {
  if (manifest.wallShelfCutDiagramViewModel.status !== "unsupported") {
    return manifest.wallShelfCutDiagramViewModel.warnings;
  }

  if (manifest.planterBoxCutDiagramViewModel.status !== "unsupported") {
    return manifest.planterBoxCutDiagramViewModel.warnings;
  }

  return manifest.cutList?.warnings ?? [];
}

function modeledPieceLabels(manifest: PrintablePlanManifest): string[] {
  const modeledPieces = manifest.cutList?.items.filter((item) => item.sourceLabel === "Modeled piece") ?? [];
  return [...new Set(modeledPieces.map((item) => item.label))].slice(0, 3);
}

export function createPrintablePlanPacketSummary(manifest: PrintablePlanManifest): PrintablePlanPacketSummary {
  const assignedParts = assignedPartsFor(manifest);
  const partRows = partRowsFor(manifest);
  const cutWarnings = cutWarningsFor(manifest);
  const majorPieceLabels = assignedParts.length > 0 ? assignedParts.map((row) => row.printLabel).slice(0, 3) : modeledPieceLabels(manifest);

  return {
    family: familyFor(manifest),
    assignedParts,
    partRows,
    cutWarnings,
    cutWarningCount: cutWarnings.length,
    majorPieceLabels,
  };
}

export function labelForPacketCutItem(item: CutListItem, packet: PrintablePlanPacketSummary): string {
  const quantity = partQuantity(item.quantityLabel);
  const match = packet.assignedParts.find((row) => {
    const rowNames = [row.displayName, row.printLabel].map(normalizePartText);
    return (
      rowNames.includes(normalizePartText(item.label)) ||
      (normalizePartText(row.displayName).replace(/\bs$/, "") === normalizePartText(item.label).replace(/\bs$/, "") &&
        row.dimensionsLabel === item.dimensionsLabel &&
        normalizePartText(row.materialLabel) === normalizePartText(item.materialLabel) &&
        (!quantity || row.quantity === quantity))
    );
  });

  return match?.printLabel ?? item.label;
}

export function packetPartScheduleListItems(manifest: PrintablePlanManifest, packet = createPrintablePlanPacketSummary(manifest)): string[] {
  if (packet.partRows.length > 0) {
    return packet.partRows.map((row) => `${row.printLabel}: ${row.quantityLabel}, ${row.dimensionsLabel}`);
  }

  return (
    manifest.cutList?.items
      .filter((item) => item.sourceLabel === "Modeled piece")
      .map((item) => `${item.quantityLabel}x ${item.label}: ${item.dimensionsLabel}`) ?? []
  );
}
