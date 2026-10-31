import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(root, "../..");
const requestedOrigin = process.argv.find((argument) => argument.startsWith("--origin="))?.slice("--origin=".length)
  ?? process.env.SEO_PRODUCTION_ORIGIN
  ?? "https://careerreality.in";
const origin = new URL(requestedOrigin).origin;
const requestedAlternates = process.argv.find((argument) => argument.startsWith("--alternate-origins="))?.slice("--alternate-origins=".length)
  ?? process.env.SEO_ALTERNATE_ORIGINS
  ?? "https://www.careerreality.in,https://indigo-bowed-megabyte.replit.app";
const alternateOrigins = requestedAlternates
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => new URL(value).origin)
  .filter((value, index, values) => value !== origin && values.indexOf(value) === index);
const auditOrigins = [origin, ...alternateOrigins];
const decisionsPath = path.join(workspaceRoot, "docs", "work", "URL_DECISIONS.csv");
const localSitemapPath = path.join(root, "public", "sitemap.xml");
const routeRegistryPath = path.join(root, "src", "data", "route-registry.json");
const forbiddenPublicCopy = [
  "source citation unavailable",
  "directional stability",
  "A concise editorial brief",
  "CareerReality keeps assumptions, evidence freshness",
  "Read the journal",
  "Archived article body text is not republished",
  "words of editorial framing",
];

function normalizeRoute(value, baseOrigin = origin) {
  const url = value.startsWith("http") ? new URL(value) : new URL(value, baseOrigin);
  const pathname = url.pathname === "/" ? "/" : `/${url.pathname.replace(/^\/+|\/+$/g, "")}/`;
  return pathname;
}

function readRetiredRoutes(redirectedRoutes = new Set()) {
  const lines = fs.readFileSync(decisionsPath, "utf8").trim().split(/\r?\n/);
  const rows = lines.slice(1).map((line) => {
    const [rawRoute, rawAction, rawTarget] = line.split(",", 3);
    return {
      route: normalizeRoute((rawRoute ?? "").replace(/^"|"$/g, "").trim()),
      action: (rawAction ?? "").replace(/^"|"$/g, "").trim(),
      target: (rawTarget ?? "").replace(/^"|"$/g, "").trim(),
    };
  });
  if (rows.length !== 80) throw new Error(`Expected 80 reviewed URL decisions; found ${rows.length}.`);
  const invalid = rows.find((row) =>
    !row.route ||
    (row.action === "410" && row.target) ||
    (row.action === "200_NOINDEX" && (!row.route.startsWith("/article/") || row.target)) ||
    (row.action !== "410" && row.action !== "200_NOINDEX" && !(row.route === "/companies/" && row.action === "200" && !row.target))
  );
  if (invalid) throw new Error(`Unsupported retired-route decision for ${invalid.route || "(missing route)"}.`);
  return [...new Set(rows.filter((row) => row.action === "410" && !redirectedRoutes.has(row.route)).map((row) => row.route))];
}

function readLocalSitemapRoutes() {
  const body = fs.existsSync(localSitemapPath) ? fs.readFileSync(localSitemapPath, "utf8") : "";
  if (!body) throw new Error(`Local sitemap is missing: ${localSitemapPath}`);
  return [...new Set(sitemapRoutes(body).map((route) => normalizeRoute(route)))];
}

function tagAttribute(html, tagPattern, attribute) {
  const tag = html.match(tagPattern)?.[0] ?? "";
  return tag.match(new RegExp(`\\b${attribute}=["']([^"']*)["']`, "i"))?.[1] ?? "";
}

