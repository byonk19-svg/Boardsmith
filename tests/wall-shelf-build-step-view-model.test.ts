import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BuildStepCards } from "@/app/projects/[id]/BuildStepCards";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { createWallShelfBuildStepViewModel } from "@/lib/plans/wall-shelf-build-step-view-model";
import { createWallShelfCutDiagramViewModel } from "@/lib/plans/wall-shelf-cut-diagram-view-model";
import { createWallShelfDiagramViewModel } from "@/lib/plans/wall-shelf-diagram-view-model";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_build_steps_project",
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
  tools_available: ["tape_measure", "pencil", "drill", "sander"],
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
      title: "Assemble shelves as freestanding unit",
      instructions: "Stack and assemble the shelves as a freestanding unit before mounting.",
      tools_used: ["drill"],
      safety_note: null,
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
  id: "wall_shelf_build_steps_plan",
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
    pieces: overrides.pieces ?? [shelfPiece({ label: "Shelf boards", quantity: 5, dimensions: { lengthInches: 12, widthInches: 6 } })],
    materials: overrides.materials ?? [{ ...simpleShelfBuildModelFixture.materials[0], label: "3/4 in pine board" }],
  };
}

function viewModel(project: Project, model: BoardsmithBuildModel) {
  const diagramViewModel = createWallShelfDiagramViewModel({ project, buildModel: model });
  const cutViewModel = createWallShelfCutDiagramViewModel({ project, buildModel: model });
  return createWallShelfBuildStepViewModel({ project, buildModel: model, diagramViewModel, cutViewModel });
}

