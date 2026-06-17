import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const duplicateProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();
const getProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/storage/project-store", () => ({
  getProject: (projectId: string) => getProjectMock(projectId),
  duplicateProject: (projectId: string) => duplicateProjectMock(projectId),
}));

const duplicatedProject: Project = {
  id: "duplicated-project-id",
  created_at: new Date(1).toISOString(),
  updated_at: new Date(1).toISOString(),
  title: "Bathroom shelf copy",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "draft",
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

describe("duplicate project route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjectMock.mockResolvedValue({
      ...duplicatedProject,
      id: "source-project-id",
      title: "Bathroom shelf",
    });
  });

  it("duplicates the project and redirects to the new project detail page", async () => {
    duplicateProjectMock.mockResolvedValue(duplicatedProject);
    const { POST } = await import("@/app/projects/[id]/duplicate/route");

    const response = await POST(new Request("http://localhost/projects/source-project-id/duplicate", { method: "POST" }), {
      params: Promise.resolve({ id: "source-project-id" }),
    });

    expect(duplicateProjectMock).toHaveBeenCalledWith("source-project-id");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/duplicated-project-id?duplicated=1");
  });

  it("redirects to projects with an error when the source project is missing", async () => {
    getProjectMock.mockResolvedValue(null);
    const { POST } = await import("@/app/projects/[id]/duplicate/route");

    const response = await POST(new Request("http://localhost/projects/missing-project/duplicate", { method: "POST" }), {
      params: Promise.resolve({ id: "missing-project" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects?error=Project%20not%20found");
    expect(duplicateProjectMock).not.toHaveBeenCalled();
  });

  it("blocks archived source projects before duplicating", async () => {
    getProjectMock.mockResolvedValue({
      ...duplicatedProject,
      id: "source-project-id",
      archived_at: "2026-06-08T12:00:00.000Z",
    });
    const { POST } = await import("@/app/projects/[id]/duplicate/route");

    const response = await POST(new Request("http://localhost/projects/source-project-id/duplicate", { method: "POST" }), {
      params: Promise.resolve({ id: "source-project-id" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/source-project-id?error=project_archived");
    expect(duplicateProjectMock).not.toHaveBeenCalled();
  });

  it("maps a stale archived storage no-op to the archived source project error", async () => {
    getProjectMock
      .mockResolvedValueOnce({
        ...duplicatedProject,
        id: "source-project-id",
        title: "Bathroom shelf",
      })
      .mockResolvedValueOnce({
        ...duplicatedProject,
        id: "source-project-id",
        title: "Bathroom shelf",
        archived_at: "2026-06-08T12:00:00.000Z",
      });
    duplicateProjectMock.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/projects/[id]/duplicate/route");

    const response = await POST(new Request("http://localhost/projects/source-project-id/duplicate", { method: "POST" }), {
      params: Promise.resolve({ id: "source-project-id" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/source-project-id?error=project_archived");
    expect(duplicateProjectMock).toHaveBeenCalledWith("source-project-id");
  });

  it("uses a stable project-detail error key when duplication fails", async () => {
    duplicateProjectMock.mockRejectedValueOnce(new Error("database duplicate stack detail"));
    const { POST } = await import("@/app/projects/[id]/duplicate/route");

    const response = await POST(new Request("http://localhost/projects/source-project-id/duplicate", { method: "POST" }), {
      params: Promise.resolve({ id: "source-project-id" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/source-project-id?error=duplicate_failed");
    expect(response.headers.get("location")).not.toContain("database");
  });
});
