import { doorHangerBuildModelFixture, simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { createBuildModelDraft, type BuildModelDraftProject } from "@/lib/build-model/create-build-model-draft";
import {
  connectionDiagramFallback,
  createPlanDiagrams,
  planningDiagramDisclaimer,
  planningDiagramFallback,
  threeViewDiagramFallback,
  visualPieceInventoryDisclaimer,
} from "@/lib/plans/plan-diagrams";
import { describe, expect, it } from "vitest";

const baseProject: BuildModelDraftProject = {
  id: "diagram_project",
  title: "Diagram project",
  project_type: "simple_shelf",
  skill_level: "beginner",
  width_inches: 36,
  height_inches: 6,
  depth_inches: 10,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "",
  intended_use: "Decorative planning aid",
};

describe("createPlanDiagrams", () => {
  it("creates project anatomy visual data from dimensions, material thickness, and modeled pieces", () => {
    const summary = createPlanDiagrams(simpleShelfBuildModelFixture);

    expect(summary.projectAnatomy).toMatchObject({
      title: "Project anatomy",
      widthLabel: "Width 36 in",
      heightLabel: "Height 6 in",
      depthLabel: "Depth 10 in",
      materialThicknessLabel: "Material thickness 0.75 in",
      materialLabel: "3/4 inch pine board",
      fallbackMessage: null,
    });
    expect(summary.projectAnatomy.pieceLabels).toEqual(["Shelf board"]);
  });

  it("creates three-view planning data for supported dimensioned projects", () => {
    const summary = createPlanDiagrams(simpleShelfBuildModelFixture);

    expect(summary.threeView).toMatchObject({
      title: "Three-view planning diagram",
      fallbackMessage: null,
    });
    expect(summary.threeView.views.map((view) => view.title)).toEqual(["Front view", "Top view", "Side view"]);
    expect(summary.threeView.views.map((view) => view.primaryDimensionLabel)).toEqual(["Width 36 in", "Width 36 in", "Depth 10 in"]);
    expect(summary.threeView.views.map((view) => view.secondaryDimensionLabel)).toEqual(["Height 6 in", "Depth 10 in", "Height 6 in"]);
  });

  it("creates a visual piece inventory from modeled pieces", () => {
    const summary = createPlanDiagrams(simpleShelfBuildModelFixture);

    expect(summary.visualPieceInventory.disclaimer).toBe(visualPieceInventoryDisclaimer);
    expect(summary.visualPieceInventory.disclaimer).toBe("Visual piece inventory - planning aid only.");
    expect(summary.visualPieceInventory.items[0]).toMatchObject({
      label: "Shelf board",
      quantityLabel: "1x",
      dimensionsLabel: "36 in x 10 in x 0.75 in",
      materialLabel: "3/4 inch pine board",
    });
  });

  it("falls back for three-view planning when dimensions or pieces are insufficient", () => {
    const summary = createPlanDiagrams({
      ...simpleShelfBuildModelFixture,
      dimensions: {
        ...simpleShelfBuildModelFixture.dimensions,
        depthInches: null,
      },
      pieces: [],
    });

    expect(summary.threeView.views).toEqual([]);
    expect(summary.threeView.fallbackMessage).toBe(threeViewDiagramFallback);
    expect(summary.projectAnatomy.fallbackMessage).toBe("Project anatomy is not available yet. Review the cut list and build guide before building.");
    expect(summary.visualPieceInventory.items).toEqual([]);
  });

  it("keeps planning visual labels away from forbidden output or approval wording", () => {
    const summary = createPlanDiagrams(simpleShelfBuildModelFixture);
    const labels = JSON.stringify({
      anatomy: summary.projectAnatomy,
      threeView: summary.threeView,
      pieceInventory: summary.visualPieceInventory,
    });

    expect(labels).not.toMatch(/CAD-ready|CNC-ready|load-rated|approved|fabrication-ready|construction approval/i);
  });

  it("creates deterministic shelf board diagrams from a supported shelf model", () => {
    const summary = createPlanDiagrams(simpleShelfBuildModelFixture);

    expect(summary.fallbackMessage).toBe(planningDiagramFallback);
    expect(summary.diagrams.map((diagram) => diagram.title)).toEqual([
      "Shelf board overview",
      "Shelf board piece relationship",
      "Mounting to verify",
    ]);
    expect(summary.diagrams[0]?.disclaimer).toBe(planningDiagramDisclaimer);
    expect(summary.diagrams[0]?.pieces[0]).toMatchObject({
      label: "Shelf board",
      quantityLabel: "1x",
      role: "shelf",
    });
  });

  it("recognizes book ledge pieces when bottom shelf board, back rail, and front lip exist", () => {
    const model = createBuildModelDraft({
      ...baseProject,
      title: "Toddler book ledge",
      style_notes: "Simple book ledge with bottom shelf board, back rail, and front lip.",
      intended_use: "Book ledge for child-adjacent room with adult review.",
    });
    const summary = createPlanDiagrams(model);

    expect(summary.diagrams.map((diagram) => diagram.title)).toContain("Book ledge overview");
    expect(summary.diagrams[0]?.kind).toBe("book_ledge");
    expect(summary.diagrams[0]?.pieces.map((piece) => piece.label)).toEqual(
      expect.arrayContaining(["Bottom shelf board", "Back rail", "Front lip"]),
    );
  });

  it("recognizes planter box pieces when front, back, side, and bottom panels exist", () => {
    const model = createBuildModelDraft({
      ...baseProject,
      title: "Outdoor planter box",
      project_type: "planter_box",
      height_inches: 8,
      depth_inches: 8,
      material_type: "cedar board",
      intended_use: "Outdoor herb planter box.",
    });
    const summary = createPlanDiagrams(model);

    expect(summary.diagrams.map((diagram) => diagram.title)).toContain("Planter box overview");
    expect(summary.diagrams[0]?.kind).toBe("planter_box");
    expect(summary.diagrams[0]?.pieces.map((piece) => piece.label)).toEqual(
      expect.arrayContaining(["Front panel", "Back panel", "Left side panel", "Right side panel", "Bottom panel"]),
    );
  });

  it("maps modeled connection relationships with hardware, location, review wording, and concise safety notes", () => {
    const withConnections = createPlanDiagrams(simpleShelfBuildModelFixture);
    const connectionDiagram = withConnections.diagrams.find((diagram) => diagram.type === "connection_summary");

    expect(connectionDiagram?.title).toBe("Mounting to verify");
    expect(connectionDiagram?.label).toBe("Mounting planning aid");
    expect(connectionDiagram?.connections[0]).toMatchObject({
      fromLabel: "Shelf board",
      toLabel: "Shelf board",
      connectionLabel: "bracket",
      hardwareLabel: "Wall brackets, Wall anchors or stud fasteners",
      relationshipLabel: "Each shelf needs a verified support method.",
      location: "Under shelf board at wall mounting points",
      needsReview: true,
      reviewLabel: "Needs manual review",
      safetyNote: "Boardsmith cannot verify load capacity or wall mounting safety.",
    });
  });

  it("uses a shelf-layout diagram title for multi-shelf shelf boards", () => {
    const summary = createPlanDiagrams({
      ...simpleShelfBuildModelFixture,
      pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], label: "Shelf boards", quantity: 5 }],
    });

    expect(summary.diagrams[0]?.title).toBe("Shelf layout overview");
    expect(summary.diagrams[0]?.pieces[0]).toMatchObject({
      label: "Shelf boards",
      quantityLabel: "5x",
    });
  });

  it("falls back from impossible multi-shelf height instead of labeling it as valid", () => {
    const model = createBuildModelDraft({
      ...baseProject,
      title: "Bathroom shelf with 5 shelves",
      width_inches: 23,
      height_inches: 0.1,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      shelf_layout: "multi_shelf_unit",
      shelf_count: 5,
      intended_use: "Indoor bathroom shelf unit.",
    });
    const summary = createPlanDiagrams(model);

    expect(summary.projectAnatomy.heightLabel).toBe("Total height needs review");
    expect(summary.projectAnatomy.fallbackMessage).toBe("Add valid total height to render full layout.");
    expect(summary.projectAnatomy.heightLabel).not.toBe("Height 0.1 in");
  });

  it("keeps a connection summary fallback when supported diagrams have no modeled connections", () => {
    const withoutConnections = createPlanDiagrams({
      ...simpleShelfBuildModelFixture,
      connections: [],
    });
    const connectionDiagram = withoutConnections.diagrams.find((diagram) => diagram.type === "connection_summary");

    expect(connectionDiagram?.connections).toEqual([]);
    expect(connectionDiagram?.emptyMessage).toBe(connectionDiagramFallback);
  });

  it("falls back for unsupported model shapes without inventing a diagram", () => {
    const summary = createPlanDiagrams(doorHangerBuildModelFixture);

    expect(summary.diagrams).toEqual([]);
    expect(summary.fallbackMessage).toBe("No diagram available yet. Review the cut list and build steps before building.");
  });
});
