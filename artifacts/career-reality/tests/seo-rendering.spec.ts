import { expect, test } from "./fixtures";
import { readFileSync } from "node:fs";

const registry = JSON.parse(readFileSync(new URL("../src/data/route-registry.json", import.meta.url), "utf8")) as {
  redirects: Array<{ from: string; to: string; status: number }>;
};

test.describe("crawler and client route identity", () => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION !== "true", "Requires generated production snapshots.");

  test("retired company and category URLs keep their registered redirects and destination metadata", async ({ page, request }) => {
    test.setTimeout(120_000);
    const paths = [
      "/companies/infosys",
      "/companies/amazon-india",
      "/category/engineering",
      "/category/software-engineering",
      "/category/career-strategy",
      "/category/career-reality-checks",
      "/category/money-reality",
      "/category/career-growth",
    ];
    const checkedDestinations = new Set<string>();
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const path of paths) {
      const redirect = registry.redirects.find((entry) => entry.from === path)!;
      expect(redirect, `${path} must retain a registered retirement destination`).toBeTruthy();
      const response = await request.get(`${path}/`, { maxRedirects: 0 });
      expect(response.status()).toBe(redirect.status);
      expect(response.headers().location).toBe(redirect.to);

      const destination = redirect.to;
      const navigation = await page.goto(`${path}/`, { waitUntil: "domcontentloaded" });
      expect(navigation?.ok()).toBeTruthy();
      expect(new URL(page.url()).pathname).toBe(destination);
      const snapshot = await navigation!.text();
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".snapshot-shell")).toHaveCount(0);

      const { initial, hydrated } = await page.evaluate((html) => {
        function metadata(doc: Document) {
          const content = (selector: string) => doc.querySelector(selector)?.getAttribute("content");
          const schema = (id: string) => JSON.parse(doc.querySelector(`script[data-career-seo-schema="${id}"]`)?.textContent ?? "null");
          return {
            title: doc.title,
            description: content('meta[name="description"]'),
            ogTitle: content('meta[property="og:title"]'),
            ogDescription: content('meta[property="og:description"]'),
            twitterTitle: content('meta[name="twitter:title"]'),
            twitterDescription: content('meta[name="twitter:description"]'),
            canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
            ogUrl: content('meta[property="og:url"]'),
            ogImage: content('meta[property="og:image"]'),
            twitterImage: content('meta[name="twitter:image"]'),
            site: schema("site"),
            breadcrumbs: schema("breadcrumbs"),
            webApplication: schema("webapp"),
            rulesPage: schema("webpage"),
          };
        }
        return { initial: metadata(new DOMParser().parseFromString(html, "text/html")), hydrated: metadata(document) };
      }, snapshot);

      expect(hydrated, `${path}: hydration must preserve crawler-visible destination identity`).toEqual(initial);
      expect(hydrated.title).toBeTruthy();
      expect(hydrated.description).toBeTruthy();
      expect(hydrated.ogTitle).toBe(hydrated.title);
      expect(hydrated.twitterTitle).toBe(hydrated.title);
      expect(hydrated.ogDescription).toBe(hydrated.description);
      expect(hydrated.twitterDescription).toBe(hydrated.description);
      const canonical = new URL(hydrated.canonical!);
      expect(canonical.pathname).toBe(destination);
      expect(canonical.origin).not.toBe(new URL(page.url()).origin);
      expect(hydrated.ogUrl).toBe(canonical.href);
      for (const image of [hydrated.ogImage, hydrated.twitterImage]) {
        expect(new URL(image!).origin).toBe(canonical.origin);
      }
      if (!checkedDestinations.has(destination)) {
        expect(titles.has(hydrated.title)).toBe(false);
        expect(descriptions.has(hydrated.description!)).toBe(false);
        titles.add(hydrated.title);
        descriptions.add(hydrated.description!);
        checkedDestinations.add(destination);
      }
    }
  });
});
