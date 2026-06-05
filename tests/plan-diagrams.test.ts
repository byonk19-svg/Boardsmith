import { doorHangerBuildModelFixture, simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { createBuildModelDraft, type BuildModelDraftProject } from "@/lib/build-model/create-build-model-draft";
import { connectionDiagramFallback, createPlanDiagrams, planningDiagramDisclaimer, planningDiagramFallback } from "@/lib/plans/plan-diagrams";
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
  it("creates deterministic shelf board diagrams from a supported shelf model", () => {
    const summary = createPlanDiagrams(simpleShelfBuildModelFixture);

    expect(summary.fallbackMessage).toBe(planningDiagramFallback);
    expect(summary.diagrams.map((diagram) => diagram.title)).toEqual([
      "Shelf board overview",
      "Shelf board piece relationship",
      "How pieces connect",
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

    expect(connectionDiagram?.title).toBe("How pieces connect");
    expect(connectionDiagram?.label).toBe("Connection planning aid");
    expect(connectionDiagram?.connections[0]).toMatchObject({
      fromLabel: "Shelf board",
      toLabel: "Shelf board",
      connectionLabel: "bracket",
      hardwareLabel: "Wall brackets, Wall anchors or stud fasteners",
      relationshipLabel: "Shelf board → bracket / Wall brackets, Wall anchors or stud fasteners → Shelf board",
      location: "Under shelf board at wall mounting points",
      needsReview: true,
      reviewLabel: "Needs manual review",
      safetyNote: "Boardsmith cannot verify load capacity or wall mounting safety.",
    });
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
