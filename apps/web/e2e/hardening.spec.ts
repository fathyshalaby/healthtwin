import { test, expect } from "@playwright/test";

test("edit then delete a captured entry", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Left Knee").click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(1);

  // Edit → re-save (supersedes; still one live entry)
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(1);

  // Delete → tombstone → gone
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(0);
});

test("captures on the back view (lower back)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel("Lower Back").click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toContainText("Lower Back");
});
