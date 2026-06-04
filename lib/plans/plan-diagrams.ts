import type { BoardsmithBuildModel, BuildModelConnection, BuildModelPiece } from "@/lib/build-model/build-model-schema";

export const planningDiagramDisclaimer = "Planning diagram — not to scale.";
export const planningDiagramFallback = "No diagram available yet. Review the cut list and build steps before building.";

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
  location: string;
  needsReview: boolean;
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
};

export type PlanningDiagramSummary = {
  diagrams: PlanningDiagram[];
  fallbackMessage: typeof planningDiagramFallback;
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

function mapConnections(connections: BuildModelConnection[], pieceById: Map<string, BuildModelPiece>): PlanningDiagramConnection[] {
  return connections
    .map((connection) => {
      const fromPiece = pieceById.get(connection.fromPieceId);
      const toPiece = pieceById.get(connection.toPieceId);
      if (!fromPiece || !toPiece) return null;

      return {
        id: connection.id,
        fromLabel: fromPiece.label,
        toLabel: toPiece.label,
        connectionLabel: connection.connectionType.replaceAll("_", " "),
        location: connection.locationDescription,
        needsReview: connection.strengthCritical || connection.safetyNotes.length > 0,
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

export function createPlanDiagrams(model: BoardsmithBuildModel): PlanningDiagramSummary {
  const kind = detectDiagramKind(model);
  if (!kind) {
    return { diagrams: [], fallbackMessage: planningDiagramFallback };
  }

  const pieceById = new Map(model.pieces.map((piece) => [piece.id, piece]));
  const pieces = mapPieces(model.pieces);
  const connections = mapConnections(model.connections, pieceById);
  const diagrams: PlanningDiagram[] = [
    {
      id: `${kind}_overview`,
      type: "overview",
      kind,
      title: overviewTitle(kind),
      label: diagramLabel(kind),
      disclaimer: planningDiagramDisclaimer,
      pieces,
      connections: [],
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
    },
  ];

  if (connections.length > 0) {
    diagrams.push({
      id: `${kind}_connection_summary`,
      type: "connection_summary",
      kind,
      title: "Connection summary diagram",
      label: "Connection review diagram",
      disclaimer: planningDiagramDisclaimer,
      pieces,
      connections,
    });
  }

  return { diagrams, fallbackMessage: planningDiagramFallback };
}
