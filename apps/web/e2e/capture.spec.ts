import { test, expect } from "@playwright/test";

test("capture a knee entry and see it listed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Left Knee").click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(1);
  await expect(page.getByTestId("entry")).toContainText("Knee");
});
