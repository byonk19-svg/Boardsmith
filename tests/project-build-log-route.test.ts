import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project, ProjectBuildLogInput } from "@/lib/projects/types";
import { activeProjectArchiveFields } from "./project-test-helpers";

const updateProjectBuildLogMock = vi.fn<(projectId: string, input: ProjectBuildLogInput) => Promise<Project | null>>();
const getProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/storage/project-store", () => ({
  getProject: (projectId: string) => getProjectMock(projectId),
  updateProjectBuildLog: (projectId: string, input: ProjectBuildLogInput) => updateProjectBuildLogMock(projectId, input),
}));

const updatedProject: Project = {
  id: "project-with-build-log",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(1).toISOString(),
  title: "Shelf with build log",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "draft",
  width_inches: 24,
  height_inches: 8,
  depth_inches: 7,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil"],
  style_notes: "",
  intended_use: "Light shelf",
  safety_review_required: false,
  safety_flags: [],
  notes: "",
  build_completed: true,
  build_completed_at: "2026-06-02",
  build_actual_material: "Red oak board.",
  build_plan_changes: "Used deeper brackets.",
  build_lessons_learned: "Pre-drill earlier next time.",
  ...activeProjectArchiveFields,
};

describe("project build log route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjectMock.mockResolvedValue(updatedProject);
  });

  it("saves the build log and redirects back to the project detail page", async () => {
    updateProjectBuildLogMock.mockResolvedValue(updatedProject);
    const { POST } = await import("@/app/projects/[id]/build-log/route");
    const formData = new FormData();
    formData.set("build_completed", "on");
    formData.set("build_completed_at", "2026-06-02");
    formData.set("build_actual_material", "Red oak board.");
    formData.set("build_plan_changes", "Used deeper brackets.");
    formData.set("build_lessons_learned", "Pre-drill earlier next time.");

    const response = await POST(new Request("http://localhost/projects/project-with-build-log/build-log", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-build-log" }),
    });

    expect(updateProjectBuildLogMock).toHaveBeenCalledWith("project-with-build-log", {
      build_completed: true,
      build_completed_at: "2026-06-02",
      build_actual_material: "Red oak board.",
      build_plan_changes: "Used deeper brackets.",
      build_lessons_learned: "Pre-drill earlier next time.",
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-build-log?build_log=updated");
  });

  it("redirects with an error if the project is missing", async () => {
    getProjectMock.mockResolvedValue(null);
    const { POST } = await import("@/app/projects/[id]/build-log/route");
    const formData = new FormData();

    const response = await POST(new Request("http://localhost/projects/missing/build-log", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects?error=Project%20not%20found");
    expect(updateProjectBuildLogMock).not.toHaveBeenCalled();
  });

  it("blocks archived projects before saving build log changes", async () => {
    getProjectMock.mockResolvedValue({ ...updatedProject, archived_at: "2026-06-08T12:00:00.000Z" });
    const { POST } = await import("@/app/projects/[id]/build-log/route");
    const formData = new FormData();
    formData.set("build_completed", "on");

    const response = await POST(new Request("http://localhost/projects/project-with-build-log/build-log", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-build-log" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-build-log?error=project_archived");
    expect(updateProjectBuildLogMock).not.toHaveBeenCalled();
  });

  it("uses a stable project-detail error key when build log save fails", async () => {
    updateProjectBuildLogMock.mockRejectedValueOnce(new Error("database build log stack detail"));
    const { POST } = await import("@/app/projects/[id]/build-log/route");
    const formData = new FormData();

    const response = await POST(new Request("http://localhost/projects/project-with-build-log/build-log", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-build-log" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-build-log?error=build_log_failed");
    expect(response.headers.get("location")).not.toContain("database");
  });
});
