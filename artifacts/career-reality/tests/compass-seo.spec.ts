import { expect, test } from "./fixtures";
import registry from "../src/data/route-registry";
import { routeSeoTitle } from "../src/data/seo-title";

const compass = registry.routes.find((route) => route.path === "/compass")!;

test.describe("Compass client-navigation metadata", () => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION !== "true", "Indexability must be checked in a production build, not the noindex development preview.");

  for (const origin of [
    { path: "/tools/", link: true },
    { path: "/sitemap/", link: true },
    { path: "/salary-calculator/", schema: "faq" },
    { path: "/guides/performance-reviews-and-career-choices/", schema: "article" },
  ]) {
    test(`replaces route metadata from ${origin.path}`, async ({ page }) => {
      await page.goto(origin.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("data-career-seo", "canonical");
      if (origin.path === "/sitemap/") {
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
      }
      if (origin.schema) {
        await expect(page.locator(`script[data-career-seo-schema="${origin.schema}"]`)).toHaveCount(1);
      }
      // A document marker proves this is an SPA transition, not a new snapshot.
      await page.evaluate(() => { document.documentElement.dataset.spaNavigation = "preserved"; });
      if (origin.link) {
        await page.locator('a[href="/compass/"]').first().click();
      } else {
        // Wouter observes pushState, the same history operation used by its links.
        await page.evaluate(() => window.history.pushState(null, "", "/compass"));
      }
      await expect(page).toHaveURL(/\/compass\/?$/);
      await expect(page).toHaveTitle(routeSeoTitle(compass));
      await expect(page.locator("html")).toHaveAttribute("data-spa-navigation", "preserved");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", compass.description);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute("href", /\/compass\/$/);
      const canonicalUrl = await canonical.getAttribute("href");
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonicalUrl!);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
      for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
        await expect(page.locator(selector)).toHaveAttribute("content", routeSeoTitle(compass));
      }
      for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) {
        await expect(page.locator(selector)).toHaveAttribute("content", compass.description);
      }
      await expect(page.locator('script[data-career-seo-schema="article"], script[data-career-seo-schema="faq"]')).toHaveCount(0);
      const breadcrumbs = JSON.parse((await page.locator('script[data-career-seo-schema="breadcrumbs"]').textContent())!);
      expect(breadcrumbs.itemListElement.at(-1).item).toBe(canonicalUrl);
      expect(breadcrumbs.itemListElement.at(-1).name).toBe(compass.title);
    });
  }
});
