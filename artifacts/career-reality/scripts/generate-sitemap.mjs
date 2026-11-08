import fs from "node:fs";
import path from "node:path";
import { getSiteUrl } from "./seo-site-url.mjs";

const root = path.resolve(import.meta.dirname, "..");
const siteUrl = getSiteUrl();
const routeRegistry = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/route-registry.json"), "utf8"),
);

function publicPath(route) {
  return route === "/" ? "/" : `${route}/`;
}

const sitemapRoutes = routeRegistry.routes
  .filter((route) => route.indexability === "indexable" && route.sitemap)
  .map((route) => route.path);
const duplicateSitemapRoutes = sitemapRoutes.filter((route, index) =>
  sitemapRoutes.indexOf(route) !== index,
);
if (duplicateSitemapRoutes.length > 0) {
  throw new Error(`Duplicate sitemap routes are not allowed: ${[...new Set(duplicateSitemapRoutes)].join(", ")}`);
}
const invalidSitemapRoutes = sitemapRoutes.filter((route) => {
  const policy = routeRegistry.routes.find((entry) => entry.path === route);
  return !policy || policy.render !== "snapshot";
});
if (invalidSitemapRoutes.length > 0) {
  throw new Error(`Only generated public snapshots can be listed in the sitemap: ${invalidSitemapRoutes.join(", ")}`);
}
const humanRoutePath = routeRegistry.sitemapPolicy.humanRoute.replace(/\/+$/, "") || "/";
const humanRoutePolicy = routeRegistry.routes.find((route) => route.path === humanRoutePath);
if (
  routeRegistry.sitemapPolicy.humanRouteIndexability !== "noindex" ||
  !humanRoutePolicy ||
  humanRoutePolicy.render !== "snapshot" ||
  humanRoutePolicy.indexability !== "noindex" ||
  humanRoutePolicy.sitemap
) {
  throw new Error("The human-readable sitemap route must remain noindex.");
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

// <lastmod> only where the repo records a verified modification date; other routes omit it.
const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const lastModified = new Map();
const guideData = JSON.parse(fs.readFileSync(path.join(root, "src/data/generated-pillar-guides.json"), "utf8"));
for (const guide of guideData.guides ?? []) {
  const routeEntry = routeRegistry.routes.find((entry) => entry.guideSlug === guide.slug);
  if (routeEntry && validDate(guide.dateModified)) lastModified.set(routeEntry.path, guide.dateModified);
}
const layoffEvents = JSON.parse(fs.readFileSync(path.join(root, "src/data/layoff-events.json"), "utf8"));
for (const event of layoffEvents) {
  const updated = typeof event.updatedAt === "string" ? event.updatedAt.slice(0, 10) : null;
  if (validDate(updated)) lastModified.set(`/layoffs/${event.slug}`, updated);
}

const body = sitemapRoutes
  .map((route) => {
    const lastmod = lastModified.get(route);
    return `  <url><loc>${escapeXml(`${siteUrl}${publicPath(route)}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
const sitemapFile = path.join(
  root,
  "public",
  routeRegistry.sitemapPolicy.xmlRoute.replace(/^\/+/, ""),
);
fs.writeFileSync(sitemapFile, sitemap);
fs.writeFileSync(
  path.join(root, "public/robots.txt"),
  [
    "User-agent: *",
    "Allow: /",
    "Disallow: /workspace",
    "Disallow: /sign-in",
    "Disallow: /sign-up",
    `Sitemap: ${siteUrl}${routeRegistry.sitemapPolicy.xmlRoute}`,
    "",
  ].join("\n"),
);

const companyRedirects = (routeRegistry.drafts?.companyPages ?? []).map((entry) => ({
  from: entry.path,
  to: "/companies/",
  status: 301,
}));
const redirectRules = new Map();
for (const entry of [...routeRegistry.redirects, ...companyRedirects]) {
  const normalized = entry.from.replace(/\/+$/, "") || "/";
  for (const from of normalized === "/" ? ["/"] : [normalized, `${normalized}/`]) {
    redirectRules.set(from, `${from} ${entry.to} ${entry.status}!`);
  }
}
const manifest = [...redirectRules.values()].sort().join("\n") + "\n";
for (const companyPage of routeRegistry.drafts?.companyPages ?? []) {
  const source = companyPage.path;
  if (!manifest.includes(`${source} /companies/ 301!`)) {
    throw new Error(`Missing permanent company-page redirect: ${source}`);
  }
}
if (!manifest.includes("/articles /guides/ 301!") || !manifest.includes("/articles/ /guides/ 301!")) {
  throw new Error("The archived /articles route must permanently redirect to /guides/ with and without a trailing slash.");
}
fs.writeFileSync(path.join(root, "public/_redirects"), manifest);