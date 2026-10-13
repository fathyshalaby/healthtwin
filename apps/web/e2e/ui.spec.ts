import { test, expect, type Page } from "@playwright/test";
import { shapesFor } from "@healthtwin/bodymap-core";

/** A front-view region's bbox — taps are derived from the shared geometry, so they follow any redraw. */
const front = (key: string) => shapesFor("anterior").find((s) => s.key === key)!.bbox;

/** Click at a point given in body-map SVG units, via the SVG's own screen transform — like a real tap. */
async function tapAt(page: Page, ux: number, uy: number) {
  const pt = await page.evaluate(([x, y]) => {
    const svg = document.querySelector<SVGSVGElement>('svg[aria-label^="Body map"]')!;
    const m = svg.getScreenCTM()!;
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  }, [ux, uy] as const);
  const vp = page.viewportSize()!;
  // Never "tap" off-screen: that silently clicks <html> and proves nothing.
  if (pt.x < 0 || pt.y < 0 || pt.x > vp.width || pt.y > vp.height) {
    throw new Error(`tapAt(${ux}, ${uy}) maps to (${pt.x}, ${pt.y}), outside the ${vp.width}×${vp.height} viewport`);
  }
  await page.mouse.click(pt.x, pt.y);
}

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

test("a tap lands on the region you touched, and records where on it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 }); // the whole figure on screen
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const form = (name: string) => page.getByRole("form", { name: `Log symptom for ${name}` });

  // Centre of the right shoulder — the chest's padding used to steal this.
  const shoulder = front("shoulder:right:anterior");
  await tapAt(page, shoulder.x + shoulder.w / 2, shoulder.y + shoulder.h / 2);
  await expect(form("Right Shoulder")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(form("Right Shoulder")).toBeHidden();

  // 3 units off the left hand (on no shape): a near miss goes to the nearest region.
  // (Tapped immediately after the previous sheet closed — that tap used to be cancelled by the closing sheet.)
  const hand = front("hand:left:anterior");
  await tapAt(page, hand.x - 3, hand.y + hand.h / 2);
  await expect(form("Left Hand")).toBeVisible();
  // A tap on the backdrop still dismisses (the stale-dismiss guard must not break real outside clicks).
  await page.mouse.click(20, 20);
  await expect(form("Left Hand")).toBeHidden();

  // Inside the LEFT knee, 4 units from its inner edge (toward the right knee) — used to be logged as the right knee.
  const knee = front("knee:left:anterior");
  await tapAt(page, knee.x + knee.w - 4, knee.y + knee.h / 2);
  await expect(form("Left Knee")).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(1);

  const stored = await page.evaluate(() => new Promise<{ side: string; point: { x: number; y: number } }[]>((resolve) => {
    const req = indexedDB.open("healthtwin");
    req.onsuccess = () => {
      const all = req.result.transaction("observations").objectStore("observations").getAll();
      all.onsuccess = () => resolve(all.result.map((o: { location: { side: string; point: { x: number; y: number } } }) => o.location));
    };
  }));
  expect(stored).toHaveLength(1);
  expect(stored[0].side).toBe("left");
  // where on the knee it landed: (w − 4) / w across, halfway down — not the old clamped {1, 1}.
  expect(stored[0].point.x).toBeCloseTo((knee.w - 4) / knee.w, 1);
  expect(stored[0].point.y).toBeCloseTo(0.5, 1);
});

test("keyboard-only capture: open, cancel, save and delete — announced, with focus never lost", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // exact: the open form's label ("Log symptom for Left Knee") also contains "Left Knee"
  const knee = page.getByLabel("Left Knee", { exact: true });
  const form = page.getByRole("form", { name: "Log symptom for Left Knee" });
  const announcer = page.getByTestId("announcer");

  await knee.focus();
  await page.keyboard.press("Enter");
  await expect(form).toBeVisible();
  await expect(page.locator("form.ht-entry :focus")).toHaveCount(1); // focus moved into the sheet

  await page.keyboard.press("Escape");
  await expect(form).toBeHidden();
  await expect(knee).toBeFocused(); // …and came back to the region that opened it

  await page.keyboard.press("Enter");
  await expect(form).toBeVisible();
  // Record, at the moment the live region changes, whether a (modal) dialog is still mounted —
  // some screen readers ignore live-region updates outside an aria-modal dialog.
  await announcer.evaluate((el) => {
    const w = window as unknown as { __spoken: { text: string; dialog: boolean; hidden: boolean }[] };
    w.__spoken = [];
    new MutationObserver(() => {
      if (el.textContent) w.__spoken.push({ text: el.textContent, dialog: !!document.querySelector('[role="dialog"]'), hidden: !!el.closest('[aria-hidden="true"]') });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });
  await page.getByRole("button", { name: "Save" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("entry")).toHaveCount(1);
  await expect(announcer).toHaveText("Saved: Left Knee, pain, 5 of 10.");
  const spoken = await page.evaluate(() => (window as unknown as { __spoken: unknown[] }).__spoken);
  expect(spoken).toEqual([{ text: "Saved: Left Knee, pain, 5 of 10.", dialog: false, hidden: false }]);
  await expect(knee).toBeFocused();

  await page.getByRole("button", { name: "Delete" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("entry")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Entries" })).toBeFocused(); // not dropped to <body>
  await expect(announcer).toHaveText("Deleted Left Knee entry. 0 entries left.");
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
