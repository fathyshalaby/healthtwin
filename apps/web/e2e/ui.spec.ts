import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/review", "/insights", "/report", "/share", "/embed", "/sdk", "/partner"];

test("every route renders without console or page errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text()}`);
  });
  for (const route of ROUTES) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(problems).toEqual([]);
});

test("a seeded week renders the vitals + correlation charts without errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));

  await page.goto("/insights");
  await page.waitForLoadState("networkidle"); // let React hydrate before clicking
  await page.getByRole("button", { name: /seed a demo week/i }).click();

  // Demo data is anchored to today, so it must land inside Review's default 30-day window.
  await expect(page.getByText(/strong inverse correlation/i).first()).toBeVisible();
  await expect(page.getByRole("img", { name: /inverse correlation, r/i }).first()).toBeVisible();
  await expect(page.locator(".vital")).toHaveCount(2);
  // Seeding writes day by day; wait for it to finish (button re-enables) before navigating away.
  await expect(page.getByRole("button", { name: "Seed a demo week" })).toBeEnabled();

  await page.goto("/review");
  await expect(page.getByTestId("timeline-entry")).toHaveCount(7);
  expect(problems).toEqual([]);
});

test("⌘K opens the command palette and jumps to a page", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await page.getByPlaceholder(/jump to a page/i).fill("review");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/review$/);
  await expect(palette).toBeHidden();
});

test("hovering a body region names it in the live readout", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".readout")).toContainText("Tap a region");
  await page.getByLabel("Left Knee").hover();
  await expect(page.locator(".readout")).toContainText("Left Knee");
});

test("entries say which side — Left Knee, not just Knee", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Left Knee").click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toContainText("Left Knee");
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the dock replaces the desktop nav and navigates", async ({ page }) => {
    await page.goto("/");
    // Exactly one visible "Review" link: the dock's. (The desktop pill is display:none under 768px.)
    const review = page.getByRole("link", { name: "Review" });
    await expect(review).toHaveCount(1);
    await review.click();
    await expect(page).toHaveURL(/\/review$/);
    await expect(page.getByRole("link", { name: "Review" })).toHaveAttribute("aria-current", "page");
  });

  test("a real tap on the knee opens the log sheet (the dock never blocks the figure)", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Left Knee").click(); // un-forced: fails if something covers it
    await expect(page.getByRole("form", { name: /Log symptom for Left Knee/ })).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("entry")).toHaveCount(1);
  });
});
