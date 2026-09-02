import { test, expect } from "@playwright/test";

test("dark mode toggle persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Switch to dark mode/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /Switch to light mode/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
