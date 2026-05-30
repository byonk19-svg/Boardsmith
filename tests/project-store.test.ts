import { beforeAll, describe, expect, it } from "vitest";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import type { ProjectIntake } from "@/lib/projects/types";

beforeAll(() => {
  process.env.BOARDSMITH_DATA_FILE = `.data/test-${crypto.randomUUID()}.json`;
});

const intake: ProjectIntake = {
  title: `Storage lifecycle ${Date.now().toString()}`,
  project_type: "simple_shelf",
  skill_level: "beginner",
  width_inches: 42,
  height_inches: 8,
  depth_inches: 12,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill", "sander"],
  style_notes: "Wall mounted shelf for books",
  intended_use: "Heavy books on a wall mounted shelf",
};

const plan: GeneratedPlan = {
  project_summary: "A review-required shelf plan based on the submitted dimensions and tool list.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 42,
    height_inches: 8,
    depth_inches: 12,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "Pine board", quantity: "1", notes: "Inspect for straightness before cutting." }],
  tools: ["Tape measure", "Drill", "Sander"],
  cut_list: [
    {
      part_name: "Shelf board",
      quantity: 1,
      length_inches: 42,
      width_inches: 12,
      thickness_inches: 0.75,
      material: "Pine board",
      notes: "Confirm final length against wall location.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Confirm mounting location",
      instructions: "Locate studs or appropriate anchors before drilling and review expected shelf use.",
      tools_used: ["Tape measure", "Drill"],
      safety_note: "Do not assume a safe load rating from this plan.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand all exposed edges.", "Apply finish compatible with indoor use."],
  safety_notes: ["Wear PPE.", "Review wall mounting, anchors, and loading before use."],
  assumptions: ["Decorative/light storage use unless reviewed otherwise."],
  needs_review_flags: ["Wall mounting review", "Heavy shelving review"],
  beginner_tips: ["Mark pilot holes before drilling."],
  svg_readiness_notes: ["Separate board outline from drilling references in future exports."],
  estimated_difficulty: "moderate",
  estimated_time: "2-3 hours",
  confidence_level: "medium",
};

describe("project store lifecycle", () => {
  it("creates projects with deterministic safety flags and preserves generated plan history", async () => {
    const store = await import("@/lib/storage/project-store");
    const project = await store.createProject(intake);

    expect(project.safety_review_required).toBe(true);
    expect(project.safety_flags).toEqual(expect.arrayContaining(["Wall mounting review", "Heavy shelving review"]));

    const firstPlan = await store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model-a", plan });
    const secondPlan = await store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model-b", plan });
    const plans = await store.listGeneratedPlans(project.id);

    expect(plans).toHaveLength(2);
    expect(plans[0]?.id).toBe(secondPlan.id);
    expect(plans[0]?.is_latest).toBe(true);
    expect(plans[1]?.id).toBe(firstPlan.id);
    expect(plans[1]?.is_latest).toBe(false);
  });
});
