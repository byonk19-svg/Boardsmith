import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

const getProjectMock = vi.fn<(projectId: string) => Promise<Project | null>>();
const listGeneratedPlansMock = vi.fn<(projectId: string) => Promise<GeneratedProjectPlanRecord[]>>();

vi.mock("@/lib/storage/project-store", () => ({
  getProject: (projectId: string) => getProjectMock(projectId),
  listGeneratedPlans: (projectId: string) => listGeneratedPlansMock(projectId),
}));

const project: Project = {
  id: "project_saved_bbm",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Saved shelf project",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 36,
  height_inches: 6,
  depth_inches: 10,
  material_thickness_inches: 0.75,
  material_type: "fresh intake material",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Decorative wall shelf for light objects",
  safety_review_required: true,
  safety_flags: ["Wall mounting review", "Heavy shelving review"],
};

const storedBuildModel = {
  ...simpleShelfBuildModelFixture,
  project: {
    ...simpleShelfBuildModelFixture.project,
    projectId: project.id,
  },
  materials: [
    {
      ...simpleShelfBuildModelFixture.materials[0],
      id: "saved_material",
      label: "Saved BBM pine board material",
    },
  ],
  pieces: simpleShelfBuildModelFixture.pieces.map((piece) => ({ ...piece, materialId: "saved_material" })),
};

const planRecord: GeneratedProjectPlanRecord = {
  id: "plan_saved_bbm",
  project_id: project.id,
  created_at: new Date(1).toISOString(),
  model_name: "test-model",
  plan_json: {
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
        safety_note: "Do not rely on Boardsmith for load ratings.",
        estimated_time_minutes: 15,
      },
    ],
    finishing_steps: ["Sand and finish according to product labels."],
    safety_notes: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
    assumptions: ["Light decorative use unless reviewed by the builder."],
    needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review."],
    beginner_tips: ["Measure twice before cutting."],
    svg_readiness_notes: ["Mounting geometry is unresolved."],
    estimated_difficulty: "moderate",
    estimated_time: "1-2 hours",
    confidence_level: "low",
  },
  build_model_json: storedBuildModel,
  plan_markdown: "# test",
  validation_status: "valid",
  warnings: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  confidence_level: "low",
  is_latest: true,
};

describe("ProjectDetailPage project structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the latest saved build model instead of re-deriving project structure", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("A deterministic planning model saved with the latest generated plan.");
    expect(markup).toContain("Saved BBM pine board material");
    expect(markup).toContain("Plan Review");
    expect(markup).toContain("Review: Blocked");
    expect(markup).toContain("Export Readiness");
    expect(markup).toContain("This checks whether the saved plan structure is ready for future printable, SVG, or PDF polish.");
    expect(markup).toContain("No export files are generated here.");
  });

  it("renders a read-only material summary from the displayed build model", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Material Summary");
    expect(markup).toContain("Saved BBM pine board material");
    expect(markup).toContain("1 planned piece");
    expect(markup).toContain("0.75 in thickness");
  });

  it("falls back to a derived project structure for older generated plans without saved build models", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([{ ...planRecord, build_model_json: null }]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("A deterministic planning model derived from the project intake.");
    expect(markup).toContain("fresh intake material");
    expect(markup).toContain("Review uses a derived project structure because this plan version did not store a build model.");
    expect(markup).toContain("Future export work should use a generated plan with stored build-model JSON.");
  });

  it("shows a calm empty review state before any plan is generated", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("No generated plan yet");
    expect(markup).toContain("Generate a plan to see Boardsmith&#x27;s review checks.");
    expect(markup).not.toContain("Plan Review");
  });
});
