import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WallShelfCutDiagram } from "@/app/projects/[id]/WallShelfCutDiagram";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { createWallShelfCutDiagramViewModel } from "@/lib/plans/wall-shelf-cut-diagram-view-model";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_cut_diagram_project",
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
  style_notes: "Connected wall shelf unit with side supports.",
  intended_use: "Connected wall shelf unit for light towels.",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

const basePlan: GeneratedPlan = {
  project_summary: "A cautious wall shelf plan sized from structured fields.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 12,
    height_inches: 60,
    depth_inches: 6,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "3/4 in pine board", quantity: "1 board", notes: "Inspect before cutting." }],
  tools: ["tape measure", "pencil", "drill"],
  cut_list: [
    {
      part_name: "Shelf boards",
      quantity: 5,
      length_inches: 12,
      width_inches: 6,
      thickness_inches: 0.75,
      material: "3/4 in pine board",
      notes: "No load rating is implied.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review support/frame design",
      instructions: "Confirm support before building.",
      tools_used: ["drill"],
      safety_note: "Do not rely on Boardsmith for load ratings.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: [],
  safety_notes: ["Plans are review aids."],
  assumptions: ["Support details need review."],
  needs_review_flags: ["Support/frame design needs review."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["Mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "2-3 hours",
  confidence_level: "low",
};

const planRecord: GeneratedProjectPlanRecord = {
  id: "wall_shelf_cut_diagram_plan",
  project_id: baseProject.id,
  created_at: new Date(1).toISOString(),
  model_name: "test-model",
  plan_json: basePlan,
  build_model_json: simpleShelfBuildModelFixture,
  plan_markdown: "# test",
  validation_status: "valid",
  warnings: basePlan.safety_notes,
  assumptions: basePlan.assumptions,
  confidence_level: basePlan.confidence_level,
  is_latest: true,
};

function shelfPiece(overrides: Partial<BuildModelPiece> = {}): BuildModelPiece {
  return {
    ...simpleShelfBuildModelFixture.pieces[0],
    id: overrides.id ?? simpleShelfBuildModelFixture.pieces[0].id,
    label: overrides.label ?? simpleShelfBuildModelFixture.pieces[0].label,
    quantity: overrides.quantity ?? simpleShelfBuildModelFixture.pieces[0].quantity,
    notes: overrides.notes ?? [],
    dimensions: {
      ...simpleShelfBuildModelFixture.pieces[0].dimensions,
      ...overrides.dimensions,
    },
  };
}

function supportPiece(id: string, label: string): BuildModelPiece {
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
    notes: [],
  };
}

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
    pieces: overrides.pieces ?? [shelfPiece({ label: "Shelf boards", quantity: 5 })],
    materials: overrides.materials ?? [{ ...simpleShelfBuildModelFixture.materials[0], label: "3/4 in pine board" }],
  };
}