describe("createWallShelfBuildStepViewModel", () => {
  it("creates a natural deterministic step sequence for a single wall shelf", () => {
    const model = buildModel({ pieces: [shelfPiece({ quantity: 1, dimensions: { lengthInches: 12, widthInches: 6 } })] });
    const steps = viewModel({ ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 }, model);

    expect(steps.status).toBe("ready");
    expect(steps.stepCards.map((step) => step.title)).toEqual([
      "Review dimensions and support method",
      "Cut shelf board pieces",
      "Dry fit shelf layout",
      "Sand and prep pieces",
      "Confirm wall mounting/support method before installation",
      "Finish and final safety check",
    ]);
    expect(steps.stepCards[1]?.dimensionReferences).toContain("Part A - Shelf board: Qty 1, 12 in x 6 in x 0.75 in");
    expect(steps.stepCards.map((step) => step.visualIntent)).toEqual(["review", "cut", "layout", "finish", "mount", "finish"]);
    expect(steps.stepCards.map((step) => `${step.title} ${step.instructions}`).join(" ")).not.toMatch(/freestanding|non-mounted|support\/frame details before assembly/i);
  });

  it("reflects selected mounting method and support count in build-guide review steps", () => {
    const model = buildModel({
      pieces: [shelfPiece({ quantity: 1, dimensions: { lengthInches: 48, widthInches: 14 } })],
      hardware: simpleShelfBuildModelFixture.hardware.map((item) =>
        item.id === "wall_brackets" ? { ...item, label: "Visible L bracket placeholders", quantity: 3 } : item,
      ),
    });
    const steps = viewModel(
      {
        ...baseProject,
        title: "Garage utility shelf",
        shelf_layout: "single_shelf",
        shelf_count: 1,
        width_inches: 48,
        height_inches: 0.75,
        depth_inches: 14,
        intended_use: [
          "Garage shelf for storage bins and tools.",
          "Structured intake",
          "- Mounting method: Visible L brackets",
          "- Wall type: Drywall, studs unknown",
          "- Stud access: Not sure",
          "- What it will hold: Books/heavy items",
          "- Support/bracket count: 3",
        ].join("\n"),
      },
      model,
    );
    const reviewStep = steps.stepCards.find((step) => step.id === "review_dimensions_support");
    const mountingStep = steps.stepCards.find((step) => step.id === "confirm_mounting_support");

    expect(reviewStep?.instructions).toContain("Selected mounting method: Visible L brackets.");
    expect(reviewStep?.instructions).toContain("Intake support/bracket count: 3.");
    expect(reviewStep?.instructions).toContain("not safety approval");
    expect(mountingStep?.instructions).toContain("Use the selected mounting/support plan as a review starting point");
    expect(mountingStep?.instructions).toContain("Selected mounting method: Visible L brackets.");
    expect(mountingStep?.instructions).toContain("Intake support/bracket count: 3.");
    expect(JSON.stringify(steps)).not.toMatch(/vendor|price|pricing|checkout|cart|certified|load-rated|engineering approval/i);
  });

  it("marks a valid 5-shelf connected unit with unresolved support/frame as needs_review", () => {
    const steps = viewModel(baseProject, buildModel());

    expect(steps.status).toBe("needs_review");
    expect(steps.badges).toContain("Support/frame review");
    expect(steps.reviewBlockers).toContain("Add support/frame details before assembly or mounting.");
    const supportReviewStep = steps.stepCards.find((step) => step.title === "Add support/frame details before assembly");
    const blockedAssemblyStep = steps.stepCards.find((step) => step.title === "Do not assemble connected unit yet");

    expect(supportReviewStep?.phaseLabel).toBe("Inspect / review");
    expect(supportReviewStep?.visualIntent).toBe("support");
    expect(supportReviewStep?.reviewBlockers).toContain("Confirm support/frame design before assembly.");
    expect(blockedAssemblyStep?.phaseLabel).toBe("Inspect / review");
    expect(blockedAssemblyStep?.visualIntent).toBe("support");
  });

  it("blocks an invalid 5-shelf height from rendering a trusted full build guide", () => {
    const steps = viewModel(
      { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" },
      buildModel({
        dimensions: { ...simpleShelfBuildModelFixture.dimensions, widthInches: 12, heightInches: 0.1, depthInches: 6 },
      }),
    );

    expect(steps.status).toBe("needs_review");
    expect(steps.renderLabels.summary).toBe("Build guide needs review before this is a trusted build sequence.");
    expect(steps.reviewBlockers).toContain("Add valid total height before treating this as a build-ready sequence.");
    expect(JSON.stringify(steps)).not.toContain("Height 0.1 in");
  });

  it("allows assembly-oriented steps only when support/frame pieces are modeled", () => {
    const steps = viewModel(
      baseProject,
      buildModel({
        pieces: [
          shelfPiece({ label: "Shelf boards", quantity: 5, dimensions: { lengthInches: 12, widthInches: 6 } }),
          supportPiece("left_side_support", "Side supports"),
          supportPiece("right_side_support", "Side supports"),
        ],
      }),
    );

    expect(steps.status).toBe("ready");
    expect(steps.stepCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Prepare support/frame pieces" }),
        expect.objectContaining({ title: "Assemble connected shelf unit" }),
      ]),
    );
    expect(steps.stepCards.map((step) => step.title)).not.toContain("Do not assemble connected unit yet");

    const markup = renderToStaticMarkup(React.createElement(BuildStepCards, { cards: steps.stepCards }));
    expect(markup).toContain("step mini diagram");
    expect(markup).toContain("Part A - Shelf boards");
    expect(markup).toContain("Part B - Side supports");
    expect(markup).toContain("Assemble connected shelf unit");
  });

  it("filters stale freestanding generated-plan copy from manifest build cards", () => {
    const manifest = createPrintablePlanManifest({
      project: baseProject,
      planRecord,
      buildModel: buildModel(),
      buildModelSource: "saved",
    });

    expect(manifest.wallShelfBuildStepViewModel.status).toBe("needs_review");
    expect(manifest.buildStepCards[0]?.title).toBe("Review dimensions and support method before building");
    expect(JSON.stringify(manifest.buildStepCards)).not.toMatch(/freestanding|non-mounted/i);
  });

  it("renders print-compatible safe build guide copy", () => {
    const manifest = createPrintablePlanManifest({
      project: baseProject,
      planRecord,
      buildModel: buildModel(),
      buildModelSource: "saved",
    });
    const markup = renderToStaticMarkup(React.createElement(BuildStepCards, { cards: manifest.buildStepCards, compact: true }));

    expect(markup).toContain("step mini diagram");
    expect(markup).toContain("support/frame review");
    expect(markup).toContain("Step 1 mini diagram");
    expect(markup).toContain("Part A - Shelf boards");
    expect(markup).toContain("review first");
    expect(markup).toContain("Add support/frame details");
    expect(markup).toContain("Do not assemble connected unit yet");
    expect(markup).toContain("Use the selected mounting/support plan as a review starting point");
    expect(markup).not.toMatch(/freestanding|non-mounted|CAD-ready|CNC-ready|fabrication-ready|approved/i);
  });
});
