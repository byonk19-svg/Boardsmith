import { beforeAll, describe, expect, it } from "vitest";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import { projectSchema, type ProjectIntake } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";

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
  shelf_layout: "multiple_separate_shelves",
  shelf_count: 2,
  shelf_spacing_inches: 12,
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
  it("treats existing projects without archive metadata as active", () => {
    const existingProject = projectSchema.parse({
      ...intake,
      id: "existing-project-without-archive-field",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      status: "draft",
      safety_review_required: false,
      safety_flags: [],
      notes: "",
    });

    expect(existingProject.archived_at).toBeNull();
  });

  it("lists projects by most recent update first", async () => {
    const store = await import("@/lib/storage/project-store");
    const firstProject = await store.createProject({
      ...intake,
      title: `Recently updated shelf ${crypto.randomUUID()}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const secondProject = await store.createProject({
      ...intake,
      title: `Newer created shelf ${crypto.randomUUID()}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await store.updateProjectNotes(firstProject.id, "Move this older created project to the top by updating it.");

    const projectIds = (await store.listProjects()).map((project) => project.id);

    expect(projectIds.indexOf(firstProject.id)).toBeLessThan(projectIds.indexOf(secondProject.id));
  });

  it("creates projects with deterministic safety flags and preserves generated plan history", async () => {
    const store = await import("@/lib/storage/project-store");
    const project = await store.createProject(intake);

    expect(project.safety_review_required).toBe(true);
    expect(project.safety_flags).toEqual(expect.arrayContaining(["Wall mounting review", "Heavy shelving review"]));

    const buildModel = createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
    const failed = await store.markProjectGenerationFailed(project.id);
    expect(failed?.status).toBe("generation_failed");

    const firstPlan = await store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model-a", plan, buildModel });
    const secondPlan = await store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model-b", plan });
    const reloadedProject = await store.getProject(project.id);
    const plans = await store.listGeneratedPlans(project.id);

    expect(reloadedProject?.status).toBe("plan_generated");
    expect(plans).toHaveLength(2);
    expect(plans[0]?.id).toBe(secondPlan.id);
    expect(plans[0]?.is_latest).toBe(true);
    expect(plans[1]?.id).toBe(firstPlan.id);
    expect(plans[1]?.is_latest).toBe(false);
    expect(plans[1]?.build_model_json?.project.projectId).toBe(project.id);
    expect(plans[0]?.build_model_json).toBeNull();
  });

  it("duplicates project intake as a fresh draft without generated plans", async () => {
    const store = await import("@/lib/storage/project-store");
    const original = await store.createProject({
      ...intake,
      title: `Original shelf ${crypto.randomUUID()}`,
    });
    await store.updateProjectNotes(original.id, "Use black screws if the pine board looks too plain.");
    await store.saveGeneratedPlan({ projectId: original.id, modelName: "test-model", plan });

    const duplicate = await store.duplicateProject(original.id);
    if (!duplicate) throw new Error("Expected duplicate project to be created.");
    const duplicatePlans = await store.listGeneratedPlans(duplicate.id);

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.title).toBe(`${original.title} copy`);
    expect(duplicate.status).toBe("draft");
    expect(duplicate.created_at).not.toBe(original.created_at);
    expect(duplicate.updated_at).toBe(duplicate.created_at);
    expect(duplicate.project_type).toBe(original.project_type);
    expect(duplicate.skill_level).toBe(original.skill_level);
    expect(duplicate.width_inches).toBe(original.width_inches);
    expect(duplicate.height_inches).toBe(original.height_inches);
    expect(duplicate.depth_inches).toBe(original.depth_inches);
    expect(duplicate.material_thickness_inches).toBe(original.material_thickness_inches);
    expect(duplicate.material_type).toBe(original.material_type);
    expect(duplicate.shelf_layout).toBe(original.shelf_layout);
    expect(duplicate.shelf_count).toBe(original.shelf_count);
    expect(duplicate.shelf_spacing_inches).toBe(original.shelf_spacing_inches);
    expect(duplicate.tools_available).toEqual(original.tools_available);
    expect(duplicate.style_notes).toBe(original.style_notes);
    expect(duplicate.intended_use).toBe(original.intended_use);
    expect(duplicate.safety_review_required).toBe(original.safety_review_required);
    expect(duplicate.safety_flags).toEqual(original.safety_flags);
    expect(duplicate.notes).toBe("");
    expect(duplicatePlans).toEqual([]);
  });

  it("saves and updates plain-text project notes without affecting generated plans", async () => {
    const store = await import("@/lib/storage/project-store");
    const project = await store.createProject({
      ...intake,
      title: `Notes shelf ${crypto.randomUUID()}`,
    });
    await store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model", plan });

    const updated = await store.updateProjectNotes(project.id, "Try oak instead of pine.\nConfirm screw length before mounting.");
    const reloaded = await store.getProject(project.id);
    const plans = await store.listGeneratedPlans(project.id);

    expect(updated?.notes).toBe("Try oak instead of pine.\nConfirm screw length before mounting.");
    expect(updated?.updated_at).not.toBe(project.updated_at);
    expect(reloaded?.notes).toBe(updated?.notes);
    expect(plans).toHaveLength(1);
    expect(plans[0]?.is_latest).toBe(true);
  });

  it("updates shelf layout fields and refreshes deterministic shelf-layout flags", async () => {
    const store = await import("@/lib/storage/project-store");
    const project = await store.createProject({
      ...intake,
      title: `Layout repair shelf ${crypto.randomUUID()}`,
      shelf_layout: "multi_shelf_unit",
      shelf_count: undefined,
      shelf_spacing_inches: undefined,
      intended_use: "Bathroom wall storage for towels.",
    });

    expect(project.safety_flags).toContain("Shelf count/layout missing");

    const updated = await store.updateProjectShelfLayout(project.id, {
      shelf_layout: "multi_shelf_unit",
      shelf_count: 3,
      shelf_spacing_inches: 12,
      height_inches: 60,
    });
    const reloaded = await store.getProject(project.id);

    expect(updated?.shelf_layout).toBe("multi_shelf_unit");
    expect(updated?.shelf_count).toBe(3);
    expect(updated?.shelf_spacing_inches).toBe(12);
    expect(updated?.height_inches).toBe(60);
    expect(reloaded?.safety_flags).not.toContain("Shelf count/layout missing");
  });

  it("saves a plain-text build log without affecting generated plans", async () => {
    const store = await import("@/lib/storage/project-store");
    const project = await store.createProject({
      ...intake,
      title: `Build log shelf ${crypto.randomUUID()}`,
    });
    await store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model", plan });

    const updated = await store.updateProjectBuildLog(project.id, {
      build_completed: true,
      build_completed_at: "2026-06-02",
      build_actual_material: "Red oak board with clear satin finish.",
      build_plan_changes: "Used a slightly deeper shelf and different brackets.",
      build_lessons_learned: "Pre-drill bracket holes before final sanding next time.",
    });
    const reloaded = await store.getProject(project.id);
    const plans = await store.listGeneratedPlans(project.id);

    expect(updated?.build_completed).toBe(true);
    expect(updated?.build_completed_at).toBe("2026-06-02");
    expect(updated?.build_actual_material).toBe("Red oak board with clear satin finish.");
    expect(updated?.build_plan_changes).toBe("Used a slightly deeper shelf and different brackets.");
    expect(updated?.build_lessons_learned).toBe("Pre-drill bracket holes before final sanding next time.");
    expect(updated?.updated_at).not.toBe(project.updated_at);
    expect(reloaded?.build_plan_changes).toBe(updated?.build_plan_changes);
    expect(plans).toHaveLength(1);
    expect(plans[0]?.is_latest).toBe(true);
  });

  it("archives and restores projects without deleting generated plans", async () => {
    const store = await import("@/lib/storage/project-store");
    const project = await store.createProject({
      ...intake,
      title: `Archived lifecycle shelf ${crypto.randomUUID()}`,
    });
    await store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model", plan });

    const archived = await store.archiveProject(project.id);
    const archivedPlans = await store.listGeneratedPlans(project.id);
    const failedWhileArchived = await store.markProjectGenerationFailed(project.id);

    expect(archived?.archived_at).toEqual(expect.any(String));
    expect(archived?.updated_at).not.toBe(project.updated_at);
    expect(archivedPlans).toHaveLength(1);
    expect(archivedPlans[0]?.is_latest).toBe(true);
    expect(failedWhileArchived).toBeNull();
    await expect(store.saveGeneratedPlan({ projectId: project.id, modelName: "test-model", plan })).rejects.toThrow(
      "Project is archived. Restore it before saving a generated plan.",
    );

    const restored = await store.restoreProject(project.id);
    const restoredPlans = await store.listGeneratedPlans(project.id);

    expect(restored?.archived_at).toBeNull();
    expect(restored?.updated_at).not.toBe(archived?.updated_at);
    expect(restoredPlans).toHaveLength(1);
    expect(restoredPlans[0]?.id).toBe(archivedPlans[0]?.id);
  });
});