describe("createWallShelfCutDiagramViewModel", () => {
  it("creates a ready single wall shelf cut view model from Build Model pieces", () => {
    const viewModel = createWallShelfCutDiagramViewModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 },
      buildModel: buildModel({ pieces: [shelfPiece({ quantity: 1 })] }),
    });

    expect(viewModel.status).toBe("ready");
    expect(viewModel.totalCutPieces).toBe(1);
    expect(viewModel.readyCutPieces).toBe(1);
    expect(viewModel.pieceGroups[0]).toMatchObject({
      label: "Shelf board",
      quantity: 1,
      quantityLabel: "Qty 1",
      dimensionsLabel: "36 in x 10 in x 0.75 in",
      needsReview: false,
    });
  });

  it("groups valid 5-shelf shelf board cuts and modeled supports by material", () => {
    const viewModel = createWallShelfCutDiagramViewModel({
      project: baseProject,
      buildModel: buildModel({
        pieces: [
          shelfPiece({ label: "Shelf boards", quantity: 5, dimensions: { lengthInches: 12, widthInches: 6, thicknessInches: 0.75 } }),
          supportPiece("left_side_support", "Side supports"),
          supportPiece("right_side_support", "Side supports"),
        ],
      }),
    });

    expect(viewModel.status).toBe("ready");
    expect(viewModel.totalCutPieces).toBe(7);
    expect(viewModel.pieceGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Shelf boards", quantity: 5, dimensionsLabel: "12 in x 6 in x 0.75 in" }),
        expect.objectContaining({ label: "Side supports", quantity: 2, dimensionsLabel: "60 in x 6 in x 0.75 in" }),
      ]),
    );
    expect(viewModel.materialGroups[0]?.materialLabel).toBe("3/4 in pine board");
  });

  it("dedupes duplicate Build Model cut pieces into one grouped row", () => {
    const viewModel = createWallShelfCutDiagramViewModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 },
      buildModel: buildModel({
        pieces: [
          shelfPiece({ id: "shelf_board_one", label: "Shelf board", quantity: 1 }),
          shelfPiece({ id: "shelf_board_two", label: "Shelf board", quantity: 2 }),
        ],
      }),
    });

    expect(viewModel.pieceGroups).toHaveLength(1);
    expect(viewModel.pieceGroups[0]).toMatchObject({
      label: "Shelf boards",
      quantity: 3,
      pieceIds: ["shelf_board_one", "shelf_board_two"],
    });
  });

  it("marks invalid 5-shelf height as needs_review without a trusted complete cut layout", () => {
    const viewModel = createWallShelfCutDiagramViewModel({
      project: { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" },
      buildModel: buildModel({
        dimensions: { ...simpleShelfBuildModelFixture.dimensions, heightInches: 0.1 },
        pieces: [
          shelfPiece({ label: "Shelf boards", quantity: 5, dimensions: { lengthInches: 23, widthInches: 8, thicknessInches: 0.75 } }),
          {
            ...supportPiece("side_support_frame_placeholder", "Side support/frame placeholders"),
            quantity: 2,
            dimensions: { lengthInches: null, widthInches: 8, thicknessInches: 0.75 },
            notes: ["Total height needs review before support/frame piece dimensions can be trusted."],
          },
        ],
      }),
    });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.renderLabels.summary).toBe("Cut layout needs review before cutting.");
    expect(viewModel.warnings).toContain("Impossible or missing shelf layout dimensions");
    expect(JSON.stringify(viewModel)).not.toContain("Height 0.1 in");
  });

  it("marks unresolved connected support/frame cuts for review", () => {
    const viewModel = createWallShelfCutDiagramViewModel({
      project: { ...baseProject, style_notes: "" },
      buildModel: buildModel(),
    });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.warnings.join(" ")).toContain("side support, frame, cleat, bracket");
    expect(viewModel.badges).toContain("Needs review");
  });

  it("renders print-compatible safe labels and no stale freestanding copy", () => {
    const manifest = createPrintablePlanManifest({
      project: { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" },
      planRecord: {
        ...planRecord,
        plan_json: {
          ...planRecord.plan_json,
          project_summary: "This plan describes a freestanding shelf unit.",
          assumptions: ["The shelf is freestanding; no wall mounting or brackets are included or assumed."],
        },
      },
      buildModel: buildModel({
        pieces: [shelfPiece({ label: "Shelf boards", quantity: 5 })],
      }),
      buildModelSource: "saved",
    });

    const markup = renderToStaticMarkup(React.createElement(WallShelfCutDiagram, { viewModel: manifest.wallShelfCutDiagramViewModel, compact: true }));

    expect(markup).toContain("Cut layout diagram");
    expect(markup).toContain("Cut layout needs review before cutting.");
    expect(markup).toContain("Shelf boards");
    expect(markup).toContain("Qty 5");
    expect(markup).toContain("Support/frame review");
    expect(markup).not.toMatch(/freestanding|non-mounted|CAD-ready|CNC-ready|fabrication-ready|approved/i);
  });
});
