import { rm } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const e2eDataFile = process.env.BOARDSMITH_DATA_FILE ?? ".data/playwright-e2e.json";

test.beforeEach(async () => {
  await rm(e2eDataFile, { force: true });
});

async function quickSelectBasicTools(page: Page) {
  await page.getByRole("button", { name: /Quick select: Basic layout tools/i }).click();
}

async function fillValidShelfProject(page: Page, title: string) {
  await page.goto("/projects/new");
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Project type").selectOption("simple_shelf");
  await page.getByLabel("Skill level").selectOption("beginner");
  await page.getByLabel("Shelf layout").selectOption("single_shelf");
  await page.getByLabel("Number of shelves").fill("1");
  await page.getByLabel("Shelf width, inches").fill("30");
  await page.getByLabel("Shelf depth from wall, inches").fill("8");
  await page.getByLabel("Actual board thickness, inches").fill("0.75");
  await page.getByLabel("Board material").fill("pine board");
  await page.getByLabel("How do you want to mount it?").selectOption("visible_l_brackets");
  await page.getByLabel("What will it mount into?").selectOption("drywall_wood_studs");
  await page.getByLabel("Can you attach to studs?").selectOption("yes");
  await page.getByLabel("What will the shelf hold?").selectOption("light_decor");
  await quickSelectBasicTools(page);
  await page.getByLabel("Anything else Boardsmith should know?").fill("Light decor shelf for a non-critical wall spot.");
}

test("intake form live summary, risk exclusivity, and save label behave like a first-time setup", async ({ page }) => {
  await page.goto("/projects/new");

  await expect(page.getByText("Critical missing info")).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete required info to save" })).toBeVisible();

  await quickSelectBasicTools(page);
  await expect(page.getByText("4 tools selected")).toBeVisible();

  await page.getByLabel("None of these").check();
  await expect(page.getByLabel("None of these")).toBeChecked();
  await page.getByLabel("Child-accessible").check();
  await expect(page.getByLabel("Child-accessible")).toBeChecked();
  await expect(page.getByLabel("None of these")).not.toBeChecked();

  await page.getByLabel("Project title").fill("Ledger QA shelf");
  await page.getByLabel("Project type").selectOption("simple_shelf");
  await page.getByLabel("Skill level").selectOption("beginner");
  await page.getByLabel("Shelf width, inches").fill("24");
  await page.getByLabel("Shelf depth from wall, inches").fill("8");
  await page.getByLabel("Actual board thickness, inches").fill("0.75");
  await page.getByLabel("Board material").fill("pine board");
  await page.getByLabel("Anything else Boardsmith should know?").fill("Small wall shelf for light decor only.");

  await expect(page.getByRole("button", { name: "Save and review project" })).toBeVisible();
});

test("dashboard idea draft opens the review form before save", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Start with an idea").fill(
    "Bathroom wall shelf, 24 x 8 x 6 inches, 3/4 inch pine board, drill and sander available, towels only, mount into studs if possible, painted finish.",
  );
  await page.getByRole("button", { name: "Draft setup fields" }).click();

  await expect(page).toHaveURL(/\/projects\/new\?draft=idea/);
  await expect(page.getByText("Idea drafted into setup fields - review before saving.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tell Boardsmith what you want to build" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save and review project|Complete required info to save/ })).toBeVisible();
});

test("project library search, archive, archived filter, and restore work from real browser actions", async ({ page }) => {
  const title = "Ledger archive restore shelf";
  await fillValidShelfProject(page, title);
  await page.getByRole("button", { name: "Save and review project" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.goto("/projects");
  await page.getByLabel("Search Projects").fill("archive restore");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "Archive project" }).click();
  await expect(page).toHaveURL(/\/projects\?archived=1/);
  await expect(page.getByText("Project archived. It is hidden from the active project list, and its plans are preserved.")).toBeVisible();

  await page.getByLabel("Workspace").selectOption("archived");
  await page.getByLabel("Search Projects").fill("archive restore");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Archived").first()).toBeVisible();

  await page.getByRole("button", { name: "Restore project" }).click();
  await expect(page).toHaveURL(/\/projects\?archive=archived&restored=1/);
  await expect(page.getByText("Project restored to the active project list.")).toBeVisible();
});

test("project notes and build log save through the detail record without changing plan state", async ({ page }) => {
  const title = "Ledger project record shelf";
  await fillValidShelfProject(page, title);
  await page.getByRole("button", { name: "Save and review project" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.locator('textarea[name="notes"]').fill("Confirm bracket finish and paint color before buying.");
  await page.getByRole("button", { name: "Save notes" }).click();
  await expect(page.getByText("Project notes saved.")).toBeVisible();
  await expect(page.locator("#project-record p").filter({ hasText: "Confirm bracket finish and paint color before buying." })).toBeVisible();

  await page.getByLabel("Project was completed").check();
  await page.locator('input[name="build_completed_at"]').fill("2026-06-24");
  await page.locator('textarea[name="build_actual_material"]').fill("Used pine common board and visible L brackets.");
  await page.locator('textarea[name="build_plan_changes"]').fill("Shifted mounting height after checking the wall.");
  await page.locator('textarea[name="build_lessons_learned"]').fill("Dry fit brackets before marking holes.");
  await page.getByRole("button", { name: "Save build log" }).click();

  await expect(page.getByText("Build log saved.")).toBeVisible();
  await expect(page.locator("#project-record p").filter({ hasText: "Project was completed" })).toBeVisible();
  await expect(page.locator("#project-record p").filter({ hasText: "Used pine common board and visible L brackets." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No generated plan yet" })).toBeVisible();
});
