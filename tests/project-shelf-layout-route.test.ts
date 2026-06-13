import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project, ProjectShelfLayoutUpdate } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const updateProjectShelfLayoutMock = vi.fn<(projectId: string, input: ProjectShelfLayoutUpdate) => Promise<Project | null>>();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/storage/project-store", () => ({
  updateProjectShelfLayout: (projectId: string, input: ProjectShelfLayoutUpdate) => updateProjectShelfLayoutMock(projectId, input),
}));

const updatedProject: Project = {
  id: "project-with-shelf-layout",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(1).toISOString(),
  title: "Shelf layout project",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 24,
  height_inches: 60,
  depth_inches: 8,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  shelf_layout: "multi_shelf_unit",
  shelf_count: 3,
  shelf_spacing_inches: 12,
  tools_available: ["tape_measure", "pencil"],
  style_notes: "",
  intended_use: "Light shelf unit.",
  safety_review_required: false,
  safety_flags: [],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

describe("project shelf layout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves shelf layout details and redirects back to project intake", async () => {
    updateProjectShelfLayoutMock.mockResolvedValue(updatedProject);
    const { POST } = await import("@/app/projects/[id]/shelf-layout/route");
    const formData = new FormData();
    formData.set("shelf_layout", "multi_shelf_unit");
    formData.set("shelf_count", "3");
    formData.set("shelf_spacing_inches", "12");
    formData.set("height_inches", "60");

    const response = await POST(new Request("http://localhost/projects/project-with-shelf-layout/shelf-layout", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-shelf-layout" }),
    });

    expect(updateProjectShelfLayoutMock).toHaveBeenCalledWith("project-with-shelf-layout", {
      shelf_layout: "multi_shelf_unit",
      shelf_count: 3,
      shelf_spacing_inches: 12,
      height_inches: 60,
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-shelf-layout?shelf_layout=updated#project-intake");
  });

  it("redirects safely when shelf layout validation fails", async () => {
    const { POST } = await import("@/app/projects/[id]/shelf-layout/route");
    const formData = new FormData();
    formData.set("shelf_layout", "multi_shelf_unit");
    formData.set("shelf_count", "");

    const response = await POST(new Request("http://localhost/projects/project-with-shelf-layout/shelf-layout", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-shelf-layout" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-shelf-layout?error=shelf_layout_invalid#project-intake");
    expect(updateProjectShelfLayoutMock).not.toHaveBeenCalled();
  });

  it("redirects to a schema-specific error when storage reports missing shelf layout columns", async () => {
    updateProjectShelfLayoutMock.mockRejectedValue(new Error("Could not find the 'shelf_layout' column of 'projects' in the schema cache"));
    const { POST } = await import("@/app/projects/[id]/shelf-layout/route");
    const formData = new FormData();
    formData.set("shelf_layout", "multi_shelf_unit");
    formData.set("shelf_count", "3");

    const response = await POST(new Request("http://localhost/projects/project-with-shelf-layout/shelf-layout", { method: "POST", body: formData }), {
      params: Promise.resolve({ id: "project-with-shelf-layout" }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/project-with-shelf-layout?error=shelf_layout_schema_missing#project-intake");
  });
});
