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
  notes: "",
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

  it("tells the model to avoid overclaim wording that deterministic quality checks reject", () => {
    const context = buildProjectPlanPromptContext(shelfProject, simpleShelfBuildModelFixture);

    expect(context.deterministic_quality_rules).toEqual(
      expect.arrayContaining([
        "Use 'Boardsmith cannot verify ...' phrasing instead of guarantee, guaranteed, certify, child-safe, structural approval, or load-rating claims.",
        "When safety is uncertain, put the concern in needs_review_flags and safety_notes as a manual review item without claiming the project is safe.",
      ]),
    );
    expect(context.output_alignment_rules).toEqual(
      expect.arrayContaining([
        "Treat template hints as guidance. If the project intake and build model do not include wall mounting or wall hardware, do not add brackets, anchors, studs, or mounting steps.",
      ]),
    );
  });

  it("requires exact review labels for wall-mounted bathroom shelves", () => {
    const context = buildProjectPlanPromptContext(
      {
        ...shelfProject,
        title: "Small bathroom wall shelf",
        intended_use: "Wall-mounted bathroom shelf for light toiletries near a damp sink area.",
      },
      simpleShelfBuildModelFixture,
    );

    expect(context.intake_interpretation.wall_mounting_review_required).toBe(true);
    expect(context.intake_interpretation.bathroom_or_humidity_review).toBe(true);
    expect(context.intake_interpretation.exact_review_labels_required).toEqual(expect.arrayContaining(["Wall mounting review"]));
    expect(context.deterministic_quality_rules).toContain(
      "Copy each exact_review_labels_required value verbatim into needs_review_flags when any review labels are provided.",
    );
    expect(context.output_alignment_rules).toContain(
      "For bathroom shelves, include humidity and finish assumptions as review notes rather than waterproof or load-capacity claims.",
    );
  });

  it("adds cautious child-adjacent guidance for toddler book ledges", () => {
    const context = buildProjectPlanPromptContext({
      ...shelfProject,
      title: "Simple toddler book ledge",
      width_inches: 24,
      height_inches: 4,
      depth_inches: 4,
      intended_use: "Wall-mounted toddler book ledge for nursery books in a reading corner.",
      safety_flags: ["Wall mounting review", "Child or baby use", "Heavy shelving review"],
    });

    expect(context.intake_interpretation.child_or_baby_review_required).toBe(true);
    expect(context.intake_interpretation.book_ledge_review).toBe(true);
    expect(context.intake_interpretation.exact_review_labels_required).toEqual(
      expect.arrayContaining(["Wall mounting review", "Child or baby use", "Heavy shelving review"]),
    );
    expect(context.safety_rules).toContain(
      "Avoid the phrases child safe, safe for children, safe for toddlers, structurally approved, certified, load rated, guaranteed safe, guaranteed capacity, and safely supports.",
    );
    expect(context.forbidden_output_phrases).toEqual(expect.arrayContaining(["child-safe", "kid-safe", "safe for toddlers", "load-rated"]));
    expect(context.preferred_safety_phrases).toContain("Boardsmith cannot verify child safety.");
    expect(context.output_alignment_rules).toContain(
      "For book ledges, reuse modeled ledge piece names such as bottom shelf board, back rail, and front lip when present; do not add unmodeled child-safety claims.",
    );
  });
});
