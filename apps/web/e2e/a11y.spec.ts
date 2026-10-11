import { test, expect, type Page } from "@playwright/test";

// Specs compile to CommonJS here (apps/web is not "type": "module"), so plain require.resolve is correct.
const AXE_PATH = require.resolve("axe-core/axe.min.js");

const ROUTES = ["/", "/review", "/insights", "/report", "/share", "/embed", "/sdk", "/partner"];

declare global {
  // injected by axe.min.js
  // eslint-disable-next-line no-var
  var axe: { run: (ctx: Document, opts: unknown) => Promise<{ violations: AxeViolation[] }> };
}
interface AxeViolation { id: string; impact?: string; help: string; nodes: { target: unknown[]; failureSummary?: string }[] }

/** Seed a demo week so entries, charts, the timeline and the report are all on screen when audited. */
async function seed(page: Page) {
  await page.goto("/insights");
  await page.waitForLoadState("networkidle"); // let React hydrate before clicking
  await page.getByRole("button", { name: /seed a demo week/i }).click();
  await expect(page.getByRole("button", { name: "Seed a demo week" })).toBeEnabled();
  await expect(page.locator(".vital")).toHaveCount(2);
}

async function audit(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(900); // let mount animations settle so contrast is measured on final colours
  await page.addScriptTag({ path: AXE_PATH });
  const { violations } = await page.evaluate(() =>
    globalThis.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } }),
  );
  return violations.map((v) => `${route} ${v.id} [${v.impact}] ${v.help}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test(`every route has no WCAG A/AA violations (${scheme})`, async ({ page }) => {
      test.setTimeout(90_000);
      await seed(page);
      const problems: string[] = [];
      for (const route of ROUTES) problems.push(...(await audit(page, route)));
      expect(problems).toEqual([]);
    });
  });
}
