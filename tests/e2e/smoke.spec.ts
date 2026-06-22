import { expect, test } from "@playwright/test";

test("opens the app without a fatal browser error", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status(), "home page should not return a server error").toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).toContainText(/Boardsmith|Private MVP/i);

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/Application error|Internal Server Error|Unhandled Runtime Error|TypeError|ReferenceError/i);
});
