import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WallShelfDiagrams } from "@/app/projects/[id]/WallShelfDiagrams";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { buildWallShelfDiagramModel, type WallShelfDiagramModel } from "@/lib/diagrams/wall-shelf-diagram-model";
import { createWallShelfDiagramViewModel } from "@/lib/plans/wall-shelf-diagram-view-model";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_renderer_project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Wall shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 12,
  height_inches: 60,
  depth_inches: 6,
  material_thickness_inches: 0.75,
  material_type: "3/4 in pine board",
  shelf_layout: "multi_shelf_unit",
  shelf_count: 5,
  shelf_spacing_inches: 12,
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Connected wall shelf unit for light towels.",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

function buildModel(overrides: Partial<BoardsmithBuildModel> = {}): BoardsmithBuildModel {
  return {
    ...simpleShelfBuildModelFixture,
    ...overrides,
    dimensions: {
      ...simpleShelfBuildModelFixture.dimensions,
      widthInches: 12,
      heightInches: 60,
      depthInches: 6,
      materialThicknessInches: 0.75,
      ...overrides.dimensions,
    },
    pieces: overrides.pieces ?? [
      {
        ...simpleShelfBuildModelFixture.pieces[0],
        label: "Shelf boards",
        quantity: 5,
        dimensions: {
          lengthInches: 12,
          widthInches: 6,
          thicknessInches: 0.75,
        },
      },
    ],
    materials: overrides.materials ?? [{ ...simpleShelfBuildModelFixture.materials[0], label: "3/4 in pine board" }],
  };
}

function renderModel(project: Project, model: BoardsmithBuildModel): WallShelfDiagramModel {
  const viewModel = createWallShelfDiagramViewModel({ project, buildModel: model });
  const diagram = buildWallShelfDiagramModel({ project, buildModel: model, cutList: null, viewModel });
  if (!diagram) throw new Error("Expected wall shelf diagram model.");
  return diagram;
}

function sideSupportPiece(id: string, label: string): BuildModelPiece {
  return {
    id,
    label,
    quantity: 1,
    pieceType: "board",
    materialId: simpleShelfBuildModelFixture.materials[0]?.id ?? null,
    dimensions: {
      lengthInches: 60,
      widthInches: 6,
      thicknessInches: 0.75,
    },
    grainDirection: "length",
    notes: ["Modeled support/frame piece for review."],
  };
}

