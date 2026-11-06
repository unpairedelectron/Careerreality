# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seo-foundations.spec.ts >> public SEO foundations >> renders complete, route-specific trust pages
- Location: tests/seo-foundations.spec.ts:17:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('script[type="application/ld+json"]')
Expected: 2
Received: 3
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('script[type="application/ld+json"]')
    14 × locator resolved to 3 elements
       - unexpected value "3"

```

# Test source

```ts
  1   | import { expect, test } from "./fixtures";
  2   | import { archivedArticleRecords, articles, articleCategories } from "../src/data/content";
  3   | import { editorialPrimaryIntents } from "../src/data/editorial-briefs";
  4   | import { ARTICLE_TITLE_MAX_LENGTH, ARTICLE_TITLE_SUFFIX } from "../src/data/editorial-metadata";
  5   | import routeRegistry from "../src/data/route-registry";
  6   | 
  7   | function decodeHtmlValue(value: string): string {
  8   |   return value
  9   |     .replaceAll("&amp;", "&")
  10  |     .replaceAll("&lt;", "<")
  11  |     .replaceAll("&gt;", ">")
  12  |     .replaceAll("&quot;", "\"")
  13  |     .replaceAll("&#39;", "'");
  14  | }
  15  | 
  16  | test.describe("public SEO foundations", () => {
  17  |   test("renders complete, route-specific trust pages", async ({ page }) => {
  18  |     const routes = [
  19  |       { path: "/about", heading: "CareerReality, made for consequential decisions.", marker: "Current public scope" },
  20  |       { path: "/team", heading: "Author and review details.", marker: "Attribution status" },
  21  |       { path: "/editorial", heading: "Evidence, limits, and uncertainty.", marker: "Evidence before conclusion" },
  22  |       { path: "/privacy-policy", heading: "What the public tools and contact form store.", marker: "Contact message records" },
  23  |       { path: "/terms", heading: "Limits and use of CareerReality.", marker: "Tools and guides" },
  24  |       { path: "/contact", heading: "Contact CareerReality Editorial.", marker: "Send a message." },
  25  |     ];
  26  | 
  27  |     for (const route of routes) {
  28  |       await page.goto(route.path, { waitUntil: "domcontentloaded" });
  29  |       await expect(page.locator("h1")).toHaveCount(1);
  30  |       await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
  31  |       await expect(page.getByText(route.marker, { exact: true })).toBeVisible();
  32  |       await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  33  |       await expect(page.getByRole("link", { name: "Contact" }).first()).toBeVisible();
> 34  |       await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
      |                                                                        ^ Error: expect(locator).toHaveCount(expected) failed
  35  |     }
  36  | 
  37  |     await page.goto("/about", { waitUntil: "domcontentloaded" });
  38  |     await expect(page.locator("#identity")).toContainText("No owner-approved individual author or reviewer record is available for publication.");
  39  |     await expect(page.locator("#identity")).toContainText("No legal entity name is published.");
  40  |     const siteSchema = JSON.parse((await page.locator('script[data-career-seo-schema="site"]').textContent()) ?? "{}");
  41  |     const graph = siteSchema["@graph"] as Array<Record<string, unknown>>;
  42  |     expect(graph.some((entry) => entry["@type"] === "Person")).toBe(false);
  43  |     expect(graph.some((entry) => entry["@type"] === "Organization" && entry.name === "CareerReality" && entry.email === "hello@careerreality.in")).toBe(true);
  44  | 
  45  |     await page.goto("/contact", { waitUntil: "domcontentloaded" });
  46  |     const contactForm = page.getByTestId("form-contact");
  47  |     await expect(contactForm.locator('input[autocomplete="name"]')).toBeVisible();
  48  |     await expect(contactForm.locator('input[autocomplete="email"]')).toBeVisible();
  49  |     await expect(contactForm.locator("select")).toBeVisible();
  50  |     await expect(contactForm.locator("textarea")).toBeVisible();
  51  |     await expect(page.getByText("hello@careerreality.in", { exact: false }).first()).toBeVisible();
  52  |   });
  53  | 
  54  |   test("does not render unknown article routes in the client application", async ({ page }) => {
  55  |     await page.goto("/article/not-a-registered-article-slug", { waitUntil: "domcontentloaded" });
  56  | 
  57  |     await expect(page.locator("h1")).toContainText(/not found/i);
  58  |     await expect(page.locator('script[data-career-seo-schema="article"]')).toHaveCount(0);
  59  |   });
  60  | 
  61  |   test("published archived article URL returns 404 or 410 after the approved release", async ({ request }) => {
  62  |     test.skip(process.env.PLAYWRIGHT_PUBLISHED !== "true", "This check runs against the published custom origin.");
  63  | 
  64  |     const articlePath = "/article/indian-it-layoff-cycle-2026/";
  65  |     const response = await request.get(articlePath);
  66  |     expect([404, 410]).toContain(response.status());
  67  |     expect(await response.text()).not.toContain('"@type":"Article"');
  68  |   });
  69  | 
  70  |   test("publishes unique route metadata and one canonical URL", async ({ page }) => {
  71  |     const routes = [
  72  |       { path: "/salary-calculator", type: "website" },
  73  |     ];
  74  | 
  75  |     for (const route of routes) {
  76  |       await page.goto(route.path, { waitUntil: "domcontentloaded" });
  77  |       await expect(page.locator("h1")).toHaveCount(1);
  78  |       await expect(page).toHaveTitle(/CareerReality/);
  79  | 
  80  |       const head = await page.evaluate(() => ({
  81  |         description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
  82  |         canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
  83  |         canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
  84  |         ogType: document.querySelector('meta[property="og:type"]')?.getAttribute("content"),
  85  |         schemaCount: document.querySelectorAll('script[type="application/ld+json"]').length,
  86  |         robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
  87  |         articleSchema: document.querySelector('script[data-career-seo-schema="article"]')?.textContent ?? "",
  88  |       }));
  89  | 
  90  |       expect(head.description.length).toBeGreaterThan(100);
  91  |       expect(new URL(head.canonical).pathname).toBe(`${route.path}/`);
  92  |       expect(head.canonicalCount).toBe(1);
  93  |       expect(head.ogType).toBe(route.type);
  94  |       expect(head.schemaCount).toBe(3);
  95  |       expect(head.robots).toMatch(/noindex/);
  96  |     }
  97  |   });
  98  | 
  99  |   test("serves an XML sitemap without quarantined routes or calculator state", async ({ request }) => {
  100 |     const response = await request.get("/sitemap.xml");
  101 |     const body = await response.text();
  102 | 
  103 |     expect(response.ok()).toBeTruthy();
  104 |     expect(response.headers()["content-type"]).toMatch(/(?:application|text)\/xml/);
  105 |     expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  106 |     const sitemapPaths = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)]
  107 |       .map((match) => new URL(match[1]).pathname);
  108 |     expect(sitemapPaths).not.toContain("/search/");
  109 |     expect(sitemapPaths).not.toContain("/articles/");
  110 |     expect(sitemapPaths).not.toContain("/salary-calculator/");
  111 |     expect(sitemapPaths.some((path) => /^\/article\//.test(path))).toBe(false);
  112 |     expect(sitemapPaths.some((path) => /^\/companies\/[^/]+\/$/.test(path))).toBe(false);
  113 |     expect(sitemapPaths.some((path) => /^\/(?:category|topic-clusters)\//.test(path))).toBe(false);
  114 |     expect(sitemapPaths.some((path) => /[?&](?:ctc|salary|offer|fixed|variable|pf|city|tax)=/i.test(path))).toBe(false);
  115 |   });
  116 | 
  117 |   test("serves the declared social preview image and organization logo", async ({ request }) => {
  118 |     const socialImage = await request.get("/social-card.png");
  119 |     expect(socialImage.ok()).toBeTruthy();
  120 |     expect(socialImage.headers()["content-type"]).toMatch(/image\/png/);
  121 |     const imageBytes = await socialImage.body();
  122 |     expect(imageBytes.readUInt32BE(16)).toBe(1200);
  123 |     expect(imageBytes.readUInt32BE(20)).toBe(630);
  124 | 
  125 |     const logo = await request.get("/logo.svg");
  126 |     expect(logo.ok()).toBeTruthy();
  127 |     expect(logo.headers()["content-type"]).toMatch(/image\/svg\+xml/);
  128 |   });
  129 | 
  130 |   test("redirects retired company routes to the due-diligence hub", async ({ page }) => {
  131 |     await page.goto("/companies/infosys", { waitUntil: "domcontentloaded" });
  132 |     await expect(page).toHaveURL(/\/companies\/?$/);
  133 |     await expect(page.locator("h1")).toContainText(/check the employer behind the offer/i);
  134 |     await expect(page.getByTestId("input-officialDomain")).toBeVisible();
```