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
    expect(redirect, `${article.slug} must keep its original URL until approved`).toBeUndefined();
    expect(article.heroImage?.alt, `${article.slug} must have meaningful hero-image alt text`).toBeTruthy();

    const path = `/article/${article.slug}`;
    const response = await request.get(path);
    expect(response.ok(), `${article.slug} must remain accessible`).toBeTruthy();
    await page.evaluate((nextPath) => {
      window.history.pushState(null, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    }, path);
    const actualPath = new URL(page.url()).pathname.replace(/\/+$/, "");
    expect(actualPath, `${article.slug} must remain on the preserved URL`).toBe(`/article/${article.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: "This article is not published." })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: article.title })).toHaveCount(0);
  }
});