describe("WallShelfDiagrams", () => {
  it("renders a valid single wall shelf with safe width, depth, and thickness labels", () => {
    const model = renderModel(
      { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75, shelf_spacing_inches: undefined },
      buildModel({
        pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], quantity: 1 }],
      }),
    );
    const markup = renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model }));

    expect(markup).toContain("drawn from the Diagram View Model and cut list");
    expect(markup).toContain("Exploded assembly view");
    expect(markup).toContain("Part A - Shelf board");
    expect(markup).toContain("single shelf assembly");
    expect(markup).toContain("single shelf layout");
    expect(markup).toContain("Top view / shelf footprint");
    expect(markup).toContain("Top view shelf footprint");
    expect(markup).toContain("shelf footprint");
    expect(markup).toContain("1 shelf");
    expect(markup).toContain("Width 12 in");
    expect(markup).toContain("Depth 6 in");
    expect(markup).toContain("Material thickness 0.75 in");
    expect(markup).not.toContain("Height 0.1 in");
  });

  it("renders a 5-shelf front elevation, side view, part schedule, and review state from the view model", () => {
    const model = renderModel(baseProject, buildModel());
    const markup = renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model }));

    expect(markup).toContain("Exploded assembly view");
    expect(markup).toContain("Part A - Shelf boards");
    expect(markup).toContain("connected shelf unit assembly");
    expect(markup).toContain("Front elevation / shelf layout");
    expect(markup).toContain("Top view / shelf footprint");
    expect(markup).toContain("connected shelf unit layout");
    expect(markup).toContain("5 shelves");
    expect(markup).toContain("Width 12 in");
    expect(markup).toContain("Height 60 in");
    expect(markup).toContain("12 in spacing");
    expect(markup).toContain("Depth 6 in");
    expect(markup).toContain("Material thickness 0.75 in");
    expect(markup).toContain("Qty 5");
    expect(markup).toContain("Shelf boards cut part planning graphic");
    expect(markup).toContain("12 in x 6 in x 0.75 in");
    expect(markup).toContain("Cut count is based on the physical cut-list quantity shown in the generated plan.");
    expect(markup).toContain("Support/frame design needs review");
    expect(markup).toContain("support/frame review required");
    expect(markup).toContain("Each shelf needs a verified support method.");
    expect(markup).not.toContain("connection planning aid");
  });

  it("renders multiple separate shelves as repeated assemblies without implying a connected unit", () => {
    const model = renderModel(
      { ...baseProject, shelf_layout: "multiple_separate_shelves", shelf_count: 3, height_inches: 0.75, shelf_spacing_inches: undefined },
      buildModel({
        pieces: [
          {
            ...simpleShelfBuildModelFixture.pieces[0],
            label: "Shelf boards",
            quantity: 3,
          },
        ],
      }),
    );
    const markup = renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model }));

    expect(markup).toContain("Exploded assembly view");
    expect(markup).toContain("Part A - Shelf boards");
    expect(markup).toContain("separate wall shelf assemblies");
    expect(markup).toContain("separate wall shelf layout");
    expect(markup).toContain("Top view / shelf footprint");
    expect(markup).not.toContain("connected shelf unit assembly");
  });

  it("does not render invalid 5-shelf height as a valid dimension", () => {
    const model = renderModel(
      { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1 },
      buildModel({
        dimensions: {
          ...simpleShelfBuildModelFixture.dimensions,
          widthInches: 12,
          heightInches: 0.1,
          depthInches: 6,
          materialThicknessInches: 0.75,
        },
      }),
    );
    const markup = renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model }));

    expect(markup).toContain("Diagram needs more details.");
    expect(markup).toContain("Add valid total height to render full layout.");
    expect(markup).toContain("Needs review");
    expect(markup).not.toContain("Height 0.1 in");
    expect(markup).not.toContain("Front elevation / shelf layout");
    expect(markup).not.toContain("Top view / shelf footprint");
  });

  it("renders unresolved connected support/frame as review-needed instead of complete structure", () => {
    const model = renderModel(baseProject, buildModel());
    const markup = renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model }));

    expect(markup).toContain("Exploded assembly view");
    expect(markup).toContain("Support/frame review");
    expect(markup).toContain("support/frame to review");
    expect(markup).toContain("Support/frame design needs review");
    expect(markup).not.toContain("modeled support/frame</text>");
  });

  it("renders modeled support/frame pieces when they exist in the view model", () => {
    const model = renderModel(
      { ...baseProject, style_notes: "Connected shelf unit with modeled side supports." },
      buildModel({
        pieces: [
          { ...simpleShelfBuildModelFixture.pieces[0], label: "Shelf boards", quantity: 5 },
          sideSupportPiece("left_side_support", "Left side support"),
          sideSupportPiece("right_side_support", "Right side support"),
        ],
      }),
    );
    const markup = renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model }));

    expect(markup).toContain("modeled support/frame");
    expect(markup).toContain("Part A - Shelf boards");
    expect(markup).toContain("Part B - Left side support");
    expect(markup).toContain("connected shelf unit assembly");
    expect(markup).toContain("Left side support");
    expect(markup).toContain("Right side support");
    expect(markup).not.toContain("Support/frame design needs review");
  });

  it("keeps print-compatible renderer output safe", () => {
    const model = renderModel(baseProject, buildModel());
    const markup = renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model, compact: true }));

    expect(markup).toContain("Planning diagram - not to scale.");
    expect(markup).toContain("drawn from the Diagram View Model and cut list");
    expect(markup).not.toMatch(/CAD-ready|CNC-ready|load-rated|approved|fabrication-ready|construction approval/i);
  });
});
