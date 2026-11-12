import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { archivedArticleRecords, articles } from "../src/data/content.ts";
import { ARTICLE_TITLE_MAX_LENGTH, ARTICLE_TITLE_SUFFIX } from "../src/data/editorial-metadata.ts";
import { editorialEnhancements } from "../src/data/editorial-enhancements.ts";
import {
  legacyAiReplacements,
} from "../src/data/legacy-routes.ts";
import {
  STATIC_TITLE_MAX_LENGTH,
  STATIC_TITLE_MIN_LENGTH,
} from "./seo-title-policy.mjs";
import { formatSeoTitle } from "../src/data/seo-title.ts";

// Stricter than the shared live-site limit: registry titles must not truncate in results.
const REGISTRY_TITLE_MAX_LENGTH = 60;
import { getSiteUrl } from "./seo-site-url.mjs";
import { ctcWorkedExampleResults } from "../src/lib/ctc-calculator.ts";
import { createSiteOrganization } from "../src/data/seo-organization.ts";
import { SITE_FOUNDER, createFounderAuthor, createFounderPerson } from "../src/data/site-founder.ts";
import { getGuideDirectAnswer } from "../src/data/guide-direct-answers.ts";
import { assertPublicRouteDescription } from "../src/data/seo-description-policy.ts";
import { assertArticlePublisherLogos } from "./lib/verify-publisher-logo.ts";
import { publicSiteMap, sitemapSections } from "../src/data/site-map.ts";

const root = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(root, "../..");
const distRoot = path.join(root, "dist", "public");
const siteUrl = getSiteUrl();
const basePath = (process.env.BASE_PATH ?? "/").replace(/\/+$/, "");
const snapshotHref = (route: string) => `${basePath}${route === "/" ? "/" : `${route.replace(/\/+$/, "")}/`}`;
const entryHtml = fs.readFileSync(path.join(distRoot, "index.html"), "utf8");
const tags = [...entryHtml.matchAll(/<(script|link)\b[^>]*>/gi)].map((match) => match[0]);
const entryScript = tags.find((tag) =>
  /<script\b/i.test(tag) && /type="module"/i.test(tag) && /\bsrc="[^"]+\.js(?:\?[^"]*)?"/i.test(tag),
);
const stylesheet = tags.find((tag) =>
  /<link\b/i.test(tag) && /rel="stylesheet"/i.test(tag) && /\bhref="[^"]+\.css(?:\?[^"]*)?"/i.test(tag),
);
const criticalAssets = [
  { label: "entry JS", tag: entryScript },
  { label: "entry CSS", tag: stylesheet },
].map(({ label, tag }) => {
  const assetUrl = tag?.match(/\b(?:src|href)="([^"]+)"/i)?.[1];
  if (!assetUrl) throw new Error(`Missing ${label} reference in the built entry HTML.`);
  const assetPath = new URL(assetUrl, "http://careerreality.local").pathname.replace(/^\/+/, "");
  const file = path.resolve(distRoot, assetPath);
  if (!file.startsWith(`${path.resolve(distRoot)}${path.sep}`)) {
    throw new Error(`Built ${label} resolves outside the public output directory.`);
  }
  if (!fs.existsSync(file)) throw new Error(`Missing built ${label}: ${file}`);
  return { label, gzipBytes: gzipSync(fs.readFileSync(file)).byteLength };
});
const criticalGzipBytes = criticalAssets.reduce((sum, asset) => sum + asset.gzipBytes, 0);
if (criticalAssets[0].gzipBytes > 160_000 || criticalAssets[1].gzipBytes > 35_000 || criticalGzipBytes > 200_000) {
  throw new Error(`Mobile entry payload exceeds budget: ${criticalAssets.map((asset) => `${asset.label} ${asset.gzipBytes}`).join(", ")}; combined ${criticalGzipBytes} bytes gzip.`);
}
console.log(`Verified mobile entry payload: ${criticalAssets.map((asset) => `${asset.label} ${asset.gzipBytes}`).join(", ")}; combined ${criticalGzipBytes} bytes gzip.`);
const routeRegistry = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/route-registry.json"), "utf8"),
) as {
  sitemapPolicy: { humanRoute: string; xmlRoute: string; humanRouteIndexability: string };
  routes: Array<{ path: string; title?: string; seoTitle?: string; description: string; kind: string; render: "snapshot" | "app-shell"; indexability: "indexable" | "noindex"; sitemap: boolean; guideSlug?: string }>;
};
const generatedGuideMetadata = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/generated-pillar-guides.json"), "utf8"),
) as {
  guides: Array<{ slug: string; datePublished: string | null; dateModified: string | null }>;
};
const guideMetadataBySlug = new Map(generatedGuideMetadata.guides.map((guide) => [guide.slug, guide]));
const sitemapRoutes = routeRegistry.routes.filter((route) => route.sitemap);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function metaContent(html: string, name: string): string {
  return html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i"))?.[1] ?? "";
}

function propertyContent(html: string, property: string): string {
  return html.match(new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, "i"))?.[1] ?? "";
}

function pageTitle(html: string): string {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
}

function decodeHtmlValue(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function snapshotParagraph(html: string, className: string): string {
  const match = html.match(new RegExp(`<p class="${className}">([\\s\\S]*?)<\\/p>`, "i"));
  return decodeHtmlValue((match?.[1] ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
}

function structuredDataTypes(html: string, route: string): Set<string> {
  const types = new Set<string>();
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let parsed: { "@graph"?: unknown[]; "@type"?: string | string[] };
    try {
      parsed = JSON.parse(match[1]) as { "@graph"?: unknown[]; "@type"?: string | string[] };
    } catch (error) {
      throw new Error(`Invalid JSON-LD on ${route}: ${String(error)}`);
    }
    const nodes = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== "object" || !("@type" in node)) continue;
      const type = (node as { "@type": string | string[] })["@type"];
      for (const value of Array.isArray(type) ? type : [type]) types.add(value);
    }
  }
  return types;
}

