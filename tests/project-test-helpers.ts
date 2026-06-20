import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";

export const emptyProjectBuildLog = {
  build_completed: false,
  build_completed_at: "",
  build_actual_material: "",
  build_plan_changes: "",
  build_lessons_learned: "",
} satisfies Pick<
  Project,
  "build_completed" | "build_completed_at" | "build_actual_material" | "build_plan_changes" | "build_lessons_learned"
>;

export const activeProjectArchiveFields = {
  archived_at: null,
} satisfies Pick<Project, "archived_at">;

export type WallShelfFixtureState = "single" | "separate" | "connected_modeled_support" | "connected_unresolved_support" | "connected_impossible_height";

export const wallShelfBasePlan = {
  project_summary: "A cautious wall shelf plan sized from structured fields.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 24,
    height_inches: 60,
    depth_inches: 8,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "3/4 in pine board", quantity: "boards to review", notes: "Inspect stock before cutting." }],
  tools: ["tape measure", "pencil", "drill", "sander"],
  cut_list: [
    {
      part_name: "Shelf boards",
      quantity: 5,
      length_inches: 24,
      width_inches: 8,
      thickness_inches: 0.75,
      material: "3/4 in pine board",
      notes: "No load rating is implied.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review dimensions and support method",
      instructions: "Confirm shelf width, depth, board thickness, wall structure, fasteners, and support method before building.",
      tools_used: ["tape measure", "pencil"],
      safety_note: "Boardsmith cannot verify load capacity, wall safety, anchors, studs, or site conditions.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand edges and apply finish according to product labels."],
  safety_notes: ["Plans are review aids.", "Wall mounting requires stud, anchor, fastener, and wall-structure review."],
  assumptions: ["Use is light-duty unless reviewed by the builder."],
  needs_review_flags: ["Wall mounting requires stud, anchor, fastener, and wall-structure review."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["Mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "2-3 hours",
  confidence_level: "low",
} satisfies GeneratedPlan;

export function createWallShelfFixtureProject(
  state: WallShelfFixtureState = "single",
  overrides: Partial<Project> = {},
): Project {
  const connected = state === "connected_modeled_support" || state === "connected_unresolved_support" || state === "connected_impossible_height";
  const separate = state === "separate";
  const impossibleHeight = state === "connected_impossible_height";

  return {
    id: `wall_shelf_${state}`,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    title: state === "single" ? "Single wall shelf" : state === "separate" ? "Separate wall shelves" : "Connected wall shelf unit",
    project_type: "simple_shelf",
    skill_level: "beginner",
    status: "plan_generated",
    width_inches: 24,
    height_inches: connected ? (impossibleHeight ? 0.1 : 60) : 0.75,
    depth_inches: 8,
    material_thickness_inches: 0.75,
    material_type: "3/4 in pine board",
    shelf_layout: connected ? "multi_shelf_unit" : separate ? "multiple_separate_shelves" : "single_shelf",
    shelf_count: connected || separate ? 5 : 1,
    shelf_spacing_inches: connected || separate ? 12 : undefined,
    tools_available: ["tape_measure", "pencil", "drill", "sander"],
    style_notes: connected ? "Connected wall shelf unit with support/frame details to review." : "Wall-mounted shelf for light decor.",
    intended_use: connected ? "Connected wall shelf unit for light towels; mounting and support need review." : "Wall shelf for light decor.",
    safety_review_required: true,
    safety_flags: ["Wall mounting review"],
    notes: "",
    ...emptyProjectBuildLog,
    ...activeProjectArchiveFields,
    ...overrides,
  };
}

type PieceOverrides = Omit<Partial<BuildModelPiece>, "dimensions"> & {
  dimensions?: Partial<BuildModelPiece["dimensions"]>;
};

export function createWallShelfFixtureShelfPiece(overrides: PieceOverrides = {}): BuildModelPiece {
  return {
    ...simpleShelfBuildModelFixture.pieces[0],
    id: overrides.id ?? simpleShelfBuildModelFixture.pieces[0].id,
    label: overrides.label ?? simpleShelfBuildModelFixture.pieces[0].label,
    quantity: overrides.quantity ?? simpleShelfBuildModelFixture.pieces[0].quantity,
    notes: overrides.notes ?? [],
    dimensions: {
      ...simpleShelfBuildModelFixture.pieces[0].dimensions,
      lengthInches: 24,
      widthInches: 8,
      thicknessInches: 0.75,
      ...overrides.dimensions,
    },
  };
}

export function createWallShelfFixtureSupportPiece(id: string, label = "Side supports", overrides: PieceOverrides = {}): BuildModelPiece {
  return {
    id,
    label,
    quantity: overrides.quantity ?? 1,
    pieceType: "board",
    materialId: overrides.materialId ?? simpleShelfBuildModelFixture.materials[0].id,
    dimensions: {
      lengthInches: 60,
      widthInches: 8,
      thicknessInches: 0.75,
      ...overrides.dimensions,
    },
    grainDirection: "length",
    notes: overrides.notes ?? [],
  };
}

export function createWallShelfFixtureBuildModel(
  state: WallShelfFixtureState = "single",
  overrides: Partial<BoardsmithBuildModel> = {},
): BoardsmithBuildModel {
  const connected = state === "connected_modeled_support" || state === "connected_unresolved_support" || state === "connected_impossible_height";
  const separate = state === "separate";
  const impossibleHeight = state === "connected_impossible_height";
  const shelfQuantity = connected || separate ? 5 : 1;
  const pieces =
    overrides.pieces ??
    (state === "connected_modeled_support"
      ? [
          createWallShelfFixtureShelfPiece({ label: "Shelf boards", quantity: shelfQuantity }),
          createWallShelfFixtureSupportPiece("left_side_support"),
          createWallShelfFixtureSupportPiece("right_side_support"),
        ]
      : [
          createWallShelfFixtureShelfPiece({
            label: shelfQuantity === 1 ? "Shelf board" : "Shelf boards",
            quantity: shelfQuantity,
          }),
        ]);

  return {
    ...simpleShelfBuildModelFixture,
    ...overrides,
    dimensions: {
      ...simpleShelfBuildModelFixture.dimensions,
      widthInches: 24,
      heightInches: connected ? (impossibleHeight ? 0.1 : 60) : 0.75,
      depthInches: 8,
      materialThicknessInches: 0.75,
      ...overrides.dimensions,
    },
    pieces,
    materials: overrides.materials ?? [{ ...simpleShelfBuildModelFixture.materials[0], label: "3/4 in pine board" }],
  };
}

export function createWallShelfFixturePlan(state: WallShelfFixtureState = "single", overrides: Partial<GeneratedPlan> = {}): GeneratedPlan {
  const connected = state === "connected_modeled_support" || state === "connected_unresolved_support" || state === "connected_impossible_height";
  const separate = state === "separate";
  const impossibleHeight = state === "connected_impossible_height";
  const shelfQuantity = connected || separate ? 5 : 1;

  return {
    ...wallShelfBasePlan,
    ...overrides,
    dimensions: {
      ...wallShelfBasePlan.dimensions,
      height_inches: connected ? (impossibleHeight ? 0.1 : 60) : 0.75,
      ...overrides.dimensions,
    },
    cut_list: overrides.cut_list ?? [
      {
        ...wallShelfBasePlan.cut_list[0],
        part_name: shelfQuantity === 1 ? "Shelf board" : "Shelf boards",
        quantity: shelfQuantity,
      },
    ],
  };
}

export function createWallShelfFixturePlanRecord(
  state: WallShelfFixtureState = "single",
  overrides: Partial<GeneratedProjectPlanRecord> = {},
): GeneratedProjectPlanRecord {
  const plan = createWallShelfFixturePlan(state);

  return {
    id: `wall_shelf_${state}_plan`,
    project_id: `wall_shelf_${state}`,
    created_at: new Date(1).toISOString(),
    model_name: "test-model",
    plan_json: plan,
    build_model_json: createWallShelfFixtureBuildModel(state),
    plan_markdown: "# test",
    validation_status: "valid",
    warnings: plan.safety_notes,
    assumptions: plan.assumptions,
    confidence_level: plan.confidence_level,
    is_latest: true,
    ...overrides,
  };
}
