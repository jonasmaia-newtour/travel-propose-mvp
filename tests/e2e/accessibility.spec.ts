import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
