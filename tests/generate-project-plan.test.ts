import { describe, expect, it } from "vitest";
import { buildProjectPlanPromptContext } from "@/lib/ai/generate-project-plan";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { Project } from "@/lib/projects/types";

const shelfProject: Project = {
  id: "test-project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Office shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "draft",
  width_inches: 48,
  height_inches: 8,
  depth_inches: 12,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Books on a wall shelf",
  safety_review_required: true,
  safety_flags: ["Wall mounting review", "Heavy shelving review"],
};

describe("buildProjectPlanPromptContext", () => {
  it("includes deterministic template hints for the project type", () => {
    const context = buildProjectPlanPromptContext(shelfProject, simpleShelfBuildModelFixture);

    expect(context.template_hints.projectType).toBe("simple_shelf");
    expect(context.build_model_context?.schemaVersion).toBe("1.0");
    expect(context.deterministic_quality_rules).toContain("Generated dimensions must not exceed confirmed build model dimensions.");
    expect(context.template_hints.cautions).toContain("Include stud/anchor caution and require user review before use.");
    expect(context.deterministic_safety_flags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["wall_mounting", "heavy_shelving"]),
    );
  });

  it("includes BBM cut-list reconciliation rules in the prompt context", () => {
    const context = buildProjectPlanPromptContext(shelfProject, simpleShelfBuildModelFixture);

    expect(context.deterministic_quality_rules).toEqual(
      expect.arrayContaining([
        "Every cut-list part must map to a build model piece label, id, or piece type.",
        "Every cut-list material must map to a build model material label, id, or material type.",
        "Cut-list dimensions must not exceed the matched build model piece dimensions.",
      ]),
    );
  });
});
