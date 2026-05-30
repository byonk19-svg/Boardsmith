import { describe, expect, it } from "vitest";
import { generatedPlanSchema, renderPlanMarkdown, type GeneratedPlan } from "@/lib/plans/plan-schema";

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

  it("renders markdown from validated plans", () => {
    expect(renderPlanMarkdown(validPlan)).toContain("## Cut List");
    expect(renderPlanMarkdown(validPlan)).toContain("Round backer");
  });
});