function assertSharedSchema(html: string, route: string): void {
  const types = structuredDataTypes(html, route);
  for (const requiredType of ["WebSite", "Organization", "BreadcrumbList"]) {
    if (!types.has(requiredType)) throw new Error(`Missing ${requiredType} structured data on ${route}`);
  }
  const nodes = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const schema = JSON.parse(match[1]) as Record<string, unknown>;
      return Array.isArray(schema["@graph"]) ? schema["@graph"] as Array<Record<string, unknown>> : [schema];
    });
  const people = nodes.filter((node) => node["@type"] === "Person");
  if (route !== "/team" && people.length) {
    throw new Error(`Person structured data is not approved on ${route}`);
  }
  if (route === "/team") {
    const expected = createFounderPerson(siteUrl);
    if (people.length !== 1 || JSON.stringify(people[0]) !== JSON.stringify(expected)) {
      throw new Error("Team Person schema must match the owner-approved founder record in src/data/site-founder.ts");
    }
  }
  assertArticlePublisherLogos(nodes, createSiteOrganization(siteUrl, process.env.BASE_PATH || "/").logo, route);
}

function assertSocialTitles(html: string, route: string): void {
  const title = pageTitle(html);
  const ogTitle = propertyContent(html, "og:title");
  const twitterTitle = metaContent(html, "twitter:title");
  if (ogTitle !== title || twitterTitle !== title) {
    throw new Error(`Social titles do not match the page title on ${route}`);
  }
}

