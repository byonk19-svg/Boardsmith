import { afterEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
  vi.doUnmock("@supabase/supabase-js");
});

const sourceProject: Project = {
  id: "source-project-id",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Bathroom shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 24,
  height_inches: 8,
  depth_inches: 7,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  shelf_layout: "multiple_separate_shelves",
  shelf_count: 2,
  shelf_spacing_inches: 12,
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Light bathroom shelf",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "Use stainless screws for bathroom humidity.",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

describe("Supabase project duplication", () => {
  it("copies only project intake fields into a new draft row", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    let insertedProject: Project | null = null;
    const maybeSingle = vi.fn(() => Promise.resolve({ data: sourceProject, error: null }));
    const single = vi.fn(() => Promise.resolve({ data: insertedProject, error: null }));
    const is = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq, single }));
    const insert = vi.fn((project: Project) => {
      insertedProject = project;
      return { select };
    });
    const from = vi.fn(() => ({ select, insert }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({ from })),
    }));

    const store = await import("@/lib/storage/project-store");
    const duplicate = await store.duplicateProject(sourceProject.id);
    if (!duplicate) throw new Error("Expected duplicate project to be created.");

    expect(from).toHaveBeenCalledWith("projects");
    expect(eq).toHaveBeenCalledWith("id", sourceProject.id);
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insertedProject).toEqual(
      expect.objectContaining({
        title: "Bathroom shelf copy",
        project_type: sourceProject.project_type,
        skill_level: sourceProject.skill_level,
        status: "draft",
        width_inches: sourceProject.width_inches,
        height_inches: sourceProject.height_inches,
        depth_inches: sourceProject.depth_inches,
        material_thickness_inches: sourceProject.material_thickness_inches,
        material_type: sourceProject.material_type,
        shelf_layout: sourceProject.shelf_layout,
        shelf_count: sourceProject.shelf_count,
        shelf_spacing_inches: sourceProject.shelf_spacing_inches,
        tools_available: sourceProject.tools_available,
        style_notes: sourceProject.style_notes,
        intended_use: sourceProject.intended_use,
        safety_review_required: sourceProject.safety_review_required,
        safety_flags: sourceProject.safety_flags,
      }),
    );
    expect(insertedProject).not.toHaveProperty("notes");
    expect(insertedProject).not.toHaveProperty("archived_at");
    expect(duplicate.id).not.toBe(sourceProject.id);
    expect(duplicate.status).toBe("draft");
    expect(duplicate.notes).toBe("");
  });

  it("updates structured shelf layout fields on the existing Supabase project row", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const updatedProject = {
      ...sourceProject,
      updated_at: new Date(6).toISOString(),
      shelf_layout: "multi_shelf_unit" as const,
      shelf_count: 4,
      shelf_spacing_inches: 14,
      height_inches: 60,
      safety_review_required: true,
      safety_flags: ["Wall mounting review"],
    };
    const getMaybeSingle = vi.fn(() => Promise.resolve({ data: sourceProject, error: null }));
    const updateMaybeSingle = vi.fn(() => Promise.resolve({ data: updatedProject, error: null }));
    const is = vi.fn(() => ({ select: () => ({ maybeSingle: updateMaybeSingle }) }));
    const eq = vi
      .fn()
      .mockReturnValueOnce({ maybeSingle: getMaybeSingle })
      .mockReturnValueOnce({ is });
    const select = vi.fn(() => ({ eq }));
    const update = vi.fn<(payload: Record<string, unknown>) => { eq: typeof eq }>(() => ({ eq }));
    const from = vi.fn(() => ({ select, update }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({ from })),
    }));

    const store = await import("@/lib/storage/project-store");
    const saved = await store.updateProjectShelfLayout(sourceProject.id, {
      shelf_layout: "multi_shelf_unit",
      shelf_count: 4,
      shelf_spacing_inches: 14,
      height_inches: 60,
    });

    expect(from).toHaveBeenCalledWith("projects");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        shelf_layout: "multi_shelf_unit",
        shelf_count: 4,
        shelf_spacing_inches: 14,
        height_inches: 60,
        safety_review_required: true,
      }),
    );
    const updatePayload = update.mock.calls[0]?.[0];
    expect(updatePayload).not.toHaveProperty("style_notes");
    expect(eq).toHaveBeenCalledWith("id", sourceProject.id);
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(saved?.shelf_layout).toBe("multi_shelf_unit");
    expect(saved?.shelf_count).toBe(4);
    expect(saved?.shelf_spacing_inches).toBe(14);
  });

  it("updates project notes on the existing project row", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const updatedProject = {
      ...sourceProject,
      updated_at: new Date(2).toISOString(),
      notes: "Confirm bracket screw length.",
    };
    const maybeSingle = vi.fn(() => Promise.resolve({ data: updatedProject, error: null }));
    const is = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
    const eq = vi.fn(() => ({ is }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({ from })),
    }));

    const store = await import("@/lib/storage/project-store");
    const saved = await store.updateProjectNotes(sourceProject.id, "Confirm bracket screw length.");

    expect(from).toHaveBeenCalledWith("projects");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ notes: "Confirm bracket screw length." }));
    expect(eq).toHaveBeenCalledWith("id", sourceProject.id);
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(saved?.notes).toBe("Confirm bracket screw length.");
  });

  it("does not update project notes when the Supabase row is already archived", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const is = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
    const eq = vi.fn(() => ({ is }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({ from })),
    }));

    const store = await import("@/lib/storage/project-store");
    const saved = await store.updateProjectNotes(sourceProject.id, "Stale archived write.");

    expect(saved).toBeNull();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ notes: "Stale archived write." }));
    expect(is).toHaveBeenCalledWith("archived_at", null);
  });

  it("updates the project build log on the existing project row", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const updatedProject = {
      ...sourceProject,
      updated_at: new Date(3).toISOString(),
      build_completed: true,
      build_completed_at: "2026-06-02",
      build_actual_material: "Red oak board.",
      build_plan_changes: "Changed brackets after dry fitting.",
      build_lessons_learned: "Mark pilot holes earlier next time.",
    };
    const maybeSingle = vi.fn(() => Promise.resolve({ data: updatedProject, error: null }));
    const is = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
    const eq = vi.fn(() => ({ is }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({ from })),
    }));

    const store = await import("@/lib/storage/project-store");
    const saved = await store.updateProjectBuildLog(sourceProject.id, {
      build_completed: true,
      build_completed_at: "2026-06-02",
      build_actual_material: "Red oak board.",
      build_plan_changes: "Changed brackets after dry fitting.",
      build_lessons_learned: "Mark pilot holes earlier next time.",
    });

    expect(from).toHaveBeenCalledWith("projects");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        build_completed: true,
        build_completed_at: "2026-06-02",
        build_actual_material: "Red oak board.",
        build_plan_changes: "Changed brackets after dry fitting.",
        build_lessons_learned: "Mark pilot holes earlier next time.",
      }),
    );
    expect(eq).toHaveBeenCalledWith("id", sourceProject.id);
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(saved?.build_completed).toBe(true);
    expect(saved?.build_plan_changes).toBe("Changed brackets after dry fitting.");
  });

  it("archives and restores a project on the existing Supabase row", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const archivedProject = {
      ...sourceProject,
      archived_at: "2026-06-06T10:00:00.000Z",
      updated_at: new Date(4).toISOString(),
    };
    const restoredProject = {
      ...sourceProject,
      updated_at: new Date(5).toISOString(),
    };
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: archivedProject, error: null })
      .mockResolvedValueOnce({ data: restoredProject, error: null });
    const is = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
    const not = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
    const eq = vi.fn(() => ({ is, not }));
    const update = vi.fn<(payload: { archived_at: string | null }) => { eq: typeof eq }>(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({ from })),
    }));

    const store = await import("@/lib/storage/project-store");
    const archived = await store.archiveProject(sourceProject.id);
    const restored = await store.restoreProject(sourceProject.id);

    expect(from).toHaveBeenCalledWith("projects");
    expect(typeof update.mock.calls[0]?.[0].archived_at).toBe("string");
    expect(update).toHaveBeenNthCalledWith(2, expect.objectContaining({ archived_at: null }));
    expect(eq).toHaveBeenCalledWith("id", sourceProject.id);
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(not).toHaveBeenCalledWith("archived_at", "is", null);
    expect(archived?.archived_at).toBe("2026-06-06T10:00:00.000Z");
    expect(restored?.archived_at).toBeNull();
  });
});
