import { classifyRevisionIntent } from "@/lib/plans/revision-intent";
import { createProjectIntakeRevisionDecision } from "@/lib/projects/project-intake-revision";
import { createWallShelfFixtureProject } from "./project-test-helpers";
import { describe, expect, it } from "vitest";

function decisionFor(instruction: string, overrides = {}) {
  return createProjectIntakeRevisionDecision(createWallShelfFixtureProject("single", overrides), classifyRevisionIntent(instruction));
}

describe("createProjectIntakeRevisionDecision", () => {
  it("turns safe dimension and material revision requests into project intake patches", () => {
    expect(decisionFor("Make the shelf 30 inches wide and switch the material to oak.")).toMatchObject({
      decision: "apply_safe_patch",
      patch: {
        width_inches: 30,
        material_type: "Oak",
      },
      touchedFields: ["width_inches", "material_type"],
    });
  });

  it("turns explicit material thickness changes into project intake patches", () => {
    expect(decisionFor("Use 3/4 inch thick oak.")).toMatchObject({
      decision: "apply_safe_patch",
      patch: {
        material_thickness_inches: 0.75,
        material_type: "Oak",
      },
    });
  });

  it("turns safe shelf layout revision requests into shelf intake patches", () => {
    expect(decisionFor("Change this to three separate shelves with 12 inch spacing.")).toMatchObject({
      decision: "apply_safe_patch",
      patch: {
        shelf_layout: "multiple_separate_shelves",
        shelf_count: 3,
        shelf_spacing_inches: 12,
      },
    });
  });

  it("returns the post-patch Clarification Gate decision", () => {
    const decision = decisionFor("Make the shelf 30 inches wide and switch the material to oak.");

    expect(decision).toMatchObject({
      decision: "apply_safe_patch",
      clarificationGateDecision: {
        supportedProjectType: true,
      },
    });
  });

  it("keeps support, cut-list, safety, and ambiguous categories on the manual review path", () => {
    for (const instruction of [
      "Use a French cleat instead of brackets.",
      "Make the shelf 30 inches wide and use a French cleat.",
      "Reduce the number of cuts.",
      "Make it safe for heavy books.",
      "Make it sturdier and switch the material to oak.",
    ]) {
      expect(createProjectIntakeRevisionDecision(createWallShelfFixtureProject(), classifyRevisionIntent(instruction))).toMatchObject({
        decision: "manual_intake_update_required",
      });
    }
  });

  it("falls back to manual intake review when no deterministic field can be parsed", () => {
    expect(decisionFor("Make the shelf wider.")).toEqual({
      decision: "manual_intake_update_required",
      reason: "no_parseable_update",
    });
  });

  it("does not auto-patch shelf height because height meaning depends on shelf layout", () => {
    expect(decisionFor("Make the shelf 40 inches tall.")).toEqual({
      decision: "manual_intake_update_required",
      reason: "no_parseable_update",
    });
  });

  it("does not apply shelf-layout patches to unsupported project types", () => {
    expect(decisionFor("Change this to three separate shelves.", { project_type: "wood_sign" })).toEqual({
      decision: "manual_intake_update_required",
      reason: "unsupported_project_type",
    });
  });
});
