import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const generateStructuredProjectPlanMock = vi.fn<() => Promise<unknown>>();
const saveGeneratedPlanMock = vi.fn<(...args: unknown[]) => Promise<unknown>>();

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
  getProject: vi.fn(() => Promise.resolve(project)),
  saveGeneratedPlan: (...args: unknown[]) => saveGeneratedPlanMock(...args),
}));

describe("generate plan route feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });
});
