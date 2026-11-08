import { expect, test } from "./fixtures";
import { readFileSync } from "node:fs";
import { archivedArticleRecords, articles } from "../src/data/content";

const routeRegistry = JSON.parse(
  readFileSync(new URL("../src/data/route-registry.json", import.meta.url), "utf8"),
) as {
  routes: Array<{ path: string; title: string }>;
  redirects: Array<{ from: string; to: string }>;
};

test("archived article catalogue stays out of the public UI and structured data", async ({ page, request }) => {
  test.setTimeout(120_000);
  expect(articles).toEqual([]);
  await page.goto("/articles", { waitUntil: "domcontentloaded" });
  await expect(page.locator('a[href^="/article/"]')).toHaveCount(0);

  for (const article of archivedArticleRecords) {
    const redirect = routeRegistry.redirects.find(
      (entry) => entry.from.replace(/\/+$/, "") === `/article/${article.slug}`,
    );
    expect(redirect?.status, `${article.slug} must 301 to its replacement guide`).toBe(301);
    expect(redirect?.to, `${article.slug} must 301 to a guide`).toMatch(/^\/guides\//);
    expect(article.heroImage?.alt, `${article.slug} must have meaningful hero-image alt text`).toBeTruthy();

    const path = `/article/${article.slug}`;
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), `${article.slug} must redirect`).toBe(301);
    expect(response.headers().location, `${article.slug} must go to its guide`).toContain(redirect?.to ?? "/guides/");
  }
});
