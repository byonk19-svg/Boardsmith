import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WallShelfBuyingPlan } from "@/app/projects/[id]/WallShelfBuyingPlan";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { createWallShelfStockBoardViewModel } from "@/lib/plans/wall-shelf-stock-board-view-model";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_stock_board_project",
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
  id: "wall_shelf_stock_board_plan",
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

describe("createWallShelfStockBoardViewModel", () => {
  it("creates a ready single wall shelf buying plan without claiming an exact board purchase", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, width_inches: 36, height_inches: 0.75 },
      buildModel: buildModel({
        dimensions: { ...simpleShelfBuildModelFixture.dimensions, widthInches: 36, heightInches: 0.75 },
        pieces: [shelfPiece({ label: "Shelf board", quantity: 1, dimensions: { lengthInches: 36 } })],
      }),
    });

    expect(viewModel.status).toBe("ready");
    expect(viewModel.renderLabels.summary).toBe("Buying plan from Build Model pieces.");
    expect(viewModel.materialGroups[0]).toMatchObject({
      displayName: "3/4 in pine board",
      totalPiecesLabel: "1 piece",
      pieces: [expect.objectContaining({ label: "Shelf board", quantity: 1, dimensionsLabel: "36 in x 6 in x 0.75 in" })],
    });
    expect(viewModel.storeTripMinimums).toEqual([
      {
        id: "3_4_in_pine_board",
        materialName: "3/4 in pine board",
        boardCountLabel: "Plan for 1 shelf board.",
        usableLengthLabel: "Each board needs at least 36 in usable length.",
        caveat: "Exact retail stock length still depends on available boards, defects, waste, and final layout.",
      },
    ]);
    const stockBoardDecision = viewModel.buyingDecisions.find((decision) => decision.id === "stock_board_selection");
    const hardwareDecision = viewModel.buyingDecisions.find((decision) => decision.id === "hardware_site_review");

    expect(stockBoardDecision).toMatchObject({
      label: "Stock board selection",
      statusLabel: "Select before buying",
    });
    expect(stockBoardDecision?.detail).toContain("Minimum planning fact");
    expect(stockBoardDecision?.detail).toContain("1 shelf board");
    expect(stockBoardDecision?.detail).toContain("at least 36 in usable length");
    expect(stockBoardDecision?.detail).toContain("does not optimize full boards or choose a store item");
    expect(hardwareDecision).toMatchObject({
      label: "Mounting hardware/site review",
      statusLabel: "Review before buying",
    });
    expect(hardwareDecision?.detail).toContain("Wall brackets");
    expect(hardwareDecision?.detail).toContain("Modeled support/bracket count: 2 Wall brackets");
    expect(hardwareDecision?.detail).toContain("studs/anchors");
    expect(hardwareDecision?.detail).toContain("does not provide load ratings");
    expect(viewModel.buyingNotes.join(" ")).toContain("Choose stock length after confirming available boards");
    expect(JSON.stringify(viewModel)).not.toMatch(/\bbuy one\b|home depot|pricing|inventory|1x10x8/i);
  });

  it("reflects selected mounting method and support count in hardware buying review copy", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: {
        ...baseProject,
        shelf_layout: "single_shelf",
        shelf_count: 1,
        width_inches: 48,
        height_inches: 0.75,
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
      buildModel: buildModel({
        dimensions: { ...simpleShelfBuildModelFixture.dimensions, widthInches: 48, heightInches: 0.75 },
        pieces: [shelfPiece({ label: "Shelf board", quantity: 1, dimensions: { lengthInches: 48 } })],
        hardware: simpleShelfBuildModelFixture.hardware.map((item) =>
          item.id === "wall_brackets" ? { ...item, label: "Visible L bracket placeholders", quantity: 3 } : item,
        ),
      }),
    });
    const hardwareDecision = viewModel.buyingDecisions.find((decision) => decision.id === "hardware_site_review");

    expect(hardwareDecision?.detail).toContain("Selected mounting method: Visible L brackets.");
    expect(hardwareDecision?.detail).toContain("Intake support/bracket count: 3.");
    expect(hardwareDecision?.detail).toContain("Modeled support/bracket count: 3 Visible L bracket placeholders.");
    expect(hardwareDecision?.detail).toContain("before buying or installing");
    expect(hardwareDecision?.detail).toContain("does not provide load ratings or engineering sign-off");
    expect(hardwareDecision?.detail).not.toMatch(/vendor|price|pricing|checkout|cart|certified|load-rated/i);
  });

  it("groups a valid 5-shelf wall shelf under one material when support pieces are modeled", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: baseProject,
      buildModel: buildModel({
        pieces: [
          shelfPiece({ label: "Shelf boards", quantity: 5 }),
          supportPiece("left_side_support", "Side supports"),
          supportPiece("right_side_support", "Side supports"),
        ],
      }),
    });

    expect(viewModel.status).toBe("ready");
    expect(viewModel.materialGroups).toHaveLength(1);
    expect(viewModel.materialGroups[0]).toMatchObject({
      displayName: "3/4 in pine board",
      totalPieces: 7,
      totalPiecesLabel: "7 pieces",
    });
    expect(viewModel.materialGroups[0]?.pieces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Shelf boards", quantity: 5 }),
        expect.objectContaining({ label: "Side supports", quantity: 2 }),
      ]),
    );
    expect(viewModel.storeTripMinimums).toEqual([
      expect.objectContaining({
        boardCountLabel: "Plan for 5 shelf boards.",
        usableLengthLabel: "Each board needs at least 12 in usable length.",
      }),
    ]);
  });

  it("dedupes duplicate shelf board pieces into one clean buying-plan group", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 },
      buildModel: buildModel({
        pieces: [
          shelfPiece({ id: "shelf_board_one", label: "Shelf board", quantity: 1 }),
          shelfPiece({ id: "shelf_board_two", label: "Shelf board", quantity: 2 }),
        ],
      }),
    });

    expect(viewModel.materialGroups[0]?.pieces).toHaveLength(1);
    expect(viewModel.materialGroups[0]?.pieces[0]).toMatchObject({
      label: "Shelf boards",
      quantity: 3,
      quantityLabel: "Qty 3",
    });
  });

  it("marks connected shelf units without modeled side supports or frame pieces incomplete", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: baseProject,
      buildModel: buildModel(),
    });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.badges).toContain("Support/frame review");
    expect(viewModel.reviewReasons.join(" ")).toContain("Support/frame pieces may add material");
  });

  it("marks stale invalid 5-shelf height as needs_review without a trusted buying plan", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" },
      buildModel: buildModel({
        dimensions: { ...simpleShelfBuildModelFixture.dimensions, heightInches: 0.1 },
        pieces: [
          shelfPiece({ label: "Shelf boards", quantity: 5 }),
          {
            ...supportPiece("side_support_frame_placeholder", "Side support/frame placeholders"),
            quantity: 2,
            dimensions: { lengthInches: null, widthInches: 6, thicknessInches: 0.75 },
            notes: ["Total height needs review before support/frame piece dimensions can be trusted."],
          },
        ],
      }),
    });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.renderLabels.summary).toBe("Buying plan needs review before purchasing material.");
    expect(viewModel.reviewReasons).toContain("Impossible or missing shelf layout dimensions");
    expect(viewModel.buyingDecisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "support_frame_review", statusLabel: "Resolve before buying" }),
        expect.objectContaining({ id: "finish_exposure_review", label: "Finish/exposure review" }),
      ]),
    );
    expect(JSON.stringify(viewModel)).not.toContain("Height 0.1 in");
  });

  it("marks missing material dimensions as needs_review", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 },
      buildModel: buildModel({
        pieces: [shelfPiece({ label: "Shelf board", quantity: 1 })],
        materials: [{ ...simpleShelfBuildModelFixture.materials[0], label: "Pine board", nominalThicknessInches: null }],
      }),
    });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.materialGroups[0]?.thickness).toMatchObject({
      label: "thickness needs review",
      status: "missing",
    });
    expect(viewModel.reviewReasons).toContain("Confirm thickness for Pine board.");
  });

  it("renders print-compatible safe labels and no exact stock-board purchase claim", () => {
    const manifest = createPrintablePlanManifest({
      project: { ...baseProject, title: "Bathroom shelf with 5 shelves", style_notes: "" },
      planRecord,
      buildModel: buildModel({ pieces: [shelfPiece({ label: "Shelf boards", quantity: 5 })] }),
      buildModelSource: "saved",
    });

    const markup = renderToStaticMarkup(React.createElement(WallShelfBuyingPlan, { viewModel: manifest.wallShelfStockBoardViewModel, compact: true }));

    expect(markup).toContain("Buying Plan");
    expect(markup).toContain("Buying plan needs review before purchasing material.");
    expect(markup).toContain("Store-trip minimum");
    expect(markup).toContain("Plan for 5 shelf boards.");
    expect(markup).toContain("Each board needs at least 12 in usable length.");
    expect(markup).toContain("Exact retail stock length still depends on available boards, defects, waste, and final layout.");
    expect(markup).toContain("Buying decisions before purchase");
    expect(markup).toContain("Stock board selection");
    expect(markup).toContain("Support/frame may change the list");
    expect(markup).toContain("Support and wall-fastener review");
    expect(markup).toContain("Build Model hardware to review");
    expect(markup).toContain("stock-board planning visual: Part A - Shelf boards");
    expect(markup).toContain("stock length to select");
    expect(markup).toContain("not optimized");
    expect(markup).toContain("Pieces to get from this material");
    expect(markup).toContain("Qty 5");
    expect(markup).toContain("Shelf boards");
    expect(markup).toContain("Support/frame review");
    expect(markup).not.toMatch(/\bbuy one\b|home depot|pricing|inventory|1x10x8|freestanding|non-mounted/i);
  });

  it("renders missing material thickness as review-needed in the stock-board visual", () => {
    const viewModel = createWallShelfStockBoardViewModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 },
      buildModel: buildModel({
        pieces: [shelfPiece({ label: "Shelf board", quantity: 1 })],
        materials: [{ ...simpleShelfBuildModelFixture.materials[0], label: "Pine board", nominalThicknessInches: null }],
      }),
    });
    const markup = renderToStaticMarkup(React.createElement(WallShelfBuyingPlan, { viewModel, compact: true }));

    expect(markup).toContain("Pine board stock-board planning visual: Part A - Shelf board");
    expect(markup).toContain("thickness needs review");
    expect(markup).toContain("review");
    expect(markup).toContain("Stock length still needs selection from available boards.");
    expect(markup).not.toMatch(/\bbuy one\b|vendor|price|pricing|inventory|checkout|cart|load-rated|certified|CAD-ready|CNC-ready|optimized cut/i);
  });
});
