import { describe, expect, it } from "vitest";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { createPlanterBoxCutDiagramViewModel } from "@/lib/plans/planter-box-cut-diagram-view-model";
import { createPlanterBoxBuildStepViewModel } from "@/lib/plans/planter-box-build-step-view-model";
import { createPlanterBoxPlanReadinessViewModel } from "@/lib/plans/planter-box-plan-readiness-view-model";
import { createPlanterBoxStockBoardViewModel } from "@/lib/plans/planter-box-stock-board-view-model";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { createWallShelfFixtureProject } from "./project-test-helpers";

function planterProject() {
  return {
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
}

function planterBuildModel() {
  const project = planterProject();
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

  it("replaces generic planter connections with review-only assembly guidance", () => {
    const buildModel = planterBuildModel();
    const connectionText = JSON.stringify(buildModel.connections);

    expect(buildModel.connections.map((connection) => connection.id)).toEqual(
      expect.arrayContaining([
        "front_panel_to_bottom_panel",
        "back_panel_to_bottom_panel",
        "left_side_panel_to_front_back_bottom",
        "right_side_panel_to_front_back_bottom",
      ]),
    );
    expect(buildModel.operations.map((operation) => operation.id)).toEqual([
      "cut_planter_panels",
      "drill_drainage_holes",
      "dry_fit_planter_panels",
      "fasten_planter_panels",
      "apply_exterior_finish",
      "review_drainage_finish_and_connections",
    ]);
    expect(connectionText).not.toContain("Generic planter-box connection placeholder");
    expect(connectionText).toMatch(/front, back, and bottom panels/);
    expect(connectionText).toMatch(/outdoor-suitable fasteners/i);
    expect(connectionText).toMatch(/pilot holes/i);
    expect(connectionText).toMatch(/clamp the planter square/i);
    expect(connectionText).toMatch(/drainage, liner, and water\/soil exposure/i);
    expect(connectionText).not.toMatch(/load-bearing guarantee|certified/i);
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
    expect(viewModel.buyingNotes.join(" ")).toMatch(/assembled boards, slats, or courses/i);
    expect(viewModel.materialGroups[0]?.buyingNotes.join(" ")).toMatch(/actual stock board width is smaller than the modeled panel height or bottom depth/i);
    expect(viewModel.materialGroups[0]?.buyingNotes.join(" ")).toMatch(/does not calculate course counts or optimize cuts/i);
    expect(JSON.stringify(viewModel)).not.toMatch(/vendor|price|cart|load-rated|CAD-ready|CNC-ready/i);
  });

  it("creates review-first planter readiness actions without inventing joinery or approval", () => {
    const project = planterProject();
    const buildModel = planterBuildModel();
    const cutViewModel = createPlanterBoxCutDiagramViewModel({ buildModel });
    const stockBoardViewModel = createPlanterBoxStockBoardViewModel({ buildModel, cutViewModel });
    const viewModel = createPlanterBoxPlanReadinessViewModel({ project, buildModel, cutViewModel, stockBoardViewModel });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.renderLabels.title).toBe("Plan Readiness / Next Actions");
    expect(viewModel.actions.map((action) => action.id)).toEqual(
      expect.arrayContaining([
        "planter_drainage_liner_review",
        "planter_outdoor_finish_review",
        "planter_stock_board_selection",
        "planter_connection_review",
      ]),
    );
    expect(viewModel.actions.map((action) => action.printLabel)).toContain("Confirm drainage/liner");
    expect(JSON.stringify(viewModel)).toMatch(/manual review|planning aid|Outdoor material and finish/i);
    expect(JSON.stringify(viewModel)).not.toMatch(/vendor|price|cart|load rated|certified|CAD-ready|CNC-ready|approved|load-bearing/i);
  });

  it("creates a deterministic planter build guide from panels and connections", () => {
    const project = planterProject();
    const buildModel = planterBuildModel();
    const cutViewModel = createPlanterBoxCutDiagramViewModel({ buildModel });
    const stockBoardViewModel = createPlanterBoxStockBoardViewModel({ buildModel, cutViewModel });
    const viewModel = createPlanterBoxBuildStepViewModel({ project, buildModel, cutViewModel, stockBoardViewModel });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.badges).toEqual(expect.arrayContaining(["Needs review", "Panel connections", "Build Model steps"]));
    expect(viewModel.reviewBlockers).toEqual(
      expect.arrayContaining([
        "Confirm drainage-hole layout and liner approach before final assembly.",
        "Confirm screw length, spacing, edge distance, and outdoor suitability before fastening panels.",
      ]),
    );
    expect(viewModel.stepCards.map((step) => step.title)).toEqual([
      "Review planter layout before cutting",
      "Cut planter panels",
      "Drill drainage holes in bottom panel",
      "Dry fit planter box and confirm panel connections",
      "Apply exterior finish or liner",
      "Final planter review before use",
    ]);
    expect(viewModel.stepCards[1]?.dimensionReferences).toEqual([
      "Part A - Front panel: 1x, 24 x 8 x 0.75 in",
      "Part B - Back panel: 1x, 24 x 8 x 0.75 in",
      "Part C - Left side panel: 1x, 8 x 8 x 0.75 in",
      "Part D - Right side panel: 1x, 8 x 8 x 0.75 in",
      "Part E - Bottom panel: 1x, 24 x 8 x 0.75 in",
    ]);
    expect(viewModel.stepCards[3]?.relatedPieceLabels).toEqual([
      "Part A - Front panel",
      "Part B - Back panel",
      "Part C - Left side panel",
      "Part D - Right side panel",
      "Part E - Bottom panel",
    ]);
    expect(JSON.stringify(viewModel)).toMatch(/dry-fit|panel connections|pilot holes|outdoor/i);
    expect(JSON.stringify(viewModel)).not.toMatch(/vendor|price|cart|load rated|certified|CAD-ready|CNC-ready|approved|load-bearing/i);
  });

  it("uses planter build-step cards in the printable manifest without making the packet build-ready", () => {
    const project = planterProject();
    const buildModel = planterBuildModel();
    const manifest = createPrintablePlanManifest({
      project,
      planRecord: null,
      buildModel,
      buildModelSource: "derived",
    });

    expect(manifest.wallShelfBuildStepViewModel.status).toBe("unsupported");
    expect(manifest.planterBoxBuildStepViewModel.status).toBe("needs_review");
    expect(manifest.buildStepCards.map((step) => step.title)).toContain("Dry fit planter box and confirm panel connections");
    expect(JSON.stringify(manifest.buildStepCards)).toContain("Part E - Bottom panel");
    expect(JSON.stringify(manifest.buildStepCards)).not.toMatch(/vendor|price|cart|load rated|certified|CAD-ready|CNC-ready|approved|load-bearing/i);
  });

  it("keeps baseline planter readiness actions when generated wording lacks trigger keywords", () => {
    const project = {
      ...planterProject(),
      material_type: "board",
      intended_use: "box",
      style_notes: "",
      safety_flags: [],
    };
    const buildModel = structuredClone(planterBuildModel());
    buildModel.assumptions = ["Confirm physical fit before work."];
    buildModel.unresolvedQuestions = [];
    buildModel.safety = {
      reviewRequired: false,
      flags: [],
      disclaimers: [],
    };
    buildModel.connections = buildModel.connections.map((connection) => ({
      ...connection,
      notes: [],
      safetyNotes: [],
    }));
    buildModel.materials = buildModel.materials.map((material) => ({
      ...material,
      label: "Board",
      notes: [],
    }));
    const cutViewModel = {
      ...createPlanterBoxCutDiagramViewModel({ buildModel }),
      missingDimensions: [],
      warnings: [],
    };
    const stockBoardViewModel = {
      ...createPlanterBoxStockBoardViewModel({ buildModel, cutViewModel }),
      status: "ready" as const,
      reviewReasons: [],
      buyingNotes: [],
    };

    const viewModel = createPlanterBoxPlanReadinessViewModel({ project, buildModel, cutViewModel, stockBoardViewModel });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.actions.map((action) => action.id)).toEqual([
      "planter_drainage_liner_review",
      "planter_outdoor_finish_review",
      "planter_stock_board_selection",
      "planter_connection_review",
    ]);
    expect(viewModel.summary).toMatch(/Review drainage, liner, outdoor exposure, finish, material, cuts, and connections/);
  });
});
