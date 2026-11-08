import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { withTrailingSlash } from "../src/lib/internal-href";

const registry = JSON.parse(readFileSync(new URL("../src/data/route-registry.json", import.meta.url), "utf8")) as {
  routes: Array<{ path: string; kind: string; description: string }>;
};

test("hydration and client navigation keep registry descriptions and publisher logos", async ({ page }) => {
  test.setTimeout(60_000);
  const routes = [
    "/",
    "/tools",
    "/salary-calculator",
    "/companies",
    "/guides",
    "/guides/read-the-offer-beyond-ctc",
    "/guides/engineering-careers-without-the-title-trap",
    "/rules/ctc-components",
    "/privacy-policy",
  ];
  for (const path of routes) {
    const route = registry.routes.find((entry) => entry.path === path)!;
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", route.description);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", route.description);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", route.description);
    if (route.kind === "guide") {
      const schemas = await page.locator('script[data-career-seo-schema="article"]').allTextContents();
      const article = schemas.map((text) => JSON.parse(text)).find((schema) => schema["@type"] === "Article");
      expect(article?.publisher.logo).toMatch(/^https?:\/\/[^/]+\/logo\.svg$/);
      expect(article?.description).toBe(route.description);
    }
  }
  await page.goto("/guides", { waitUntil: "domcontentloaded" });
  const target = registry.routes.find((entry) => entry.path === "/guides/read-the-offer-beyond-ctc")!;
  await page.locator(`a[href="${withTrailingSlash(target.path)}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`${target.path}/?$`));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", target.description);
});
