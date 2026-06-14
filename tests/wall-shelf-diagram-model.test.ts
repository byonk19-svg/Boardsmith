import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { buildWallShelfDiagramModel } from "@/lib/diagrams/wall-shelf-diagram-model";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_diagram_project",
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

function model(overrides: Partial<BoardsmithBuildModel> = {}): BoardsmithBuildModel {
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

describe("buildWallShelfDiagramModel", () => {
  it("builds a complete single shelf diagram model", () => {
    const diagram = buildWallShelfDiagramModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75, shelf_spacing_inches: undefined },
      buildModel: model({
        pieces: [
          {
            ...simpleShelfBuildModelFixture.pieces[0],
            quantity: 1,
            dimensions: {
              lengthInches: 12,
              widthInches: 6,
              thicknessInches: 0.75,
            },
          },
        ],
      }),
      cutList: null,
    });

    expect(diagram).toMatchObject({
      status: "ready",
      shelfCount: 1,
      shelfWidthInches: 12,
      shelfDepthInches: 6,
      boardThicknessInches: 0.75,
    });
    expect(diagram?.partSchedule[0]).toEqual(
      expect.objectContaining({
        label: "Shelf board",
        quantity: 1,
        dimensionsLabel: "12 in x 6 in x 0.75 in",
      }),
    );
  });

  it("builds a 5-shelf connected unit model from structured fields", () => {
    const diagram = buildWallShelfDiagramModel({
      project: baseProject,
      buildModel: model(),
      cutList: null,
    });

    expect(diagram).toMatchObject({
      status: "ready",
      shelfLayout: "multi_shelf_unit",
      shelfCount: 5,
      totalProjectHeightInches: 60,
      shelfSpacingInches: 12,
      supportStatus: "support_to_review",
      supportLabel: "Support/frame design needs review",
    });
    expect(diagram?.reviewItems).toContain("Each shelf needs a verified support method.");
  });

  it("falls back safely when multi-shelf count is missing", () => {
    const diagram = buildWallShelfDiagramModel({
      project: { ...baseProject, shelf_count: undefined },
      buildModel: model({ pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], quantity: 1 }] }),
      cutList: null,
    });

    expect(diagram?.status).toBe("needs_shelf_count");
    expect(diagram?.fallbackMessage).toBe("Add shelf count to render a shelf layout diagram.");
  });

  it("falls back safely when required dimensions are missing", () => {
    const diagram = buildWallShelfDiagramModel({
      project: { ...baseProject, depth_inches: 0 },
      buildModel: model({ dimensions: { ...model().dimensions, depthInches: null } }),
      cutList: null,
    });

    expect(diagram?.status).toBe("needs_dimensions");
    expect(diagram?.fallbackMessage).toBe("Add shelf width, depth, and board thickness to render shelf diagrams.");
  });

  it("uses separate-shelf bracket placeholders when layout is multiple separate wall shelves", () => {
    const diagram = buildWallShelfDiagramModel({
      project: { ...baseProject, shelf_layout: "multiple_separate_shelves" },
      buildModel: model(),
      cutList: null,
    });

    expect(diagram?.supportStatus).toBe("separate_shelf_placeholders");
    expect(diagram?.supportLabel).toBe("bracket placeholders - verify final hardware");
  });
});
