import { describe, expect, it } from "vitest";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { createPlanterBoxCutDiagramViewModel } from "@/lib/plans/planter-box-cut-diagram-view-model";
import { createPlanterBoxStockBoardViewModel } from "@/lib/plans/planter-box-stock-board-view-model";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { createWallShelfFixtureProject } from "./project-test-helpers";

function planterBuildModel() {
  const project = {
    ...createWallShelfFixtureProject("single"),
    id: "planter_box_packet",
    title: "Porch planter box",
    project_type: "planter_box" as const,
    width_inches: 24,
    height_inches: 8,
    depth_inches: 8,
    material_thickness_inches: 0.75,
    material_type: "cedar board",
    intended_use: "Outdoor herb planter box.",
  };

  return createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
}

describe("planter box packet view models", () => {
  it("creates review-first cut groups from deterministic planter part labels", () => {
    const buildModel = planterBuildModel();
    const viewModel = createPlanterBoxCutDiagramViewModel({ buildModel });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.pieceGroups.map((piece) => piece.printLabel)).toEqual([
      "Part A - Front panel",
      "Part B - Back panel",
      "Part C - Left side panel",
      "Part D - Right side panel",
      "Part E - Bottom panel",
    ]);
    expect(viewModel.totalCutPieces).toBe(5);
    expect(viewModel.warnings).toEqual(expect.arrayContaining(["What drainage-hole layout and liner approach should be used?"]));
    expect(viewModel.warnings.join(" ")).toMatch(/soil and water|outdoor|drainage/i);
    expect(JSON.stringify(viewModel)).not.toMatch(/vendor|price|cart|load-rated|CAD-ready|CNC-ready/i);
  });

  it("groups planter panels into a material planning packet without shopping claims", () => {
    const buildModel = planterBuildModel();
    const cutViewModel = createPlanterBoxCutDiagramViewModel({ buildModel });
    const viewModel = createPlanterBoxStockBoardViewModel({ buildModel, cutViewModel });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.materialGroups).toHaveLength(1);
    expect(viewModel.materialGroups[0]?.pieces.map((piece) => piece.printLabel)).toEqual([
      "Part A - Front panel",
      "Part B - Back panel",
      "Part C - Left side panel",
      "Part D - Right side panel",
      "Part E - Bottom panel",
    ]);
    expect(viewModel.reviewReasons.join(" ")).toMatch(/drainage|liner|outdoor|soil and water/i);
    expect(viewModel.buyingNotes.join(" ")).toContain("not a retail checkout list or optimized cut plan");
    expect(JSON.stringify(viewModel)).not.toMatch(/vendor|price|cart|load-rated|CAD-ready|CNC-ready/i);
  });
});
