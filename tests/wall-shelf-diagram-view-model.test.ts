import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { createWallShelfDiagramViewModel } from "@/lib/plans/wall-shelf-diagram-view-model";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const baseProject: Project = {
  id: "wall_shelf_diagram_view_model_project",
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
      instructions: "Confirm side supports, frame, cleat, bracket, or another verified support method before building.",
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
  id: "wall_shelf_diagram_view_model_plan",
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
    pieces: overrides.pieces ?? [{ ...simpleShelfBuildModelFixture.pieces[0], label: "Shelf boards", quantity: 5 }],
    materials: overrides.materials ?? [{ ...simpleShelfBuildModelFixture.materials[0], label: "3/4 in pine board" }],
  };
}

describe("createWallShelfDiagramViewModel", () => {
  it("creates a ready single wall shelf view model from structured build model data", () => {
    const viewModel = createWallShelfDiagramViewModel({
      project: { ...baseProject, shelf_layout: "single_shelf", shelf_count: 1, height_inches: 0.75, shelf_spacing_inches: undefined },
      buildModel: buildModel({ pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], quantity: 1 }] }),
    });

    expect(viewModel).toMatchObject({
      projectType: "simple_shelf",
      status: "ready",
      layout: "single_shelf",
      shelfCount: 1,
      dimensions: {
        width: { valueInches: 12, label: "Width 12 in", status: "known" },
        depth: { valueInches: 6, label: "Depth 6 in", status: "known" },
        boardThickness: { valueInches: 0.75, label: "Material thickness 0.75 in", status: "known" },
      },
      supportFrameReview: {
        required: false,
        needsReview: false,
      },
    });
    expect(viewModel.visibleBoards[0]).toMatchObject({
      label: "Shelf board",
      quantity: 1,
      role: "shelf_board",
      dimensionsLabel: "36 in x 10 in x 0.75 in",
      needsReview: false,
    });
  });

  it("creates a valid 5-shelf connected unit view model with safe support/frame review state", () => {
    const viewModel = createWallShelfDiagramViewModel({
      project: baseProject,
      buildModel: buildModel(),
    });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.layout).toBe("connected_shelf_unit");
    expect(viewModel.shelfCount).toBe(5);
    expect(viewModel.dimensions.height).toMatchObject({ valueInches: 60, label: "Height 60 in", status: "known" });
    expect(viewModel.supportFrameReview).toMatchObject({
      required: true,
      needsReview: true,
      label: "Support/frame design needs review",
    });
    expect(viewModel.badges).toContain("Support/frame review");
  });

  it("returns needs_review for impossible 5-shelf height and never exposes the height as valid", () => {
    const viewModel = createWallShelfDiagramViewModel({
      project: { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1 },
      buildModel: buildModel({
        dimensions: {
          ...simpleShelfBuildModelFixture.dimensions,
          widthInches: 12,
          heightInches: 0.1,
          depthInches: 6,
          materialThicknessInches: 0.75,
        },
      }),
    });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.dimensions.height).toMatchObject({
      valueInches: null,
      label: "Total height needs review",
      status: "needs_review",
    });
    expect(viewModel.renderLabels.fallbackMessage).toBe("Add valid total height to render full layout.");
    expect(JSON.stringify(viewModel)).not.toContain("Height 0.1 in");
  });

  it("marks connected shelf units without modeled side supports or frame pieces for support/frame review", () => {
    const viewModel = createWallShelfDiagramViewModel({
      project: baseProject,
      buildModel: buildModel(),
    });

    expect(viewModel.supportFrameReview.required).toBe(true);
    expect(viewModel.supportFrameReview.needsReview).toBe(true);
    expect(viewModel.supportFrameReview.reasons.join(" ")).toContain("side supports, frame, cleat, brackets");
    expect(viewModel.renderLabels.supportLabel).toBe("Support/frame design needs review");
  });

  it("keeps stale saved invalid plans from producing valid height labels in the printable manifest", () => {
    const manifest = createPrintablePlanManifest({
      project: { ...baseProject, title: "Bathroom shelf with 5 shelves", height_inches: 0.1, style_notes: "" },
      planRecord,
      buildModel: buildModel({
        dimensions: {
          ...simpleShelfBuildModelFixture.dimensions,
          widthInches: 12,
          heightInches: 0.1,
          depthInches: 6,
          materialThicknessInches: 0.75,
        },
      }),
      buildModelSource: "saved",
    });

    expect(manifest.wallShelfDiagramViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfDiagramViewModel.dimensions.height.label).toBe("Total height needs review");
    expect(manifest.planningDiagrams.projectAnatomy.heightLabel).toBe("Total height needs review");
    expect(manifest.wallShelfDiagram?.totalProjectHeightInches).toBeNull();
    expect(manifest.wallShelfDiagram?.fallbackMessage).toBe("Add valid total height to render full layout.");
  });

  it("keeps print-compatible diagram labels safe when support details are unresolved", () => {
    const manifest = createPrintablePlanManifest({
      project: baseProject,
      planRecord,
      buildModel: buildModel(),
      buildModelSource: "saved",
    });

    expect(manifest.wallShelfDiagramViewModel.renderLabels.supportLabel).toBe("Support/frame design needs review");
    expect(manifest.planningDiagrams.projectAnatomy.supportLabel).toBe("Support/frame design needs review");
    expect(manifest.wallShelfDiagram?.supportLabel).toBe("Support/frame design needs review");
    expect(JSON.stringify(manifest.wallShelfDiagramViewModel)).not.toMatch(/load-rated|CAD-ready|CNC-ready|approved|fabrication-ready/i);
  });
});
