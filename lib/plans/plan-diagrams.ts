import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import {
  createWallShelfDiagramViewModel,
  type WallShelfDiagramViewModel,
} from "@/lib/plans/wall-shelf-diagram-view-model";

export const planningDiagramDisclaimer = "Planning diagram — not to scale.";
export const planningDiagramFallback = "No diagram available yet. Review the cut list and build steps before building.";
export const connectionDiagramFallback = "No modeled connections available yet. Review the build steps before assembling.";
export const projectAnatomyFallback = "Project anatomy is not available yet. Review the cut list and build guide before building.";
export const projectAnatomyInvalidHeightFallback = "Add valid total height to render full layout.";
export const threeViewDiagramFallback = "Three-view diagram is not available yet. Review the cut list and build guide before building.";
export const visualPieceInventoryDisclaimer = "Visual piece inventory - planning aid only.";

export type PlanningDiagramKind = "simple_shelf" | "book_ledge" | "planter_box";
export type PlanningDiagramType = "overview" | "piece_relationship" | "connection_summary";

export type PlanningDiagramPiece = {
  id: string;
  label: string;
  quantityLabel: string;
  dimensionsLabel: string;
  role: "shelf" | "bottom" | "back" | "front" | "side" | "base" | "panel" | "other";
};

export type PlanningDiagramConnection = {
  id: string;
  fromLabel: string;
  toLabel: string;
  connectionLabel: string;
  hardwareLabel: string;
  relationshipLabel: string;
  location: string;
  needsReview: boolean;
  reviewLabel: "Needs manual review" | "Verify before building";
  safetyNote: string | null;
};

export type ProjectAnatomyVisual = {
  title: "Project anatomy";
  kind: PlanningDiagramKind | "generic";
  widthLabel: string;
  heightLabel: string;
  depthLabel: string;
  materialThicknessLabel: string;
  materialLabel: string;
  pieceLabels: string[];
  shelfCount: number | null;
  hasWallContext: boolean;
  supportLabel: string | null;
  fallbackMessage: string | null;
};

export type ThreeViewPlanningDiagramView = {
  id: "front" | "top" | "side";
  title: "Front view" | "Top view" | "Side view";
  primaryDimensionLabel: string;
  secondaryDimensionLabel: string;
  pieceLabels: string[];
};

export type ThreeViewPlanningDiagram = {
  title: "Three-view planning diagram";
  views: ThreeViewPlanningDiagramView[];
  fallbackMessage: typeof threeViewDiagramFallback | null;
};

export type VisualPieceInventoryItem = PlanningDiagramPiece & {
  materialLabel: string;
};

export type VisualPieceInventory = {
  disclaimer: typeof visualPieceInventoryDisclaimer;
  items: VisualPieceInventoryItem[];
};

export type PlanningDiagram = {
  id: string;
  type: PlanningDiagramType;
  kind: PlanningDiagramKind;
  title: string;
  label: string;
  disclaimer: typeof planningDiagramDisclaimer;
  pieces: PlanningDiagramPiece[];
  connections: PlanningDiagramConnection[];
  emptyMessage: typeof connectionDiagramFallback | null;
};

