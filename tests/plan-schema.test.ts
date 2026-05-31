import { describe, expect, it } from "vitest";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { generatedPlanJsonSchema, generatedPlanSchema, generatedProjectPlanRecordSchema, renderPlanMarkdown, type GeneratedPlan } from "@/lib/plans/plan-schema";

const validPlan: GeneratedPlan = {
  project_summary: "A simple indoor door hanger plan sized from the submitted dimensions with review notes.",
  project_type: "door_hanger",
  dimensions: {
    width_inches: 18,
    height_inches: 18,
    depth_inches: 0,
    material_thickness_inches: 0.25,
  },
  materials: [{ name: "Birch plywood", quantity: "1 sheet", notes: "Use flat stock and inspect for voids." }],
  tools: ["Tape measure", "Jigsaw", "Sander"],
  cut_list: [
    {
      part_name: "Round backer",
      quantity: 1,
      length_inches: 18,
      width_inches: 18,
      thickness_inches: 0.25,
      material: "Birch plywood",
      notes: "Confirm final diameter before cutting.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Mark the blank",
      instructions: "Measure and mark the backer outline before cutting, then verify all dimensions.",
      tools_used: ["Tape measure", "Pencil"],
      safety_note: "Keep hands clear of cutting paths.",
      estimated_time_minutes: 10,
    },
  ],
  finishing_steps: ["Sand edges smooth.", "Apply paint after testing on scrap."],
  safety_notes: ["Wear eye protection.", "Measure twice, cut once and review before building."],
  assumptions: ["Indoor decorative use only."],
  needs_review_flags: ["User review required"],
  beginner_tips: ["Practice cuts on scrap material."],
  svg_readiness_notes: ["Keep the outline as a closed future path."],
  estimated_difficulty: "easy",
  estimated_time: "1-2 hours",
  confidence_level: "medium",
};

describe("generatedPlanSchema", () => {
  it("accepts a complete structured plan", () => {
    expect(generatedPlanSchema.parse(validPlan)).toEqual(validPlan);
  });

  it("rejects non-sequential assembly steps", () => {
    const invalidPlan = {
      ...validPlan,
      assembly_steps: [
        { ...validPlan.assembly_steps[0], step_number: 2 },
      ],
    };

    expect(generatedPlanSchema.safeParse(invalidPlan).success).toBe(false);
  });

  it("keeps OpenAI JSON schema array minimums aligned with Zod validation", () => {
    const schema = generatedPlanJsonSchema.properties;

    expect(schema.materials.minItems).toBe(1);
    expect(schema.tools.minItems).toBe(1);
    expect(schema.cut_list.minItems).toBe(1);
    expect(schema.assembly_steps.minItems).toBe(1);
    expect(schema.assembly_steps.items.properties.tools_used.minItems).toBe(1);
    expect(schema.finishing_steps.minItems).toBe(1);
    expect(schema.safety_notes.minItems).toBe(2);
    expect(schema.beginner_tips.minItems).toBe(1);
    expect(schema.svg_readiness_notes.minItems).toBe(1);
  });

  it("renders markdown from validated plans", () => {
    expect(renderPlanMarkdown(validPlan)).toContain("## Cut List");
    expect(renderPlanMarkdown(validPlan)).toContain("Round backer");
  });

  it("keeps old generated plan records compatible when build model JSON is missing", () => {
    const parsed = generatedProjectPlanRecordSchema.parse({
      id: "plan_1",
      project_id: "project_1",
      created_at: new Date(0).toISOString(),
      model_name: "test-model",
      plan_json: validPlan,
      plan_markdown: renderPlanMarkdown(validPlan),
      validation_status: "valid",
      warnings: validPlan.safety_notes,
      assumptions: validPlan.assumptions,
      confidence_level: validPlan.confidence_level,
      is_latest: true,
    });

    expect(parsed.build_model_json).toBeNull();
  });

  it("accepts generated plan records with BBM JSON stored beside the plan", () => {
    const parsed = generatedProjectPlanRecordSchema.parse({
      id: "plan_2",
      project_id: "project_2",
      created_at: new Date(0).toISOString(),
      model_name: "test-model",
      plan_json: validPlan,
      build_model_json: simpleShelfBuildModelFixture,
      plan_markdown: renderPlanMarkdown(validPlan),
      validation_status: "valid",
      warnings: validPlan.safety_notes,
      assumptions: validPlan.assumptions,
      confidence_level: validPlan.confidence_level,
      is_latest: true,
    });

    expect(parsed.build_model_json?.schemaVersion).toBe("1.0");
  });
});
