import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";
import {
  activeProjectArchiveFields,
  createWallShelfFixtureBuildModel,
  createWallShelfFixturePlanRecord,
  createWallShelfFixtureProject,
  emptyProjectBuildLog,
  type WallShelfFixtureState,
} from "../project-test-helpers";

const e2eDataFile = process.env.BOARDSMITH_DATA_FILE ?? ".data/playwright-e2e.json";
const projectId = "e2e-planter-packet";
const planId = "e2e-planter-packet-plan";
const wallShelfProjectId = "e2e-wall-shelf-buying-minimum";
const wallShelfPlanId = "e2e-wall-shelf-buying-minimum-plan";
const separateShelfProjectId = "e2e-separate-wall-shelves";
const connectedShelfProjectId = "e2e-connected-wall-shelf-review";

const generatedPlan: GeneratedPlan = {
  project_summary: "A cautious rectangular planter box planning packet with panel, drainage, liner, finish, and outdoor fastener review.",
  project_type: "planter_box",
  dimensions: {
    width_inches: 24,
    height_inches: 8,
    depth_inches: 8,
    material_thickness_inches: 0.75,
  },
  materials: [
    {
      name: "cedar board",
      quantity: "boards to review",
      notes: "Confirm actual stock width, length, condition, and outdoor suitability before buying.",
    },
    {
      name: "outdoor-rated screws",
      quantity: "quantity to review",
      notes: "Confirm screw length, spacing, and corrosion resistance before assembly.",
    },
  ],
  tools: ["tape measure", "pencil", "drill", "saw", "clamps", "sander"],
  cut_list: [
    { part_name: "Front panel", quantity: 1, length_inches: 24, width_inches: 8, thickness_inches: 0.75, material: "cedar board", notes: "Review panel layout before cutting." },
    { part_name: "Back panel", quantity: 1, length_inches: 24, width_inches: 8, thickness_inches: 0.75, material: "cedar board", notes: "Review panel layout before cutting." },
    { part_name: "Side panel", quantity: 2, length_inches: 8, width_inches: 8, thickness_inches: 0.75, material: "cedar board", notes: "Review panel layout before cutting." },
    { part_name: "Bottom panel", quantity: 1, length_inches: 24, width_inches: 8, thickness_inches: 0.75, material: "cedar board", notes: "Drainage-hole layout needs review." },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review planter packet",
      instructions: "Review panel labels, drainage, liner, finish, and connection notes before cutting or assembly.",
      tools_used: ["tape measure", "pencil"],
      safety_note: "Boardsmith is a planning aid; verify all material and safety choices yourself.",
      estimated_time_minutes: 10,
    },
  ],
  finishing_steps: ["Choose an outdoor-appropriate finish or liner and follow product labels before use."],
  safety_notes: [
    "Boardsmith plans are planning aids, not professional engineering reviews.",
    "Soil and water add weight; review placement, drainage, material, finish, and fasteners before use.",
  ],
  assumptions: ["This is a rectangular ground-level planter box shell."],
  needs_review_flags: ["Drainage, liner, outdoor finish, fastener, stock board, and connection details need manual review."],
  beginner_tips: ["Dry-fit the panels before driving fasteners."],
  svg_readiness_notes: ["This MVP uses browser print only; no PDF, CAD, or CNC output is generated."],
  estimated_difficulty: "moderate",
  estimated_time: "2-3 hours",
  confidence_level: "low",
};

