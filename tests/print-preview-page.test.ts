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

  it("renders the latest generated plan as a print build sheet from the printable manifest", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Print build sheet");
    expect(markup).toContain("Use the button to open your browser print dialog, or use your browser&#x27;s print command.");
    expect(markup).toContain("Boardsmith does not generate PDF, CAD, CNC, or export/download files.");
    expect(markup).toContain("Print build sheet");
    expect(markup).toContain("Opens the browser print dialog only.");
    expect(markup).toContain('class="no-print mb-6');
    expect(markup).toContain("Planning aid: verify dimensions, materials, hardware, and safety notes before building.");
    expect(markup).toContain("A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use.");
    expect(markup).not.toContain("This extra sentence should stay out of the compressed print header.");
    expect(markup).toContain("Build Snapshot");
    expect(markup).toContain("Difficulty");
    expect(markup).toContain("Time estimate");
    expect(markup).toContain("Shelf width");
    expect(markup).toContain("Shelf depth from wall");
    expect(markup).toContain("Board thickness");
    expect(markup).not.toContain("Overall dimensions");
    expect(markup).toContain("Main material");
    expect(markup).toContain("Major pieces");
    expect(markup).toContain("First check");
    expect(markup).not.toContain("Plan date");
    expect(markup).not.toContain("Cut list</dt>");
    expect(markup).not.toContain("Primary tools");
    expect(markup).toContain("Project Visuals / Diagrams");
    expect(markup).toContain("Plan Readiness / Next Actions");
    expect(markup).toContain("Hero Visual");
    expect(markup).toContain("Build-model hero visual - planning aid only.");
    expect(markup).toContain("Main project visual from structured plan data.");
    expect(markup.indexOf("Plan Readiness / Next Actions")).toBeGreaterThan(markup.indexOf("Build Snapshot"));
    expect(markup.indexOf("Hero Visual")).toBeGreaterThan(markup.indexOf("Plan Readiness / Next Actions"));
    expect(markup.indexOf("Hero Visual")).toBeLessThan(markup.indexOf("Project Visuals / Diagrams"));
    expect(markup).toContain("Check Before Building");
    expect(markup).toContain('print:break-before-page');
    expect(markup).toContain("Review wall mounting details.");
    expect(markup).toContain("Review safety-trigger notes.");
    expect(markup).toContain("Check-list markers are for paper or shop review only; nothing is saved.");
    expect(markup.indexOf("Boardsmith cannot verify wall safety or load capacity.")).toBeGreaterThan(markup.indexOf("Reference Review Notes"));
    expect(markup).not.toContain('name="plan_action_');
    expect(markup).not.toContain("Review child-adjacent or load-related safety flags.");
    expect(markup).toContain("Planning diagram - not to scale");
    expect(markup).toContain("Exploded assembly view");
    expect(markup).toContain("Front elevation / shelf layout");
    expect(markup).toContain("Top view / shelf footprint");
    expect(markup).toContain("Side view");
    expect(markup).toContain("Cut parts");
    expect(markup).toContain("Mounting review");
    expect(markup).toContain("Width 36 in");
    expect(markup).toContain("Depth 10 in");
    expect(markup).toContain("Material thickness 0.75 in");
    expect(markup).toContain("support method to verify");
    expect(markup).not.toContain("Shelf board overview");
    expect(markup).not.toContain("Shelf board piece relationship");
    expect(markup).not.toContain("Project anatomy");
    expect(markup).not.toContain("Three-view planning diagram");
    expect(markup.split("Planning diagram - not to scale").length - 1).toBe(1);
    expect(markup).toContain("Materials and Parts");
    expect(markup).toContain("Materials to gather");
    expect(markup).toContain("Pieces to cut");
    expect(markup).not.toContain("Pieces to identify");
    expect(markup).toContain("1 - 36 in x 10 in x 0.75 in");
    expect(markup).toContain("1 planned piece");
    expect(markup).toContain("Support method needs review");
    expect(markup).toContain("Wall fasteners depend on wall type");
    expect(markup).not.toContain("QUANTITY TO REVIEW");
    expect(markup).not.toContain("PLANNED PCS");
    expect(markup).not.toContain("Plan material:");
    expect(markup).not.toContain("Material checks");
    expect(markup).toContain("Cut Checklist");
    expect(markup).toContain("Cut layout diagram");
    expect(markup).toContain("Cut layout from Build Model pieces.");
    expect(markup).toContain("Shelf board cut layout planning graphic");
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
    expect(markup).not.toContain("Shelf boards");
    expect(markup).not.toContain("Do not rely on Boardsmith for load ratings.");
    expect(markup).not.toContain("Modeled step");
    expect(markup).not.toContain("Modeled operations");
    expect(markup).not.toContain("15 min");
    expect(markup).toContain("Reference Review Notes");
    expect(markup).toContain("Shop notes");
    expect(markup).toContain("Blank space for handwritten notes on the printed plan. Nothing here is saved in Boardsmith.");
    expect(markup).toContain("hidden print:block print:break-before-page");
    expect(markup).toContain("Wall/support review");
    expect(markup).toContain("Open questions");
    expect(markup).toContain("Finish/humidity notes");
    expect(markup).toContain("Planning-aid reminder");
    expect(markup).toContain("No PDF, CAD, CNC, load rating, or engineering sign-off is generated.");
    expect(markup).not.toContain("Review Appendix");
    expect(markup).not.toContain("Additional checklist notes");
    expect(markup).not.toContain("Plan review summary");
    expect(markup).not.toContain("Conservative review triggers are not confirmed hazards.");
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
    expect(markup).not.toContain("AI-generated concept preview");
    expect(markup).not.toContain("reference image measurement");
    expect(markup).not.toContain("Download");
    expect(markup).not.toContain("fabrication-ready");
    expect(markup).not.toContain("approved");
    expect(markup).not.toContain("structural approval");
    expect(markup).not.toContain("construction approval");
    expect(markup).toContain('href="/projects/print_preview_project"');
    expect(markup).toContain("Back to project");

    const sectionOrder = [
      "Build Snapshot",
      "Plan Readiness / Next Actions",
      "Hero Visual",
      "Project Visuals / Diagrams",
      "Cut Checklist",
      "Buying Plan",
      "Materials and Parts",
      "Build Guide",
      "Check Before Building",
      "Reference Review Notes",
    ];
    const sectionIndexes = sectionOrder.map((label) => markup.indexOf(label));
    expect(sectionIndexes.every((index) => index >= 0)).toBe(true);
    expect(sectionIndexes).toEqual([...sectionIndexes].sort((a, b) => a - b));
    expect(markup).toContain("Pieces to get from this material");
    expect(markup).toContain("Stock length still needs selection");
    expect(markup).toContain("Not optimized");
    expect(markup.indexOf("A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use.")).toBeGreaterThan(markup.indexOf("Reference Review Notes"));
    expect(markup.indexOf("A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use.")).toBeGreaterThan(markup.indexOf("Build Guide"));
  });

  it("dedupes modeled and generated shelf cut rows in the print cut checklist", async () => {
    const fiveShelfProject: Project = {
      ...project,
      width_inches: 12,
      height_inches: 60,
      depth_inches: 6,
      material_thickness_inches: 0.75,
      material_type: "3/4 in pine board",
      shelf_layout: "multi_shelf_unit",
      shelf_count: 5,
      shelf_spacing_inches: 12,
    };
    getProjectMock.mockResolvedValue(fiveShelfProject);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        plan_json: {
          ...planRecord.plan_json,
          estimated_time: "2-3 hours total",
          cut_list: [
            {
              ...planRecord.plan_json.cut_list[0],
              part_name: "Shelf boards",
              quantity: 5,
              length_inches: 12,
              width_inches: 6,
              thickness_inches: 0.75,
              material: "3/4 in pine board",
            },
          ],
        },
        build_model_json: {
          ...simpleShelfBuildModelFixture,
          pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], label: "Shelf boards", quantity: 5 }],
        },
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Shelf width");
    expect(markup).toContain("12 in");
    expect(markup).toContain("Total project height");
    expect(markup).toContain("60 in");
    expect(markup).toContain("Shelf depth from wall");
    expect(markup).toContain("6 in");
    expect(markup).toContain("Board thickness");
    expect(markup).toContain("0.75 in");
    expect(markup).toContain("Total cut pieces");
    expect(markup).toContain("Unique cuts");
    expect(markup).not.toContain("Cut-list rows");
    expect(markup).toContain("Pieces with dimensions");
    expect(markup).toContain("Shelf boards");
    expect(markup).toContain("Shelf boards cut layout planning graphic");
    expect(markup).toContain("Shelf boards</p><span class=\"w-fit rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink/70\">Qty 5");
    expect(markup).toContain("5</td><td class=\"py-2 pr-3 text-ink/70\">12 in x 6 in x 0.75 in</td><td class=\"py-2 pr-3 text-ink/70\">3/4 in pine board");
    expect(markup.match(/<td class="py-2 pr-3 font-semibold text-ink">Part A - Shelf boards<\/td>/g)?.length).toBe(1);
    expect(markup.match(/<td class="py-2 pr-3 font-semibold text-ink">Shelf board<\/td>/g)?.length ?? 0).toBe(0);
    expect(markup).toContain("This project creates a simple multi-shelf wall unit for bathroom use: five 12 in wide x 6 in deep shelves made from 0.75 in thick pine boards.");
  });

  it("does not print stale freestanding copy for unresolved connected shelf units", async () => {
    const staleConnectedProject: Project = {
      ...project,
      title: "Bathroom shelf with 5 shelves",
      width_inches: 23,
      height_inches: 0.1,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      material_type: "3/4 in pine board",
      style_notes: "",
      intended_use: "Indoor bathroom shelf unit.",
      shelf_layout: "multi_shelf_unit",
      shelf_count: 5,
    };
    getProjectMock.mockResolvedValue(staleConnectedProject);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        plan_json: {
          ...planRecord.plan_json,
          project_summary: "This beginner-friendly woodworking plan describes building a simple freestanding bathroom shelf unit with 5 shelves.",
          assumptions: ["The shelf is freestanding; no wall mounting or brackets are included or assumed."],
          safety_notes: ["Boardsmith cannot verify wall structure, anchors, fasteners, or load capacity as the design is freestanding."],
        },
        build_model_json: {
          ...simpleShelfBuildModelFixture,
          pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], label: "Shelf boards", quantity: 5 }],
          assumptions: ["Project is treated as freestanding or non-mounted because the intake does not ask for wall mounting."],
        },
      },
    ]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    const readinessIndex = markup.indexOf("Plan Readiness / Next Actions");
    expect(readinessIndex).toBeGreaterThan(markup.indexOf("Build Snapshot"));
    expect(readinessIndex).toBeLessThan(markup.indexOf("Hero Visual"));
    expect(readinessIndex).toBeLessThan(markup.indexOf("Cut Checklist"));
    expect(markup).toContain("Resolve blockers before treating this as a build packet.");
    expect(markup).toContain("Total project height looks too small");
    expect(markup).toContain("Enter the full top-to-bottom height of the shelf unit, such as 60 in.");
    expect(markup).toContain("This saved plan needs support/frame review before it can be treated as a complete connected shelf unit.");
    expect(markup).toContain("Total height needs review");
    expect(markup).toContain("Support/frame review");
    expect(markup).toContain("Choose whether this is separate wall shelves, bracket-supported shelves, or a connected unit with side supports.");
    expect(markup).toContain("Cut layout needs review before cutting.");
    expect(markup).not.toMatch(/freestanding|non-mounted/i);
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
    expect(markup).toContain("Front lip to Bottom shelf board with screw and Wood screws");
    expect(markup).toContain("Back rail to Bottom shelf board with screw and Wood screws");
    expect(markup).toContain("Needs manual review");
    expect(markup).toContain("Review unresolved questions.");
    expect(markup).toContain("Finish/humidity notes");
    expect(markup).toContain("Bottom shelf board");
    expect(markup).toContain("Back rail");
    expect(markup).toContain("Front lip");
  });

  it("keeps the print build sheet available for archived projects", async () => {
    getProjectMock.mockResolvedValue({ ...project, archived_at: "2026-06-06T10:00:00.000Z" });
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectPrintPreviewPage } = await import("@/app/projects/[id]/print/page");

    const markup = renderToStaticMarkup(
      await ProjectPrintPreviewPage({
        params: Promise.resolve({ id: project.id }),
      }),
    );

    expect(markup).toContain("Print build sheet");
    expect(markup).toContain("Build Snapshot");
    expect(markup).toContain("Project Visuals / Diagrams");
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
    expect(markup).toContain("Front panel to Bottom panel with screw and Outdoor-rated screws");
    expect(markup).toContain("Back panel to Bottom panel with screw and Outdoor-rated screws");
    expect(markup).toContain("Verify before building");
    expect(markup).toContain("Review unresolved questions.");
    expect(markup).toContain("Finish/humidity notes");
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

    expect(markup).toContain("Mounting review");
    expect(markup).toContain("support method to verify");
    expect(markup).toContain("Each shelf needs a verified support method.");
    expect(markup).not.toContain("No modeled connections available yet. Review the build steps before assembling.");
    expect(markup.split("Planning diagram - not to scale").length - 1).toBe(1);
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

    expect(markup).toContain("Project Visuals / Diagrams");
    expect(markup).toContain("Hero Visual");
    expect(markup).toContain("Build-model hero visual - planning aid only.");
    expect(markup).toContain("No diagram available yet. Review the cut list and build steps before building.");
    expect(markup).toContain("Three-view diagram is not available yet. Review the cut list and build guide before building.");
    expect(markup).toContain("Visual piece inventory - planning aid only.");
    expect(markup).not.toContain("Download");
    expect(markup).not.toContain("CAD-ready");
    expect(markup).not.toContain("CNC-ready");
    expect(markup).not.toContain("construction approval");
  });

  it("renders wall shelf build steps from deterministic structured data instead of ambiguous generated prose", async () => {
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

    expect(markup).toContain("Review dimensions and support method");
    expect(markup).toContain("Cut shelf board pieces");
    expect(markup).toContain("Confirm wall mounting/support method before installation");
    expect(markup).not.toContain("Think through the plan");
    expect(markup).not.toContain("Read the plan and pause if anything is unclear.");
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
    expect(markup).toContain("Use this as a planning aid; verify dimensions, materials, hardware, tool setup, and site conditions before building.");
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
    expect(markup).toContain("Generate and validate a plan before using the print build sheet.");
    expect(markup).not.toContain("Download");
  });
});