// Check the homepage too; staticRoutes below excludes it.
for (const route of routeRegistry.routes.filter((entry) => entry.render === "snapshot")) {
  assertPublicRouteDescription(route);
  const file = path.join(distRoot, route.path.replace(/^\/+/, ""), "index.html");
  const html = fs.readFileSync(file, "utf8");
  const navigation = html.match(/<nav\b[^>]*aria-label="Public CareerReality navigation"[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  if (!navigation) throw new Error(`Missing public navigation in initial HTML on ${route.path}`);
  const navigationLinks = [...navigation.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  if (route.path === "/") {
      const principalRoutes = [
        "/tools", "/guides", "/rules", "/layoffs", "/sitemap",
      ...routeRegistry.routes.filter((entry) => entry.kind === "trust" && entry.indexability === "indexable").map((entry) => entry.path),
    ];
    for (const destination of principalRoutes) {
      if (!navigationLinks.some((link) => link[1] === snapshotHref(destination))) {
        throw new Error(`Homepage initial HTML lacks a principal public link: ${destination}`);
      }
    }
  }
  for (const item of publicSiteMap.flatMap((section) => section.items)) {
    if (!navigationLinks.some((link) => link[1] === snapshotHref(item.href) && link[2] === escapeHtml(item.label))) {
      throw new Error(`Missing public navigation link on ${route.path}: ${item.href}`);
    }
  }
  for (const link of navigationLinks) {
    if (!routeRegistry.routes.some((entry) => snapshotHref(entry.path) === link[1] &&
      entry.render === "snapshot" && (entry.indexability === "indexable" || snapshotHref(entry.path) === snapshotHref(routeRegistry.sitemapPolicy.humanRoute)))) {
      throw new Error(`Non-public discovery link on ${route.path}: ${link[1]}`);
    }
  }
  if (snapshotHref(route.path) === snapshotHref(routeRegistry.sitemapPolicy.humanRoute)) {
    const main = html.match(/<main>([\s\S]*?)<\/main>/i)?.[1] ?? "";
    const links = [...main.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const entry of sitemapRoutes) {
      if (!links.some((link) => link[1] === snapshotHref(entry.path) && link[2] === escapeHtml(entry.title ?? ""))) {
        throw new Error(`Missing public sitemap body link: ${entry.path}`);
      }
    }
    for (const section of sitemapSections) {
      if (!main.includes(`<h2>${escapeHtml(section.label)}</h2>`)) {
        throw new Error(`Missing public sitemap section: ${section.label}`);
      }
    }
    if (links.some((link) => !sitemapRoutes.some((entry) => snapshotHref(entry.path) === link[1]))) {
      throw new Error("Public sitemap body contains a non-sitemap destination.");
    }
  }
  const descriptions = [
    metaContent(html, "description"),
    propertyContent(html, "og:description"),
    metaContent(html, "twitter:description"),
  ].map(decodeHtmlValue);
  if (descriptions.some((description) => description !== route.description)) {
    throw new Error(`Static and runtime description source differs on ${route.path}`);
  }
}

for (const article of articles) {
  const file = path.join(distRoot, "article", article.slug, "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing article snapshot: ${article.slug}`);
  const html = fs.readFileSync(file, "utf8");
  const checks = [
    [`title: ${article.slug}`, html.includes(`<title>${escapeHtml(article.editorial.seoTitle)}${ARTICLE_TITLE_SUFFIX}</title>`)],
    [`title budget: ${article.slug}`, `${article.editorial.seoTitle}${ARTICLE_TITLE_SUFFIX}`.length <= ARTICLE_TITLE_MAX_LENGTH],
    [`h1: ${article.slug}`, html.includes(`<h1>${article.editorial.h1.replaceAll("&", "&amp;").replaceAll("'", "&#39;")}</h1>`)],
    [`canonical: ${article.slug}`, html.includes(`/article/${article.slug}/`)],
    [`schema: ${article.slug}`, html.includes('"@type":"Article"')],
    [`description: ${article.slug}`, html.includes(article.editorial.metaDescription.replaceAll("&", "&amp;").replaceAll("'", "&#39;"))],
    [`intent: ${article.slug}`, html.includes(article.editorial.primaryIntent)],
    [`figure: ${article.slug}`, html.includes(`<figure class="snapshot-figure">`) && html.includes(article.editorial.visual.title)],
    [`reference: ${article.slug}`, html.includes(article.editorial.sources[0].url)],
    [`source mapping: ${article.slug}`, article.editorial.sources.every((source) => html.includes(source.url) && html.includes(escapeHtml(source.section)) && html.includes(escapeHtml(source.supports)))],
    [`schema citation: ${article.slug}`, article.editorial.sources.every((source) => html.includes(`"url":"${source.url}"`))],
    [`related: ${article.slug}`, article.editorial.relatedSlugs.length >= 3 && html.includes(`/category/${article.category}`) && article.editorial.relatedSlugs.every((slug) => html.includes(`/article/${slug}/`))],
    [`reality check: ${article.slug}`, html.includes("Reality check") && html.includes("What to verify")],
    [`decision summary: ${article.slug}`, html.includes("Decision summary") && html.includes("/compass/")],
  ];
  const failed = checks.filter(([, passed]) => !passed).map(([label]) => label);
  if (failed.length) throw new Error(`Invalid article snapshot: ${failed.join(", ")}`);
  assertSocialTitles(html, `/article/${article.slug}`);
  assertSharedSchema(html, `/article/${article.slug}`);
  const articleTypes = structuredDataTypes(html, `/article/${article.slug}`);
  if (!articleTypes.has("Article")) {
    throw new Error(`Missing Article structured data: ${article.slug}`);
  }
  const articleSchema = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]) as { "@graph"?: Array<Record<string, unknown>>; "@type"?: string })
    .flatMap((schema) => schema["@graph"] ?? [schema])
    .find((schema) => schema["@type"] === "Article");
  if (!articleSchema) {
    throw new Error(`Article snapshot has no Article schema node: ${article.slug}`);
  }
  if (article.editorial.datePublished || article.editorial.dateModified) {
    if (articleSchema.datePublished !== article.editorial.datePublished || articleSchema.dateModified !== article.editorial.dateModified) {
      throw new Error(`Article snapshot publication dates do not match verified editorial metadata: ${article.slug}`);
    }
  } else if ("datePublished" in articleSchema || "dateModified" in articleSchema) {
    throw new Error(`Article snapshot includes unverified publication dates: ${article.slug}`);
  }
}

const staticRoutes = routeRegistry.routes
  .filter((route) => route.render === "snapshot")
  .map((route) => route.path);

const duplicateRoutes = routeRegistry.routes
  .map((route) => route.path)
  .filter((route, index, routes) => routes.indexOf(route) !== index);
if (duplicateRoutes.length) {
  throw new Error(`Route registry contains duplicate paths: ${[...new Set(duplicateRoutes)].join(", ")}`);
}
if (sitemapRoutes.some((route) => route.indexability !== "indexable" || route.render !== "snapshot")) {
  throw new Error("Sitemap contains a non-indexable route or a route without a generated snapshot.");
}
if (routeRegistry.sitemapPolicy.humanRouteIndexability !== "noindex") {
  throw new Error("The human-readable sitemap route must remain noindex.");
}

const legacyDestinations: Record<string, string> = {
  ...Object.fromEntries(Object.entries(legacyAiReplacements).map(([slug, replacement]) => [`/ai/${slug}`, replacement.destination])),
};

const routeContentChecks: Record<string, string[]> = {
  "/salary-calculator": ["Questions worth checking", "employer PF, gratuity, and other costs that you enter from the offer", "id=\"method\"", "For Tax Year 2026–27", "estimated month by month from a user-entered start date", "incometax.gov.in/iec/foportal/help/individual/return-applicable-1", "Salaried Individuals for AY 2026–27"],
  "/about": ["Doffysoft pvt. Limited", "Hinjewadi Phase 3, Pune", "House rules", "Shiv Shakti Mishra"],
  "/team": ["Shiv Shakti Mishra", "ML/AI engineer", "Doffysoft pvt. Limited", "What one person cannot promise"],
  "/editorial": ["Authorship, review, publication dates, and substantive updates are identified where available"],
  "/corrections": ["When a material correction is made"],
  "/methodology": ["estimates old and new salary-only tax for AY 2026–27", "limited monthly-rate illustration uses 15/26", "₹20 lakh maximum as then current", "piece-rated or seasonal cases"],
  "/sources": ["revised EPFO ceiling", "Guides provide editorial framing and practical prompts", "incometax.gov.in/iec/foportal/help/individual/return-applicable-1", "Tax Year 2026–27 under the 2025 Act"],
  "/privacy-policy": ["web address", "hello@careerreality.in", "GAESA", "13 May 2027", "Google AdSense ads are not currently served", "Google Ads Settings", "IP addresses and other identifiers", "TheirStack", "not legal advice", "24 brief-history snapshots", "backups"],
  "/terms": ["Governing law: India", "Doffysoft pvt. Limited"],
  "/contact": ["Use hello@careerreality.in", "Email is the only published contact route"],
  "/accessibility": ["axe-core 4.10.3", "no automated violations", "Report a barrier"],
  "/security": ["Report a security concern", "No response-time, bounty, or safe-harbor commitment is made", "security.txt"],
  "/escape-plan": ["5-action checklist", "The total is arithmetic", "refreshing clears them"],
  "/career-reality-index": ["Use four self-reported answers to identify career uncertainties", "No score or recommendation is produced here"],
  "/ai": ["What this tool is for", "task-level questions", "not measured exposure or a forecast"],
  "/companies": ["Ten minutes to ask better questions", "Seven guided checks", "Couldn’t verify", "call 1930 promptly", "Questions by audience", "Official source register"],
};

const longParagraphOwners = new Map<string, string>();
const editorialPageParagraphOwners = new Map<string, string>();
const moneyToolRoutes = new Set([
  "/salary-calculator",
  "/offer-comparison",
  "/tax-regime-comparison",
  "/gratuity-estimator",
  "/final-pay-estimator",
]);
const batchWorksheetRoutes = new Set([
  "/layoff-runway",
  "/home-loan-stress-test",
  "/resign-or-stay",
  "/compass",
  "/salary-drop",
  "/escape-plan",
  "/career-reality-index",
  "/ai",
  "/companies",
]);
const ruleLibraryRoutes = new Set([
  "/rules/employee-pf",
  "/rules/gratuity-wages",
  "/rules/leave-encashment",
  "/rules/income-tax-new-regime",
  "/rules/income-tax-old-regime",
  "/rules/salary-standard-deduction-cess",
  "/rules/professional-tax-states",
  "/rules/hra-rent-exemption",
  "/rules/ctc-components",
  "/rules/salary-benefits-tax",
]);

for (const route of staticRoutes) {
  const file = path.join(distRoot, route.replace(/^\/+/, ""), "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing route snapshot: ${route}`);
  const html = fs.readFileSync(file, "utf8");
  const forbiddenStrings = [
    "source citation unavailable",
    "directional stability",
    "A concise editorial brief",
    "CareerReality keeps assumptions, evidence freshness",
    "Read the journal",
    "Archived article body text is not republished",
    "words of editorial framing",
  ];
  const visiblePageText = visibleArticleText(html).toLocaleLowerCase("en-IN");
  for (const forbidden of forbiddenStrings) {
    if (visiblePageText.includes(forbidden.toLocaleLowerCase("en-IN"))) {
      throw new Error(`Forbidden published copy on ${route}: ${forbidden}`);
    }
  }
  if (ruleLibraryRoutes.has(route)) {
    const rootStart = html.indexOf('<div id="root">');
    const bodyEnd = html.indexOf("</body>", rootStart);
    const visibleMarkup = rootStart >= 0 && bodyEnd > rootStart ? html.slice(rootStart, bodyEnd) : "";
    const uniqueWords = new Set(
      (visibleArticleText(visibleMarkup).match(/\b[\p{L}\p{N}][\p{L}\p{N}'’.-]*\b/gu) ?? [])
        .map((word) => word.toLocaleLowerCase("en-IN")),
    );
    if (uniqueWords.size < 400) {
      throw new Error(`Rules page must contain at least 400 unique visible server-rendered words: ${route} has ${uniqueWords.size}.`);
    }
    console.log(`Verified rules page unique-word count: ${route} — ${uniqueWords.size}`);
  }
  const isGuide = route.startsWith("/guides/");
  const isTool = moneyToolRoutes.has(route) || batchWorksheetRoutes.has(route);
  if (isGuide || isTool) {
    const mainMarkup = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
    if (!mainMarkup) throw new Error(`Missing main content for editorial page: ${route}`);
    const mainText = visibleArticleText(mainMarkup);
    const words = plainWordCount(mainText);
    const floor = isGuide ? 1000 : moneyToolRoutes.has(route) ? 600 : 450;
    if (words < floor) {
      throw new Error(`Main-content word floor not met: ${route} has ${words}; requires ${floor}.`);
    }
    for (const unsupportedClaim of ["Drafting used AI assistance", "11 October 2026"]) {
      if (mainMarkup.includes(unsupportedClaim)) {
        throw new Error(`Unverified author or date claim found on ${route}: ${unsupportedClaim}`);
      }
    }
    console.log(`Verified main-content word count: ${route} — ${words}`);

  }
  const mainMarkup = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
  for (const match of mainMarkup.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const paragraph = visibleArticleText(match[1]).toLocaleLowerCase("en-IN");
    if (plainWordCount(paragraph) < 25) continue;
    const owner = editorialPageParagraphOwners.get(paragraph);
    if (owner) {
      throw new Error(`Repeated 25+ word paragraph on main content ${owner} and ${route}: ${paragraph.slice(0, 100)}`);
    }
    editorialPageParagraphOwners.set(paragraph, route);
  }
  if (!html.includes("<h1>") || !html.includes('<link rel="canonical"')) {
    throw new Error(`Invalid route snapshot: ${route}`);
  }
  assertSocialTitles(html, route);
  assertSharedSchema(html, route);
  const robots = metaContent(html, "robots").toLowerCase();
  const routePolicy = routeRegistry.routes.find((entry) => entry.path === route);
  if (!routePolicy) throw new Error(`Route snapshot is missing a route policy: ${route}`);
  if (routePolicy.indexability === "noindex" && !robots.includes("noindex")) {
    throw new Error(`Noindex route is missing its robots policy: ${route}`);
  }
  if (routePolicy.indexability === "indexable" && robots.includes("noindex")) {
    throw new Error(`Indexable route is marked noindex: ${route}`);
  }
  if (routePolicy.indexability === "indexable") {
    const title = pageTitle(html);
    if (title.length < STATIC_TITLE_MIN_LENGTH || title.length > STATIC_TITLE_MAX_LENGTH) {
      throw new Error(
        `Invalid indexable title: ${route} is ${title.length} characters; expected ${STATIC_TITLE_MIN_LENGTH}-${STATIC_TITLE_MAX_LENGTH}: ${title || "(missing)"}`,
      );
    }
    // Registry routes render their `seoTitle` (or `title`) and must fit a SERP line.
    const expectedTitle = formatSeoTitle(routePolicy.seoTitle ?? routePolicy.title ?? "");
    const decodedTitle = decodeHtmlValue(title);
    if (decodedTitle !== expectedTitle) {
      throw new Error(`Snapshot title on ${route} does not match the route registry: ${decodedTitle} !== ${expectedTitle}`);
    }
    if (decodedTitle.length > REGISTRY_TITLE_MAX_LENGTH) {
      throw new Error(`Registry title on ${route} is ${decodedTitle.length} characters; expected at most ${REGISTRY_TITLE_MAX_LENGTH}: ${decodedTitle}`);
    }
    const descriptionLength = decodeHtmlValue(metaContent(html, "description")).length;
    if (descriptionLength < 100 || descriptionLength > 160) {
      throw new Error(`Invalid indexable description: ${route} is ${descriptionLength} characters; expected 100-160`);
    }
  }
  const legacyDestination = legacyDestinations[route];
  if (route === "/career-reality-index" && (html.includes("70×30%") || html.includes("/100") || html.includes("weighted score"))) {
    throw new Error("Career Reality Index snapshot contains the retired numeric score model.");
  }
  if (legacyDestination) {
    if (!html.includes('content="noindex, follow"') || !html.includes(`${legacyDestination}/`)) {
      throw new Error(`Invalid legacy handoff snapshot: ${route}`);
    }
    if (html.includes(`<link rel="canonical" href="${route}/"`)) {
      throw new Error(`Legacy route has a self-canonical: ${route}`);
    }
  }
  for (const expected of routeContentChecks[route] ?? []) {
    if (!html.includes(expected)) throw new Error(`Missing route-specific content for ${route}: ${expected}`);
  }
  if (route === "/companies") {
    const faqJson = html.match(/<script type="application\/ld\+json" data-career-seo-schema="faq">([\s\S]*?)<\/script>/i)?.[1];
    const faqSchema = faqJson ? JSON.parse(faqJson) as { mainEntity?: unknown[] } : null;
    if (!faqSchema?.mainEntity || faqSchema.mainEntity.length < 12) {
      throw new Error("The employer verification snapshot must expose at least twelve matching FAQ schema entries.");
    }
  }
  const rootStart = html.indexOf('<div id="root">');
  const bodyEnd = html.indexOf("</body>", rootStart);
  const bodyHtml = rootStart >= 0 && bodyEnd > rootStart ? html.slice(rootStart, bodyEnd) : "";
  const excerpt = snapshotParagraph(bodyHtml, "snapshot-excerpt");
  const lead = snapshotParagraph(bodyHtml, "snapshot-lead");
  if (excerpt && excerpt === lead) {
    throw new Error(`Static snapshot repeats its lead as both excerpt and body copy: ${route}`);
  }
}

if (articles.length !== 0) {
  throw new Error(`Public article catalogue must remain empty; found ${articles.length} active records.`);
}
if (archivedArticleRecords.length !== 44) {
  throw new Error(`Expected all 44 archived article records to remain recoverable; found ${archivedArticleRecords.length}.`);
}
const originalArchiveRoot = path.join(workspaceRoot, "archive", "articles");
const originalArchiveFiles = fs.readdirSync(originalArchiveRoot)
  .filter((file) => file.endsWith(".json"))
  .sort();
if (originalArchiveFiles.length !== 44) {
  throw new Error(`Expected all 44 original article exports to remain recoverable; found ${originalArchiveFiles.length}.`);
}
const originalArchiveRecords = originalArchiveFiles.map((file) => {
  const record = JSON.parse(fs.readFileSync(path.join(originalArchiveRoot, file), "utf8")) as {
    slug?: unknown;
    title?: unknown;
    description?: unknown;
    body?: unknown;
  };
  if (
    typeof record.slug !== "string" ||
    typeof record.title !== "string" ||
    typeof record.description !== "string" ||
    typeof record.body !== "string" ||
    !record.body.trim()
  ) {
    throw new Error(`Incomplete original article export: ${file}`);
  }
  return { ...record, slug: record.slug, title: record.title, description: record.description, body: record.body };
});
const originalArchiveSlugs = new Set(originalArchiveRecords.map((record) => record.slug));
const forensicArchive = JSON.parse(
  fs.readFileSync(path.join(workspaceRoot, "docs", "work", "articles.json"), "utf8"),
) as Array<{ slug?: unknown; title?: unknown; description?: unknown; body?: unknown }>;
const forensicBySlug = new Map(
  forensicArchive
    .filter((record): record is { slug: string; title: string; description: string; body: string } =>
      typeof record.slug === "string" &&
      typeof record.title === "string" &&
      typeof record.description === "string" &&
      typeof record.body === "string",
    )
    .map((record) => [record.slug, record] as const),
);
if (
  originalArchiveSlugs.size !== 44 ||
  forensicArchive.length !== 44 ||
  forensicBySlug.size !== 44 ||
  archivedArticleRecords.some((article) => !originalArchiveSlugs.has(article.slug)) ||
  originalArchiveRecords.some((record) => {
    const forensicRecord = forensicBySlug.get(record.slug);
    return (
      !forensicRecord ||
      forensicRecord.title !== record.title ||
      forensicRecord.description !== record.description ||
      forensicRecord.body !== record.body
    );
  })
) {
  throw new Error("The original article exports do not exactly match the 44 quarantined source records.");
}

const textExtensions = new Set([".html", ".js", ".mjs", ".json", ".map", ".xml", ".txt", ".css", ".webmanifest"]);
const publicTextFiles = fs.readdirSync(distRoot, { recursive: true })
  .filter((entry): entry is string => typeof entry === "string" && textExtensions.has(path.extname(entry)))
  .map((entry) => path.join(distRoot, entry));
const publicText = publicTextFiles
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const leakedArticle = archivedArticleRecords.find((article) =>
  (article.excerpt.length > 0 && publicText.includes(article.excerpt)) ||
  article.sections.some((section) => {
    const distinctiveText = section.body.replace(/\s+/g, " ").trim().slice(0, 160);
    return distinctiveText.length >= 100 && publicText.includes(distinctiveText);
  }),
);
if (leakedArticle) {
  throw new Error(`Archived article body text leaked into public build output: ${leakedArticle.slug}`);
}
const leakedOriginal = originalArchiveRecords.find((article) => {
  const firstSectionParagraph = article.body.match(/<section>\s*<h2>[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/i)?.[1];
  const distinctiveText = decodeHtmlValue((firstSectionParagraph ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 160);
  return (
    (distinctiveText.length >= 100 && publicText.includes(distinctiveText))
  );
});
if (leakedOriginal) {
  throw new Error(`Original archived article body text leaked into public build output: ${leakedOriginal.slug}`);
}

const sitemapPath = path.join(
  distRoot,
  routeRegistry.sitemapPolicy.xmlRoute.replace(/^\/+/, ""),
);
const sitemap = fs.readFileSync(sitemapPath, "utf8");
const robotsFile = fs.readFileSync(path.join(distRoot, "robots.txt"), "utf8");
if (!robotsFile.includes(`Sitemap: ${siteUrl}${routeRegistry.sitemapPolicy.xmlRoute}`)) {
  throw new Error("robots.txt does not reference the configured XML sitemap.");
}
if (/[?&](?:ctc|salary|offer|fixed|variable|pf|city|tax)=/i.test(sitemap)) {
  throw new Error("Parameterized calculator state must never appear in the XML sitemap.");
}
if (/\/(?:article|articles|category|topic-clusters)\//i.test(sitemap) || /\/companies\/[^/<]+/i.test(sitemap)) {
  throw new Error("Sitemap contains a quarantined editorial or company route.");
}

const urlDecisionPath = path.join(workspaceRoot, "docs", "work", "URL_DECISIONS.csv");
const urlDecisionRows = fs.readFileSync(urlDecisionPath, "utf8").split(/\r?\n/).filter(Boolean);
const urlDecisions = urlDecisionRows.slice(1).map((row) => {
  const [route, action] = row.split(",", 3);
  return {
    route: (route ?? "").replace(/^"|"$/g, "").trim(),
    action: (action ?? "").replace(/^"|"$/g, "").trim(),
  };
});
const retiredRoutes = urlDecisions.filter((decision) => decision.action === "410").map((decision) => decision.route);
const preservedArticleRoutes = archivedArticleRecords.map((article) => `/article/${article.slug}`);
const normalizeDecisionRoute = (route: string) => route.replace(/\/+$/, "") || "/";
const noindexArticleDecisions = urlDecisions
  .filter((decision) => decision.action === "301" && decision.route.startsWith("/article/"))
  .map((decision) => normalizeDecisionRoute(decision.route))
  .sort();
if (urlDecisions.length !== 80 || retiredRoutes.length !== 35 || JSON.stringify(noindexArticleDecisions) !== JSON.stringify(preservedArticleRoutes.map(normalizeDecisionRoute).sort())) {
  throw new Error(`Expected 80 reviewed URL decisions, 35 retired URLs, and ${preservedArticleRoutes.length} article URLs redirected to guides; found ${urlDecisions.length}, ${retiredRoutes.length}, and ${noindexArticleDecisions.length}.`);
}
const withoutBasePath = (pathname: string) => {
  if (basePath && pathname === basePath) return "/";
  return basePath && pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
};
const normalizeRoute = (pathname: string) => pathname.replace(/\/+$/, "") || "/";
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname)
  .map(withoutBasePath)
  .map(normalizeRoute)
  .sort();
const expectedSitemapRoutes = sitemapRoutes
  .map((route) => normalizeRoute(route.path))
  .sort();
if (JSON.stringify(sitemapLocations) !== JSON.stringify(expectedSitemapRoutes)) {
  throw new Error(
    `Generated sitemap routes differ from the registry. Expected ${expectedSitemapRoutes.join(", ")}; received ${sitemapLocations.join(", ")}`,
  );
}
for (const route of routeRegistry.routes) {
  const normalized = normalizeRoute(route.path);
  const retiredMatch = retiredRoutes.some((retired) => normalizeRoute(retired) === normalized);
  if (retiredMatch) {
    throw new Error(`Active route registry conflicts with a reviewed retired URL: ${route.path}`);
  }
}
for (const route of retiredRoutes) {
  const routeFile = path.join(distRoot, route.replace(/^\/+|\/+$/g, ""), "index.html");
  if (fs.existsSync(routeFile)) {
    throw new Error(`A reviewed retired route has a generated snapshot: ${route}`);
  }
  if (sitemap.includes(route)) {
    throw new Error(`A reviewed retired route remains in the generated sitemap: ${route}`);
  }
}

const notFoundFile = path.join(distRoot, "404.html");
if (!fs.existsSync(notFoundFile)) throw new Error("Static deployment 404.html is missing.");
const notFoundHtml = fs.readFileSync(notFoundFile, "utf8");
if (!notFoundHtml.includes('content="noindex, follow"') || !notFoundHtml.includes("<h1>This page is not available.</h1>")) {
  throw new Error("Static deployment 404.html must be a genuine noindex not-found page.");
}

const advertisingMarkers = [
  "pagead2.googlesyndication.com",
  "adsbygoogle",
  "doubleclick.net",
];
const adsenseAccountTags = [...publicText.matchAll(/<meta\b(?=[^>]*\bname=["']google-adsense-account["'])[^>]*>/gi)]
  .map(([tag]) => tag);
if (
  adsenseAccountTags.length === 0 ||
  adsenseAccountTags.some((tag) =>
    !/^<meta\s+name="google-adsense-account"\s+content="ca-pub-3766621537317806"\s*\/?>$/i.test(tag)
  )
) {
  throw new Error("The public build must contain only the approved AdSense ownership meta tag.");
}
const publicTextWithoutOwnershipTag = publicText.replace(
  /<meta\b(?=[^>]*\bname=["']google-adsense-account["'])[^>]*>/gi,
  "",
);
const advertisingMarker = advertisingMarkers.find((marker) => publicTextWithoutOwnershipTag.toLowerCase().includes(marker.toLowerCase()))
  ?? (publicTextWithoutOwnershipTag.toLowerCase().includes("ca-pub-") ? "ca-pub-" : undefined);
if (advertisingMarker) throw new Error(`Advertising marker found in public build output: ${advertisingMarker}`);
const forbiddenStrings = [
  "source citation unavailable",
  "directional stability",
  "A concise editorial brief",
  "CareerReality keeps assumptions, evidence freshness",
  "Read the journal",
  "Archived article body text is not republished",
  "words of editorial framing",
];
const publicHtmlText = publicTextFiles
  .filter((name) => name.endsWith(".html"))
  .map((name) => fs.readFileSync(name, "utf8"))
  .join("\n")
  .toLowerCase();
const forbiddenString = forbiddenStrings.find((marker) => publicHtmlText.includes(marker.toLowerCase()));
if (forbiddenString) throw new Error(`Forbidden editorial copy found in public build output: ${forbiddenString}`);

for (const file of publicTextFiles.filter((name) => name.endsWith(".html"))) {
  const html = fs.readFileSync(file, "utf8");
  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((match) => match[1]);
  const retiredLink = links.find((href) =>
    /^\/(?:articles|article|category|topic-clusters)(?:\/|$)/i.test(href) ||
    /^\/companies\/[^/?#]+/i.test(href)
  );
  if (retiredLink) throw new Error(`Generated page links to a retired route: ${path.relative(distRoot, file)} -> ${retiredLink}`);
  for (const href of links) {
    let pathname: string;
    try {
      pathname = withoutBasePath(new URL(href, "https://career-reality.invalid").pathname);
    } catch {
      continue;
    }
    const matchedDecision = retiredRoutes.find((route) => normalizeRoute(route) === normalizeRoute(pathname));
    if (matchedDecision) {
      throw new Error(`Generated page links to a reviewed retired route: ${path.relative(distRoot, file)} -> ${href}`);
    }
  }
}

for (const quarantinedRoot of ["article", "companies"]) {
  const directory = path.join(distRoot, quarantinedRoot);
  const allowedQuarantinedArticleShells = new Set(
    archivedArticleRecords.map((article) => `${article.slug}/index.html`),
  );
  if (fs.existsSync(directory)) {
    const staleSnapshots = fs.readdirSync(directory, { recursive: true })
      .map((entry) => (typeof entry === "string" ? entry.replaceAll("\\", "/") : entry))
      .filter((entry) =>
        typeof entry === "string" &&
        entry.endsWith(".html") &&
        !(quarantinedRoot === "companies" && entry === "index.html") &&
        !(quarantinedRoot === "article" && allowedQuarantinedArticleShells.has(entry))
      );
    if (staleSnapshots.length > 0) {
      throw new Error(`Quarantined ${quarantinedRoot} snapshots were generated: ${staleSnapshots.join(", ")}`);
    }
  }
}

for (const article of articles) {
  const { slug } = article;
  const file = path.join(distRoot, "article", slug, "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing article snapshot: ${slug}`);
  const html = fs.readFileSync(file, "utf8");
  if (editorialEnhancements[slug] && (!html.includes("Editorial scope") || !html.includes("Reader outcome") || !html.includes("Evidence boundary"))) {
    throw new Error(`Enhanced article snapshot is missing its value/provenance section: ${slug}`);
  }
  const schemaScript = html.match(/<script type="application\/ld\+json" data-career-seo-schema="article">([\s\S]*?)<\/script>/i);
  if (!schemaScript) throw new Error(`Article JSON-LD is missing: ${slug}`);
  const schemaGraph = JSON.parse(schemaScript[1]) as {
    "@graph"?: Array<Record<string, unknown>>;
  };
  const articleSchema = schemaGraph["@graph"]?.find((schema) => schema["@type"] === "Article");
  if (!articleSchema) throw new Error(`Article JSON-LD is malformed: ${slug}`);
  if ("author" in articleSchema) throw new Error(`Unverified author attribution found in Article JSON-LD: ${slug}`);
  if (!article.editorial.datePublished && "datePublished" in articleSchema) {
    throw new Error(`Unverified publication date found in Article JSON-LD: ${slug}`);
  }
  if (!article?.editorial.dateModified && "dateModified" in articleSchema) {
    throw new Error(`Unverified modification date found in Article JSON-LD: ${slug}`);
  }
}

const searchSnapshot = path.join(distRoot, "search", "index.html");
if (!fs.existsSync(searchSnapshot) || !fs.readFileSync(searchSnapshot, "utf8").includes('content="noindex, follow"')) {
  throw new Error("Search snapshot must be noindex, follow");
}

const authoredGuideSlugs = [
  "read-the-offer-beyond-ctc",
  "runway-debt-and-big-decisions",
  "independent-work-without-romanticising-it",
  "career-switches-and-education",
  "getting-hired-through-evidence-and-conversations",
  "performance-reviews-and-career-choices",
  "engineering-careers-without-the-title-trap",
  "ai-at-work-questions-to-ask",
  "data-science-career-claims",
  "cybersecurity-and-green-work",
  "layoff-recovery-and-employment-documents",
  "notice-period-and-return-to-office",
  "cross-border-and-remote-pay",
  "senior-engineering-and-operations-work",
  "skills-passion-and-career-constraints",
  "culture-fit-and-product-management",
  "workplace-culture-and-boundaries",
  "how-to-read-salary-and-hiring-claims",
];
function visibleArticleText(markup: string): string {
  return markup
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}
function visibleWordCount(text: string): number {
  return text.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’.-]*\b/gu)?.length ?? 0;
}
function plainWordCount(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}
function exampleRupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
for (const slug of authoredGuideSlugs) {
  const route = routeRegistry.routes.find((item) => item.guideSlug === slug);
  if (!route) throw new Error(`Missing registered guide route: ${slug}`);
  const file = path.join(distRoot, route.path.replace(/^\/+/, ""), "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing server-rendered guide HTML: ${slug}`);
  const html = fs.readFileSync(file, "utf8");
  const mainMarkup = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
  if (!mainMarkup) throw new Error(`Guide ${slug} has no server-rendered main content.`);
  for (const unsupportedClaim of ["Aman Mishra", "Aanchal Mishra", "Alok Tiwari", "Abhishek Tiwari", "Rajan Dubey", "11 October 2026", "Drafting used AI assistance"]) {
    if (html.includes(unsupportedClaim)) {
      throw new Error(`Guide ${slug} includes unsupported author or date details: ${unsupportedClaim}`);
    }
  }
  for (const match of mainMarkup.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const words = plainWordCount(visibleArticleText(match[1]));
    if (words > 90) {
      throw new Error(`Guide ${slug} has a ${words}-word paragraph; the limit is 90.`);
    }
  }
  if (route === "/salary-calculator") {
    for (const { label, result } of ctcWorkedExampleResults) {
      const displayedValues = [
        label,
        exampleRupees(result.inputs.annualCtc),
        exampleRupees(result.annualGrossAtZeroVariable),
        exampleRupees(result.inputs.annualVariablePay),
        exampleRupees(result.annualTaxAtTarget),
        exampleRupees(result.monthlyInHandAtZeroVariable),
        exampleRupees(result.monthlyInHandAtTargetAverage),
      ];
      if (displayedValues.some((value) => !html.includes(value))) {
        throw new Error(`Salary calculator worked example no longer matches its calculator output: ${label}`);
      }
    }
  }
  const schemaNodes = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]) as Record<string, unknown>)
    .flatMap((schema) => Array.isArray(schema["@graph"]) ? schema["@graph"] as Array<Record<string, unknown>> : [schema]);
  const articleSchema = schemaNodes.find((schema) => schema["@type"] === "Article");
  const breadcrumbSchema = schemaNodes.find((schema) => schema["@type"] === "BreadcrumbList");
  const faqSchema = schemaNodes.find((schema) => schema["@type"] === "FAQPage");
  const breadcrumbItems = breadcrumbSchema?.itemListElement as Array<{ position: number; name: string }> | undefined;
  const faqItems = faqSchema?.mainEntity as Array<unknown> | undefined;
  const guideMetadata = guideMetadataBySlug.get(slug);
  const actualPublishedDate = typeof articleSchema?.datePublished === "string" ? articleSchema.datePublished : null;
  const actualModifiedDate = typeof articleSchema?.dateModified === "string" ? articleSchema.dateModified : null;
  if (!articleSchema || !guideMetadata ||
      actualPublishedDate !== guideMetadata.datePublished ||
      actualModifiedDate !== guideMetadata.dateModified) {
    throw new Error(`Guide ${slug} Article JSON-LD dates must match the available editorial metadata exactly.`);
  }
  if (JSON.stringify(articleSchema.author) !== JSON.stringify(createFounderAuthor(siteUrl))) {
    throw new Error(`Guide ${slug} Article JSON-LD must credit the founder as author.`);
  }
  if (!html.includes(`rel="author">${SITE_FOUNDER.name}</a>`)) {
    throw new Error(`Guide ${slug} is missing its visible author byline.`);
  }
  if (!breadcrumbItems || breadcrumbItems.length !== 3 || breadcrumbItems[1]?.name !== "Guides" || breadcrumbItems[2]?.name !== route.title) {
    throw new Error(`Guide ${slug} has an invalid BreadcrumbList.`);
  }
  if (!faqItems || faqItems.length < 4 || faqItems.length > 6) {
    throw new Error(`Guide ${slug} must expose four to six guide-specific FAQ schema entries.`);
  }
  const pageHeading = html.match(/<header class="snapshot-header">([\s\S]*?)<\/header>/i)?.[1];
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!pageHeading || !main) throw new Error(`Missing server-rendered guide content: ${slug}`);
  const words = visibleWordCount(visibleArticleText(`${pageHeading} ${main}`));
  if (words < 1200 || words > 2000) {
    throw new Error(`Guide ${slug} has ${words} visible words in server-rendered HTML; expected 1200–2000.`);
  }
  const paragraphs = [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const match of paragraphs) {
    const paragraph = visibleArticleText(match[1]);
    if (visibleWordCount(paragraph) < 25) continue;
    const normalized = paragraph.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const owner = longParagraphOwners.get(normalized);
    if (owner) throw new Error(`Duplicate paragraph of 25+ words appears in ${owner} and ${slug}.`);
    longParagraphOwners.set(normalized, slug);
  }
}

// Every published guide opens with its direct answer (src/data/guide-direct-answers.ts).
for (const route of routeRegistry.routes.filter((entry) => entry.kind === "guide" && entry.sitemap)) {
  const slug = route.guideSlug ?? "";
  const directAnswer = getGuideDirectAnswer(slug);
  if (!directAnswer) throw new Error(`Guide ${slug} has no entry in src/data/guide-direct-answers.ts.`);
  const html = fs.readFileSync(path.join(distRoot, route.path.replace(/^\/+/, ""), "index.html"), "utf8");
  const text = visibleArticleText(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "");
  if (!html.includes('class="snapshot-direct-answer"') || !text.includes(directAnswer.answer) || !text.includes(directAnswer.question)) {
    throw new Error(`Guide ${slug} snapshot is missing its direct-answer box.`);
  }
}

const appShellRoutes = routeRegistry.routes
  .filter((route) => route.render === "app-shell")
  .flatMap((route) => {
    if (route.path === "/article/*") return [];
    if (route.path === "/sign-in/*?") {
      return ["/sign-in", "/sign-in/sso-callback", "/sign-in/factor-one", "/sign-in/factor-two"];
    }
    if (route.path === "/sign-up/*?") {
      return ["/sign-up", "/sign-up/sso-callback", "/sign-up/continue"];
    }
    return [route.path];
  });

for (const route of appShellRoutes) {
  const file = path.join(distRoot, route.replace(/^\/+/, ""), "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing app shell: ${route}`);
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes('content="noindex, follow"') || !html.includes('<link rel="canonical"')) {
    throw new Error(`Invalid app shell: ${route}`);
  }
}

console.log(`Verified ${articles.length + staticRoutes.length} crawler-visible route snapshots and ${appShellRoutes.length} app shells.`);