function robots(html) {
  return tagAttribute(html, /<meta\b[^>]*\bname=["']robots["'][^>]*>/i, "content");
}

function canonical(html) {
  return tagAttribute(html, /<link\b[^>]*\brel=["']canonical["'][^>]*>/i, "href");
}

function sitemapRoutes(body) {
  return [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

async function fetchPage(requestOrigin, route) {
  try {
    const response = await fetch(`${requestOrigin}${route}`, { redirect: "follow" });
    return { route, status: response.status, url: response.url, body: await response.text() };
  } catch (error) {
    return { route, status: null, url: "", body: "", error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchRedirect(requestOrigin, route) {
  try {
    let url = `${requestOrigin}${route}`;
    const chain = [];
    for (let hop = 0; hop < 5; hop += 1) {
      const response = await fetch(url, { redirect: "manual" });
      const location = response.headers.get("location") ?? "";
      if (response.status >= 300 && response.status < 400 && location) {
        chain.push({ status: response.status, url: response.url || url, location });
        url = new URL(location, url).href;
      } else {
        return {
          route,
          status: chain[0]?.status ?? response.status,
          url: chain[0]?.url ?? response.url ?? url,
          location: chain[0]?.location ?? "",
          finalStatus: response.status,
          finalUrl: response.url || url,
          chain,
        };
      }
    }
    return {
      route,
      status: chain[0].status,
      url: chain[0].url,
      location: chain[0].location,
      finalStatus: null,
      finalUrl: url,
      chain,
      error: "redirect limit exceeded",
    };
  } catch (error) {
    return { route, status: null, url: "", location: "", error: error instanceof Error ? error.message : String(error) };
  }
}

function redirectChainEndsAt(result, targetPath) {
  if (!result) return false;
  if (!Array.isArray(result.chain)) {
    if (result.status !== 301 || !result.location) return false;
    try {
      return normalizeRoute(new URL(result.location, result.url).pathname) === targetPath;
    } catch {
      return false;
    }
  }
  if (result.finalStatus !== 200) return false;
  if (!result.chain.length || result.chain.some((hop) => hop.status !== 301 || !hop.location)) return false;
  try {
    const reachedTargets = result.chain.map((hop) =>
      normalizeRoute(new URL(hop.location, hop.url).pathname),
    );
    const finalPath = normalizeRoute(new URL(result.finalUrl).pathname);
    return finalPath === targetPath && reachedTargets.includes(targetPath);
  } catch {
    return false;
  }
}

async function fetchMany(requestOrigin, routes) {
  const results = [];
  for (let index = 0; index < routes.length; index += 8) {
    results.push(...await Promise.all(routes.slice(index, index + 8).map((route) => fetchPage(requestOrigin, route))));
  }
  return results;
}

function evaluateOriginContract({
  requestOrigin,
  primaryOrigin,
  retiredRoutes,
  redirects = [],
  redirectResults = [],
  protectedIndexableRoutes,
  localSitemapRoutes,
  liveSitemapRoutes,
  sitemapResult,
  sitemapOrigins,
  protectedResults,
  retiredResults,
  companyRedirectRoutes = [],
  companyRedirectResults = [],
  sitemapPageResults,
}) {
  const liveSitemapSet = new Set(liveSitemapRoutes);
  const localSitemapSet = new Set(localSitemapRoutes);
  const failures = [];
  const addFailure = (failure) => failures.push({ origin: requestOrigin, ...failure });
  const redirectResultsByRoute = new Map(redirectResults.map((result) => [result.route, result]));

  for (const result of protectedResults) {
    if (result.status !== 200) {
      addFailure({
        route: result.route,
        issue: `HTTP ${result.status ?? "error"}`,
        expected: "200",
        observed: String(result.status ?? "error"),
        detail: result.error ?? result.url,
      });
    }
    if (robots(result.body) !== "index, follow") {
      addFailure({
        route: result.route,
        issue: "robots",
        expected: "index, follow",
        observed: robots(result.body) || "(missing)",
      });
    }
    if (canonical(result.body) !== `${primaryOrigin}${result.route}`) {
      addFailure({
        route: result.route,
        issue: "canonical",
        expected: `${primaryOrigin}${result.route}`,
        observed: canonical(result.body) || "(missing)",
      });
    }
  }

  const missingProtected = protectedIndexableRoutes.filter((route) => !liveSitemapSet.has(route));
  const retiredInSitemap = retiredRoutes.filter((route) => liveSitemapSet.has(route));
  const missingFromPublished = localSitemapRoutes.filter((route) => !liveSitemapSet.has(route));
  const unexpectedInPublished = liveSitemapRoutes.filter((route) => !localSitemapSet.has(route));

  for (const result of retiredResults) {
    if (result.status !== 404 && result.status !== 410) {
      addFailure({
        route: result.route,
        issue: "retired route remains live",
        expected: "404 or 410",
        observed: String(result.status ?? "error"),
        detail: result.error ?? result.url,
      });
    }
    try {
      const finalPath = normalizeRoute(new URL(result.url).pathname);
      if (finalPath !== result.route) {
        addFailure({
          route: result.route,
          issue: "retired route redirected to a different path",
          expected: result.route,
          observed: finalPath,
          detail: result.url,
        });
      }
    } catch {
      if (!result.error) {
        addFailure({
          route: result.route,
          issue: "retired route final URL is invalid",
          expected: result.route,
          observed: result.url || "(missing)",
        });
      }
    }
  }

  const companyRedirectResultsByRoute = new Map(companyRedirectResults.map((result) => [result.route, result]));
  for (const route of companyRedirectRoutes) {
    const result = companyRedirectResultsByRoute.get(route);
    let locationPath = "";
    try {
      locationPath = normalizeRoute(new URL(result?.location ?? "", requestOrigin).pathname);
    } catch {
      // The failure below reports missing or malformed redirect destinations.
    }
    if (!redirectChainEndsAt(result, "/companies/")) {
      addFailure({
        route,
        issue: "draft company route redirect",
        expected: "301 to /companies/",
        observed: result?.status === 301 ? `301 to ${locationPath || "(missing location)"}` : String(result?.status ?? "error"),
        detail: result?.error ?? result?.url,
      });
    }
  }

  for (const redirect of redirects) {
    const result = redirectResultsByRoute.get(redirect.route);
    let locationPath = "";
    try {
      locationPath = normalizeRoute(new URL(result?.location ?? "", requestOrigin).pathname);
    } catch {
      // The failure below reports missing or malformed redirect destinations.
    }
    if (!redirectChainEndsAt(result, redirect.target)) {
      addFailure({
        route: redirect.route,
        issue: "legacy route redirect",
        expected: `301 to ${redirect.target}`,
        observed: result?.status === 301 ? `301 to ${locationPath || "(missing location)"}` : String(result?.status ?? "error"),
        detail: result?.error ?? result?.url,
      });
    }
  }

  if (sitemapResult.status !== 200) {
    addFailure({
      route: "/sitemap.xml",
      issue: `HTTP ${sitemapResult.status ?? "error"}`,
      expected: "200",
      observed: String(sitemapResult.status ?? "error"),
      detail: sitemapResult.error ?? sitemapResult.url,
    });
  }
  if (sitemapOrigins.some((sitemapOrigin) => sitemapOrigin !== primaryOrigin)) {
    addFailure({
      route: "/sitemap.xml",
      issue: "sitemap location uses non-primary origin",
      expected: primaryOrigin,
      observed: sitemapOrigins.join(", ") || "(missing)",
    });
  }
  for (const route of missingProtected) {
    addFailure({
      route,
      issue: "protected route missing from live sitemap",
      expected: "present in live sitemap",
      observed: "missing",
    });
  }
  for (const route of retiredInSitemap) {
    addFailure({
      route,
      issue: "retired route present in live sitemap",
      expected: "absent from live sitemap",
      observed: "present",
    });
  }
  for (const route of missingFromPublished) {
    addFailure({
      route,
      issue: "local sitemap route missing from live sitemap",
      expected: "present in live sitemap",
      observed: "missing",
    });
  }
  for (const route of unexpectedInPublished) {
    addFailure({
      route,
      issue: "stale route present only in live sitemap",
      expected: "absent from live sitemap",
      observed: "present",
    });
  }

  const noindexSitemapRoutes = [];
  for (const result of sitemapPageResults) {
    if (result.status !== 200) {
      addFailure({
        route: result.route,
        issue: `sitemap page HTTP ${result.status ?? "error"}`,
        expected: "200",
        observed: String(result.status ?? "error"),
        detail: result.error ?? result.url,
      });
    }
    const robotsValue = robots(result.body);
    if (robotsValue !== "index, follow") {
      const sitemapRoute = { route: result.route, robots: robotsValue || "(missing)" };
      if (/noindex/i.test(robotsValue)) noindexSitemapRoutes.push(sitemapRoute);
      addFailure({
        route: sitemapRoute.route,
        issue: /noindex/i.test(robotsValue) ? "noindex route present in live sitemap" : "sitemap page robots",
        expected: "index, follow",
        observed: sitemapRoute.robots,
      });
    }
    if (canonical(result.body) !== `${primaryOrigin}${result.route}`) {
      addFailure({
        route: result.route,
        issue: "sitemap page canonical",
        expected: `${primaryOrigin}${result.route}`,
        observed: canonical(result.body) || "(missing)",
      });
    }
    const forbiddenPhrase = forbiddenPublicCopy.find((phrase) =>
      result.body.toLowerCase().includes(phrase.toLowerCase()),
    );
    if (forbiddenPhrase) {
      addFailure({
        route: result.route,
        issue: "forbidden legacy copy in published HTML",
        expected: "none",
        observed: forbiddenPhrase,
      });
    }
  }

  const protectedIndexablePassed = protectedResults.filter((result) => result.status === 200
    && robots(result.body) === "index, follow"
    && canonical(result.body) === `${primaryOrigin}${result.route}`).length;
  const retiredRoutePassCount = retiredResults.filter((result) => {
    if (result.status !== 404 && result.status !== 410) return false;
    try {
      return normalizeRoute(new URL(result.url).pathname) === result.route;
    } catch {
      return false;
    }
  }).length;
  const companyRedirectPassCount = companyRedirectRoutes.filter((route) => {
    const result = companyRedirectResultsByRoute.get(route);
    return redirectChainEndsAt(result, "/companies/");
  }).length;
  const redirectPassCount = redirects.filter((redirect) => {
    const result = redirectResultsByRoute.get(redirect.route);
    return redirectChainEndsAt(result, redirect.target);
  }).length;
  const finalOrigins = [...new Set([...protectedResults, ...retiredResults].map((result) => {
    try {
      return new URL(result.url).origin;
    } catch {
      return "(error)";
    }
  }))];

  return {
    origin: requestOrigin,
    finalOrigins,
    canonicalizesToPrimary: failures.every((failure) => !["canonical", "sitemap page canonical"].includes(failure.issue)),
    protectedIndexablePassed,
    protectedIndexableRoutes: protectedIndexableRoutes.length,
    retiredRoutePassCount,
    retiredRouteCount: retiredRoutes.length,
    companyRedirectPassCount,
    companyRedirectRouteCount: companyRedirectRoutes.length,
    redirectPassCount,
    redirectRouteCount: redirects.length,
    liveSitemapRoutes: liveSitemapRoutes.length,
    localSitemapRoutes: localSitemapRoutes.length,
    sitemapOrigins,
    noindexSitemapRoutes,
    missingProtected,
    retiredInSitemap,
    missingFromPublished,
    unexpectedInPublished,
    failures,
    passed: failures.length === 0,
  };
}

async function auditOrigin(requestOrigin, config) {
  const sitemapResult = await fetchPage(requestOrigin, "/sitemap.xml");
  const sitemapLocations = sitemapRoutes(sitemapResult.body);
  const liveSitemapRoutes = sitemapLocations.map((route) => normalizeRoute(route, requestOrigin));
  const sitemapOrigins = [...new Set(sitemapLocations.map((location) => {
    try {
      return new URL(location).origin;
    } catch {
      return "(invalid)";
    }
  }))];
  const protectedResults = await fetchMany(requestOrigin, config.protectedIndexableRoutes);
  const retiredResults = await fetchMany(requestOrigin, config.retiredRoutes);
  const redirectResults = await Promise.all(config.redirects.map((redirect) => fetchRedirect(requestOrigin, redirect.route)));
  const companyRedirectResults = await Promise.all(
    config.companyRedirectRoutes.map((route) => fetchRedirect(requestOrigin, route)),
  );
  const sitemapPageResults = await fetchMany(requestOrigin, [...new Set(liveSitemapRoutes)]);
  return evaluateOriginContract({
    ...config,
    requestOrigin,
    liveSitemapRoutes,
    sitemapResult,
    sitemapOrigins,
    protectedResults,
    retiredResults,
    redirectResults,
    companyRedirectResults,
    sitemapPageResults,
  });
}

async function main() {
  const routeRegistry = JSON.parse(fs.readFileSync(routeRegistryPath, "utf8"));
  const redirects = routeRegistry.redirects.map((entry) => ({
    route: normalizeRoute(entry.from),
    target: normalizeRoute(entry.to),
    status: entry.status,
  }));
  const companyRedirectRoutes = routeRegistry.drafts.companyPages.map((entry) => normalizeRoute(entry.path));
  const redirectedRoutes = new Set([
    ...redirects.map((entry) => entry.route),
    ...companyRedirectRoutes,
  ]);
  const retiredRoutes = readRetiredRoutes(redirectedRoutes);
  const localSitemapRoutes = readLocalSitemapRoutes();
  const config = {
    primaryOrigin: origin,
    retiredRoutes,
    redirects: redirects.filter((entry) => entry.status === 301),
    companyRedirectRoutes,
    protectedIndexableRoutes: localSitemapRoutes,
    localSitemapRoutes,
  };
  const originReports = await Promise.all(auditOrigins.map((requestOrigin) => auditOrigin(requestOrigin, config)));
  const report = {
    origin,
    alternateOrigins,
    decisionsPath,
    retiredRouteCount: retiredRoutes.length,
    companyRedirectRouteCount: companyRedirectRoutes.length,
    redirectRouteCount: redirects.filter((entry) => entry.status === 301).length,
    protectedIndexableRoutes: localSitemapRoutes.length,
    origins: originReports,
    passed: originReports.every((result) => result.passed),
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

export { evaluateOriginContract, normalizeRoute, sitemapRoutes };

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}