import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const generateStructuredProjectPlanMock = vi.fn<() => Promise<unknown>>();
const saveGeneratedPlanMock = vi.fn<(...args: unknown[]) => Promise<unknown>>();
const getProjectMock = vi.fn<() => Promise<Project | null>>();
const markProjectGenerationFailedMock = vi.fn<(projectId: string) => Promise<Project | null>>();

const project: Project = {
  id: "blocked_generation_project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Blocked shelf project",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "draft",
  width_inches: 24,
  height_inches: 4,
  depth_inches: 4,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Toddler book ledge",
  safety_review_required: true,
  safety_flags: ["Wall mounting review", "Child or baby use"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/ai/generate-project-plan", () => ({
  generateStructuredProjectPlan: () => generateStructuredProjectPlanMock(),
}));

vi.mock("@/lib/storage/project-store", () => ({
  getProject: () => getProjectMock(),
  markProjectGenerationFailed: (projectId: string) => markProjectGenerationFailedMock(projectId),
  saveGeneratedPlan: (...args: unknown[]) => saveGeneratedPlanMock(...args),
}));

describe("generate plan route feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjectMock.mockResolvedValue(project);
  });

  it("blocks multi-shelf wording without a shelf count before generation", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Multiple shelf wall hanging",
      height_inches: 60,
      depth_inches: 6,
      shelf_layout: "multi_shelf_unit",
      shelf_count: undefined,
      intended_use: "Bathroom wall storage for towels.",
      style_notes: "",
    });
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=shelf_layout_missing#project-intake",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("blocks impossible multi-shelf height before generation", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Bathroom shelf with 5 shelves",
      width_inches: 23,
      height_inches: 0.1,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      shelf_layout: "multi_shelf_unit",
      shelf_count: 5,
      intended_use: "Indoor bathroom shelf unit.",
      style_notes: "",
    });
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=shelf_layout_invalid#project-intake",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("does not treat multiple separate shelves as an impossible connected shelf unit", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Five separate bathroom wall shelves",
      width_inches: 12,
      height_inches: 0.75,
      depth_inches: 6,
      material_thickness_inches: 0.75,
      shelf_layout: "multiple_separate_shelves",
      shelf_count: 5,
      intended_use: "Five separate wall shelves for light towels.",
      style_notes: "Review brackets and anchors before mounting.",
    });
    generateStructuredProjectPlanMock.mockRejectedValue(new Error("Hosted model unavailable in this route preflight test."));
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/blocked_generation_project?generation_error=generation_failed");
    expect(generateStructuredProjectPlanMock).toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("does not generate a new plan version for archived projects", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      archived_at: "2026-06-08T12:00:00.000Z",
    });
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/blocked_generation_project?generation_error=archived");
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).not.toHaveBeenCalled();
  });

  it("redirects blocked deterministic review failures to a safe feedback state without saving", async () => {
    generateStructuredProjectPlanMock.mockRejectedValue(
      new Error("Generated plan failed deterministic quality checks: Plan makes a safety claim Boardsmith cannot verify."),
    );
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/blocked_generation_project?generation_error=review_blocked");
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });
});