const wallShelfGeneratedPlan: GeneratedPlan = {
  project_summary: "A cautious wall shelf planning packet with board-count, minimum usable length, support, hardware, and wall-fastener review.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 42,
    height_inches: 0.75,
    depth_inches: 10,
    material_thickness_inches: 0.75,
  },
  materials: [
    {
      name: "pine board",
      quantity: "1 shelf board to review",
      notes: "Confirm actual retail board length, defects, straightness, and final cut layout before purchase.",
    },
    {
      name: "wall brackets and fasteners",
      quantity: "quantity to review",
      notes: "Confirm bracket, fastener, stud/anchor, wall structure, and expected load before purchase.",
    },
  ],
  tools: ["tape measure", "pencil", "drill", "stud finder", "level", "miter saw", "sander"],
  cut_list: [
    {
      part_name: "Shelf board",
      quantity: 1,
      length_inches: 42,
      width_inches: 10,
      thickness_inches: 0.75,
      material: "pine board",
      notes: "Review stock-board condition and final support method before cutting.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review shelf buying minimum",
      instructions: "Confirm board count, minimum usable length, stock-board condition, brackets, fasteners, studs or anchors, and expected load before buying.",
      tools_used: ["tape measure", "stud finder"],
      safety_note: "Boardsmith cannot verify wall safety or load capacity.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand and finish after confirming mounting hardware, wall conditions, and site constraints."],
  safety_notes: [
    "Boardsmith plans are planning aids, not professional engineering reviews.",
    "Verify studs, anchors, wall structure, fasteners, and expected load before installing.",
  ],
  assumptions: ["This is a single non-critical wall shelf for private MVP testing."],
  needs_review_flags: ["Board count, stock-board length, bracket/fastener choice, and wall structure need review."],
  beginner_tips: ["Bring final shelf dimensions and wall-structure notes to the store."],
  svg_readiness_notes: ["This MVP uses browser print only; no PDF, CAD, or CNC output is generated."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

function createProject(): Project {
  const project = {
    id: projectId,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(1).toISOString(),
    title: "E2E non-critical planter packet",
    project_type: "planter_box",
    skill_level: "beginner",
    status: "plan_generated",
    width_inches: 24,
    height_inches: 8,
    depth_inches: 8,
    material_thickness_inches: 0.75,
    material_type: "cedar board",
    shelf_layout: undefined,
    shelf_count: undefined,
    shelf_spacing_inches: undefined,
    tools_available: ["tape_measure", "pencil", "drill", "jigsaw", "clamps", "sander", "paint_brush"],
    style_notes: "Outdoor herb planter box shell.",
    intended_use: "Small covered outdoor planter for herbs, with drainage and liner review.",
    safety_review_required: true,
    safety_flags: ["Outdoor exposure review"],
    notes: "",
    ...emptyProjectBuildLog,
    ...activeProjectArchiveFields,
  } satisfies Project;

  return project;
}

function createWallShelfProject(): Project {
  const project = {
    id: wallShelfProjectId,
    created_at: new Date(3).toISOString(),
    updated_at: new Date(4).toISOString(),
    title: "E2E wall shelf buying minimum",
    project_type: "simple_shelf",
    skill_level: "beginner",
    status: "plan_generated",
    width_inches: 42,
    height_inches: 0.75,
    depth_inches: 10,
    material_thickness_inches: 0.75,
    material_type: "pine board",
    shelf_layout: "single_shelf",
    shelf_count: 1,
    shelf_spacing_inches: undefined,
    tools_available: ["tape_measure", "pencil", "drill", "stud_finder", "level", "miter_saw", "sander"],
    style_notes: "Simple wall shelf above a desk.",
    intended_use: [
      "Wall shelf for books and small decor above a desk; visible brackets and wall fasteners need review.",
      "Structured intake",
      "- Mounting method: Visible L brackets",
      "- Wall type: Drywall with wood studs",
      "- Stud access: Yes, studs can be used",
      "- What it will hold: Light decor only",
      "- Support/bracket count: 3",
    ].join("\n"),
    safety_review_required: true,
    safety_flags: ["Wall mounting needs review"],
    notes: "",
    ...emptyProjectBuildLog,
    ...activeProjectArchiveFields,
  } satisfies Project;

  return project;
}

test.beforeEach(async () => {
  const project = createProject();
  const buildModel = createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
  const wallShelfProject = createWallShelfProject();
  const wallShelfBuildModel = createBuildModelDraft(
    wallShelfProject,
    getTemplateHint(wallShelfProject.project_type),
    calculateSafetyReviewFlags(wallShelfProject),
  );
  const planRecord: GeneratedProjectPlanRecord = {
    id: planId,
    project_id: project.id,
    created_at: new Date(2).toISOString(),
    model_name: "e2e-seeded",
    plan_json: generatedPlan,
    build_model_json: buildModel,
    plan_markdown: "# seeded planter packet",
    validation_status: "valid",
    warnings: generatedPlan.safety_notes,
    assumptions: generatedPlan.assumptions,
    confidence_level: generatedPlan.confidence_level,
    is_latest: true,
  };
  const wallShelfPlanRecord: GeneratedProjectPlanRecord = {
    id: wallShelfPlanId,
    project_id: wallShelfProject.id,
    created_at: new Date(5).toISOString(),
    model_name: "e2e-seeded",
    plan_json: wallShelfGeneratedPlan,
    build_model_json: wallShelfBuildModel,
    plan_markdown: "# seeded wall shelf packet",
    validation_status: "valid",
    warnings: wallShelfGeneratedPlan.safety_notes,
    assumptions: wallShelfGeneratedPlan.assumptions,
    confidence_level: wallShelfGeneratedPlan.confidence_level,
    is_latest: true,
  };
  const separateShelfProject = createWallShelfE2EProject("separate", separateShelfProjectId, "E2E separate wall shelves");
  const connectedShelfProject = createWallShelfE2EProject("connected_unresolved_support", connectedShelfProjectId, "E2E connected shelf review");
  const separateShelfPlanRecord = createWallShelfFixturePlanRecord("separate", {
    id: `${separateShelfProjectId}-plan`,
    project_id: separateShelfProject.id,
    build_model_json: createWallShelfFixtureBuildModel("separate"),
  });
  const connectedShelfPlanRecord = createWallShelfFixturePlanRecord("connected_unresolved_support", {
    id: `${connectedShelfProjectId}-plan`,
    project_id: connectedShelfProject.id,
    build_model_json: createWallShelfFixtureBuildModel("connected_unresolved_support"),
  });

  await rm(e2eDataFile, { force: true });
  await mkdir(path.dirname(e2eDataFile), { recursive: true });
  await writeFile(
    e2eDataFile,
    `${JSON.stringify(
      {
        projects: [project, wallShelfProject, separateShelfProject, connectedShelfProject],
        plans: [planRecord, wallShelfPlanRecord, separateShelfPlanRecord, connectedShelfPlanRecord],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
});

test("renders seeded planter packet on detail and browser print routes", async ({ page }) => {
  await page.goto(`/projects/${projectId}`);

  await expect(page.getByRole("heading", { name: "E2E non-critical planter packet" })).toBeVisible();
  await expectVisualPacket(page, /Deterministic planter-box planning hero visual/i, ["Part E - Bottom panel"]);
  await expect(page.getByText("Planter Box Buying Plan")).toBeVisible();
  await expect(page.getByText("Build Guide").first()).toBeVisible();
  await expect(page.getByText("Dry fit planter box and confirm panel connections")).toBeVisible();
  await expect(page.getByText("Part E - Bottom panel").first()).toBeVisible();

  await page.goto(`/projects/${projectId}/print`);

  await expect(page.getByText("Print build sheet").first()).toBeVisible();
  await expectVisualPacket(page, /Deterministic planter-box planning hero visual/i, ["Part E - Bottom panel"]);
  await expect(page.getByText("Planter Box Buying Plan")).toBeVisible();
  await expect(page.getByText("Dry fit planter box and confirm panel connections")).toBeVisible();
  await expect(page.getByText("Boardsmith does not generate PDF, CAD, CNC, or export/download files.")).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/add to cart|checkout|vendor|price|load rated|certified|CAD-ready|CNC-ready/i);
});

test("renders wall shelf store-trip minimum on detail and browser print routes", async ({ page }) => {
  await page.goto(`/projects/${wallShelfProjectId}`);

  await expect(page.getByRole("heading", { name: "E2E wall shelf buying minimum" })).toBeVisible();
  await expectVisualPacket(page, /Deterministic finished wall-shelf hero visual/i, ["Part A - Shelf board"]);
  await expect(page.getByText("Store-trip minimum").first()).toBeVisible();
  await expect(page.getByText("Plan for 1 shelf board.").first()).toBeVisible();
  await expect(page.getByText("Each board needs at least 42 in usable length.").first()).toBeVisible();
  await expect(page.getByText("Selected mounting method: Visible L brackets.").first()).toBeVisible();
  await expect(page.getByText("Intake support/bracket count: 3.").first()).toBeVisible();
  await expect(page.getByText("Modeled support/bracket count: 3 Visible L bracket placeholders.").first()).toBeVisible();

  await page.goto(`/projects/${wallShelfProjectId}/print`);

  await expect(page.getByText("Print build sheet").first()).toBeVisible();
  await expectVisualPacket(page, /Deterministic finished wall-shelf hero visual/i, ["Part A - Shelf board"]);
  await expect(page.getByText("Store-trip minimum")).toBeVisible();
  await expect(page.getByText("Plan for 1 shelf board.")).toBeVisible();
  await expect(page.getByText("Each board needs at least 42 in usable length.")).toBeVisible();
  await expect(page.getByText("Exact retail stock length still depends on available boards, defects, waste, and final layout.")).toBeVisible();
  await expect(page.getByText("Selected mounting method: Visible L brackets.").first()).toBeVisible();
  await expect(page.getByText("Intake support/bracket count: 3.").first()).toBeVisible();
  await expect(page.getByText("Modeled support/bracket count: 3 Visible L bracket placeholders.").first()).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/add to cart|checkout|vendor|price|load rated|certified|CAD-ready|CNC-ready/i);
});

test("renders multi-shelf and connected-unit visual packets on detail and browser print routes", async ({ page }) => {
  await page.goto(`/projects/${separateShelfProjectId}`);

  await expect(page.getByRole("heading", { name: "E2E separate wall shelves" })).toBeVisible();
  await expectVisualPacket(page, /Deterministic finished wall-shelf hero visual/i, ["Part A - Shelf boards"]);
  await expect(page.getByText("separate wall shelf assemblies").first()).toBeVisible();
  await expect(page.getByText("connected shelf unit assembly")).toHaveCount(0);

  await page.goto(`/projects/${separateShelfProjectId}/print`);

  await expect(page.getByText("Print build sheet").first()).toBeVisible();
  await expectVisualPacket(page, /Deterministic finished wall-shelf hero visual/i, ["Part A - Shelf boards"]);

  await page.goto(`/projects/${connectedShelfProjectId}`);

  await expect(page.getByRole("heading", { name: "E2E connected shelf review" })).toBeVisible();
  await expectVisualPacket(page, /Deterministic finished wall-shelf hero visual/i, ["Part A - Shelf boards", "Support/frame review"]);
  await expect(page.getByText("Support/frame review").first()).toBeVisible();
  await expect(page.getByText("Do not assemble connected unit yet").first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/projects/${connectedShelfProjectId}/print`);

  await expect(page.getByText("Print build sheet").first()).toBeVisible();
  await expectVisualPacket(page, /Deterministic finished wall-shelf hero visual/i, ["Part A - Shelf boards", "Support/frame review"]);

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/add to cart|checkout|vendor|price|load rated|certified|CAD-ready|CNC-ready|fabrication-ready/i);
});

function createWallShelfE2EProject(state: WallShelfFixtureState, id: string, title: string): Project {
  return createWallShelfFixtureProject(state, {
    id,
    title,
    intended_use:
      state === "connected_unresolved_support"
        ? "Connected wall shelf unit for light towels; side supports, frame, brackets, and mounting still need review."
        : "Separate wall shelves for light decor; wall mounting still needs review.",
  });
}

async function expectVisualPacket(page: Page, heroName: RegExp, expectedLabels: string[]) {
  const packetRoot = await packetRootLocator(page);
  const packetText = await packetRoot.innerText();
  expect(packetText.indexOf("Hero Visual")).toBeGreaterThan(-1);
  expect(packetText.indexOf("Project Visuals / Diagrams")).toBeGreaterThan(packetText.indexOf("Hero Visual"));
  expect(packetText.indexOf("Cut Checklist")).toBeGreaterThan(packetText.indexOf("Project Visuals / Diagrams"));
  expect(packetText.indexOf("Buying Plan")).toBeGreaterThan(packetText.indexOf("Cut Checklist"));
  expect(packetText.indexOf("Build Guide")).toBeGreaterThan(packetText.indexOf("Buying Plan"));

  for (const label of expectedLabels) {
    expect(packetText).toContain(label);
  }

  await expectNonBlankSvg(packetRoot.getByRole("img", { name: heroName }).first());
  const svgCount = await packetRoot.locator('svg[role="img"]').count();
  expect(svgCount).toBeGreaterThanOrEqual(4);
}

async function packetRootLocator(page: Page): Promise<Locator> {
  const detailRoot = page.locator("#printable-plan-sheet");
  if ((await detailRoot.count()) > 0) return detailRoot;
  return page.locator("main article");
}

async function expectNonBlankSvg(svg: Locator) {
  await expect(svg).toBeVisible();
  const summary = await svg.evaluate((element) => {
    const svgElement = element as SVGSVGElement;
    return {
      role: svgElement.getAttribute("role"),
      viewBox: svgElement.getAttribute("viewBox"),
      graphicNodes: svgElement.querySelectorAll("path,rect,polygon,line,circle,ellipse,text").length,
      textLength: svgElement.textContent.trim().length,
    };
  });

  expect(summary.role).toBe("img");
  expect(summary.viewBox).toMatch(/\d+\s+\d+\s+\d+\s+\d+/);
  expect(summary.graphicNodes).toBeGreaterThan(5);
  expect(summary.textLength).toBeGreaterThan(0);
}
