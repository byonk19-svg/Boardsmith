import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const archiveProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();
const restoreProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/storage/project-store", () => ({
  archiveProject: (projectId: string) => archiveProjectMock(projectId),
  restoreProject: (projectId: string) => restoreProjectMock(projectId),
}));

const project: Project = {
  id: "archive-project-id",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(1).toISOString(),
  title: "Archive shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 24,
  height_inches: 8,
  depth_inches: 7,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Light bathroom shelf",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

describe("project archive routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archives the project and redirects back to the project list by default", async () => {
    archiveProjectMock.mockResolvedValue({ ...project, archived_at: new Date(2).toISOString() });
    const { POST } = await import("@/app/projects/[id]/archive/route");

    const response = await POST(new Request("http://localhost/projects/archive-project-id/archive", { method: "POST" }), {
      params: Promise.resolve({ id: "archive-project-id" }),
    });

    expect(archiveProjectMock).toHaveBeenCalledWith("archive-project-id");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects?archived=1");
  });

  it("archives and restores from project detail without leaving the detail page", async () => {
    archiveProjectMock.mockResolvedValue({ ...project, archived_at: new Date(2).toISOString() });
    restoreProjectMock.mockResolvedValue(project);
    const archiveFormData = new FormData();
    archiveFormData.set("return_to", "project_detail");
    const restoreFormData = new FormData();
    restoreFormData.set("return_to", "project_detail");
    const { POST: archivePost } = await import("@/app/projects/[id]/archive/route");
    const { POST: restorePost } = await import("@/app/projects/[id]/restore/route");

    const archiveResponse = await archivePost(new Request("http://localhost/projects/archive-project-id/archive", { method: "POST", body: archiveFormData }), {
      params: Promise.resolve({ id: "archive-project-id" }),
    });
    const restoreResponse = await restorePost(new Request("http://localhost/projects/archive-project-id/restore", { method: "POST", body: restoreFormData }), {
      params: Promise.resolve({ id: "archive-project-id" }),
    });

    expect(archiveResponse.status).toBe(303);
    expect(archiveResponse.headers.get("location")).toBe("http://localhost/projects/archive-project-id?archived=1");
    expect(restoreResponse.status).toBe(303);
    expect(restoreResponse.headers.get("location")).toBe("http://localhost/projects/archive-project-id?restored=1");
  });

  it("restores the project and redirects to the archived filter when requested from the list", async () => {
    restoreProjectMock.mockResolvedValue(project);
    const formData = new FormData();
    formData.set("return_to", "archived_list");
    const { POST } = await import("@/app/projects/[id]/restore/route");

    const response = await POST(new Request("http://localhost/projects/archive-project-id/restore", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "archive-project-id" }),
    });

    expect(restoreProjectMock).toHaveBeenCalledWith("archive-project-id");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects?archive=archived&restored=1");
  });

  it("redirects with a calm error when archive or restore cannot find the project", async () => {
    archiveProjectMock.mockResolvedValue(null);
    restoreProjectMock.mockResolvedValue(null);
    const { POST: archivePost } = await import("@/app/projects/[id]/archive/route");
    const { POST: restorePost } = await import("@/app/projects/[id]/restore/route");

    const archiveResponse = await archivePost(new Request("http://localhost/projects/missing/archive", { method: "POST" }), {
      params: Promise.resolve({ id: "missing" }),
    });
    const restoreResponse = await restorePost(new Request("http://localhost/projects/missing/restore", { method: "POST" }), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(archiveResponse.headers.get("location")).toBe("http://localhost/projects?error=Project%20not%20found");
    expect(restoreResponse.headers.get("location")).toBe("http://localhost/projects?error=Project%20not%20found");
  });
});
