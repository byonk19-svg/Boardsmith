import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";

const getProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();
const updateProjectClarificationAnswersMock = vi.fn<(...args: unknown[]) => Promise<Project | null>>();
const revalidatePathMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    revalidatePathMock(path);
  },
}));

vi.mock("@/lib/storage/project-store", () => ({
  getProject: (projectId: string) => getProjectMock(projectId),
  updateProjectClarificationAnswers: (...args: unknown[]) => updateProjectClarificationAnswersMock(...args),
}));

const project: Project = {
  id: "clarification-project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Bathroom shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "generation_failed",
  width_inches: 24,
  height_inches: 0.1,
  depth_inches: 8,
  material_thickness_inches: 0.75,
  material_type: "Pine",
  shelf_layout: "multi_shelf_unit",
  shelf_count: undefined,
  shelf_spacing_inches: undefined,
  tools_available: ["tape_measure", "pencil"],
  style_notes: "",
  intended_use: "Bathroom wall shelf.",
  safety_review_required: true,
  safety_flags: ["Shelf count/layout missing"],
  notes: "",
  build_completed: false,
  build_completed_at: "",
  build_actual_material: "",
  build_plan_changes: "",
  build_lessons_learned: "",
  archived_at: null,
};

describe("project clarification route", () => {
  beforeEach(() => {
    vi.resetModules();
    getProjectMock.mockReset();
    updateProjectClarificationAnswersMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("saves clarification answers to the existing project and redirects to readiness", async () => {
    getProjectMock.mockResolvedValue(project);
    updateProjectClarificationAnswersMock.mockResolvedValue({ ...project, shelf_count: 3, height_inches: 60 });
    const { POST } = await import("@/app/projects/[id]/clarification/route");
    const formData = new FormData();
    formData.set("shelf_layout", "multi_shelf_unit");
    formData.set("shelf_count", "3");
    formData.set("height_inches", "60");
    formData.set("mounting_method", "visible_l_brackets");

    const response = await POST(new Request("http://localhost/projects/clarification-project/clarification", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "clarification-project" }),
    });

    expect(updateProjectClarificationAnswersMock).toHaveBeenCalledWith(
      "clarification-project",
      expect.objectContaining({
        shelf_layout: "multi_shelf_unit",
        shelf_count: 3,
        height_inches: 60,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects/clarification-project");
    expect(response.headers.get("location")).toBe("http://localhost/projects/clarification-project?clarification_answers=updated&clarification_status=needs_details#plan-readiness");
  });

  it("blocks archived project writes", async () => {
    getProjectMock.mockResolvedValue({ ...project, archived_at: new Date(0).toISOString() });
    const { POST } = await import("@/app/projects/[id]/clarification/route");
    const formData = new FormData();
    formData.set("shelf_count", "3");

    const response = await POST(new Request("http://localhost/projects/clarification-project/clarification", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "clarification-project" }),
    });

    expect(updateProjectClarificationAnswersMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost/projects/clarification-project?error=project_archived#plan-readiness");
  });

  it("redirects invalid answers to a safe project-detail error", async () => {
    getProjectMock.mockResolvedValue(project);
    const { POST } = await import("@/app/projects/[id]/clarification/route");

    const response = await POST(new Request("http://localhost/projects/clarification-project/clarification", { method: "POST", body: new FormData() }), {
      params: Promise.resolve({ id: "clarification-project" }),
    });

    expect(updateProjectClarificationAnswersMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost/projects/clarification-project?error=clarification_answers_invalid#plan-readiness");
  });
});
