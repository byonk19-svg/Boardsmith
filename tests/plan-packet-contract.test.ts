import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BuildStepCards } from "@/app/projects/[id]/BuildStepCards";
import { WallShelfBuyingPlan } from "@/app/projects/[id]/WallShelfBuyingPlan";
import { WallShelfCutDiagram } from "@/app/projects/[id]/WallShelfCutDiagram";
import { WallShelfDiagrams } from "@/app/projects/[id]/WallShelfDiagrams";
import { WallShelfPlanReadiness } from "@/app/projects/[id]/WallShelfPlanReadiness";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { describe, expect, it } from "vitest";
import {
  createWallShelfFixtureBuildModel,
  createWallShelfFixturePlanRecord,
  createWallShelfFixtureProject,
  type WallShelfFixtureState,
} from "./project-test-helpers";

function wallShelfManifest(state: WallShelfFixtureState) {
  const project = createWallShelfFixtureProject(state);
  const planRecord = createWallShelfFixturePlanRecord(state, { project_id: project.id });
  const buildModel = createWallShelfFixtureBuildModel(state);

  return createPrintablePlanManifest({
    project,
    planRecord: { ...planRecord, build_model_json: buildModel },
    buildModel,
    buildModelSource: "saved",
  });
}

function renderWallShelfPacketSurfaces(manifest: ReturnType<typeof wallShelfManifest>): string {
  return [
    renderToStaticMarkup(React.createElement(WallShelfPlanReadiness, { viewModel: manifest.wallShelfPlanReadinessViewModel })),
    manifest.wallShelfDiagram ? renderToStaticMarkup(React.createElement(WallShelfDiagrams, { model: manifest.wallShelfDiagram })) : "",
    renderToStaticMarkup(React.createElement(WallShelfCutDiagram, { viewModel: manifest.wallShelfCutDiagramViewModel })),
    renderToStaticMarkup(React.createElement(WallShelfBuyingPlan, { viewModel: manifest.wallShelfStockBoardViewModel })),
    renderToStaticMarkup(React.createElement(BuildStepCards, { cards: manifest.buildStepCards })),
  ].join(" ");
}

describe("plan packet contract", () => {
  it("uses the same deterministic wall-shelf part labels across packet surfaces", () => {
    const manifest = wallShelfManifest("connected_modeled_support");
    const expectedLabels = ["Part A - Shelf boards", "Part B - Side supports"];
    const renderedPacket = renderWallShelfPacketSurfaces(manifest);

    expect(manifest.wallShelfPlanReadinessViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfPlanReadinessViewModel.actions.map((action) => action.id)).not.toContain("support_frame_design");
    expect(manifest.wallShelfPlanReadinessViewModel.actions.map((action) => action.id)).toContain("mounting_support_method");
    expect(manifest.wallShelfPartScheduleViewModel.assignedParts.map((part) => part.printLabel)).toEqual(expectedLabels);
    expect(manifest.wallShelfCutDiagramViewModel.pieceGroups.map((piece) => piece.printLabel)).toEqual(expectedLabels);
    expect(manifest.wallShelfStockBoardViewModel.materialGroups.flatMap((group) => group.pieces.map((piece) => piece.printLabel))).toEqual(expectedLabels);

    for (const label of expectedLabels) {
      expect(JSON.stringify(manifest.wallShelfBuildStepViewModel.stepCards)).toContain(label);
      expect(renderedPacket).toContain(label);
    }
  });

  it("keeps unresolved connected shelf supports review-only instead of inventing build-ready parts", () => {
    const manifest = wallShelfManifest("connected_unresolved_support");
    const renderedPacket = renderWallShelfPacketSurfaces(manifest);

    expect(manifest.wallShelfPlanReadinessViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfCutDiagramViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfStockBoardViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfBuildStepViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfPartScheduleViewModel.assignedParts).toEqual([
      expect.objectContaining({ partLabel: "Part A", printLabel: "Part A - Shelf boards" }),
    ]);
    expect(manifest.wallShelfPartScheduleViewModel.rows).not.toContainEqual(expect.objectContaining({ partLabel: "Part B" }));
    expect(renderedPacket).toContain("Support/frame review");
    expect(renderedPacket).toContain("Do not assemble connected unit yet");
    expect(renderedPacket).not.toContain("Part B - Side support/frame placeholders");
    expect(renderedPacket).not.toMatch(/freestanding|non-mounted|load rated|certified|CAD-ready|CNC-ready/i);
  });

  it("sanitizes impossible connected shelf dimensions across packet contract surfaces", () => {
    const manifest = wallShelfManifest("connected_impossible_height");
    const serialized = JSON.stringify({
      intake: manifest.project.intake,
      readiness: manifest.wallShelfPlanReadinessViewModel,
      cut: manifest.wallShelfCutDiagramViewModel,
      buying: manifest.wallShelfStockBoardViewModel,
      steps: manifest.wallShelfBuildStepViewModel,
    });

    expect(manifest.project.intake.dimensions).toBe("24 x total height needs review x 8 in");
    expect(manifest.wallShelfPlanReadinessViewModel.status).not.toBe("ready");
    expect(manifest.wallShelfCutDiagramViewModel.status).toBe("needs_review");
    expect(manifest.wallShelfStockBoardViewModel.status).toBe("needs_review");
    expect(serialized).toContain("Impossible or missing shelf layout dimensions");
    expect(serialized).not.toContain("Height 0.1 in");
  });

  it("exposes a typed planter-box packet contract without making it build-ready", () => {
    const project = {
      ...createWallShelfFixtureProject("single"),
      id: "planter_box_contract",
      title: "Small planter box",
      project_type: "planter_box" as const,
      width_inches: 24,
      height_inches: 8,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      material_type: "cedar board",
      intended_use: "Outdoor herb planter.",
    };
    const buildModel = createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
    const manifest = createPrintablePlanManifest({
      project,
      planRecord: null,
      buildModel,
      buildModelSource: "derived",
    });

    expect(manifest.planningDiagrams.diagrams.map((diagram) => diagram.kind)).toContain("planter_box");
    expect(manifest.planterBoxPartScheduleViewModel.status).toBe("needs_review");
    expect(manifest.planterBoxPartScheduleViewModel.assignedParts.map((part) => part.printLabel)).toEqual([
      "Part A - Front panel",
      "Part B - Back panel",
      "Part C - Left side panel",
      "Part D - Right side panel",
      "Part E - Bottom panel",
    ]);
    expect(manifest.planterBoxPartScheduleViewModel.reviewMessages).toContain("What drainage-hole layout and liner approach should be used?");
    expect(JSON.stringify(manifest.planterBoxPartScheduleViewModel)).not.toMatch(/vendor|price|cart|load rated|certified|CAD-ready|CNC-ready/i);
  });
});
