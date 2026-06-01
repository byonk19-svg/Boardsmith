import { afterEach, describe, expect, it, vi } from "vitest";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
  vi.doUnmock("@supabase/supabase-js");
});

const plan: GeneratedPlan = {
  project_summary: "A cautious shelf plan with review reminders before cutting or building.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 24,
    height_inches: 6,
    depth_inches: 8,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "Pine board", quantity: "1 board", notes: "Inspect for straightness before cutting." }],
  tools: ["Tape measure", "Pencil", "Drill"],
  cut_list: [
    {
      part_name: "Shelf board",
      quantity: 1,
      length_inches: 24,
      width_inches: 8,
      thickness_inches: 0.75,
      material: "Pine board",
      notes: "Confirm final length before cutting.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Confirm dimensions",
      instructions: "Confirm all dimensions against the actual project space before cutting.",
      tools_used: ["Tape measure"],
      safety_note: "Review the plan before cutting.",
      estimated_time_minutes: 10,
    },
  ],
  finishing_steps: ["Sand exposed edges."],
  safety_notes: ["Wear PPE.", "Review dimensions and materials before cutting."],
  assumptions: ["Decorative use only unless reviewed otherwise."],
  needs_review_flags: ["Manual review required before building."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["No export files are generated."],
  estimated_difficulty: "easy",
  estimated_time: "1 hour",
  confidence_level: "medium",
};

describe("Supabase generated plan save RPC", () => {
  it("saves generated plans through one atomic RPC call in Supabase mode", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const single = vi.fn(() =>
      Promise.resolve({
        data: {
          id: "saved-plan-id",
          project_id: "project-id",
          created_at: new Date(0).toISOString(),
          model_name: "test-model",
          plan_json: plan,
          build_model_json: null,
          plan_markdown: "# simple shelf plan\n",
          validation_status: "valid",
          warnings: plan.safety_notes,
          assumptions: plan.assumptions,
          confidence_level: plan.confidence_level,
          is_latest: true,
        },
        error: null,
      }),
    );
    const rpc = vi.fn(() => ({ single }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({ rpc })),
    }));

    const store = await import("@/lib/storage/project-store");
    const saved = await store.saveGeneratedPlan({ projectId: "project-id", modelName: "test-model", plan });

    expect(saved.id).toBe("saved-plan-id");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "save_generated_plan_atomic",
      expect.objectContaining({
        p_project_id: "project-id",
        p_model_name: "test-model",
        p_plan_json: plan,
        p_build_model_json: null,
        p_warnings: plan.safety_notes,
        p_assumptions: plan.assumptions,
        p_confidence_level: plan.confidence_level,
      }),
    );
  });
});
