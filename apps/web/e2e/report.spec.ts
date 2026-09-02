import { test, expect } from "@playwright/test";

test("clinician report shows a captured entry", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Left Knee").click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(1);

  await page.getByRole("link", { name: "Report", exact: true }).click();
  await expect(page.getByRole("heading", { name: /between-visit body record/i })).toBeVisible();
  await expect(page.getByTestId("report-entry")).toContainText("Knee");
  await expect(page.getByTestId("data-bar")).toContainText("this browser");
});
