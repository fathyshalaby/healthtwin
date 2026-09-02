import { test, expect } from "@playwright/test";

test("embedded widget delivers a capture event to the host", async ({ page }) => {
  await page.goto("/embed");
  await expect(page.getByRole("heading", { name: /Drop it into any site/ })).toBeVisible();
  await page.locator(".embed-frame").getByLabel("Left Knee").click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Events received")).toContainText(/knee/i);
  await expect(page.getByLabel("Events received")).toContainText("1");
});
