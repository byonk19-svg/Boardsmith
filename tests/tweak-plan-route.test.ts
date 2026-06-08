import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const generateRevisedStructuredProjectPlanMock = vi.fn<
  (args: { project: Project; buildModel: BoardsmithBuildModel; latestPlan: GeneratedProjectPlanRecord; revisionInstruction: string }) => Promise<{
    modelName: string;
    plan: GeneratedPlan;
  }>
>();
const getProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();
const listGeneratedPlansMock = vi.fn<(projectId: string) => Promise<GeneratedProjectPlanRecord[]>>();
const saveGeneratedPlanMock = vi.fn<(...args: unknown[]) => Promise<unknown>>();

const project: Project = {
  id: "revision-project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Revision shelf project",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 36,
  height_inches: 6,
  depth_inches: 10,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Decorative wall shelf for light objects",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

const plan: GeneratedPlan = {
  project_summary: "A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 36,
    height_inches: 6,
    depth_inches: 10,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "3/4 inch pine board", quantity: "1 board", notes: "Inspect before cutting." }],
  tools: ["tape measure", "pencil", "drill"],
  cut_list: [
    {
      part_name: "Shelf board",
      quantity: 1,
      length_inches: 36,
      width_inches: 10,
      thickness_inches: 0.75,
      material: "pine board",
      notes: "No load rating is implied.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review mounting",
      instructions: "Review wall structure, anchors, and fasteners before drilling.",
      tools_used: ["drill"],
      safety_note: "Boardsmith cannot verify wall structure, anchors, fasteners, or load capacity.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand and finish according to product labels."],
  safety_notes: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  needs_review_flags: ["Wall mounting review"],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["No export output is generated."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

const latestPlan: GeneratedProjectPlanRecord = {
  id: "prior-latest-plan",
  project_id: project.id,
  created_at: new Date(1).toISOString(),
  model_name: "test-model",
  plan_json: plan,
  build_model_json: simpleShelfBuildModelFixture,
  plan_markdown: "# test",
  validation_status: "valid",
  warnings: plan.safety_notes,
  assumptions: plan.assumptions,
  confidence_level: plan.confidence_level,
  is_latest: true,
};

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/ai/generate-project-plan", () => ({
  generateRevisedStructuredProjectPlan: (args: {
    project: Project;
    buildModel: BoardsmithBuildModel;
    latestPlan: GeneratedProjectPlanRecord;
    revisionInstruction: string;
  }) => generateRevisedStructuredProjectPlanMock(args),
}));

vi.mock("@/lib/storage/project-store", () => ({
  getProject: (projectId: string) => getProjectMock(projectId),
  listGeneratedPlans: (projectId: string) => listGeneratedPlansMock(projectId),
  saveGeneratedPlan: (...args: unknown[]) => saveGeneratedPlanMock(...args),
}));

function revisionRequest(instruction: string): Request {
  const body = new URLSearchParams();
  body.set("revision_instruction", instruction);
  return new Request("http://localhost/projects/revision-project/revise", { method: "POST", body });
}

describe("tweak plan route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([latestPlan]);
    generateRevisedStructuredProjectPlanMock.mockResolvedValue({ modelName: "test-revision-model", plan });
    saveGeneratedPlanMock.mockResolvedValue({ ...latestPlan, id: "new-revised-plan", plan_json: plan, is_latest: true });
  });

  it("saves a revised plan as a new version and redirects to comparison with the prior latest plan", async () => {
    const { POST } = await import("@/app/projects/[id]/revise/route");

    const response = await POST(revisionRequest("Make the steps easier for a beginner."), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/projects/revision-project?revised=1&compare_plan=prior-latest-plan");
    expect(generateRevisedStructuredProjectPlanMock).toHaveBeenCalledWith({
      project,
      buildModel: simpleShelfBuildModelFixture,
      latestPlan,
      revisionInstruction: "Make the steps easier for a beginner.",
    });
    expect(saveGeneratedPlanMock).toHaveBeenCalledWith({
      projectId: project.id,
      modelName: "test-revision-model",
      plan,
      buildModel: simpleShelfBuildModelFixture,
    });
    expect(latestPlan.is_latest).toBe(true);
  });

  it("does not call generation or save for empty and overlong revision notes", async () => {
    const { POST } = await import("@/app/projects/[id]/revise/route");

    const emptyResponse = await POST(revisionRequest("   "), {
      params: Promise.resolve({ id: project.id }),
    });
    const longResponse = await POST(revisionRequest("x".repeat(501)), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(emptyResponse.headers.get("location")).toBe("http://localhost/projects/revision-project?revision_error=empty");
    expect(longResponse.headers.get("location")).toBe("http://localhost/projects/revision-project?revision_error=too_long");
    expect(generateRevisedStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
  });

  it("does not save when revised generation fails validation", async () => {
    generateRevisedStructuredProjectPlanMock.mockRejectedValue(new Error("Generated plan failed validation: invalid plan"));
    const { POST } = await import("@/app/projects/[id]/revise/route");

    const response = await POST(revisionRequest("Reduce the number of cuts."), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(response.headers.get("location")).toBe("http://localhost/projects/revision-project?generation_error=validation_failed");
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
  });

  it("does not revise archived projects or projects with no latest plan", async () => {
    const { POST } = await import("@/app/projects/[id]/revise/route");

    getProjectMock.mockResolvedValueOnce({ ...project, archived_at: "2026-06-08T12:00:00.000Z" });
    const archivedResponse = await POST(revisionRequest("Make it easier."), {
      params: Promise.resolve({ id: project.id }),
    });

    getProjectMock.mockResolvedValueOnce(project);
    listGeneratedPlansMock.mockResolvedValueOnce([]);
    const noPlanResponse = await POST(revisionRequest("Make it easier."), {
      params: Promise.resolve({ id: project.id }),
    });

    expect(archivedResponse.headers.get("location")).toBe("http://localhost/projects/revision-project?revision_error=archived");
    expect(noPlanResponse.headers.get("location")).toBe("http://localhost/projects/revision-project?revision_error=no_plan");
    expect(generateRevisedStructuredProjectPlanMock).not.toHaveBeenCalled();
    expect(saveGeneratedPlanMock).not.toHaveBeenCalled();
  });
});
