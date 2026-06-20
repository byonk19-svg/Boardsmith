import { describe, expect, it } from "vitest";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { planterBoxBuildModelFixture, simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { createPlanterBoxPartScheduleViewModel } from "@/lib/plans/planter-box-part-schedule-view-model";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { createWallShelfFixtureProject } from "./project-test-helpers";

describe("planter box part schedule view model", () => {
  it("assigns deterministic planter-panel labels from build model pieces", () => {
    const viewModel = createPlanterBoxPartScheduleViewModel({ buildModel: planterBoxBuildModelFixture });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.assignedParts.map((part) => part.printLabel)).toEqual(["Part A - Front panel", "Part E - Bottom panel"]);
    expect(viewModel.rows[0]).toMatchObject({
      pieceId: "front_panel",
      partLabel: "Part A",
      dimensions: "24 x 8 x 0.75 in",
      materialLabel: "Cedar board",
      reviewOnly: false,
    });
    expect(viewModel.reviewMessages).toContain("Exact drainage layout and liner choice are unresolved.");
    expect(JSON.stringify(viewModel)).not.toMatch(/vendor|price|cart|load rated|certified/i);
  });

  it("tracks all five generated planter panels for a live draft", () => {
    const project = {
      ...createWallShelfFixtureProject("single"),
      id: "planter_box_project",
      title: "Porch planter box",
      project_type: "planter_box" as const,
      width_inches: 24,
      height_inches: 8,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      material_type: "cedar board",
      intended_use: "Outdoor herb planter box.",
    };
    const buildModel = createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
    const viewModel = createPlanterBoxPartScheduleViewModel({ buildModel });

    expect(viewModel.assignedParts.map((part) => part.printLabel)).toEqual([
      "Part A - Front panel",
      "Part B - Back panel",
      "Part C - Left side panel",
      "Part D - Right side panel",
      "Part E - Bottom panel",
    ]);
    expect(viewModel.assignedParts.every((part) => !part.reviewOnly)).toBe(true);
    expect(viewModel.reviewMessages).toContain("What drainage-hole layout and liner approach should be used?");
    expect(viewModel.reviewMessages.join(" ")).toMatch(/outdoor|drainage/i);
  });

  it("keeps planter part labels deterministic when build-model pieces are out of order", () => {
    const buildModel = {
      ...planterBoxBuildModelFixture,
      pieces: [...planterBoxBuildModelFixture.pieces].reverse(),
    };
    const viewModel = createPlanterBoxPartScheduleViewModel({ buildModel });

    expect(viewModel.assignedParts.map((part) => part.printLabel)).toEqual(["Part A - Front panel", "Part E - Bottom panel"]);
    expect(viewModel.assignedParts.map((part) => part.partLabel)).toEqual(["Part A", "Part E"]);
    expect(viewModel.assignedParts).not.toContainEqual(expect.objectContaining({ printLabel: "Part A - Bottom panel" }));
    expect(JSON.stringify(viewModel)).not.toMatch(/vendor|price|cart|load-rated|CAD-ready|CNC-ready/i);
  });

  it("keeps missing dimensions review-only instead of implying cut-ready panels", () => {
    const buildModel = {
      ...planterBoxBuildModelFixture,
      pieces: [
        {
          ...planterBoxBuildModelFixture.pieces[0],
          dimensions: {
            ...planterBoxBuildModelFixture.pieces[0].dimensions,
            lengthInches: null,
          },
        },
      ],
    };
    const viewModel = createPlanterBoxPartScheduleViewModel({ buildModel });

    expect(viewModel.status).toBe("needs_review");
    expect(viewModel.assignedParts).toEqual([
      expect.objectContaining({
        printLabel: "Part A - Front panel",
        dimensions: "Dimensions need review",
        reviewOnly: true,
      }),
    ]);
    expect(viewModel.reviewMessages).toContain("Part A - Front panel needs length, width, and thickness before cutting.");
  });

  it("does not expose planter packet labels for other templates", () => {
    const viewModel = createPlanterBoxPartScheduleViewModel({ buildModel: simpleShelfBuildModelFixture });

    expect(viewModel.status).toBe("unsupported");
    expect(viewModel.assignedParts).toEqual([]);
    expect(viewModel.reviewMessages).toContain("Planter-box packet parts are available only for the planter box template.");
  });
});
