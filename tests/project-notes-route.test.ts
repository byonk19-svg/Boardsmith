import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const updateProjectNotesMock = vi.fn<(projectId: string, notes: string) => Promise<Project | null>>();
const getProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/storage/project-store", () => ({
  getProject: (projectId: string) => getProjectMock(projectId),
  updateProjectNotes: (projectId: string, notes: string) => updateProjectNotesMock(projectId, notes),
}));

const updatedProject: Project = {
  id: "project-with-notes",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(1).toISOString(),
  title: "Shelf with notes",
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
  notes: "Confirm screw length.",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

describe("project notes route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjectMock.mockResolvedValue(updatedProject);
  });

  it("saves notes and redirects back to the project detail page", async () => {
    updateProjectNotesMock.mockResolvedValue(updatedProject);
    const { POST } = await import("@/app/projects/[id]/notes/route");
    const formData = new FormData();
    formData.set("notes", "Confirm screw length.");

    const response = await POST(new Request("http://localhost/projects/project-with-notes/notes", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-notes" }),
    });

    expect(updateProjectNotesMock).toHaveBeenCalledWith("project-with-notes", "Confirm screw length.");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-notes?notes=updated");
  });

  it("redirects with an error if the project is missing", async () => {
    getProjectMock.mockResolvedValue(null);
    const { POST } = await import("@/app/projects/[id]/notes/route");
    const formData = new FormData();
    formData.set("notes", "Confirm screw length.");

    const response = await POST(new Request("http://localhost/projects/missing/notes", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects?error=Project%20not%20found");
    expect(updateProjectNotesMock).not.toHaveBeenCalled();
  });

  it("blocks archived projects before saving notes", async () => {
    getProjectMock.mockResolvedValue({ ...updatedProject, archived_at: "2026-06-08T12:00:00.000Z" });
    const { POST } = await import("@/app/projects/[id]/notes/route");
    const formData = new FormData();
    formData.set("notes", "Try to write after archive.");

    const response = await POST(new Request("http://localhost/projects/project-with-notes/notes", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-notes" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-notes?error=project_archived");
    expect(updateProjectNotesMock).not.toHaveBeenCalled();
  });

  it("uses a stable project-detail error key when notes fail to save", async () => {
    updateProjectNotesMock.mockRejectedValueOnce(new Error("database notes stack detail"));
    const { POST } = await import("@/app/projects/[id]/notes/route");
    const formData = new FormData();
    formData.set("notes", "Confirm screw length.");

    const response = await POST(new Request("http://localhost/projects/project-with-notes/notes", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-notes" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-notes?error=notes_failed");
    expect(response.headers.get("location")).not.toContain("database");
  });
});
