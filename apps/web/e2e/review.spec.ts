import { test, expect } from "@playwright/test";

test("a captured entry shows on the review timeline", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Left Knee").click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(1);

  await page.getByRole("link", { name: /Review/ }).click();
  await expect(page.getByTestId("timeline-entry")).toHaveCount(1);
  await expect(page.getByTestId("timeline-entry")).toContainText("Knee");
});
