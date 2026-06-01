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
  id: "print_preview_project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Print preview shelf",
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
};

const planRecord: GeneratedProjectPlanRecord = {
  id: "print_preview_plan",
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
  build_model_json: {
    ...simpleShelfBuildModelFixture,
    project: {
      ...simpleShelfBuildModelFixture.project,
      projectId: project.id,
    },
  },
  plan_markdown: "# test",
  validation_status: "valid",
  warnings: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  confidence_level: "low",
  is_latest: true,
};

describe("ProjectPrintPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the latest generated plan as a browser print preview from the printable manifest", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Browser print preview");
    expect(markup).toContain("Use your browser&#x27;s print dialog if you want a paper copy.");
    expect(markup).toContain("Review all dimensions, materials, and safety notes before building.");
    expect(markup).toContain("Plan Review");
    expect(markup).toContain("Export Readiness");
    expect(markup).toContain("Materials");
    expect(markup).toContain("Cut List Review");
    expect(markup).toContain("Operations and Build Steps");
    expect(markup).toContain("Planning-aid disclaimers");
    expect(markup).toContain("Future export notes");
    expect(markup).toContain("No export, CAD, CNC, PDF, SVG, or DXF output is generated here.");
    expect(markup).toContain('href="/projects/print_preview_project"');
    expect(markup).toContain("Back to project");
  });

  it("shows a calm print-preview empty state when no generated plan exists", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("No generated plan to print yet");
    expect(markup).toContain("Generate and validate a plan before using browser print preview.");
    expect(markup).not.toContain("Download");
  });
});
