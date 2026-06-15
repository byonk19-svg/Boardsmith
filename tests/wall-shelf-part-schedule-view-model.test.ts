import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { createWallShelfPartScheduleViewModel } from "@/lib/plans/wall-shelf-part-schedule-view-model";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_part_schedule_project",
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
  id: "wall_shelf_part_schedule_plan",
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

type PieceOverrides = Omit<Partial<BuildModelPiece>, "dimensions"> & {
  dimensions?: Partial<BuildModelPiece["dimensions"]>;
};

function shelfPiece(overrides: PieceOverrides = {}): BuildModelPiece {
  return {
    ...simpleShelfBuildModelFixture.pieces[0],
    id: overrides.id ?? simpleShelfBuildModelFixture.pieces[0].id,
    label: overrides.label ?? simpleShelfBuildModelFixture.pieces[0].label,
    quantity: overrides.quantity ?? simpleShelfBuildModelFixture.pieces[0].quantity,
    notes: overrides.notes ?? [],
    dimensions: {
      ...simpleShelfBuildModelFixture.pieces[0].dimensions,
      lengthInches: 12,
      widthInches: 6,
      thicknessInches: 0.75,
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

describe("createWallShelfPartScheduleViewModel", () => {
  it("assigns stable Part A to a single wall shelf board", () => {
    const viewModel = createWallShelfPartScheduleViewModel({
      buildModel: buildModel({ pieces: [shelfPiece({ label: "Shelf board", quantity: 1 })] }),
    });

    expect(viewModel.status).toBe("ready");
    expect(viewModel.assignedParts).toHaveLength(1);
    expect(viewModel.assignedParts[0]).toMatchObject({
      partLabel: "Part A",
      badgeLabel: "A",
      printLabel: "Part A - Shelf board",
      displayName: "Shelf board",
      quantity: 1,
      quantityLabel: "Qty 1",
      dimensionsLabel: "12 in x 6 in x 0.75 in",
    });
  });

  it("groups valid 5-shelf shelf boards as stable Part A Qty 5", () => {
    const model = buildModel({ pieces: [shelfPiece({ label: "Shelf boards", quantity: 5 })] });
    const first = createWallShelfPartScheduleViewModel({ buildModel: model });
    const second = createWallShelfPartScheduleViewModel({ buildModel: model });

    expect(first.assignedParts[0]).toMatchObject({
      partLabel: "Part A",
      printLabel: "Part A - Shelf boards",
      quantity: 5,
      quantityLabel: "Qty 5",
    });
    expect(second.assignedParts).toEqual(first.assignedParts);
  });

  it("assigns separate labels when connected shelf support/frame pieces are modeled", () => {
    const viewModel = createWallShelfPartScheduleViewModel({
      buildModel: buildModel({
        pieces: [
          shelfPiece({ label: "Shelf boards", quantity: 5 }),
          supportPiece("left_side_support", "Side supports"),
          supportPiece("right_side_support", "Side supports"),
        ],
      }),
    });

    expect(viewModel.assignedParts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ partLabel: "Part A", printLabel: "Part A - Shelf boards", quantity: 5 }),
        expect.objectContaining({ partLabel: "Part B", printLabel: "Part B - Side supports", quantity: 2 }),
      ]),
    );
  });

  it("does not invent a support/frame part label when support pieces are unresolved", () => {
    const manifest = createPrintablePlanManifest({
      project: baseProject,
      planRecord,
      buildModel: buildModel({ pieces: [shelfPiece({ label: "Shelf boards", quantity: 5 })] }),
      buildModelSource: "saved",
    });

    expect(manifest.wallShelfPartScheduleViewModel.assignedParts).toEqual([
      expect.objectContaining({ partLabel: "Part A", printLabel: "Part A - Shelf boards" }),
    ]);
    expect(manifest.wallShelfPartScheduleViewModel.rows).toContainEqual(
      expect.objectContaining({
        partLabel: null,
        displayName: "Side support/frame placeholders",
        needsReview: true,
      }),
    );
    expect(manifest.wallShelfPartScheduleViewModel.rows).not.toContainEqual(expect.objectContaining({ partLabel: "Part B" }));
  });

  it("keeps invalid 5-shelf height review-needed without presenting invented missing parts", () => {
    const manifest = createPrintablePlanManifest({
      project: { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" },
      planRecord,
      buildModel: buildModel({
        dimensions: { ...simpleShelfBuildModelFixture.dimensions, heightInches: 0.1 },
        pieces: [shelfPiece({ label: "Shelf boards", quantity: 5 })],
      }),
      buildModelSource: "saved",
    });

    expect(manifest.wallShelfPartScheduleViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfPartScheduleViewModel.assignedParts).toEqual([
      expect.objectContaining({ partLabel: "Part A", printLabel: "Part A - Shelf boards" }),
    ]);
    expect(manifest.wallShelfPartScheduleViewModel.warnings.join(" ")).toContain("Support/frame design needs review");
    expect(JSON.stringify(manifest.wallShelfPartScheduleViewModel)).not.toContain("Height 0.1 in");
    expect(manifest.wallShelfPartScheduleViewModel.rows).not.toContainEqual(expect.objectContaining({ partLabel: "Part B" }));
  });
});
