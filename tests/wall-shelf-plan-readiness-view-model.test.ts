import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WallShelfPlanReadiness } from "@/app/projects/[id]/WallShelfPlanReadiness";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel, BuildModelPiece } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_plan_readiness_project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Wall shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 23,
  height_inches: 60,
  depth_inches: 8,
  material_thickness_inches: 0.75,
  material_type: "3/4 in pine board",
  shelf_layout: "multi_shelf_unit",
  shelf_count: 5,
  shelf_spacing_inches: 12,
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Connected wall shelf unit.",
  intended_use: "Bathroom wall shelf for light towels.",
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
    width_inches: 23,
    height_inches: 60,
    depth_inches: 8,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "3/4 in pine board", quantity: "material to review", notes: "Inspect before cutting." }],
  tools: ["tape measure", "pencil", "drill"],
  cut_list: [
    {
      part_name: "Shelf boards",
      quantity: 5,
      length_inches: 23,
      width_inches: 8,
      thickness_inches: 0.75,
      material: "3/4 in pine board",
      notes: "No load rating is implied.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review support/frame design",
      instructions: "Confirm side supports, frame, cleat, bracket, or another verified support method before building.",
      tools_used: ["drill"],
      safety_note: "Do not rely on Boardsmith for load ratings.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand and finish according to product labels."],
  safety_notes: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
  assumptions: ["Support details need review."],
  needs_review_flags: ["Support/frame design needs review."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["Mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "2-3 hours",
  confidence_level: "low",
};

const planRecord: GeneratedProjectPlanRecord = {
  id: "wall_shelf_plan_readiness_plan",
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
      lengthInches: 23,
      widthInches: 8,
      thicknessInches: 0.75,
      ...overrides.dimensions,
    },
  };
}

function buildModel(overrides: Partial<BoardsmithBuildModel> = {}): BoardsmithBuildModel {
  return {
    ...simpleShelfBuildModelFixture,
    ...overrides,
    project: {
      ...simpleShelfBuildModelFixture.project,
      projectId: baseProject.id,
      ...overrides.project,
    },
    dimensions: {
      ...simpleShelfBuildModelFixture.dimensions,
      widthInches: 23,
      heightInches: 60,
      depthInches: 8,
      materialThicknessInches: 0.75,
      ...overrides.dimensions,
    },
    pieces: overrides.pieces ?? [shelfPiece({ label: "Shelf boards", quantity: 5 })],
    materials: overrides.materials ?? [{ ...simpleShelfBuildModelFixture.materials[0], label: "3/4 in pine board" }],
  };
}

function manifestFor(project: Project, model: BoardsmithBuildModel = buildModel()) {
  return createPrintablePlanManifest({
    project,
    planRecord,
    buildModel: model,
    buildModelSource: "saved",
  });
}

describe("createWallShelfPlanReadinessViewModel", () => {
  it("blocks invalid 5-shelf height with an exact total-height action", () => {
    const manifest = manifestFor(
      { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" },
      buildModel({ dimensions: { ...simpleShelfBuildModelFixture.dimensions, widthInches: 23, heightInches: 0.1, depthInches: 8 } }),
    );

    expect(manifest.wallShelfPlanReadinessViewModel.status).toBe("blocked");
    const heightAction = manifest.wallShelfPlanReadinessViewModel.actions.find((action) => action.id === "total_height_review");
    expect(heightAction).toMatchObject({
      relatedSection: "dimensions",
      severity: "blocker",
    });
    expect(heightAction?.suggestedAction).toContain("Enter the full top-to-bottom height of the shelf unit, such as 60 in.");
    expect(JSON.stringify(manifest.wallShelfPlanReadinessViewModel)).not.toContain("Height 0.1 in");
  });

  it("returns a support/frame action for connected units without modeled support pieces", () => {
    const manifest = manifestFor({ ...baseProject, style_notes: "" }, buildModel());

    expect(manifest.wallShelfPlanReadinessViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfPlanReadinessViewModel.actions).toContainEqual(
      expect.objectContaining({
        id: "support_frame_design",
        relatedSection: "support/frame",
        suggestedAction: "Choose whether this is separate wall shelves, bracket-supported shelves, or a connected unit with side supports.",
      }),
    );
  });

  it("returns a buying-plan action for stock length selection without inventing a purchase", () => {
    const manifest = manifestFor({ ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 }, buildModel({ pieces: [shelfPiece({ label: "Shelf board", quantity: 1 })] }));
    const action = manifest.wallShelfPlanReadinessViewModel.actions.find((item) => item.id === "stock_board_selection");

    expect(action).toMatchObject({
      relatedSection: "buying plan",
      suggestedAction: "Choose available board size/stock length before treating the buying plan as final.",
    });
    expect(JSON.stringify(manifest.wallShelfPlanReadinessViewModel)).not.toMatch(/\bbuy one\b|home depot|pricing|vendor|inventory|1x10x8/i);
  });

  it("returns a mounting/support action from structured wall-mounting signals", () => {
    const manifest = manifestFor({ ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 }, buildModel({ pieces: [shelfPiece({ label: "Shelf board", quantity: 1 })] }));

    expect(manifest.wallShelfPlanReadinessViewModel.actions).toContainEqual(
      expect.objectContaining({
        id: "mounting_support_method",
        relatedSection: "mounting",
        suggestedAction: "Confirm support method before mounting.",
      }),
    );
  });

  it("keeps a single shelf compact and free of connected-unit warnings", () => {
    const manifest = manifestFor({ ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75 }, buildModel({ pieces: [shelfPiece({ label: "Shelf board", quantity: 1 })] }));

    expect(manifest.wallShelfPlanReadinessViewModel.status).toBe("build_ready");
    expect(manifest.wallShelfPlanReadinessViewModel.actions.map((action) => action.id)).not.toContain("support_frame_design");
    expect(manifest.wallShelfPlanReadinessViewModel.actions.map((action) => action.id)).not.toContain("total_height_review");
    expect(JSON.stringify(manifest.wallShelfPlanReadinessViewModel)).not.toMatch(/connected unit|connected shelf unit|freestanding|non-mounted/i);
  });

  it("keeps valid 5-shelf height out of impossible-height blockers while surfacing support/frame review", () => {
    const manifest = manifestFor({ ...baseProject, height_inches: 60, style_notes: "" }, buildModel());

    expect(manifest.wallShelfPlanReadinessViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfPlanReadinessViewModel.actions.map((action) => action.id)).toContain("support_frame_design");
    expect(manifest.wallShelfPlanReadinessViewModel.actions.map((action) => action.id)).not.toContain("total_height_review");
    expect(JSON.stringify(manifest.wallShelfPlanReadinessViewModel)).not.toContain("Total project height looks too small");
  });

  it("renders print-compatible readiness cards without forbidden claims", () => {
    const manifest = manifestFor({ ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" });
    const markup = renderToStaticMarkup(React.createElement(WallShelfPlanReadiness, { viewModel: manifest.wallShelfPlanReadinessViewModel, compact: true }));

    expect(markup).toContain("Plan Readiness / Next Actions");
    expect(markup).toContain("Total project height looks too small");
    expect(markup).toContain("Enter the full top-to-bottom height");
    expect(markup).toContain("Support/frame design needs review");
    expect(markup).toContain("Stock board size needs selection");
    expect(markup).not.toMatch(/freestanding|non-mounted|CAD-ready|CNC-ready|load rating|pricing|vendor|inventory|home depot/i);
  });
});
