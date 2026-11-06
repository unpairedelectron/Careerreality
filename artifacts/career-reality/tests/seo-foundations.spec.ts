import { expect, test } from "./fixtures";
import { archivedArticleRecords, articles, articleCategories } from "../src/data/content";
import { editorialPrimaryIntents } from "../src/data/editorial-briefs";
import { ARTICLE_TITLE_MAX_LENGTH, ARTICLE_TITLE_SUFFIX } from "../src/data/editorial-metadata";
import routeRegistry from "../src/data/route-registry";

function decodeHtmlValue(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

test.describe("public SEO foundations", () => {
  test("renders complete, route-specific trust pages", async ({ page }) => {
    const routes = [
      { path: "/about", heading: "CareerReality, made for consequential decisions.", marker: "Current public scope" },
      { path: "/team", heading: "People behind CareerReality.", marker: "Affiliation" },
      { path: "/editorial", heading: "Evidence, limits, and uncertainty.", marker: "Evidence before conclusion" },
      { path: "/privacy-policy", heading: "Privacy and data handling.", marker: "Contact message records" },
      { path: "/terms", heading: "Limits and use of CareerReality.", marker: "Tools and guides" },
      { path: "/contact", heading: "Contact CareerReality Editorial.", marker: "Email and operator" },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.getByText(route.marker, { exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Contact" }).first()).toBeVisible();
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(3);
    }

    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#identity")).toContainText("Doffysoft pvt. Limited");
    await expect(page.locator("#identity")).toContainText("Hinjewadi Phase 3, Pune");
    const siteSchema = JSON.parse((await page.locator('script[data-career-seo-schema="site"]').textContent()) ?? "{}");
    const graph = siteSchema["@graph"] as Array<Record<string, unknown>>;
    expect(graph.some((entry) => entry["@type"] === "Person")).toBe(false);
    expect(graph.some((entry) => entry["@type"] === "Organization" && entry.name === "Doffysoft pvt. Limited." && entry.email === "hello@careerreality.in")).toBe(true);

    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href="mailto:hello@careerreality.in"]').first()).toBeVisible();
    await expect(page.getByTestId("form-contact")).toHaveCount(0);
  });

  test("does not render unknown article routes in the client application", async ({ page }) => {
    await page.goto("/article/not-a-registered-article-slug", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1")).toContainText(/not found/i);
    await expect(page.locator('script[data-career-seo-schema="article"]')).toHaveCount(0);
  });

  test("published archived article URL returns 404 or 410 after the approved release", async ({ request }) => {
    test.skip(process.env.PLAYWRIGHT_PUBLISHED !== "true", "This check runs against the published custom origin.");

    const articlePath = "/article/indian-it-layoff-cycle-2026/";
    const response = await request.get(articlePath);
    expect([404, 410]).toContain(response.status());
    expect(await response.text()).not.toContain('"@type":"Article"');
  });

  test("publishes unique route metadata and one canonical URL", async ({ page }) => {
    const routes = [
      { path: "/salary-calculator", type: "website" },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/CareerReality/);

      const head = await page.evaluate(() => ({
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
        canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
        ogType: document.querySelector('meta[property="og:type"]')?.getAttribute("content"),
        schemaCount: document.querySelectorAll('script[type="application/ld+json"]').length,
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
        articleSchema: document.querySelector('script[data-career-seo-schema="article"]')?.textContent ?? "",
      }));

      expect(head.description.length).toBeGreaterThan(100);
      expect(new URL(head.canonical).pathname).toBe(`${route.path}/`);
      expect(head.canonicalCount).toBe(1);
      expect(head.ogType).toBe(route.type);
      expect(head.schemaCount).toBe(3);
      expect(head.robots).toMatch(/noindex/);
    }
  });

  test("serves an XML sitemap without quarantined routes or calculator state", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toMatch(/(?:application|text)\/xml/);
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    const sitemapPaths = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1]).pathname);
    expect(sitemapPaths).not.toContain("/search/");
    expect(sitemapPaths).not.toContain("/articles/");
    expect(sitemapPaths).not.toContain("/salary-calculator/");
    expect(sitemapPaths.some((path) => /^\/article\//.test(path))).toBe(false);
    expect(sitemapPaths.some((path) => /^\/companies\/[^/]+\/$/.test(path))).toBe(false);
    expect(sitemapPaths.some((path) => /^\/(?:category|topic-clusters)\//.test(path))).toBe(false);
    expect(sitemapPaths.some((path) => /[?&](?:ctc|salary|offer|fixed|variable|pf|city|tax)=/i.test(path))).toBe(false);
  });

  test("serves the declared social preview image and organization logo", async ({ request }) => {
    const socialImage = await request.get("/social-card.png");
    expect(socialImage.ok()).toBeTruthy();
    expect(socialImage.headers()["content-type"]).toMatch(/image\/png/);
    const imageBytes = await socialImage.body();
    expect(imageBytes.readUInt32BE(16)).toBe(1200);
    expect(imageBytes.readUInt32BE(20)).toBe(630);

    const logo = await request.get("/logo.svg");
    expect(logo.ok()).toBeTruthy();
    expect(logo.headers()["content-type"]).toMatch(/image\/svg\+xml/);
  });

  test("redirects retired company routes to the due-diligence hub", async ({ page }) => {
    await page.goto("/companies/infosys", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/companies\/?$/);
    await expect(page.locator("h1")).toContainText(/check the employer behind the offer/i);
    await expect(page.getByTestId("input-officialDomain")).toBeVisible();
  });

  test("shows the shared calculator example and an official PF source on the offer guide", async ({ page }) => {
    await page.goto("/guides/read-the-offer-beyond-ctc/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Worked example" })).toBeVisible();
    const example = page.getByRole("table");
    await expect(example).toContainText("Full target variable");
    await expect(example).toContainText("Zero variable payout");
    await expect(page.getByRole("link", { name: "EPFO: FAQs on revision of statutory wage ceiling" })).toHaveAttribute(
      "href",
      "https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf",
    );
  });

  test("keeps internal search out of the index", async ({ page, request }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/search/");
  });

  test("does not hand off retired legacy AI URLs to unrelated content", async ({ page }) => {
    const routes = [
      "/ai/openai-o1-reasoning-shift",
      "/ai/gpt-4-1-coding-reliability-shift",
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toContainText(/not found/i);
      await expect(page.getByRole("link", { name: "Open the AI career pulse" })).toHaveCount(0);
      await expect(page.getByText("Indexed route retained", { exact: true })).toHaveCount(0);
    }
  });

  test("publishes an AI-readable public content guide", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.ok()).toBeTruthy();
    const guide = await response.text();
    expect(guide).toContain("# CareerReality");
    expect(guide).not.toContain("https://careerreality.in/salary-calculator/");
    for (const path of ["/guides/", "/rules/", "/layoffs/", "/layoff-runway/", "/compass/", "/offer-comparison/"]) {
      expect(guide).toContain(`https://careerreality.in${path}`);
    }
    expect(guide).toContain("dated, source-linked event records");
    expect(guide).toContain("not a robots directive");
    expect(guide).not.toContain("Other noindex tools");
    expect(guide).not.toContain("local release candidate");
    expect(guide).toContain("https://careerreality.in/sitemap.xml");
    expect(guide).not.toContain("/articles/");
    expect(guide).toContain("https://careerreality.in/companies/");
    expect(guide).toContain("not an owner-approved privacy policy");
    expect(guide).not.toContain("indigo-bowed-megabyte.replit.app");
  });

  test("keeps the complete article SEO catalogue internally consistent", () => {
    const slugs = new Set(archivedArticleRecords.map((article) => article.slug));
    const intents = new Set(archivedArticleRecords.map((article) => article.editorial.primaryIntent));
    const titles = new Set(archivedArticleRecords.map((article) => article.editorial.seoTitle));
    const descriptions = new Set(archivedArticleRecords.map((article) => article.editorial.metaDescription));

    expect(articles).toEqual([]);
    expect(archivedArticleRecords).toHaveLength(44);
    expect(slugs.size).toBe(archivedArticleRecords.length);
    expect(new Set(Object.keys(editorialPrimaryIntents))).toEqual(slugs);
    expect(intents.size).toBe(archivedArticleRecords.length);
    expect(titles.size).toBe(archivedArticleRecords.length);
    expect(descriptions.size).toBe(archivedArticleRecords.length);

    for (const article of archivedArticleRecords) {
      expect(article.editorial.primaryIntent.trim().split(/\s+/).length).toBeGreaterThanOrEqual(3);
      expect(article.editorial.seoTitle).not.toBe("");
      expect(`${article.editorial.seoTitle}${ARTICLE_TITLE_SUFFIX}`.length).toBeLessThanOrEqual(ARTICLE_TITLE_MAX_LENGTH);
      expect(article.editorial.metaDescription.length).toBeGreaterThanOrEqual(100);
      expect(article.editorial.metaDescription.length).toBeLessThanOrEqual(160);
      expect(article.editorial.h1).toBe(article.title);
      expect(article.editorial.datePublished).toBeNull();
      expect(article.editorial.dateModified).toBeNull();
      expect(article.editorial.sources.length).toBeGreaterThan(0);
      expect(article.editorial.sources[0].url).toMatch(/^https?:\/\//);
      expect(article.editorial.sources.every((source) => article.sections.some((section) => section.heading === source.section))).toBeTruthy();
      expect(article.editorial.sources.every((source) => source.supports.trim().length > 0)).toBeTruthy();
      expect(article.sourceUrl).toBe(article.editorial.sources[0].url);
      expect(articleCategories.some((category) => category.value === article.category)).toBeTruthy();
      expect(article.editorial.relatedSlugs.length).toBeGreaterThanOrEqual(3);
      expect(article.editorial.relatedSlugs).not.toContain(article.slug);
      expect(article.editorial.relatedSlugs.every((slug) => slugs.has(slug))).toBeTruthy();
    }

    for (const article of articles) {
      const normalizedParagraphs = article.sections
        .flatMap((section) => section.body.split(/\n\s*\n+/))
        .map((paragraph) => paragraph.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en"))
        .filter(Boolean);
      expect(new Set(normalizedParagraphs).size).toBe(normalizedParagraphs.length);
    }
  });

  test("keeps production snapshots on CareerReality's canonical origin", async ({ request }) => {
    test.skip(process.env.PLAYWRIGHT_PRODUCTION !== "true", "Canonical-origin checks run against the production build.");
    const canonicalOrigin = "https://careerreality.in";
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>${canonicalOrigin}/</loc>`);
    expect(sitemap).not.toContain("replit.app");
    expect(sitemap).not.toMatch(/\/(?:article|articles|category|topic-clusters)\//);

    const routeChecks = [
      { path: "/salary-calculator/", marker: "Questions worth checking" },
    ];
    for (const route of routeChecks) {
      const body = await (await request.get(route.path)).text();
      expect(body).toContain(route.marker);
      expect(body).toContain(`href="${canonicalOrigin}${route.path}"`);
    }

    for (const { path, destination } of [
      { path: "/articles/", destination: "/guides/" },
      { path: "/companies/infosys/", destination: "/companies/" },
      { path: "/category/engineering/", destination: "/guides/engineering-careers-without-the-title-trap/" },
      { path: "/topic-clusters/", destination: "/guides/" },
    ]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} should retain its registered redirect`).toBe(301);
      expect(response.headers().location).toBe(destination);
    }
  });

  test("keeps registered snapshot metadata aligned with hydrated production pages", async ({ page, request }) => {
    test.skip(process.env.PLAYWRIGHT_PRODUCTION !== "true", "Snapshot/hydration parity is checked against the production build.");
    test.setTimeout(180_000);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.ok()).toBeTruthy();
    const sitemap = await sitemapResponse.text();
    const routes = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)]
      .map((match) => new URL(match[1].trim()).pathname);
    expect(routes.length).toBeGreaterThan(0);
    const mismatches: string[] = [];

    for (const definition of routeRegistry.routes.filter((entry) => entry.render === "snapshot")) {
      const route = definition.path === "/" ? "/" : `${definition.path}/`;
      const response = await request.get(route);
      expect(response.ok(), `Expected ${route} to load`).toBeTruthy();
      const snapshot = await response.text();
      const snapshotTitle = decodeHtmlValue(snapshot.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      const snapshotDescription = decodeHtmlValue(snapshot.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ?? "");
      const snapshotRobots = snapshot.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1] ?? "";
      const expectedRobots = definition.indexability === "noindex" ? "noindex, follow" : "index, follow";

      await page.evaluate((path) => {
        window.history.pushState(null, "", path);
        window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
      }, route);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://careerreality.in${route}`,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("data-career-seo", "canonical");
      const hydrated = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? "",
        ogTitle: document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? "",
        twitterTitle: document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.content ?? "",
        ogImage: document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? "",
        twitterImage: document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.content ?? "",
        canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? "",
        robots: document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content ?? "",
      }));

      if (snapshotRobots !== expectedRobots) mismatches.push(`${route}: snapshot robots disagree with registry`);
      if (hydrated.robots !== expectedRobots) mismatches.push(`${route}: hydrated robots disagree with registry`);
      if (hydrated.title !== snapshotTitle) mismatches.push(`${route}: title differs`);
      if (hydrated.description !== snapshotDescription) mismatches.push(`${route}: description differs`);
      if (hydrated.ogTitle !== snapshotTitle) mismatches.push(`${route}: Open Graph title differs`);
      if (hydrated.twitterTitle !== snapshotTitle) mismatches.push(`${route}: Twitter title differs`);
      if (new URL(hydrated.ogImage).pathname !== "/social-card.png") mismatches.push(`${route}: Open Graph image URL is invalid`);
      if (new URL(hydrated.twitterImage).pathname !== "/social-card.png") mismatches.push(`${route}: Twitter image URL is invalid`);
      if (new URL(hydrated.canonical).pathname !== route) mismatches.push(`${route}: canonical differs`);
    }
    expect(mismatches, "Static and hydrated metadata must agree with the registry on all snapshot routes").toEqual([]);
  });

});
