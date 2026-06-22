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
  height_inches: 0.75,
  depth_inches: 4,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  shelf_layout: "single_shelf",
  shelf_count: 1,
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted with brackets screwed into studs.",
  intended_use: "Decorative shelf for light display items.",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
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
      style_notes: "Review brackets and anchors before mounting into drywall studs; use a moisture-resistant finish and corrosion-resistant hardware.",
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

  it("gates needs-details projects before generation without saving a plan", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Bathroom shelf needing details",
      material_type: "unknown",
      tools_available: [],
      shelf_layout: "single_shelf",
      shelf_count: 1,
      intended_use: "Small bathroom shelf.",
      style_notes: "Wall mounted with brackets screwed into studs.",
    });
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=clarification_gate#plan-readiness",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("gates heavy garage shelf projects before generation when support-count and fastener details are missing", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Garage utility shelf",
      width_inches: 48,
      depth_inches: 14,
      shelf_layout: "single_shelf",
      shelf_count: 1,
      style_notes: "Wall mounted shelf with visible L brackets.",
      intended_use: "Garage shelf for storage bins and tools. Avoid electrical on this wall.",
    });
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=clarification_gate#plan-readiness",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("gates raised planter support concepts before generation", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Raised herb planter",
      project_type: "planter_box",
      width_inches: 36,
      height_inches: 18,
      depth_inches: 14,
      material_type: "cedar 1x6",
      shelf_layout: undefined,
      shelf_count: undefined,
      style_notes: "Raised planter box with legs and a support frame.",
      intended_use: "Outdoor herb planter standing off the ground.",
    });
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=clarification_gate#plan-readiness",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("gates blocked-for-safety projects before shelf repair or generation", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Baby crib rail",
      shelf_layout: undefined,
      shelf_count: undefined,
      intended_use: "Sleep surface for baby nursery.",
      style_notes: "",
    });
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=clarification_gate#plan-readiness",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("gates concept-only woodworking-adjacent projects before generation", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Built-in bookcase",
      project_type: "bookcase",
      intended_use: "Large built-in bookcase for living room storage.",
      style_notes: "",
    } as unknown as Project);
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=clarification_gate#plan-readiness",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).toHaveBeenCalledWith(project.id);
  });

  it("gates unsupported unrelated projects before generation", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Replace a bicycle chain",
      project_type: "bike_repair",
      intended_use: "Fix a bicycle drivetrain.",
      style_notes: "",
    } as unknown as Project);
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/blocked_generation_project?generation_error=clarification_gate#plan-readiness",
    );
    expect(generateStructuredProjectPlanMock).not.toHaveBeenCalled();
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

  it("does not mark failed when a project becomes archived before the generated plan can be saved", async () => {
    generateStructuredProjectPlanMock.mockResolvedValue({ modelName: "test-model", plan: {} });
    saveGeneratedPlanMock.mockRejectedValue(new Error("Project is archived. Restore it before saving a generated plan."));
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/blocked_generation_project?generation_error=archived");
    expect(generateStructuredProjectPlanMock).toHaveBeenCalled();
    expect(saveGeneratedPlanMock).toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).not.toHaveBeenCalled();
  });

  it("does not mark failed when Supabase reports an archived generated-plan save", async () => {
    generateStructuredProjectPlanMock.mockResolvedValue({ modelName: "test-model", plan: {} });
    saveGeneratedPlanMock.mockRejectedValue(
      new Error("Project 11111111-1111-4111-8111-111111111111 is archived or not found while saving generated plan"),
    );
    const { POST } = await import("@/app/projects/[id]/generate/route");

    const response = await POST(new Request("http://localhost/projects/blocked_generation_project/generate", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/blocked_generation_project?generation_error=archived");
    expect(generateStructuredProjectPlanMock).toHaveBeenCalled();
    expect(saveGeneratedPlanMock).toHaveBeenCalled();
    expect(markProjectGenerationFailedMock).not.toHaveBeenCalled();
  });
});