export type PlanningDiagramSummary = {
  diagrams: PlanningDiagram[];
  fallbackMessage: typeof planningDiagramFallback;
  projectAnatomy: ProjectAnatomyVisual;
  threeView: ThreeViewPlanningDiagram;
  visualPieceInventory: VisualPieceInventory;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function pieceText(piece: BuildModelPiece): string {
  return normalize(`${piece.id} ${piece.label} ${piece.pieceType}`);
}

function findPiece(pieces: BuildModelPiece[], terms: RegExp): BuildModelPiece | null {
  return pieces.find((piece) => terms.test(pieceText(piece))) ?? null;
}

function formatMeasurement(value: number | null): string {
  return value ? `${value.toString()} in` : "unknown";
}

function dimensionLabel(label: "Width" | "Height" | "Depth" | "Material thickness", value: number | null): string {
  return `${label} ${formatMeasurement(value)}`;
}

function formatPieceDimensions(piece: BuildModelPiece): string {
  const dimensions = piece.dimensions;
  return `${formatMeasurement(dimensions.lengthInches)} x ${formatMeasurement(dimensions.widthInches)} x ${formatMeasurement(dimensions.thicknessInches)}`;
}

function roleForPiece(piece: BuildModelPiece): PlanningDiagramPiece["role"] {
  const text = pieceText(piece);
  if (/\bshelf\b/.test(text) && !/\bbottom\b/.test(text)) return "shelf";
  if (/\bbottom\b/.test(text)) return "bottom";
  if (/\bback\b/.test(text)) return "back";
  if (/\bfront|lip\b/.test(text)) return "front";
  if (/\bside|left|right\b/.test(text)) return "side";
  if (/\bbase\b/.test(text)) return "base";
  if (/\bpanel\b/.test(text)) return "panel";
  return "other";
}

function mapPieces(pieces: BuildModelPiece[]): PlanningDiagramPiece[] {
  return pieces.map((piece) => ({
    id: piece.id,
    label: piece.label,
    quantityLabel: `${piece.quantity.toString()}x`,
    dimensionsLabel: formatPieceDimensions(piece),
    role: roleForPiece(piece),
  }));
}

function materialLabelForPiece(piece: BuildModelPiece, model: BoardsmithBuildModel): string {
  return model.materials.find((material) => material.id === piece.materialId)?.label ?? "material to review";
}

function createVisualPieceInventory(model: BoardsmithBuildModel): VisualPieceInventory {
  return {
    disclaimer: visualPieceInventoryDisclaimer,
    items: model.pieces.map((piece) => ({
      ...mapPieces([piece])[0],
      materialLabel: materialLabelForPiece(piece, model),
    })),
  };
}

function hasCompleteDimensions(model: BoardsmithBuildModel): boolean {
  return Boolean(model.dimensions.widthInches && model.dimensions.heightInches && model.dimensions.depthInches);
}

function createProjectAnatomyVisual(model: BoardsmithBuildModel, wallShelfViewModel?: WallShelfDiagramViewModel | null): ProjectAnatomyVisual {
  if (wallShelfViewModel && wallShelfViewModel.status !== "unsupported") {
    const pieceLabels = wallShelfViewModel.visibleBoards.map((piece) => piece.label).slice(0, 4);
    const isAvailable = wallShelfViewModel.status === "ready" && wallShelfViewModel.visibleBoards.length > 0;
    return {
      title: "Project anatomy",
      kind: "simple_shelf",
      widthLabel: wallShelfViewModel.dimensions.width.label,
      heightLabel: wallShelfViewModel.dimensions.height.label,
      depthLabel: wallShelfViewModel.dimensions.depth.label,
      materialThicknessLabel: wallShelfViewModel.dimensions.boardThickness.label,
      materialLabel: wallShelfViewModel.visibleBoards.at(0)?.materialLabel ?? model.materials.at(0)?.label ?? "material to review",
      pieceLabels,
      shelfCount: wallShelfViewModel.shelfCount,
      hasWallContext: hasWallContext(model),
      supportLabel: wallShelfViewModel.supportFrameReview.needsReview ? wallShelfViewModel.supportFrameReview.label : hasWallContext(model) ? "Wall/support details to verify" : null,
      fallbackMessage: wallShelfViewModel.visibleBoards.length === 0 ? projectAnatomyFallback : wallShelfViewModel.renderLabels.fallbackMessage ?? (isAvailable ? null : projectAnatomyFallback),
    };
  }

  const pieceLabels = model.pieces.map((piece) => piece.label).slice(0, 4);
  const isAvailable = hasCompleteDimensions(model) && model.pieces.length > 0;
  const shelfPiece = findPiece(model.pieces, /\bshelf\b.*\bboard\b|\bshelf\b/);
  const kind = model.project.projectType === "simple_shelf" && shelfPiece ? "simple_shelf" : (detectDiagramKind(model) ?? "generic");
  const shelfCount = kind === "simple_shelf" ? (shelfPiece?.quantity ?? null) : null;
  const wallContext = kind === "simple_shelf" && hasWallContext(model);

  return {
    title: "Project anatomy",
    kind,
    widthLabel: dimensionLabel("Width", model.dimensions.widthInches),
    heightLabel: dimensionLabel("Height", model.dimensions.heightInches),
    depthLabel: dimensionLabel("Depth", model.dimensions.depthInches),
    materialThicknessLabel: dimensionLabel("Material thickness", model.dimensions.materialThicknessInches),
    materialLabel: model.materials[0]?.label ?? "material to review",
    pieceLabels,
    shelfCount,
    hasWallContext: wallContext,
    supportLabel: wallContext ? "Wall/support details to verify" : null,
    fallbackMessage: isAvailable ? null : projectAnatomyFallback,
  };
}

function hasWallContext(model: BoardsmithBuildModel): boolean {
  return (
    model.safety.flags.some((flag) => flag.category === "wall_mounting" || /wall|mount|anchor|stud/i.test(flag.message)) ||
    model.connections.some((connection) => /\b(bracket|anchor|hanger)\b/i.test(`${connection.connectionType} ${connection.locationDescription}`))
  );
}

function createThreeViewPlanningDiagram(model: BoardsmithBuildModel): ThreeViewPlanningDiagram {
  if (!hasCompleteDimensions(model) || model.pieces.length === 0) {
    return {
      title: "Three-view planning diagram",
      views: [],
      fallbackMessage: threeViewDiagramFallback,
    };
  }

  const pieceLabels = model.pieces.map((piece) => piece.label).slice(0, 4);

  return {
    title: "Three-view planning diagram",
    fallbackMessage: null,
    views: [
      {
        id: "front",
        title: "Front view",
        primaryDimensionLabel: dimensionLabel("Width", model.dimensions.widthInches),
        secondaryDimensionLabel: dimensionLabel("Height", model.dimensions.heightInches),
        pieceLabels,
      },
      {
        id: "top",
        title: "Top view",
        primaryDimensionLabel: dimensionLabel("Width", model.dimensions.widthInches),
        secondaryDimensionLabel: dimensionLabel("Depth", model.dimensions.depthInches),
        pieceLabels,
      },
      {
        id: "side",
        title: "Side view",
        primaryDimensionLabel: dimensionLabel("Depth", model.dimensions.depthInches),
        secondaryDimensionLabel: dimensionLabel("Height", model.dimensions.heightInches),
        pieceLabels,
      },
    ],
  };
}

function conciseSafetyNote(notes: string[]): string | null {
  const note = notes.find((item) => item.trim().length > 0 && item.trim().length <= 140);
  return note ?? null;
}

function mapConnections(model: BoardsmithBuildModel, pieceById: Map<string, BuildModelPiece>): PlanningDiagramConnection[] {
  const hardwareById = new Map(model.hardware.map((hardware) => [hardware.id, hardware]));

  return model.connections
    .map((connection) => {
      const fromPiece = pieceById.get(connection.fromPieceId);
      const toPiece = pieceById.get(connection.toPieceId);
      if (!fromPiece || !toPiece) return null;
      const hardwareLabels = connection.hardwareIds
        .map((hardwareId) => hardwareById.get(hardwareId)?.label)
        .filter((label): label is string => Boolean(label));
      const connectionLabel = connection.connectionType.replaceAll("_", " ");
      const hardwareLabel = hardwareLabels.length > 0 ? hardwareLabels.join(", ") : "hardware or fastener to verify";
      const reviewLabel = connection.strengthCritical ? "Needs manual review" : "Verify before building";
      const wallShelfMounting =
        model.project.projectType === "simple_shelf" &&
        connection.fromPieceId === connection.toPieceId &&
        /\b(bracket|anchor|hanger)\b/.test(connectionLabel);
      const relationshipLabel = wallShelfMounting
        ? "Each shelf needs a verified support method."
        : `${fromPiece.label} to ${toPiece.label} with ${connectionLabel} and ${hardwareLabel}`;

      return {
        id: connection.id,
        fromLabel: fromPiece.label,
        toLabel: toPiece.label,
        connectionLabel,
        hardwareLabel,
        relationshipLabel,
        location: connection.locationDescription,
        needsReview: connection.strengthCritical || connection.safetyNotes.length > 0,
        reviewLabel,
        safetyNote: conciseSafetyNote(connection.safetyNotes),
      };
    })
    .filter((connection): connection is PlanningDiagramConnection => connection !== null);
}

function detectDiagramKind(model: BoardsmithBuildModel): PlanningDiagramKind | null {
  const bottomShelfBoard = findPiece(model.pieces, /\bbottom\b.*\bshelf\b|\bshelf\b.*\bbottom\b/);
  const backRail = findPiece(model.pieces, /\bback\b.*\brail\b|\brail\b.*\bback\b/);
  const frontLip = findPiece(model.pieces, /\bfront\b.*\blip\b|\blip\b.*\bfront\b/);
  if (bottomShelfBoard && backRail && frontLip) return "book_ledge";

  const frontPanel = findPiece(model.pieces, /\bfront\b.*\bpanel\b|\bfront\b.*\bboard\b/);
  const backPanel = findPiece(model.pieces, /\bback\b.*\bpanel\b|\bback\b.*\bboard\b/);
  const sidePanel = findPiece(model.pieces, /\bside\b.*\bpanel\b|\bleft\b.*\bside\b|\bright\b.*\bside\b/);
  const bottomPanel = findPiece(model.pieces, /\bbottom\b.*\bpanel\b|\bbottom\b.*\bboard\b/);
  if (frontPanel && backPanel && sidePanel && bottomPanel) return "planter_box";

  const shelfBoard = findPiece(model.pieces, /\bshelf\b.*\bboard\b|\bshelf\b/);
  if (model.project.projectType === "simple_shelf" && shelfBoard) return "simple_shelf";

  return null;
}

function overviewTitle(kind: PlanningDiagramKind): string {
  if (kind === "book_ledge") return "Book ledge overview";
  if (kind === "planter_box") return "Planter box overview";
  return "Shelf board overview";
}

function relationshipTitle(kind: PlanningDiagramKind): string {
  if (kind === "book_ledge") return "Book ledge piece relationship";
  if (kind === "planter_box") return "Planter box piece relationship";
  return "Shelf board piece relationship";
}

function diagramLabel(kind: PlanningDiagramKind): string {
  if (kind === "book_ledge") return "Book ledge planning diagram";
  if (kind === "planter_box") return "Planter box planning diagram";
  return "Shelf board planning diagram";
}

function isMultiShelfModel(model: BoardsmithBuildModel): boolean {
  return model.project.projectType === "simple_shelf" && model.pieces.some((piece) => piece.quantity > 1 && /\bshelf\b/i.test(piece.label));
}

export function createPlanDiagrams(model: BoardsmithBuildModel, options: { wallShelfViewModel?: WallShelfDiagramViewModel | null } = {}): PlanningDiagramSummary {
  const wallShelfViewModel =
    options.wallShelfViewModel ?? (model.project.projectType === "simple_shelf" ? createWallShelfDiagramViewModel({ buildModel: model }) : null);
  const richVisuals = {
    projectAnatomy: createProjectAnatomyVisual(model, wallShelfViewModel),
    threeView: createThreeViewPlanningDiagram(model),
    visualPieceInventory: createVisualPieceInventory(model),
  };
  const kind = detectDiagramKind(model);
  if (!kind) {
    return { diagrams: [], fallbackMessage: planningDiagramFallback, ...richVisuals };
  }

  const pieceById = new Map(model.pieces.map((piece) => [piece.id, piece]));
  const pieces = mapPieces(model.pieces);
  const connections = mapConnections(model, pieceById);
  const multiShelf = isMultiShelfModel(model);
  const diagrams: PlanningDiagram[] = [
    {
      id: `${kind}_overview`,
      type: "overview",
      kind,
      title: multiShelf ? "Shelf layout overview" : overviewTitle(kind),
      label: diagramLabel(kind),
      disclaimer: planningDiagramDisclaimer,
      pieces,
      connections: [],
      emptyMessage: null,
    },
    {
      id: `${kind}_piece_relationship`,
      type: "piece_relationship",
      kind,
      title: relationshipTitle(kind),
      label: "Piece relationship diagram",
      disclaimer: planningDiagramDisclaimer,
      pieces,
      connections: [],
      emptyMessage: null,
    },
  ];

  diagrams.push({
    id: `${kind}_connection_summary`,
    type: "connection_summary",
    kind,
    title: kind === "simple_shelf" ? "Mounting to verify" : "How pieces connect",
    label: kind === "simple_shelf" ? "Mounting planning aid" : "Connection planning aid",
    disclaimer: planningDiagramDisclaimer,
    pieces,
    connections,
    emptyMessage: connectionDiagramFallback,
  });

  return { diagrams, fallbackMessage: planningDiagramFallback, ...richVisuals };
}
