import assert from "node:assert/strict";
import test from "node:test";

import { evaluateOriginContract } from "../scripts/verify-indexed-routes.mjs";

const primaryOrigin = "https://careerreality.in";
const requestOrigin = "https://www.careerreality.in";
const localSitemapRoutes = ["/", "/tools/"];
const retiredRoutes = ["/article/retired/", "/companies/retired/"];

function pageResult(route, robotsValue = "index, follow", canonicalValue = `${primaryOrigin}${route}`) {
  return {
    route,
    status: 200,
    url: `${requestOrigin}${route}`,
    body: `<meta name="robots" content="${robotsValue}"><link rel="canonical" href="${canonicalValue}">`,
  };
}

function retiredResult(route, status = 404, url = `${requestOrigin}${route}`) {
  return { route, status, url, body: "" };
}

function evaluateFixture(options = {}) {
  const localRoutes = options.localSitemapRoutes ?? localSitemapRoutes;
  const retiredRouteList = options.retiredRoutes ?? retiredRoutes;
  const liveRoutes = options.liveSitemapRoutes ?? localRoutes;
  const sitemapPageResults = options.sitemapPageResults ?? liveRoutes.map((route) => pageResult(route));

  return evaluateOriginContract({
    requestOrigin,
    primaryOrigin,
    retiredRoutes: retiredRouteList,
    redirects: options.redirects ?? [],
    redirectResults: options.redirectResults ?? [],
    companyRedirectRoutes: options.companyRedirectRoutes ?? [],
    companyRedirectResults: options.companyRedirectResults ?? [],
    protectedIndexableRoutes: localRoutes,
    localSitemapRoutes: localRoutes,
    liveSitemapRoutes: liveRoutes,
    sitemapResult: { status: 200, url: `${requestOrigin}/sitemap.xml`, body: "" },
    sitemapOrigins: [primaryOrigin],
    protectedResults: options.protectedResults ?? localRoutes.map((route) => pageResult(route)),
    retiredResults: options.retiredResults ?? retiredRouteList.map((route) => retiredResult(route)),
    sitemapPageResults,
  });
}

test("reports a local indexable route missing from the live sitemap", () => {
  const report = evaluateFixture({
    liveSitemapRoutes: ["/"],
    sitemapPageResults: [pageResult("/")],
  });

  assert.deepEqual(report.failures.find((item) => item.issue === "protected route missing from live sitemap"), {
    origin: requestOrigin,
    route: "/tools/",
    issue: "protected route missing from live sitemap",
    expected: "present in live sitemap",
    observed: "missing",
  });
  assert.equal(report.passed, false);
});

test("reports a stale route that exists only in the live sitemap", () => {
  const staleRoutes = [...localSitemapRoutes, "/sitemap/"];
  const report = evaluateFixture({
    liveSitemapRoutes: staleRoutes,
    sitemapPageResults: staleRoutes.map((route) => pageResult(route)),
  });

  assert.deepEqual(report.failures.find((item) => item.issue === "stale route present only in live sitemap"), {
    origin: requestOrigin,
    route: "/sitemap/",
    issue: "stale route present only in live sitemap",
    expected: "absent from live sitemap",
    observed: "present",
  });
  assert.equal(report.passed, false);
});

test("reports a noindex page that appears in the live sitemap", () => {
  const report = evaluateFixture({
    sitemapPageResults: [
      pageResult("/", "noindex, follow"),
      pageResult("/tools/"),
    ],
  });

  assert.deepEqual(report.failures.find((item) => item.issue === "noindex route present in live sitemap"), {
    origin: requestOrigin,
    route: "/",
    issue: "noindex route present in live sitemap",
    expected: "index, follow",
    observed: "noindex, follow",
  });
  assert.equal(report.passed, false);
});

test("rejects assessment-specific legacy phrases in published sitemap HTML", () => {
  const result = pageResult("/");
  result.body += "<p>A concise editorial brief on this page.</p>";
  const report = evaluateFixture({ sitemapPageResults: [result] });

  assert.deepEqual(
    report.failures.find((item) => item.issue === "forbidden legacy copy in published HTML"),
    {
      origin: requestOrigin,
      route: "/",
      issue: "forbidden legacy copy in published HTML",
      expected: "none",
      observed: "A concise editorial brief",
    },
  );
  assert.equal(report.passed, false);
});

test("reports a sitemap page with no explicit index-follow directive", () => {
  const report = evaluateFixture({
    sitemapPageResults: [
      { ...pageResult("/"), body: '<link rel="canonical" href="https://careerreality.in/">'},
      pageResult("/tools/"),
    ],
  });

  assert.deepEqual(report.failures.find((item) => item.issue === "sitemap page robots"), {
    origin: requestOrigin,
    route: "/",
    issue: "sitemap page robots",
    expected: "index, follow",
    observed: "(missing)",
  });
  assert.equal(report.passed, false);
});

