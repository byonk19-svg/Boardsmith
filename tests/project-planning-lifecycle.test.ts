import { describe, expect, it } from "vitest";
import {
  createProjectPlanningLifecycle,
  evaluateArchiveCommand,
  evaluateGenerationCommand,
  evaluateProjectWriteCommand,
  evaluateRestoreCommand,
  evaluateRevisionCommand,
  isProjectArchived,
} from "@/lib/projects/project-planning-lifecycle";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const project: Project = {
  id: "lifecycle-project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Lifecycle shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "draft",
  width_inches: 24,
  height_inches: 8,
  depth_inches: 7,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  shelf_layout: "single_shelf",
  shelf_count: 1,
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted with brackets screwed into studs.",
  intended_use: "Light decorative shelf with known support details.",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

describe("Project Planning Lifecycle", () => {
  it("treats Archive as the strongest lifecycle state while preserving Browser Print Plan visibility", () => {
    const lifecycle = createProjectPlanningLifecycle(
      {
        ...project,
        status: "generation_failed",
        archived_at: "2026-06-08T12:00:00.000Z",
      },
      { hasLatestPlan: true },
    );

    expect(lifecycle).toMatchObject({
      isArchived: true,
      latestAttemptFailedWithSavedPlan: true,
      canGeneratePlan: false,
      canRevisePlan: false,
      canEditProjectRecord: false,
      canRepairShelfLayout: false,
      canDuplicateProject: false,
      canArchiveProject: false,
      canRestoreProject: true,
      canShowBrowserPrintPlan: true,
    });
  });

  it("keeps failed generation as a latest-attempt state when a saved Plan Version exists", () => {
    const lifecycle = createProjectPlanningLifecycle({ ...project, status: "generation_failed" }, { hasLatestPlan: true });

    expect(lifecycle.latestAttemptFailedWithSavedPlan).toBe(true);
    expect(lifecycle.canGeneratePlan).toBe(true);
    expect(lifecycle.canRevisePlan).toBe(true);
  });

  it("orders generation eligibility as archive, Clarification Gate, shelf repair, then allowed", () => {
    expect(evaluateGenerationCommand({ ...project, archived_at: "2026-06-08T12:00:00.000Z" })).toEqual({
      allowed: false,
      reason: "archived",
    });
    expect(evaluateGenerationCommand({ ...project, title: "Baby crib rail", intended_use: "Sleep surface for baby nursery." })).toEqual({
      allowed: false,
      reason: "clarification_gate",
    });
    expect(evaluateGenerationCommand({ ...project, shelf_layout: "multi_shelf_unit", shelf_count: undefined, height_inches: 60 })).toEqual({
      allowed: false,
      reason: "shelf_layout_missing",
    });
    expect(evaluateGenerationCommand({ ...project, shelf_layout: "multi_shelf_unit", shelf_count: 5, height_inches: 0.1 })).toEqual({
      allowed: false,
      reason: "shelf_layout_invalid",
    });
    expect(evaluateGenerationCommand(project)).toEqual({ allowed: true });
  });

  it("blocks raised planter support concepts through the clarification gate before generation", () => {
    expect(
      evaluateGenerationCommand({
        ...project,
        project_type: "planter_box",
        title: "Raised herb planter",
        width_inches: 36,
        height_inches: 18,
        depth_inches: 14,
        material_type: "cedar 1x6",
        shelf_layout: undefined,
        shelf_count: undefined,
        style_notes: "Raised planter box with legs and a support frame.",
        intended_use: "Outdoor herb planter standing off the ground.",
      }),
    ).toEqual({ allowed: false, reason: "clarification_gate" });
  });

  it("blocks heavy garage shelf generation until support count and wall fastener details are explicit", () => {
    expect(
      evaluateGenerationCommand({
        ...project,
        title: "Garage utility shelf",
        width_inches: 48,
        depth_inches: 14,
        style_notes: "Wall mounted shelf with visible L brackets.",
        intended_use: "Garage shelf for storage bins and tools. Avoid electrical on this wall.",
      }),
    ).toEqual({ allowed: false, reason: "clarification_gate" });
  });

  it("keeps revision and generic writes behind the same archive decision", () => {
    const archived = { ...project, archived_at: "2026-06-08T12:00:00.000Z" };

    expect(isProjectArchived(archived)).toBe(true);
    expect(evaluateRevisionCommand(archived, { hasLatestPlan: true })).toEqual({ allowed: false, reason: "archived" });
    expect(evaluateRevisionCommand(project, { hasLatestPlan: false })).toEqual({ allowed: false, reason: "no_plan" });
    expect(evaluateRevisionCommand(project, { hasLatestPlan: true })).toEqual({ allowed: true });
    expect(evaluateProjectWriteCommand(archived)).toEqual({ allowed: false, reason: "archived" });
    expect(evaluateProjectWriteCommand(project)).toEqual({ allowed: true });
  });

  it("keeps Archive and restore as opposite lifecycle commands", () => {
    const archived = { ...project, archived_at: "2026-06-08T12:00:00.000Z" };

    expect(evaluateArchiveCommand(project)).toEqual({ allowed: true });
    expect(evaluateArchiveCommand(archived)).toEqual({ allowed: false, reason: "archived" });
    expect(evaluateRestoreCommand(archived)).toEqual({ allowed: true });
    expect(evaluateRestoreCommand(project)).toEqual({ allowed: false, reason: "not_archived" });
  });
});
