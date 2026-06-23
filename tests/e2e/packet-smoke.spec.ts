import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "../project-test-helpers";

const e2eDataFile = process.env.BOARDSMITH_DATA_FILE ?? ".data/playwright-e2e.json";
const projectId = "e2e-planter-packet";
const planId = "e2e-planter-packet-plan";

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

test.beforeEach(async () => {
  const project = createProject();
  const buildModel = createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
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

  await rm(e2eDataFile, { force: true });
  await mkdir(path.dirname(e2eDataFile), { recursive: true });
  await writeFile(e2eDataFile, `${JSON.stringify({ projects: [project], plans: [planRecord] }, null, 2)}\n`, "utf8");
});

test("renders seeded planter packet on detail and browser print routes", async ({ page }) => {
  await page.goto(`/projects/${projectId}`);

  await expect(page.getByRole("heading", { name: "E2E non-critical planter packet" })).toBeVisible();
  await expect(page.getByText("Planter Box Buying Plan")).toBeVisible();
  await expect(page.getByText("Build Guide").first()).toBeVisible();
  await expect(page.getByText("Dry fit planter box and confirm panel connections")).toBeVisible();
  await expect(page.getByText("Part E - Bottom panel").first()).toBeVisible();

  await page.goto(`/projects/${projectId}/print`);

  await expect(page.getByText("Print build sheet").first()).toBeVisible();
  await expect(page.getByText("Planter Box Buying Plan")).toBeVisible();
  await expect(page.getByText("Dry fit planter box and confirm panel connections")).toBeVisible();
  await expect(page.getByText("Boardsmith does not generate PDF, CAD, CNC, or export/download files.")).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/add to cart|checkout|vendor|price|load rated|certified|CAD-ready|CNC-ready/i);
});
