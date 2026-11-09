import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures";
import { pageHeadings } from "../src/data/page-headings";
import { toolFaqs } from "../src/data/tool-faqs";

const registry = JSON.parse(readFileSync(new URL("../src/data/route-registry.json", import.meta.url), "utf8")) as {
  routes: Array<{ path: string; render: string }>;
};
const snapshotPaths = new Set(registry.routes.filter((route) => route.render === "snapshot").map((route) => route.path));
const normalize = (value: string | null) => (value ?? "").replace(/\s+/g, " ").trim();

test.describe("prerendered and hydrated pages say the same thing", () => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION !== "true" && process.env.PLAYWRIGHT_PUBLISHED !== "true", "Requires generated production snapshots.");

  for (const [path, heading] of Object.entries(pageHeadings)) {
    if (!snapshotPaths.has(path)) continue;
    test(`H1 and FAQ match on ${path}`, async ({ page }) => {
      const url = path === "/" ? "/" : `${path}/`;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".snapshot-shell")).toHaveCount(0, { timeout: 30_000 });
      await expect(page.locator("h1")).toHaveCount(1);
      expect(normalize(await page.locator("h1").textContent())).toBe(heading.h1);
      for (const faq of toolFaqs[path] ?? []) {
        await expect(page.locator("summary", { hasText: faq.question }).first()).toBeAttached();
      }
    });
  }
});
