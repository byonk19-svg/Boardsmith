import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { doorHangerBuildModelFixture, simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { createBuildModelDraft, type BuildModelDraftProject } from "@/lib/build-model/create-build-model-draft";
import type { GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

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
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

const planRecord: GeneratedProjectPlanRecord = {
  id: "print_preview_plan",
  project_id: project.id,
  created_at: new Date(1).toISOString(),
  model_name: "test-model",
  plan_json: {
    project_summary:
      "A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use. This extra sentence should stay out of the compressed print header.",
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

function buildDraftProject(overrides: Partial<BuildModelDraftProject> = {}): BuildModelDraftProject {
  return {
    id: overrides.id ?? "draft_diagram_project",
    title: overrides.title ?? "Draft diagram project",
    project_type: overrides.project_type ?? "simple_shelf",
    skill_level: overrides.skill_level ?? "beginner",
    width_inches: overrides.width_inches ?? 36,
    height_inches: overrides.height_inches ?? 6,
    depth_inches: overrides.depth_inches ?? 10,
    material_thickness_inches: overrides.material_thickness_inches ?? 0.75,
    material_type: overrides.material_type ?? "pine board",
    tools_available: overrides.tools_available ?? ["tape_measure", "pencil", "drill"],
    style_notes: overrides.style_notes ?? "",
    intended_use: overrides.intended_use ?? "Planning aid project.",
  };
}

describe("ProjectPrintPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the latest generated plan as a browser print plan from the printable manifest", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Browser print plan");
    expect(markup).toContain("Use your browser&#x27;s print dialog if you want a paper copy.");
    expect(markup).toContain("This MVP uses browser print only; no PDF or CAD download is generated.");
    expect(markup).toContain("Planning aid: verify dimensions, materials, hardware, and safety notes before building.");
    expect(markup).toContain("A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use.");
    expect(markup).not.toContain("This extra sentence should stay out of the compressed print header.");
    expect(markup).toContain("Build Snapshot");
    expect(markup).toContain("Difficulty");
    expect(markup).toContain("Time estimate");
    expect(markup).toContain("Overall dimensions");
    expect(markup).toContain("Main material");
    expect(markup).toContain("Major pieces");
    expect(markup).toContain("First check");
    expect(markup).not.toContain("Plan date");
    expect(markup).not.toContain("Cut list</dt>");
    expect(markup).not.toContain("Primary tools");
    expect(markup).toContain("Project Visuals");
    expect(markup).toContain("Check Before Building");
    expect(markup).toContain("Review wall mounting details.");
    expect(markup).toContain("Review safety-trigger notes.");
    expect(markup).toContain("Check-list markers are for paper or shop review only; nothing is saved.");
    expect(markup.indexOf("Verify hardware and fasteners before assembly.")).toBeGreaterThan(markup.indexOf("Review Appendix"));
    expect(markup).not.toContain('name="plan_action_');
    expect(markup).not.toContain("Review child-adjacent or load-related safety flags.");
    expect(markup).toContain("Planning diagram — not to scale");
    expect(markup).toContain("Project anatomy");
    expect(markup).toContain("print:h-52");
    expect(markup).not.toContain("print:h-60");
    expect(markup).toContain("Width 36 in");
    expect(markup).toContain("Height 6 in");
    expect(markup).toContain("Depth 10 in");
    expect(markup).toContain("Material thickness 0.75 in");
    expect(markup).not.toContain("Shelf board overview");
    expect(markup).not.toContain("Shelf board piece relationship");
    expect(markup).toContain("Three-view planning diagram");
    expect(markup).toContain("Front view");
    expect(markup).toContain("Top view");
    expect(markup).toContain("Side view");
    expect(markup).toContain("Visual piece inventory - planning aid only.");
    expect(markup.split("Planning diagram — not to scale").length - 1).toBe(1);
    expect(markup).toContain("Materials and Parts");
    expect(markup).toContain("Materials to gather");
    expect(markup).toContain("Pieces to identify");
    expect(markup).toContain("1 - 36 in x 10 in x 0.75 in");
    expect(markup).not.toContain("Plan material:");
    expect(markup).not.toContain("Material checks");
    expect(markup).toContain("Cut Checklist");
    expect(markup).toContain("Scroll sideways to review all cut-list columns.");
    expect(markup).toContain("Cut?");
    expect(markup).toContain("Check");
    expect(markup).toContain("Build Guide");
    expect(markup).toContain("Step 1");
    expect(markup).toContain("Inspect / review");
    expect(markup).toContain("Do this");
    expect(markup).toContain("Tools");
    expect(markup).toContain("drill");
    expect(markup).toContain("Pieces");
    expect(markup).toContain("Shelf board");
    expect(markup).not.toContain("Do not rely on Boardsmith for load ratings.");
    expect(markup).not.toContain("Modeled step");
    expect(markup).not.toContain("Modeled operations");
    expect(markup).not.toContain("15 min");
    expect(markup).toContain("Review Appendix");
    expect(markup).toContain("Additional checklist notes");
    expect(markup).toContain("Plan review summary");
    expect(markup).toContain("Review triggers");
    expect(markup).toContain("Conservative review triggers are not confirmed hazards.");
    expect(markup).toContain("Safety-sensitive wording can trigger review even when the project excludes that use.");
    expect(markup).toContain("Planning-aid reminders");
    expect(markup).toContain("This MVP uses browser print only; no PDF or CAD download is generated.");
    expect(markup).not.toContain("Export Readiness");
    expect(markup).not.toContain("Future export notes");
    expect(markup).not.toContain("Operations and Build Steps");
    expect(markup).not.toContain("Build model");
    expect(markup).not.toContain("Confidence");
    expect(markup).not.toContain("test-model");
    expect(markup).not.toContain("CAD-ready");
    expect(markup).not.toContain("CNC-ready");
    expect(markup).not.toContain("DXF-ready");
    expect(markup).not.toContain("SVG export");
    expect(markup).not.toContain("PDF generated");
    expect(markup).not.toContain("Download");
    expect(markup).not.toContain("fabrication-ready");
    expect(markup).not.toContain("approved");
    expect(markup).not.toContain("structural approval");
    expect(markup).not.toContain("construction approval");
    expect(markup).toContain('href="/projects/print_preview_project"');
    expect(markup).toContain("Back to project");

    const sectionOrder = [
      "Build Snapshot",
      "Project Visuals",
      "Check Before Building",
      "Materials and Parts",
      "Cut Checklist",
      "Build Guide",
      "Review Appendix",
    ];
    const sectionIndexes = sectionOrder.map((label) => markup.indexOf(label));
    expect(sectionIndexes.every((index) => index >= 0)).toBe(true);
    expect(sectionIndexes).toEqual([...sectionIndexes].sort((a, b) => a - b));
  });

  it("renders book ledge planning diagram labels when supported pieces exist", async () => {
    const bookLedgeProject: Project = {
      ...project,
      title: "Toddler book ledge",
      style_notes: "Simple book ledge with bottom shelf board, back rail, and front lip.",
      intended_use: "Book ledge for child-adjacent room with adult review.",
    };
    const buildModel = createBuildModelDraft(buildDraftProject(bookLedgeProject));
    getProjectMock.mockResolvedValue(bookLedgeProject);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        build_model_json: buildModel,
        plan_json: {
          ...planRecord.plan_json,
          project_summary: "A cautious book ledge plan with adult review before building.",
        },
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).not.toContain("Book ledge overview");
    expect(markup).not.toContain("Book ledge piece relationship");
    expect(markup).toContain("How pieces connect");
    expect(markup).toContain("Connection planning aid");
    expect(markup).toContain("Verify hardware and fasteners before building.");
    expect(markup).toContain("Front lip → screw with Wood screws → Bottom shelf board");
    expect(markup).toContain("Back rail → screw with Wood screws → Bottom shelf board");
    expect(markup).toContain("Needs manual review");
    expect(markup).toContain("Review unresolved questions.");
    expect(markup).toContain("Review finish and drying details.");
    expect(markup).toContain("Bottom shelf board");
    expect(markup).toContain("Back rail");
    expect(markup).toContain("Front lip");
  });

  it("keeps browser print plan available for archived projects", async () => {
    getProjectMock.mockResolvedValue({ ...project, archived_at: "2026-06-06T10:00:00.000Z" });
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Browser print plan");
    expect(markup).toContain("Build Snapshot");
    expect(markup).toContain("Project Visuals");
    expect(markup).toContain("Cut Checklist");
    expect(markup).not.toMatch(/deleted|delete project/i);
  });

  it("renders planter box planning diagram labels when supported pieces exist", async () => {
    const planterProject: Project = {
      ...project,
      title: "Outdoor planter box",
      project_type: "planter_box",
      height_inches: 8,
      depth_inches: 8,
      material_type: "cedar board",
      intended_use: "Outdoor herb planter box.",
    };
    const buildModel = createBuildModelDraft(buildDraftProject(planterProject));
    getProjectMock.mockResolvedValue(planterProject);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        build_model_json: buildModel,
        plan_json: {
          ...planRecord.plan_json,
          project_type: "planter_box",
          project_summary: "A cautious planter box plan with drainage and outdoor exposure review.",
        },
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).not.toContain("Planter box overview");
    expect(markup).not.toContain("Planter box piece relationship");
    expect(markup).toContain("How pieces connect");
    expect(markup).toContain("Front panel → screw with Outdoor-rated screws → Bottom panel");
    expect(markup).toContain("Back panel → screw with Outdoor-rated screws → Bottom panel");
    expect(markup).toContain("Verify before building");
    expect(markup).toContain("Review unresolved questions.");
    expect(markup).toContain("Review finish and drying details.");
    expect(markup).toContain("Front panel");
    expect(markup).toContain("Back panel");
    expect(markup).toContain("Bottom panel");
  });

  it("renders a connection fallback when a supported project has no modeled connections", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        build_model_json: {
          ...simpleShelfBuildModelFixture,
          connections: [],
        },
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("How pieces connect");
    expect(markup).toContain("No modeled connections available yet. Review the build steps before assembling.");
    expect(markup.split("Planning diagram — not to scale").length - 1).toBe(1);
  });

  it("renders the planning diagram fallback for unsupported project shapes", async () => {
    const doorHangerProject: Project = {
      ...project,
      title: "Round door hanger",
      project_type: "door_hanger",
      depth_inches: 0,
      material_thickness_inches: 0.25,
      material_type: "plywood",
      intended_use: "Indoor seasonal door decoration.",
    };
    getProjectMock.mockResolvedValue(doorHangerProject);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        build_model_json: doorHangerBuildModelFixture,
        plan_json: {
          ...planRecord.plan_json,
          project_type: "door_hanger",
          project_summary: "A cautious door hanger plan.",
        },
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Project Visuals");
    expect(markup).toContain("No diagram available yet. Review the cut list and build steps before building.");
    expect(markup).toContain("Three-view diagram is not available yet. Review the cut list and build guide before building.");
    expect(markup).toContain("Visual piece inventory - planning aid only.");
    expect(markup).not.toContain("Download");
    expect(markup).not.toContain("CAD-ready");
    expect(markup).not.toContain("CNC-ready");
    expect(markup).not.toContain("construction approval");
  });

  it("renders ambiguous build steps as calm generic cards without invented pieces", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        build_model_json: {
          ...simpleShelfBuildModelFixture,
          operations: [],
        },
        plan_json: {
          ...planRecord.plan_json,
          assembly_steps: [
            {
              ...planRecord.plan_json.assembly_steps[0],
              title: "Think through the plan",
              instructions: "Read the plan and pause if anything is unclear.",
              tools_used: ["pencil"],
              safety_note: null,
              estimated_time_minutes: null,
            },
          ],
        },
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Think through the plan");
    expect(markup).toContain("Build step");
    expect(markup).toContain("pencil");
    expect(markup).not.toContain("Modeled step");
  });

  it("renders the safe default action checklist when no specific review issues are found", async () => {
    const lowIssueBuildModel = {
      ...simpleShelfBuildModelFixture,
      hardware: [],
      connections: [],
      safety: {
        reviewRequired: false,
        flags: [],
        disclaimers: [],
      },
      unresolvedQuestions: [],
      assumptions: [],
      confidence: {
        level: "high" as const,
        reasons: ["Dimensions and material are known for review."],
      },
    };
    getProjectMock.mockResolvedValue({
      ...project,
      safety_review_required: false,
      safety_flags: [],
    });
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        build_model_json: lowIssueBuildModel,
        plan_json: {
          ...planRecord.plan_json,
          safety_notes: [],
          assumptions: [],
          needs_review_flags: [],
          svg_readiness_notes: [],
          confidence_level: "high",
          cut_list: [
            {
              ...planRecord.plan_json.cut_list[0],
              notes: "",
            },
          ],
        },
        confidence_level: "high",
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Check Before Building");
    expect(markup).toContain("Verify dimensions against the real space and material.");
    expect(markup).toContain("Review tool safety and material condition.");
    expect(markup).toContain("Dry fit before final assembly.");
    expect(markup).toContain("Review before cutting or mounting.");
    expect(markup).not.toContain("load-rated");
    expect(markup).not.toContain("structural approval");
    expect(markup).not.toContain("CAD-ready");
    expect(markup).not.toContain("CNC-ready");
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
    expect(markup).toContain("Generate and validate a plan before using the browser print plan.");
    expect(markup).not.toContain("Download");
  });
});
