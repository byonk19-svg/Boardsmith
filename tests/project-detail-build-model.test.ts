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
  notes: "Try walnut stain and verify bracket screw length.",
  build_completed: true,
  build_completed_at: "2026-06-02",
  build_actual_material: "Poplar board with water-based finish.",
  build_plan_changes: "Used shorter screws and added a test finish offcut.",
  build_lessons_learned: "Dry fit brackets before final sanding next time.",
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
    materials: [
      { name: "3/4 inch pine board", quantity: "1 board", notes: "Inspect before cutting." },
      { name: "Water-based paint", quantity: "1 small can", notes: "Optional finish after sanding." },
    ],
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
    expect(markup).toContain("Template Guidance");
    expect(markup).toContain("Planning guidance, not a finished plan.");
    expect(markup).toContain("Project intake is what you entered.");
    expect(markup).toContain("AI-generated plan output appears after generation.");
    expect(markup).toContain("Plan Review and Export Readiness check the saved plan.");
    expect(markup).toContain("Wall mounting is likely.");
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
    expect(markup).toContain("Cut List Review");
    expect(markup).toContain("Total pieces");
    expect(markup).toContain("With dimensions");
    expect(markup).toContain("Needs review");
    expect(markup).toContain("Ready to review");
    expect(markup).toContain("Measure twice before cutting.");
    expect(markup).toContain("This is a planning aid, not a production cut file.");
    expect(markup).toContain("Primary materials");
    expect(markup).toContain("Hardware / fasteners");
    expect(markup).toContain("Finish / optional supplies");
    expect(markup).toContain("Material assumptions and review notes");
    expect(markup).toContain("Saved BBM pine board material");
    expect(markup).toContain("1 planned piece");
    expect(markup).toContain("0.75 in thickness");
    expect(markup).toContain("Water-based paint");
    expect(markup).toContain("Verify materials before purchasing or cutting.");
    expect(markup).toContain("Quantity to review for Wall anchors or stud fasteners.");
  });

  it("renders the latest generated plan as a printable plan sheet with review-focused groups", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Printable Plan Sheet");
    expect(markup).toContain("Planning aid");
    expect(markup).toContain("Review before building");
    expect(markup).toContain("Materials and Cut List");
    expect(markup).toContain("Verify all dimensions against your actual space, lumber, and hardware.");
    expect(markup).toContain("Build Steps and Operations");
    expect(markup).toContain("Assumptions and Open Questions");
    expect(markup).toContain("Use your own judgment before cutting or assembling.");
    expect(markup).toContain("Verify dimensions, materials, hardware, tool setup, and site conditions before cutting or building.");
    expect(markup).toContain("No export, CAD, CNC, PDF, SVG, or DXF output is generated here.");
    expect(markup).toContain("Future export notes");
    expect(markup).toContain("Exact bracket and fastener specifications are unknown.");
  });

  it("renders a read-only comparison between the latest plan and an older history version", async () => {
    const olderPlanRecord: GeneratedProjectPlanRecord = {
      ...planRecord,
      id: "plan_older_bbm",
      created_at: new Date(0).toISOString(),
      is_latest: false,
      build_model_json: null,
      plan_json: {
        ...planRecord.plan_json,
        project_summary: "An older wall shelf plan with fewer finishing details and manual mounting review before use.",
        materials: [{ name: "3/4 inch pine board", quantity: "1 board", notes: "Inspect before cutting." }],
        cut_list: [
          {
            ...planRecord.plan_json.cut_list[0],
            notes: "Older cut note.",
          },
        ],
        assembly_steps: [
          {
            ...planRecord.plan_json.assembly_steps[0],
            title: "Review mounting location",
          },
        ],
        safety_notes: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
        needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review."],
      },
    };
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord, olderPlanRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Plan comparison");
    expect(markup).toContain("Comparing latest plan with Version 1.");
    expect(markup).toContain("Changed");
    expect(markup).toContain("Project summary changed.");
    expect(markup).toContain("Material changes");
    expect(markup).toContain("Added Water-based paint");
    expect(markup).toContain("Cut list changes");
    expect(markup).toContain("Changed Shelf board");
    expect(markup).toContain("Review differences");
    expect(markup).toContain("Plan Review changed");
  });

  it("shows a calm comparison empty state when only one generated plan exists", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Plan comparison");
    expect(markup).toContain("Comparison will be available after another generated plan version exists.");
  });

  it("renders a simple build log form and saved completion details", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Build log");
    expect(markup).toContain("Record what actually happened during the real build.");
    expect(markup).toContain("Project was completed");
    expect(markup).toContain("Poplar board with water-based finish.");
    expect(markup).toContain("Used shorter screws and added a test finish offcut.");
    expect(markup).toContain("Dry fit brackets before final sanding next time.");
    expect(markup).toContain("This log is not an inspection, certification, load rating, or professional approval.");
  });

  it("links generated plans to the browser print preview page", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain('href="/projects/project_saved_bbm/print"');
    expect(markup).toContain("Browser print preview");
    expect(markup).toContain("Use your browser&#x27;s print dialog if you want a paper copy.");
  });

  it("renders a duplicate project action on the project detail page", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Duplicate project");
    expect(markup).toContain('action="/projects/project_saved_bbm/duplicate"');
    expect(markup).toContain('method="post"');
    expect(markup).toContain("Copies intake only. Generated plans and history are not copied.");
  });

  it("renders editable project notes without adding them to the printable plan sheet", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Project notes");
    expect(markup).toContain('action="/projects/project_saved_bbm/notes"');
    expect(markup).toContain('name="notes"');
    expect(markup).toContain("Try walnut stain and verify bracket screw length.");
    expect(markup).toContain("Notes stay with this project and are not used for AI generation or printable plans.");
    expect(markup).not.toContain("Printable Plan Sheet</p><h2 class=\"mt-2 text-2xl font-semibold tracking-tight text-ink\">Generated Plan</h2><p>Try walnut stain");
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
    expect(markup).not.toContain("Blocking issues");
  });

  it("shows calm blocked-generation feedback with safety-specific next steps", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      safety_flags: ["Wall mounting review", "Child or baby use"],
    });
    listGeneratedPlansMock.mockResolvedValue([]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ generation_error: "review_blocked" }),
      }),
    );

    expect(markup).toContain("Boardsmith generated a draft, but it did not pass review checks.");
    expect(markup).toContain("No plan was saved.");
    expect(markup).toContain("Boardsmith blocks drafts that fail validation or safety review before they can be saved.");
    expect(markup).toContain("For wall-mounted projects, verify studs or anchors, fasteners, wall structure, and expected load before trying again.");
    expect(markup).toContain("For child-adjacent projects, describe edge treatment, finish choice, supervision needs, mounting height, and inspection plans.");
    expect(markup).not.toContain("Generated plan failed deterministic quality checks");
  });
});
