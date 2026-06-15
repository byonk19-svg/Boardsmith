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
  archived_at: null,
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

  it("orders generated build packet before advanced project review details", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    const planSheetIndex = markup.indexOf('id="printable-plan-sheet"');
    const buildSnapshotIndex = markup.indexOf("Build Snapshot");
    const readinessIndex = markup.indexOf("Plan Readiness / Next Actions");
    const heroVisualIndex = markup.indexOf("Hero Visual");
    const advancedDetailsIndex = markup.indexOf('id="advanced-project-details"');
    const reviewChecklistIndex = markup.indexOf("Generated plan review checklist");
    const projectIntakeIndex = markup.indexOf('id="project-intake"');
    const sectionNavIndex = markup.indexOf('aria-label="Project sections"');
    const templateIndex = markup.indexOf("Template Guidance");
    const structureIndex = markup.indexOf('id="project-structure"');
    const reviewIndex = markup.indexOf('id="plan-review"');
    const historyIndex = markup.indexOf('id="plan-history"');
    const recordIndex = markup.indexOf('id="project-record"');

    expect(planSheetIndex).toBeGreaterThan(-1);
    expect(buildSnapshotIndex).toBeGreaterThan(planSheetIndex);
    expect(readinessIndex).toBeGreaterThan(buildSnapshotIndex);
    expect(heroVisualIndex).toBeGreaterThan(readinessIndex);
    expect(advancedDetailsIndex).toBeGreaterThan(heroVisualIndex);
    expect(reviewChecklistIndex).toBeGreaterThan(advancedDetailsIndex);
    expect(sectionNavIndex).toBeGreaterThan(reviewChecklistIndex);
    expect(projectIntakeIndex).toBeGreaterThan(-1);
    expect(projectIntakeIndex).toBeGreaterThan(sectionNavIndex);
    expect(templateIndex).toBeGreaterThan(projectIntakeIndex);
    expect(structureIndex).toBeGreaterThan(templateIndex);
    expect(reviewIndex).toBeGreaterThan(structureIndex);
    expect(historyIndex).toBeGreaterThan(reviewIndex);
    expect(recordIndex).toBeGreaterThan(historyIndex);
    expect(markup).toContain("Private notes and real-build details stay with this project.");
  });

  it("renders a multi-shelf wall hero as repeated shelf boards instead of one generic block", async () => {
    const { ProjectHeroVisual } = await import("@/app/projects/[id]/ProjectHeroVisual");

    const markup = renderToStaticMarkup(
      React.createElement(ProjectHeroVisual, {
        visual: {
          title: "Project anatomy",
          kind: "simple_shelf",
          widthLabel: "Width 12 in",
          heightLabel: "Height 60 in",
          depthLabel: "Depth 6 in",
          materialThicknessLabel: "Material thickness 0.75 in",
          materialLabel: "3/4 in pine board",
          pieceLabels: ["Shelf boards"],
          shelfCount: 5,
          hasWallContext: true,
          supportLabel: "Wall/support details to verify",
          fallbackMessage: null,
        },
      }),
    );

    expect(markup).toContain("5 shelves - Material thickness 0.75 in");
    expect(markup).toContain("Wall/support details to verify");
    expect(markup).toContain("wall");
    expect(markup.match(/<g>/g)?.length).toBe(5);
    expect(markup).not.toContain("Major pieces");
  });

  it("renders no-print project section navigation with links to existing latest-plan sections", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain('aria-label="Project sections"');
    expect(markup).toContain("Project actions");
    expect(markup).toContain('id="project-actions"');
    expect(markup).toContain("Project sections");
    expect(markup).toContain("Generate another plan version");
    expect(markup).not.toContain(">Generate Plan</button>");
    expect(markup).toContain('href="#project-intake"');
    expect(markup).toContain('id="project-intake"');
    expect(markup).toContain('href="#project-structure"');
    expect(markup).toContain('id="project-structure"');
    expect(markup).toContain('href="#plan-review"');
    expect(markup).toContain('id="plan-review"');
    expect(markup).toContain('href="#tweak-this-plan"');
    expect(markup).toContain('id="tweak-this-plan"');
    expect(markup).toContain('href="#plan-comparison"');
    expect(markup).toContain('id="plan-comparison"');
    expect(markup).toContain('href="#printable-plan-sheet"');
    expect(markup).toContain('id="printable-plan-sheet"');
    expect(markup).toContain('href="#plan-history"');
    expect(markup).toContain('id="plan-history"');
    expect(markup).toContain('href="#project-record"');
    expect(markup).toContain('id="project-record"');
  });

  it("keeps project navigation and top action polish hidden from print styling", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain('class="no-print text-sm font-medium text-moss hover:underline"');
    expect(markup).toContain('id="project-actions" class="no-print');
    expect(markup).toContain('<nav aria-label="Project sections" class="no-print');
    expect(markup).toContain("More sections");
  });

  it("keeps section navigation copy away from forbidden product claims", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );
    const navStart = markup.indexOf('aria-label="Project sections"');
    const navEnd = markup.indexOf("</nav>", navStart);
    const navMarkup = markup.slice(navStart, navEnd);

    expect(navMarkup).not.toMatch(/professional approval|load rating|CAD-ready|CNC-ready|export certainty|child-safe|certified|public sharing|marketplace|shopping|pricing|vendor|inventory/i);
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
    expect(markup).toContain("Saved review panels check the generated plan.");
    expect(markup).toContain("Wall mounting is likely.");
    expect(markup).toContain("Plan Review");
    expect(markup).toContain("Review: Blocked");
    expect(markup).toContain("Advanced output notes");
    expect(markup).toContain("Secondary notes for possible future output work.");
    expect(markup).toContain("This MVP uses browser print only; no PDF or CAD download is generated.");
  });

  it("renders shelf intake dimensions with beginner-safe labels", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Multiple shelf wall hanging",
      height_inches: 60,
      depth_inches: 6,
      shelf_layout: "multiple_separate_shelves",
      shelf_count: 2,
      shelf_spacing_inches: 12,
      intended_use: "Two shelves about 12 inches apart for towels.",
    });
    listGeneratedPlansMock.mockResolvedValue([]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Shelf width");
    expect(markup).toContain("36 in");
    expect(markup).toContain("Total project height");
    expect(markup).toContain("60 in");
    expect(markup).toContain("Shelf depth from wall");
    expect(markup).toContain("6 in");
    expect(markup).toContain("Board thickness");
    expect(markup).toContain("0.75 in");
    expect(markup).toContain("Shelf layout");
    expect(markup).toContain("Multiple separate wall shelves");
    expect(markup).toContain("Number of shelves");
    expect(markup).toContain("Shelf spacing");
    expect(markup).toContain("12 in");
    expect(markup).not.toContain("Dimensions</dt>");
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
    expect(markup).toContain("Total cut pieces");
    expect(markup).toContain("Cut-list rows");
    expect(markup).toContain("Pieces with dimensions");
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

    expect(markup).toContain("Print build sheet");
    expect(markup).toContain("Recommended next step");
    expect(markup).toContain("Review the generated plan");
    expect(markup).toContain("Review safety notes, cut list, assumptions, and open questions before using the print build sheet.");
    expect(markup).toContain("Generated plan review checklist");
    expect(markup).toContain("Use this as a shop-readiness checklist after the recommended next step.");
    expect(markup).toContain("Cut list check");
    expect(markup).toContain("0 rows need review");
    expect(markup).toContain("Materials check");
    expect(markup).toContain("4 groups to verify");
    expect(markup).toContain("Safety notes");
    expect(markup).toContain("2 review triggers");
    expect(markup).toContain("Open questions");
    expect(markup).toContain("1 unresolved");
    expect(markup).toContain('href="#open-questions"');
    expect(markup).toContain('href="#cut-list-to-verify"');
    expect(markup).toContain('href="/projects/project_saved_bbm/print"');
    expect(markup).toContain("Latest generated plan");
    expect(markup).toContain("Build Snapshot");
    expect(markup).not.toContain("Plan at a glance");
    expect(markup).not.toContain("Overview / Summary");
    expect(markup).toContain("Hero Visual");
    expect(markup).toContain("Build-model hero visual - planning aid only.");
    expect(markup).toContain("Main project visual from structured plan data.");
    expect(markup.indexOf("Hero Visual")).toBeGreaterThan(markup.indexOf("Build Snapshot"));
    expect(markup.indexOf("Hero Visual")).toBeLessThan(markup.indexOf("Project Visuals / Diagrams"));
    expect(markup).toContain("Project Visuals / Diagrams");
    expect(markup).toContain("Planning diagram - not to scale");
    expect(markup).toContain("Exploded assembly view");
    expect(markup).toContain("Front elevation / shelf layout");
    expect(markup).toContain("Top view / shelf footprint");
    expect(markup).toContain("Side view");
    expect(markup).toContain("Cut parts");
    expect(markup).toContain("Mounting review");
    expect(markup).toContain("support method to verify");
    expect(markup).toContain("Each shelf needs a verified support method.");
    expect(markup).toContain("Needs manual review");
    expect(markup).toContain("Planning aid");
    expect(markup).toContain("Review before building");
    expect(markup).toContain("Check Before Building");
    expect(markup).toContain("Review wall mounting details.");
    expect(markup).toContain("Review unresolved questions.");
    expect(markup).toContain("Confirm bracket, cleat, side-support, or frame type.");
    expect(markup).toContain("Confirm hardware and expected load suitability before mounting.");
    expect(markup).toContain("Check-list markers are for paper or shop review only; nothing is saved.");
    expect(markup).not.toContain('name="plan_action_');
    expect(markup).toContain("Materials and Parts");
    expect(markup).toContain("Cut Checklist");
    expect(markup).toContain("Buying Plan");
    expect(markup).toContain("Pieces to get from this material");
    expect(markup).toContain("Stock length still needs selection");
    expect(markup).toContain("Verify all dimensions against your actual space, lumber, and hardware.");
    expect(markup).toContain("Build Guide");
    expect(markup).toContain("Step 1");
    expect(markup).toContain("Inspect / review");
    expect(markup).toContain("Tools");
    expect(markup).toContain("Drill");
    expect(markup).toContain("Time");
    expect(markup).toContain("15 min");
    expect(markup).toContain("Pieces");
    expect(markup).toContain("Shelf board");
    expect(markup).toContain("Modeled step");
    expect(markup).toContain("Inspect mounting location");
    expect(markup).toContain("Review dimensions and support method");
    expect(markup).toContain("Build guide from Build Model pieces and operations.");
    expect(markup).toContain("Boardsmith cannot verify load capacity, wall safety, anchors, studs, or site conditions.");
    expect(markup).not.toContain("Modeled operations");
    expect(markup).toContain("Structured build sequence");
    expect(markup).toContain("Safety notes");
    expect(markup).toContain("Review triggers");
    expect(markup).toContain("These are conservative review triggers, not confirmed hazards.");
    expect(markup).toContain("Safety-sensitive wording can trigger review even when the project excludes that use.");
    expect(markup).toContain("Assumptions");
    expect(markup).toContain("Open questions");
    expect(markup).toContain('id="open-questions"');
    expect(markup).toContain("Finishing notes");
    expect(markup).toContain("Beginner tips");
    expect(markup).toContain("Reference Review Notes");
    expect(markup).toContain("Use your own judgment before cutting or assembling.");
    expect(markup).toContain("This MVP uses browser print only; no PDF or CAD download is generated.");
    expect(markup).not.toContain("CAD-ready");
    expect(markup).not.toContain("CNC-ready");
    expect(markup).not.toContain("AI-generated concept preview");
    expect(markup).not.toContain("reference image measurement");
    expect(markup).not.toContain("construction approval");
    expect(markup).not.toContain("Output readiness notes");
    expect(markup).toContain("Exact bracket and fastener specifications are unknown.");

    const corePacketOrder = [
      "Build Snapshot",
      "Hero Visual",
      "Project Visuals / Diagrams",
      "Cut Checklist",
      "Buying Plan",
      "Materials and Parts",
      "Build Guide",
      "Check Before Building",
      "Reference Review Notes",
    ];
    const corePacketIndexes = corePacketOrder.map((label) => markup.indexOf(label));
    expect(corePacketIndexes.every((index) => index >= 0)).toBe(true);
    expect(corePacketIndexes).toEqual([...corePacketIndexes].sort((a, b) => a - b));
    expect(markup.indexOf(planRecord.plan_json.project_summary)).toBeGreaterThan(markup.indexOf("Reference Review Notes"));
    expect(markup.indexOf(planRecord.plan_json.project_summary)).toBeGreaterThan(markup.indexOf("Build Guide"));

    expect(markup).toContain("Tweak this plan");
    expect(markup).toContain("Describe one change to the latest plan.");
    expect(markup).toContain("Boardsmith saves a new plan version for review; this is a one-shot revision, not a chat thread.");
    expect(markup).toContain("Describe one change to make to the latest plan");
    expect(markup).toContain("Boardsmith will save this as a new plan version.");
    expect(markup).toContain("Revised plans still need manual review before cutting or building.");
    expect(markup).toContain('action="/projects/project_saved_bbm/revise"');
    expect(markup).toContain('name="revision_instruction"');
    expect(markup).toContain("Create revised plan");
    expect(markup).not.toContain("AI chat");
    const tweakStart = markup.indexOf('id="tweak-this-plan"');
    const tweakEnd = markup.indexOf("</section>", tweakStart);
    const tweakMarkup = markup.slice(tweakStart, tweakEnd);
    expect(tweakMarkup).not.toMatch(/background agent|professional approval|structural approval|certification|CAD-ready|CNC-ready|fabrication-ready/i);
  });

  it("shows a prominent warning before the plan when cut-list dimensions are missing or unresolved", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        plan_json: {
          ...planRecord.plan_json,
          cut_list: [
            planRecord.plan_json.cut_list[0],
            {
              ...planRecord.plan_json.cut_list[0],
              part_name: "Decorative layer placeholder",
              notes: "Final width is unresolved and must be confirmed before cutting.",
            },
          ],
        },
      },
    ]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Resolve missing dimensions before cutting");
    expect(markup).toContain("Resolve missing cut dimensions before cutting or printing this plan.");
    expect(markup).toContain("Do not cut this piece until dimensions are resolved.");
    expect(markup).toContain("Decorative layer placeholder");
    expect(markup).toContain('href="#cut-list-to-verify"');
    expect(markup).toContain("Jump to cut list review");
    expect(markup).toContain('id="cut-list-to-verify"');
    expect(markup).toContain("Scroll sideways to review all cut-list columns.");
    expect(markup).toContain("A generated cut uses placeholder or unresolved dimension language.");
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
    listGeneratedPlansMock.mockResolvedValue([{ ...planRecord, assumptions: [...planRecord.assumptions, "Revision request: Make the steps easier."] }, olderPlanRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Plan comparison");
    expect(markup).toContain("Review the latest plan version");
    expect(markup).toContain("The latest version is shown. Older versions remain read-only in plan history for comparison.");
    expect(markup).toContain('href="#plan-history"');
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

  it("uses review-oriented copy after generating a plan version", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ generated: "1" }),
      }),
    );

    expect(markup).toContain("Generated and saved a new plan version for review.");
    expect(markup).not.toContain("Generated and saved a new validated plan version.");
  });

  it("shows a revised-plan success state with comparison against the prior plan version", async () => {
    const olderPlanRecord: GeneratedProjectPlanRecord = {
      ...planRecord,
      id: "plan_prior_to_revision",
      created_at: new Date(0).toISOString(),
      is_latest: false,
      plan_json: {
        ...planRecord.plan_json,
        project_summary: "An older wall shelf plan with fewer beginner details and manual mounting review before use.",
      },
    };
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([planRecord, olderPlanRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ revised: "1", compare_plan: olderPlanRecord.id }),
      }),
    );

    expect(markup).toContain("Revised and saved a new plan version for review. The comparison below shows the new latest plan against the previous version.");
    expect(markup).toContain("Plan comparison");
    expect(markup).toContain("Comparing the revised latest plan with the previous version (Version 1).");
    expect(markup).toContain("Project summary changed.");
    expect(markup).toContain("Revised");
    expect(markup).toContain("Latest");
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

  it("links generated plans to the print build sheet page", async () => {
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
    expect(markup).toContain("Print build sheet");
  });

  it("renders archived generated-plan projects as read-only until restored", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      archived_at: "2026-06-06T10:00:00.000Z",
    });
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Archived project");
    expect(markup).toContain("Read-only archived project");
    expect(markup).toContain("Plan readiness");
    expect(markup).toContain("Restore before full plan");
    expect(markup).toContain("This blocks future generation only. Existing saved plan versions remain readable for review, history, and browser print");
    expect(markup).toContain("Review only until restored");
    expect(markup).toContain("This archived project is read-only. Restore remains the only edit-enabling action;");
    expect(markup).toContain('href="#project-record"');
    expect(markup).toContain("This project is archived. Restore it before revising or generating another plan.");
    expect(markup).toContain("This project is hidden from the default project list and is read-only until restored.");
    expect(markup).toContain("Existing details, generated plans, history, review notes, and browser print remain available.");
    expect(markup).toContain("Restore it before revising, generating another plan, or making edit-like changes.");
    expect(markup).toContain("Restore project");
    expect(markup).toContain("Restoring re-enables generation and revisions.");
    expect(markup).toContain('action="/projects/project_saved_bbm/restore"');
    expect(markup).toContain('href="/projects/project_saved_bbm/print"');
    expect(markup).toContain("Print build sheet");
    expect(markup).toContain("Latest generated plan");
    expect(markup).toContain("Plan history");
    expect(markup).toContain("Advanced output notes");
    expect(markup).toContain("This archived project record is read-only until restored.");
    expect(markup).toContain("Restore this project before editing notes.");
    expect(markup).toContain("Restore this project before editing the build log.");
    expect(markup).not.toContain("Generate another plan version");
    expect(markup).not.toContain(">Generate Plan</button>");
    expect(markup).not.toContain("Tweak this plan");
    expect(markup).not.toContain('href="#tweak-this-plan"');
    expect(markup).not.toContain('id="tweak-this-plan"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/revise"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/generate"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/duplicate"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/notes"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/build-log"');
    expect(markup).not.toContain("Duplicate project");
    expect(markup).not.toContain("Archive project");
    expect(markup).not.toContain("Save notes");
    expect(markup).not.toContain("Save build log");
    expect(markup).not.toContain('name="revision_instruction"');
    expect(markup).not.toMatch(/deleted|delete project/i);
  });

  it("renders archived no-plan projects without generation affordances", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      status: "draft",
      archived_at: "2026-06-06T10:00:00.000Z",
    });
    listGeneratedPlansMock.mockResolvedValue([]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Read-only archived project");
    expect(markup).toContain("This project is archived. Restore it before revising or generating another plan.");
    expect(markup).toContain("No generated plan yet");
    expect(markup).toContain("This archived project has no generated plan. Restore it before generating a first plan.");
    expect(markup).toContain("This archived project record is read-only until restored.");
    expect(markup).toContain("Restore project");
    expect(markup).toContain('action="/projects/project_saved_bbm/restore"');
    expect(markup).toContain("Restore before full plan");
    expect(markup).not.toContain(">Generate Plan</button>");
    expect(markup).not.toContain("Full plan path available");
    expect(markup).not.toContain("Generate another plan version");
    expect(markup).not.toContain("Print build sheet");
    expect(markup).not.toContain("Tweak this plan");
    expect(markup).not.toContain('action="/projects/project_saved_bbm/generate"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/revise"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/notes"');
    expect(markup).not.toContain('action="/projects/project_saved_bbm/build-log"');
    expect(markup).not.toContain('name="revision_instruction"');
    expect(markup).not.toContain("Save notes");
    expect(markup).not.toContain("Save build log");
    expect(markup).not.toContain("Duplicate project");
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
    expect(markup).toContain("Copies intake only.");
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
    expect(markup).not.toContain("Print build sheet</p><h2 class=\"mt-2 text-2xl font-semibold tracking-tight text-ink\">Generated Plan</h2><p>Try walnut stain");
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
    expect(markup).toContain("Future output review should use a generated plan with stored build-model JSON.");
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
    expect(markup).toContain("Recommended next step");
    expect(markup).toContain("Review intake, then generate a first plan");
    expect(markup).toContain("Check the project intake and review triggers, then use Project actions to generate a first plan version for review.");
    expect(markup).toContain("Saved intake is ready for review");
    expect(markup).toContain("This project does not have a generated plan yet.");
    expect(markup).toContain("Generate Plan remains primary");
    expect(markup).toContain('href="#project-actions"');
    expect(markup).toContain(">Generate Plan</button>");
    expect(markup).not.toContain("Generate another plan version");
    expect(markup).toContain("Generate a first plan from Project actions.");
    expect(markup).toContain("Boardsmith saves plans for review; if review blocks generation, you will see what needs attention.");
    expect(markup).toContain("Planning details before generation");
    expect(markup).toContain("Template and derived structure are secondary until a plan exists.");
    expect(markup).toContain("Project sections");
    expect(markup).toContain('href="#project-intake"');
    expect(markup).not.toContain('href="#project-structure"');
    expect(markup).toContain('href="#project-record"');
    expect(markup).not.toContain('href="#plan-review"');
    expect(markup).not.toContain('href="#tweak-this-plan"');
    expect(markup).not.toContain('href="#plan-comparison"');
    expect(markup).not.toContain('href="#printable-plan-sheet"');
    expect(markup).not.toContain('href="#plan-history"');
    expect(markup).not.toContain("Blocking issues");
    expect(markup).not.toContain("Tweak this plan");
    expect(markup).not.toContain('name="revision_instruction"');
    expect(markup).not.toContain("Print build sheet");

    expect(markup.indexOf("Saved intake is ready for review")).toBeLessThan(markup.indexOf("Project intake"));
    expect(markup.indexOf("No generated plan yet")).toBeLessThan(markup.indexOf("Planning details before generation"));
  });

  it("keeps notes and build log useful when no plan or saved record details exist", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      notes: "",
      build_completed: false,
      build_completed_at: "",
      build_actual_material: "",
      build_plan_changes: "",
      build_lessons_learned: "",
    });
    listGeneratedPlansMock.mockResolvedValue([]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("No generated plan yet");
    expect(markup).toContain("No project notes saved yet.");
    expect(markup).toContain("Build log has not been filled out yet.");
    expect(markup).toContain("Add build notes after you cut, assemble, test-fit, or decide not to build.");
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
    expect(markup).toContain("No new plan was saved.");
    expect(markup).toContain("Boardsmith blocks drafts that fail validation or safety review before they can be saved.");
    expect(markup).toContain("For wall-mounted projects, verify studs or anchors, fasteners, wall structure, and expected load before trying again.");
    expect(markup).toContain("For child-adjacent projects, describe edge treatment, finish choice, supervision needs, mounting height, and inspection plans.");
    expect(markup).not.toContain("Generated plan failed deterministic quality checks");
  });

  it("shows failed-latest-attempt copy without hiding the saved latest plan", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      status: "generation_failed",
    });
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("latest attempt failed");
    expect(markup).toContain("Latest generation attempt needs review.");
    expect(markup).toContain("The saved latest plan below is still available for review");
    expect(markup).toContain("This blocks future generation only. Existing saved plan versions remain readable for review, history, and browser print");
    expect(markup).toContain("Latest generated plan");
    expect(markup).toContain("Print build sheet");
    expect(markup).toContain('href="/projects/project_saved_bbm/print"');
    expect(markup).not.toContain("No generated plan yet.");
  });

  it("shows a direct shelf-layout repair form when generation is blocked by missing shelf count", async () => {
    getProjectMock.mockResolvedValue({
      ...project,
      title: "Multiple shelf wall hanging",
      height_inches: 60,
      depth_inches: 6,
      shelf_layout: "multi_shelf_unit",
      shelf_count: undefined,
      intended_use: "Bathroom wall storage for towels.",
    });
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ generation_error: "shelf_layout_missing" }),
      }),
    );

    expect(markup).toContain("Shelf layout needs one more detail.");
    expect(markup).toContain("Choose the shelf layout and enter the number of shelves.");
    expect(markup).toContain("Fix shelf layout");
    expect(markup).toContain('action="/projects/project_saved_bbm/shelf-layout"');
    expect(markup).toContain('name="shelf_layout"');
    expect(markup).toContain('name="shelf_count"');
    expect(markup).toContain('name="height_inches"');
    expect(markup).toContain('name="shelf_spacing_inches"');
    expect(markup).toContain("Save shelf layout");
    expect(markup).toContain("Required to generate");
    expect(markup).not.toContain("intended-use notes");
  });

  it("shows a direct shelf-layout repair form when generation is blocked by impossible shelf height", async () => {
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
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ generation_error: "shelf_layout_invalid" }),
      }),
    );

    expect(markup).toContain("Shelf layout dimensions need review.");
    expect(markup).toContain(
      "Total project height looks too small for 5 shelves. Enter the full top-to-bottom height of the shelf unit, such as 60 in.",
    );
    expect(markup).toContain("Fix shelf layout");
    expect(markup).toContain('name="height_inches"');
    expect(markup).toContain('value="0.1"');
  });

  it("places blocked wall-shelf readiness actions before visuals, cuts, and build steps", async () => {
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
    listGeneratedPlansMock.mockResolvedValue([
      {
        ...planRecord,
        build_model_json: {
          ...storedBuildModel,
          dimensions: {
            ...storedBuildModel.dimensions,
            widthInches: 23,
            heightInches: 0.1,
            depthInches: 8,
          },
          pieces: [{ ...storedBuildModel.pieces[0], label: "Shelf boards", quantity: 5 }],
        },
      },
    ]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({}),
      }),
    );

    const readinessIndex = markup.indexOf("Plan Readiness / Next Actions");
    const heightActionIndex = markup.indexOf("Total project height looks too small");
    const heroIndex = markup.indexOf("Hero Visual");
    const cutIndex = markup.indexOf("Cut Checklist");
    const buildIndex = markup.indexOf("Build Guide");

    expect(readinessIndex).toBeGreaterThan(-1);
    expect(heightActionIndex).toBeGreaterThan(readinessIndex);
    expect(readinessIndex).toBeLessThan(heroIndex);
    expect(readinessIndex).toBeLessThan(cutIndex);
    expect(readinessIndex).toBeLessThan(buildIndex);
    expect(markup).toContain("Enter the full top-to-bottom height of the shelf unit, such as 60 in.");
    expect(markup).toContain("Support/frame design needs review");
    expect(markup).not.toMatch(/freestanding|non-mounted/i);
  });

  it("renders safe project-detail action errors without exposing raw query text", async () => {
    getProjectMock.mockResolvedValue(project);
    listGeneratedPlansMock.mockResolvedValue([]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const knownMarkup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ error: "notes_failed" }),
      }),
    );

    expect(knownMarkup).toContain("Project update was not saved.");
    expect(knownMarkup).toContain("Project notes could not be saved. Try again from the project detail page.");
    expect(knownMarkup).not.toContain("No new plan was saved.");

    const rawMarkup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ error: "Database exploded: stack trace" }),
      }),
    );

    expect(rawMarkup).toContain("Something went wrong while updating this project. Try again or review the project details before retrying.");
    expect(rawMarkup).not.toContain("Database exploded");
    expect(rawMarkup).not.toContain("stack trace");
  });

  it("keeps archived read-only framing visible when an action error is present", async () => {
    getProjectMock.mockResolvedValue({ ...project, archived_at: "2026-06-06T10:00:00.000Z" });
    listGeneratedPlansMock.mockResolvedValue([planRecord]);
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: project.id }),
        searchParams: Promise.resolve({ error: "restore_failed" }),
      }),
    );

    expect(markup).toContain("Archived project");
    expect(markup).toContain("Review only until restored");
    expect(markup).toContain("That project could not be restored. Try again from the project detail page.");
    expect(markup).toContain("Restore project");
    expect(markup).not.toContain("Project could not be restored.");
  });
});