test("reports wrong robots and canonical values for an indexable route", () => {
  const report = evaluateFixture({
    protectedResults: [
      pageResult("/", "noindex, follow", `${primaryOrigin}/wrong/`),
      pageResult("/tools/"),
    ],
  });

  assert.deepEqual(report.failures.filter((item) => item.route === "/"), [
    {
      origin: requestOrigin,
      route: "/",
      issue: "robots",
      expected: "index, follow",
      observed: "noindex, follow",
    },
    {
      origin: requestOrigin,
      route: "/",
      issue: "canonical",
      expected: `${primaryOrigin}/`,
      observed: `${primaryOrigin}/wrong/`,
    },
  ]);
  assert.equal(report.passed, false);
});

test("accepts static 404 or explicit 410 for retired routes", () => {
  const report = evaluateFixture({
    retiredResults: [
      retiredResult(retiredRoutes[0], 404),
      retiredResult(retiredRoutes[1], 410),
    ],
  });

  assert.equal(report.retiredRoutePassCount, 2);
  assert.equal(report.passed, true);
});

test("requires draft company routes to redirect directly to the checklist", () => {
  const route = "/companies/example/";
  const report = evaluateFixture({
    companyRedirectRoutes: [route],
    companyRedirectResults: [{ route, status: 301, url: `${requestOrigin}${route}`, location: "/companies/" }],
  });

  assert.equal(report.companyRedirectPassCount, 1);
  assert.equal(report.passed, true);
});

test("rejects draft company routes that do not redirect to the checklist", () => {
  const route = "/companies/example/";
  const report = evaluateFixture({
    companyRedirectRoutes: [route],
    companyRedirectResults: [{ route, status: 302, url: `${requestOrigin}${route}`, location: "/companies/" }],
  });

  assert.equal(report.failures.find((item) => item.issue === "draft company route redirect")?.expected, "301 to /companies/");
  assert.equal(report.passed, false);
});

test("requires registered legacy URLs to return 301 to the mapped page", () => {
  const route = "/article/legacy/";
  const target = "/guides/related/";
  const report = evaluateFixture({
    redirects: [{ route, target }],
    redirectResults: [{ route, status: 301, url: `${requestOrigin}${route}`, location: target }],
  });

  assert.equal(report.redirectPassCount, 1);
  assert.equal(report.passed, true);
});

test("accepts host canonicalization before the registered route redirect", () => {
  const route = "/category/career-switch/";
  const target = "/guides/career-switches-and-education/";
  const report = evaluateFixture({
    redirects: [{ route, target }],
    redirectResults: [{
      route,
      status: 301,
      url: `${requestOrigin}${route}`,
      location: `https://careerreality.in${route}`,
      chain: [
        { status: 301, url: `${requestOrigin}${route}`, location: `https://careerreality.in${route}` },
        { status: 301, url: `https://careerreality.in${route}`, location: target },
      ],
      finalStatus: 200,
      finalUrl: `https://careerreality.in${target}`,
    }],
  });

  assert.equal(report.redirectPassCount, 1);
  assert.equal(report.passed, true);
});

test("rejects a registered legacy URL that redirects to the wrong page", () => {
  const route = "/article/legacy/";
  const target = "/guides/related/";
  const report = evaluateFixture({
    redirects: [{ route, target }],
    redirectResults: [{ route, status: 302, url: `${requestOrigin}${route}`, location: "/guides/" }],
  });

  assert.equal(report.failures.find((item) => item.issue === "legacy route redirect")?.expected, `301 to ${target}`);
  assert.equal(report.passed, false);
});

test("reports a retired route that still returns 200", () => {
  const report = evaluateFixture({
    retiredResults: [
      retiredResult(retiredRoutes[0], 200),
      retiredResult(retiredRoutes[1], 404),
    ],
  });

  assert.deepEqual(report.failures.find((item) => item.issue === "retired route remains live"), {
    origin: requestOrigin,
    route: retiredRoutes[0],
    issue: "retired route remains live",
    expected: "404 or 410",
    observed: "200",
    detail: `${requestOrigin}${retiredRoutes[0]}`,
  });
  assert.equal(report.passed, false);
});

test("rejects a retired route redirected to a different path", () => {
  const report = evaluateFixture({
    retiredResults: [
      retiredResult(retiredRoutes[0], 404, `${requestOrigin}/companies/`),
      retiredResult(retiredRoutes[1], 404),
    ],
  });

  assert.equal(
    report.failures.find((item) => item.issue === "retired route redirected to a different path")?.observed,
    "/companies/",
  );
  assert.equal(report.passed, false);
});
