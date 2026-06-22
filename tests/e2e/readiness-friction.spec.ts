import { rm } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const e2eDataFile = process.env.BOARDSMITH_DATA_FILE ?? ".data/playwright-e2e.json";

test.beforeEach(async () => {
  await rm(e2eDataFile, { force: true });
});

async function fillCommonProjectFields(page: Page, title: string, projectType: string) {
  await page.goto("/projects/new");
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Project type").selectOption(projectType);
  await page.getByLabel("Skill level").selectOption("beginner");
  await page.getByRole("button", { name: /Quick select: Basic layout tools/i }).click();
}

test("garage utility shelf asks for support count without treating electrical exclusions as electrical scope", async ({ page }) => {
  await fillCommonProjectFields(page, "Garage utility shelf e2e", "simple_shelf");

  await page.getByLabel("Shelf layout").selectOption("single_shelf");
  await page.getByLabel("Number of shelves").fill("1");
  await page.getByLabel("Shelf width, inches").fill("48");
  await page.getByLabel("Shelf depth from wall, inches").fill("14");
  await page.getByLabel("Actual board thickness, inches").fill("0.75");
  await page.getByLabel("Board material").fill("pine board");
  await page.getByLabel("How do you want to mount it?").selectOption("visible_l_brackets");
  await page.getByLabel("What will it mount into?").selectOption("drywall_studs_unknown");
  await page.getByLabel("Can you attach to studs?").selectOption("not_sure");
  await page.getByLabel("What will the shelf hold?").selectOption("books_heavy_items");
  await page.getByLabel("Anything behind or near the shelf location?").fill("Avoid electrical work on this wall.");
  await page.getByLabel("Anything else Boardsmith should know?").fill("Garage shelf for storage bins and tools. No wiring or lighting.");

  await page.getByRole("button", { name: /Save and review project|Save incomplete setup/i }).click();

  await expect(page).toHaveURL(/\/projects\/[^/]+/);
  await expect(page.getByText("Plan readiness")).toBeVisible();
  await expect(page.getByText("How many brackets or supports should be reviewed for the heavier shelf use?")).toBeVisible();
  await expect(page.getByText("Can the plan exclude electrical wiring")).not.toBeVisible();

  await page.getByRole("button", { name: /^Generate Plan$/ }).click();

  await expect(page).toHaveURL(/generation_error=clarification_gate.*#plan-readiness/);
  await expect(page.getByText("How many brackets or supports should be reviewed for the heavier shelf use?")).toBeVisible();
});

test("raised planter idea shows a specific support-template boundary before generation", async ({ page }) => {
  await fillCommonProjectFields(page, "Raised herb planter e2e", "planter_box");

  await page.getByLabel("Shelf width, inches").fill("36");
  await page.getByLabel("Shelf depth from wall, inches").fill("14");
  await page.getByLabel("Actual board thickness, inches").fill("0.75");
  await page.getByLabel("Board material").fill("cedar 1x6");
  await page.getByText("Extra details only if needed").click();
  await page.locator('input[name="height_inches"]').fill("18");
  await page.getByLabel("Moisture exposure").selectOption("covered_outdoor");
  await page.getByLabel("Anything else Boardsmith should know?").fill("Outdoor herb planter standing off the ground with raised legs and a support frame.");

  await page.getByRole("button", { name: /Save and review project|Save incomplete setup/i }).click();

  await expect(page).toHaveURL(/\/projects\/[^/]+/);
  await expect(page.getByText("Plan readiness")).toBeVisible();
  await expect(page.getByText("Should this stay a ground-level planter box")).toBeVisible();
  await expect(page.getByText("outside the current rectangular planter-box template")).toBeVisible();

  await page.getByRole("button", { name: /^Generate Plan$/ }).click();

  await expect(page).toHaveURL(/generation_error=clarification_gate.*#plan-readiness/);
  await expect(page.getByText("Should this stay a ground-level planter box")).toBeVisible();
});
