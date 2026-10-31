import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  archiveCheckRecords,
  fetchSitemapPage,
  formatSitemapAuditSummary,
  parseSitemapAuditWarnMs,
  publishedTitleCheck,
  publishedSitemapPageChecks,
  runSitemapAuditBatches,
  sitemapAuditElapsedMs,
  sitemapAuditConfigurationWarning,
  sitemapAuditConfigurationWarningEntry,
  sitemapAuditPerformanceEntry,
  sitemapAuditPerformanceHistorySummary,
  sitemapAuditPerformanceHistoryWarning,
  sitemapAuditPerformanceWarning,
  formatSitemapAuditPerformanceHistory,
  readSitemapAuditPerformanceReport,
  recordSitemapAuditPerformance,
  sitemapReleaseSummary,
  sitemapPageObservation,
  validateKnownGoodReport,
  writeKnownGoodReport,
  writeSitemapReleaseSummary,
} from "../scripts/verify-published-seo.mjs";
import {
  STATIC_TITLE_MAX_LENGTH,
  STATIC_TITLE_MIN_LENGTH,
} from "../scripts/seo-title-policy.mjs";
import {
  findReportDifference,
  formatRequestBudget,
  formatReportDifference,
  normalizeKnownGoodReport,
  parseStabilityRuns,
} from "../scripts/verify-published-seo-stability.mjs";

const primaryOrigin = "https://careerreality.in";
const alternateOrigins = [
  "https://www.careerreality.in",
  "https://indigo-bowed-megabyte.replit.app",
];
const routes = {
  search: "/search/",
  sitemap: "/sitemap.xml",
  robots: "/robots.txt",
  article: "/article/indian-it-layoff-cycle-2026/",
  trust: "/editorial/",
};
const scriptPath = fileURLToPath(new URL("../scripts/verify-published-seo.mjs", import.meta.url));

function observation(route, finalOrigin = primaryOrigin) {
  const result = {
    status: 200,
    finalUrl: `${finalOrigin}${route}`,
  };
  if (route === routes.sitemap) {
    return {
      ...result,
      locationCount: 2,
      locationOrigins: [primaryOrigin],
      includesSearch: false,
    };
  }
  if (route === routes.robots) {
    return {
      ...result,
      sitemapLine: `Sitemap: ${primaryOrigin}/sitemap.xml`,
      containsLegacyOrigin: false,
    };
  }
  return {
    ...result,
    canonical: `${primaryOrigin}${route}`,
    ogUrl: `${primaryOrigin}${route}`,
    robots: route === routes.search ? "noindex, follow" : "index, follow",
    hasBreadcrumbs: route !== routes.search,
    hasRealityCheck: route === routes.article,
    hasDecisionSummary: route === routes.article,
    hasArticleSchema: route === routes.article,
  };
}

function validReport() {
  const primary = Object.fromEntries(Object.values(routes).map((route) => [route, observation(route)]));
  const alternates = Object.fromEntries(
    alternateOrigins.map((alternateOrigin) => [
      alternateOrigin,
      Object.fromEntries(Object.values(routes).map((route) => [route, observation(route, alternateOrigin)])),
    ]),
  );
  return {
    schemaVersion: 1,
    generatedAt: "2026-09-10T12:00:00.000Z",
    origin: primaryOrigin,
    alternateOrigins,
    observations: {
      primary,
      alternates,
      sitemapPages: {
        [`${primaryOrigin}/terms/`]: {
          status: 200,
          finalUrl: `${primaryOrigin}/terms/`,
          indexable: true,
          titleLength: 60,
          canonical: `${primaryOrigin}/terms/`,
          passed: true,
        },
      },
    },
    checks: [
      { label: "Published search robots", passed: true, expected: "noindex, follow", observed: "noindex, follow", kind: "live", status: "pass" },
      { label: "Published sitemap excludes search", passed: true, expected: "no /search/ URL", observed: "absent", kind: "live", status: "pass" },
      { label: "Published article summaries", passed: true, expected: "Reality check and Decision summary", observed: "present", kind: "live", status: "pass" },
    ],
  };
}

function copyReport() {
  return JSON.parse(JSON.stringify(validReport()));
}

function titleFixture(title, robots = "index, follow") {
  const titleTag = title === null ? "" : `<title>${title}</title>`;
  return `<meta name="robots" content="${robots}">${titleTag}`;
}

function validationErrors(report) {
  const result = validateKnownGoodReport(report);
  assert.equal(result.valid, false);
  return result.errors;
}

test("accepts a complete sanitized known-good report", () => {
  assert.deepEqual(validateKnownGoodReport(validReport()), { valid: true, errors: [] });
});

test("accepts the published article redirect only with passing registered-guide evidence", () => {
  const report = copyReport();
  report.observations.primary[routes.article].status = 301;
  report.checks.push(
    {
      label: `HTTP ${routes.article}`,
      passed: true,
      expected: "2xx noindex hold or 301 to a registered guide",
      observed: `301 ${primaryOrigin}${routes.article}`,
      kind: "live",
      status: "pass",
    },
    {
      label: `Published archived article destination ${routes.article.replace(/\/+$/, "")}`,
      passed: true,
      expected: "301 to registered indexable guide",
      observed: "301 /guides/read-the-offer-beyond-ctc/",
      kind: "live",
      status: "pass",
    },
  );
  assert.deepEqual(validateKnownGoodReport(report), { valid: true, errors: [] });

  report.checks.at(-1).observed = "301 /guides/not-registered/";
  assert.match(validationErrors(report).join("; "), /primary observation is incomplete for \/article\/indian-it-layoff-cycle-2026\//);
});

test("does not rewrite a valid known-good report when only generatedAt changes", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-stable-archive-"));
  const reportPath = path.join(tempDir, "known-good.json");
  const report = validReport();
  const sourceChecks = report.checks;
  try {
    assert.equal(writeKnownGoodReport(report.observations, {
      reportPath,
      generatedAt: "2026-09-10T12:00:00.000Z",
      sourceChecks,
    }), true);
    const originalContent = fs.readFileSync(reportPath, "utf8");

    assert.equal(writeKnownGoodReport(report.observations, {
      reportPath,
      generatedAt: "2026-09-11T12:00:00.000Z",
      sourceChecks,
    }), false);
    assert.equal(fs.readFileSync(reportPath, "utf8"), originalContent);
    assert.deepEqual(validateKnownGoodReport(JSON.parse(originalContent)), { valid: true, errors: [] });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("rewrites the known-good report when route, check, or sitemap-page evidence changes", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-changed-archive-"));
  const baseline = validReport();
  const changes = [
    ["route", (report) => {
      report.observations.primary[routes.article].canonical = `${primaryOrigin}/guides/`;
    }],
    ["check", (report) => {
      report.checks[0].observed = "changed check evidence";
    }],
    ["sitemap page", (report) => {
      report.observations.sitemapPages[`${primaryOrigin}/terms/`].titleLength += 1;
    }],
  ];

  try {
    for (const [name, change] of changes) {
      const reportPath = path.join(tempDir, `${name.replaceAll(" ", "-")}.json`);
      const changed = copyReport();
      change(changed);
      assert.equal(writeKnownGoodReport(baseline.observations, {
        reportPath,
        generatedAt: "2026-09-10T12:00:00.000Z",
        sourceChecks: baseline.checks,
      }), true, `${name} baseline should be written`);

      assert.equal(writeKnownGoodReport(changed.observations, {
        reportPath,
        generatedAt: "2026-09-11T12:00:00.000Z",
        sourceChecks: changed.checks,
      }), true, `${name} evidence should trigger an update`);

      const saved = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      assert.equal(saved.generatedAt, "2026-09-11T12:00:00.000Z");
      assert.deepEqual(validateKnownGoodReport(saved), { valid: true, errors: [] });
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("keeps sitemap archive checks compact while retaining page evidence", () => {
  const checks = [
    { label: "HTTP sitemap page https://careerreality.in/terms/", passed: true, expected: "2xx response", observed: "200", kind: "live" },
    { label: "https://careerreality.in/terms/ canonical", passed: true, expected: "https://careerreality.in/terms/", observed: "https://careerreality.in/terms/", kind: "live" },
    { label: "https://careerreality.in/terms/ title length", passed: true, expected: "30-65 characters", observed: "60 characters", kind: "live" },
    { label: "Published sitemap origin", passed: true, expected: primaryOrigin, observed: primaryOrigin, kind: "live" },
  ];
  const archived = archiveCheckRecords(checks);

  assert.deepEqual(archived.map((check) => check.label), ["Published sitemap origin"]);
  assert.equal(sitemapPageObservation(`${primaryOrigin}/terms/`, {
    status: 200,
    finalUrl: `${primaryOrigin}/terms/`,
    body: '<meta name="robots" content="index, follow"><link rel="canonical" href="https://careerreality.in/terms/"><title>Terms of Use for CareerReality | Career Decisions in India</title>',
  }).passed, true);
});

test("serializes archived checks in the same order regardless of request completion order", () => {
  const checks = [
    { label: "Alternate https://www.careerreality.in/article/indian-it-layoff-cycle-2026/ redirects or canonicalizes to primary", passed: true, expected: "redirect to primary", observed: "canonical primary", kind: "alternate" },
    { label: "HTTP /sitemap.xml", passed: true, expected: "2xx response", observed: "200", kind: "live" },
    { label: "Published article canonical", passed: true, expected: `${primaryOrigin}/article/indian-it-layoff-cycle-2026/`, observed: `${primaryOrigin}/article/indian-it-layoff-cycle-2026/`, kind: "live" },
    { label: "HTTP /article/indian-it-layoff-cycle-2026/", passed: true, expected: "2xx response", observed: "200", kind: "live" },
    { label: "Published search robots", passed: true, expected: "noindex, follow", observed: "noindex, follow", kind: "live" },
  ];

  assert.deepEqual(archiveCheckRecords(checks), archiveCheckRecords([...checks].reverse()));
  assert.deepEqual(
    archiveCheckRecords(checks).map((check) => check.label),
    [
      "HTTP /article/indian-it-layoff-cycle-2026/",
      "HTTP /sitemap.xml",
      "Published article canonical",
      "Published search robots",
      "Alternate https://www.careerreality.in/article/indian-it-layoff-cycle-2026/ redirects or canonicalizes to primary",
    ],
  );
});

test("normalizes only the generated timestamp for stability comparisons", () => {
  const first = validReport();
  const second = copyReport();
  second.generatedAt = "2026-09-11T12:00:00.000Z";

  assert.deepEqual(normalizeKnownGoodReport(first), normalizeKnownGoodReport(second));
  assert.equal(first.generatedAt, "2026-09-10T12:00:00.000Z");

  second.observations.primary[routes.article].status = 503;
  assert.notDeepEqual(normalizeKnownGoodReport(first), normalizeKnownGoodReport(second));
});

test("published SEO stability defaults to one pass and caps explicit report comparisons at two", () => {
  assert.equal(parseStabilityRuns([]), 1);
  assert.equal(parseStabilityRuns(["--runs=1"]), 1);
  assert.equal(parseStabilityRuns(["--runs=2"]), 2);
  assert.throws(() => parseStabilityRuns(["--runs=3"]), /integer from 1 to 2/);
  assert.throws(() => parseStabilityRuns(["--unknown"]), /Usage:/);
  assert.match(formatRequestBudget(1), /1 published verifier pass/);
  assert.match(formatRequestBudget(2), /2 published verifier passes/);
  assert.match(formatRequestBudget(2), /batches of 8/);
});

test("reports a precise safe stability diff without exposing unsafe values", () => {
  const first = validReport();
  const second = copyReport();
  second.observations.primary[routes.article].status = 503;
  const difference = findReportDifference(normalizeKnownGoodReport(first), normalizeKnownGoodReport(second));

  assert.equal(difference?.path, '$.observations.primary["/article/indian-it-layoff-cycle-2026/"].status');
  assert.match(formatReportDifference(difference), /first 200; second 503/);

  const unsafeDifference = findReportDifference(
    { value: "safe" },
    { value: "<html>private api_key=secret</html>" },
  );
  const unsafeMessage = formatReportDifference(unsafeDifference);
  assert.match(unsafeMessage, /\[redacted unsafe content\]/);
  assert.doesNotMatch(unsafeMessage, /private|api_key|secret/);
});

test("audits sitemap pages in batches of eight and continues after a worker fails", async () => {
  const locations = Array.from({ length: 17 }, (_, index) => `${primaryOrigin}/sitemap-page-${index}/`);
  const failedLocation = locations[9];
  const seen = [];
  let active = 0;
  let maxActive = 0;

  const results = await runSitemapAuditBatches(locations, async (location) => {
    seen.push(location);
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active -= 1;
    if (location === failedLocation) throw new Error("synthetic unavailable page");
  });

  assert.equal(maxActive, 8);
  assert.deepEqual(seen, locations);
  assert.equal(results.length, locations.length);
  assert.match(results.find((result) => result.location === failedLocation)?.error?.message ?? "", /synthetic unavailable page/);
  assert.equal(results.filter((result) => result.error).length, 1);
});

test("retries a transient sitemap 5xx once and reports recovery", async () => {
  const location = `${primaryOrigin}/terms/`;
  const responses = [
    {
      status: 503,
      url: location,
      async text() {
        return "Service unavailable";
      },
    },
    {
      status: 200,
      url: location,
      async text() {
        return '<meta name="robots" content="index, follow"><link rel="canonical" href="https://careerreality.in/terms/"><title>Terms of Use for CareerReality | Career Decisions in India</title>';
      },
    },
  ];

  const result = await fetchSitemapPage(location, null, {
    fetchImpl: async () => responses.shift(),
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.attempts, 2);
  assert.equal(result.retryOutcome, "recovered");
  assert.equal(
    publishedSitemapPageChecks(location, {
      status: result.response.status,
      finalUrl: result.response.url,
      body: result.body,
      attempts: result.attempts,
      retryOutcome: result.retryOutcome,
    })[0].observed,
    `200 ${location} (retry recovered; 2 attempts)`,
  );
});

test("retries a network failure once but does not retry permanent 4xx or malformed HTML", async () => {
  const location = `${primaryOrigin}/terms/`;
  let networkAttempts = 0;
  const recovered = await fetchSitemapPage(location, null, {
    fetchImpl: async () => {
      networkAttempts += 1;
      if (networkAttempts === 1) throw new Error("synthetic connection reset");
      return {
        status: 200,
        url: location,
        async text() {
          return '<link rel="canonical" href="https://careerreality.in/terms/"><title>Terms of Use for CareerReality | Career Decisions in India</title>';
        },
      };
    },
  });
  assert.equal(networkAttempts, 2);
  assert.equal(recovered.retryOutcome, "recovered");

  let permanentAttempts = 0;
  const permanent = await fetchSitemapPage(location, null, {
    fetchImpl: async () => {
      permanentAttempts += 1;
      return {
        status: 404,
        url: location,
        async text() {
          return "Not found";
        },
      };
    },
  });
  assert.equal(permanentAttempts, 1);
  assert.equal(permanent.attempts, 1);
  assert.equal(permanent.retryOutcome, "not-needed");
  assert.equal(permanent.response.status, 404);

  let malformedAttempts = 0;
  const malformed = await fetchSitemapPage(location, null, {
    fetchImpl: async () => {
      malformedAttempts += 1;
      return {
        status: 200,
        url: location,
        async text() {
          return '<link rel="canonical" href="https://careerreality.in/terms/"><main>Missing title</main>';
        },
      };
    },
  });
  assert.equal(malformedAttempts, 1);
  assert.equal(malformed.retryOutcome, "not-needed");
  const malformedChecks = publishedSitemapPageChecks(location, {
    status: malformed.response.status,
    finalUrl: malformed.response.url,
    body: malformed.body,
    attempts: malformed.attempts,
    retryOutcome: malformed.retryOutcome,
  });
  assert.equal(malformedChecks.find((check) => check.label === `${location} indexability`)?.passed, false);
});

test("stops after the bounded retry budget when a sitemap page stays unavailable", async () => {
  const location = `${primaryOrigin}/terms/`;
  let attempts = 0;
  const result = await fetchSitemapPage(location, null, {
    fetchImpl: async () => {
      attempts += 1;
      return {
        status: 503,
        url: location,
        async text() {
          return "Service unavailable";
        },
      };
    },
  });

  assert.equal(attempts, 2);
  assert.equal(result.attempts, 2);
  assert.equal(result.retryOutcome, "exhausted");
  assert.equal(
    publishedSitemapPageChecks(location, {
      status: result.response.status,
      finalUrl: result.response.url,
      body: result.body,
      attempts: result.attempts,
      retryOutcome: result.retryOutcome,
    })[0].observed,
    `503 ${location} (retry exhausted; 2 attempts)`,
  );
});

test("formats the sitemap audit count, budget, duration, and worker failures", () => {
  assert.equal(
    formatSitemapAuditSummary({ pageCount: 94, batchSize: 8, elapsedMs: 1234, workerFailures: 0, warningThresholdMs: 5000 }),
    "Sitemap page audit: 94 pages; batch size 8; elapsed 1234 ms; warning threshold 5000 ms (SEO_SITEMAP_AUDIT_WARN_MS); worker failures 0.",
  );
});

test("calculates sitemap audit elapsed time from injected start and end timestamps", () => {
  assert.equal(sitemapAuditElapsedMs(1_725_000_000_000, 1_725_000_001_234), 1234);
});

test("keeps slow-audit warnings separate from SEO pass/fail checks", () => {
  assert.equal(sitemapAuditPerformanceWarning(5000, 5000), null);
  assert.match(
    sitemapAuditPerformanceWarning(5001, 5000) ?? "",
    /WARNING: Sitemap page audit took 5001 ms.*performance warning only; SEO pass\/fail is unchanged/,
  );
});

test("summarizes repeated sitemap slowdowns separately from one-off slow audits", () => {
  const entries = [
    sitemapAuditPerformanceEntry({
      generatedAt: "2026-09-17T12:00:00.000Z",
      pageCount: 94,
      batchSize: 8,
      elapsedMs: 5100,
      warningThresholdMs: 5000,
    }),
    sitemapAuditPerformanceEntry({
      generatedAt: "2026-09-18T12:00:00.000Z",
      pageCount: 94,
      batchSize: 8,
      elapsedMs: 5200,
      warningThresholdMs: 5000,
    }),
  ];
  const summary = sitemapAuditPerformanceHistorySummary(entries);

  assert.deepEqual(summary, {
    auditCount: 2,
    slowAuditCount: 2,
    consecutiveSlowAudits: 2,
    increasingAuditStreak: 1,
    latest: entries[1],
    latestDeltaMs: 100,
    repeatedSlowdown: true,
  });
  assert.match(
    sitemapAuditPerformanceHistoryWarning(summary) ?? "",
    /exceeded its configured budget in 2 consecutive releases \(2 of 2 recorded audits\)/,
  );
  assert.match(
    formatSitemapAuditPerformanceHistory(summary, "/tmp/sitemap-performance.json"),
    /2 slow audits in the last 2; latest 5200 ms \(\+100 ms vs prior release\); increasing audit streak 1; consecutive slow audits 2; report \/tmp\/sitemap-performance\.json/,
  );
});

test("records only bounded sitemap performance metadata outside the known-good archive", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-sitemap-performance-"));
  const reportPath = path.join(tempDir, "performance.json");
  try {
    const firstSummary = recordSitemapAuditPerformance({
      pageCount: 94,
      batchSize: 8,
      elapsedMs: 4900,
      warningThresholdMs: 5000,
      workerFailures: 0,
    }, {
      reportPath,
      generatedAt: "2026-09-17T12:00:00.000Z",
      releaseId: "release-a",
    });
    const secondSummary = recordSitemapAuditPerformance({
      pageCount: 94,
      batchSize: 8,
      elapsedMs: 5100,
      warningThresholdMs: 5000,
      workerFailures: 0,
    }, {
      reportPath,
      generatedAt: "2026-09-18T12:00:00.000Z",
      releaseId: "release-b",
    });
    const report = readSitemapAuditPerformanceReport(reportPath);

    assert.equal(firstSummary.repeatedSlowdown, false);
    assert.equal(secondSummary.repeatedSlowdown, false);
    assert.equal(report.audits.length, 2);
    assert.deepEqual(Object.keys(report.audits[1]).sort(), [
      "batchSize",
      "elapsedMs",
      "generatedAt",
      "pageCount",
      "releaseId",
      "slow",
      "warningThresholdMs",
      "workerFailures",
    ]);
    assert.equal(report.audits[1].slow, true);
    assert.equal("body" in report.audits[1], false);
    assert.equal("observations" in report, false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("preserves valid sitemap history when writing a replacement is interrupted", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-sitemap-performance-interrupted-write-"));
  const reportPath = path.join(tempDir, "performance.json");
  const priorHistory = {
    schemaVersion: 1,
    generatedAt: "2026-09-17T12:00:00.000Z",
    audits: [sitemapAuditPerformanceEntry({
      generatedAt: "2026-09-17T12:00:00.000Z",
      releaseId: "last-valid",
      pageCount: 94,
      batchSize: 8,
      elapsedMs: 4900,
      warningThresholdMs: 5000,
      workerFailures: 0,
    })],
  };
  const priorContents = `${JSON.stringify(priorHistory, null, 2)}\n`;
  const originalWriteFileSync = fs.writeFileSync;
  try {
    fs.writeFileSync(reportPath, priorContents);
    fs.writeFileSync = function (filePath, data, options) {
      if (String(filePath).startsWith(`${reportPath}.tmp-`)) {
        originalWriteFileSync.call(this, filePath, '{"schemaVersion":1,"audits":[', options);
        throw new Error("simulated interrupted history write");
      }
      return originalWriteFileSync.call(this, filePath, data, options);
    };

    assert.throws(
      () => recordSitemapAuditPerformance({
        pageCount: 94,
        batchSize: 8,
        elapsedMs: 5100,
        warningThresholdMs: 5000,
        workerFailures: 0,
      }, {
        reportPath,
        generatedAt: "2026-09-18T12:00:00.000Z",
        releaseId: "interrupted",
      }),
      /simulated interrupted history write/,
    );
  } finally {
    fs.writeFileSync = originalWriteFileSync;
    assert.equal(fs.readFileSync(reportPath, "utf8"), priorContents);
    assert.deepEqual(fs.readdirSync(tempDir), ["performance.json"], "partial temporary reports are removed");
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("keeps sitemap performance history within its configured limit", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-sitemap-performance-limit-"));
  const reportPath = path.join(tempDir, "performance.json");
  try {
    for (let index = 0; index < 22; index += 1) {
      recordSitemapAuditPerformance({
        pageCount: 94,
        batchSize: 8,
        elapsedMs: 4900 + index,
        warningThresholdMs: 5000,
        workerFailures: 0,
      }, {
        reportPath,
        generatedAt: new Date(Date.UTC(2026, 8, 1 + index)).toISOString(),
        releaseId: `release-${index}`,
      });
    }
    const report = readSitemapAuditPerformanceReport(reportPath);

    assert.equal(report.audits.length, 20);
    assert.equal(report.audits[0].releaseId, "release-2");
    assert.equal(report.audits.at(-1).releaseId, "release-21");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("preserves corrupt performance history and seeds a fresh report only when recovery is enabled", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-sitemap-performance-recovery-"));
  const reportPath = path.join(tempDir, "performance.json");
  const knownGoodPath = path.join(tempDir, "known-good.json");
  const corruptContents = "{\"schemaVersion\":1,\"audits\":[";
  const knownGoodContents = "{\"knownGood\":\"unchanged\"}\n";
  const generatedAt = "2026-09-19T12:00:00.000Z";
  const quarantinedPath = `${reportPath}.corrupt-2026-09-19T12-00-00-000Z`;
  try {
    fs.writeFileSync(reportPath, corruptContents);
    fs.writeFileSync(knownGoodPath, knownGoodContents);

    assert.throws(
      () => recordSitemapAuditPerformance({
        pageCount: 94,
        batchSize: 8,
        elapsedMs: 4900,
        warningThresholdMs: 5000,
        workerFailures: 0,
      }, { reportPath, generatedAt }),
      /Sitemap performance report could not be read/,
    );
    assert.equal(fs.readFileSync(reportPath, "utf8"), corruptContents);

    const summary = recordSitemapAuditPerformance({
      pageCount: 94,
      batchSize: 8,
      elapsedMs: 4900,
      warningThresholdMs: 5000,
      workerFailures: 0,
    }, { reportPath, generatedAt, recoverInvalidHistory: true });

    assert.equal(fs.readFileSync(quarantinedPath, "utf8"), corruptContents);
    assert.equal(fs.existsSync(reportPath), true);
    assert.equal(readSitemapAuditPerformanceReport(reportPath).audits.length, 1);
    assert.equal(summary.auditCount, 1);
    assert.equal(fs.readFileSync(knownGoodPath, "utf8"), knownGoodContents);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("uses the safe default for invalid warning thresholds and accepts positive integers", () => {
  const invalidValues = [undefined, "", "not-a-number", "0", "-1", "2.5"];
  for (const value of invalidValues) {
    assert.equal(parseSitemapAuditWarnMs(value), 5000, `expected safe default for ${String(value)}`);
  }
  assert.equal(parseSitemapAuditWarnMs("1250"), 1250);
  assert.equal(parseSitemapAuditWarnMs(2500), 2500);
});

test("uses a startup environment override in the release sitemap audit summary", () => {
  const moduleUrl = pathToFileURL(scriptPath).href;
  const result = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import(${JSON.stringify(moduleUrl)}).then(({ formatSitemapAuditSummary }) => {
        console.log(formatSitemapAuditSummary({ pageCount: 1, batchSize: 1, elapsedMs: 10, workerFailures: 0 }));
      });`,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, SEO_SITEMAP_AUDIT_WARN_MS: "1250" },
    },
  );

  assert.match(
    result,
    /Sitemap page audit: 1 pages; batch size 1; elapsed 10 ms; warning threshold 1250 ms \(SEO_SITEMAP_AUDIT_WARN_MS\); worker failures 0\./,
  );
});

test("warns about invalid configured thresholds without warning for unset or valid values", () => {
  assert.equal(sitemapAuditConfigurationWarning(undefined), null);
  assert.equal(sitemapAuditConfigurationWarning("5000"), null);
  assert.match(
    sitemapAuditConfigurationWarning("not-a-number") ?? "",
    /WARNING: SEO_SITEMAP_AUDIT_WARN_MS="not-a-number" is invalid; using the safe default of 5000 ms/,
  );
});

test("serializes invalid sitemap configuration separately from SEO status", () => {
  const warning = sitemapAuditConfigurationWarningEntry("not-a-number");
  assert.deepEqual(warning, {
    code: "invalid-sitemap-audit-warning-threshold",
    setting: "SEO_SITEMAP_AUDIT_WARN_MS",
    effectiveThresholdMs: 5000,
  });
  assert.equal(sitemapAuditConfigurationWarningEntry("1250")?.effectiveThresholdMs, undefined);

  const summary = sitemapReleaseSummary({
    generatedAt: "2026-09-19T12:00:00.000Z",
    configurationWarnings: [warning],
    localFailureCount: 0,
    publishedFailureCount: 2,
  });
  assert.deepEqual(summary, {
    schemaVersion: 1,
    generatedAt: "2026-09-19T12:00:00.000Z",
    seoStatus: "fail",
    configurationStatus: "warning",
    effectiveSitemapAuditWarnMs: 5000,
    configurationWarnings: [warning],
    localFailureCount: 0,
    publishedFailureCount: 2,
  });
});

test("writes a compact sanitized release summary without known-good page evidence", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-release-summary-"));
  const summaryPath = path.join(tempDir, "release-summary.json");
  try {
    const summary = sitemapReleaseSummary({
      generatedAt: "2026-09-19T12:00:00.000Z",
      configurationWarnings: [sitemapAuditConfigurationWarningEntry("not-a-number")],
    });
    writeSitemapReleaseSummary(summary, summaryPath);
    const written = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

    assert.deepEqual(written, summary);
    assert.equal("observations" in written, false);
    assert.equal("checks" in written, false);
    assert.equal("body" in written, false);
    assert.doesNotMatch(fs.readFileSync(summaryPath, "utf8"), /not-a-number|<html|api_key|password|secret/i);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("rejects a known-good report without URL-level sitemap evidence", () => {
  const report = copyReport();
  delete report.observations.sitemapPages;
  assert.match(validationErrors(report).join("; "), /sitemap page observations are missing/);
});

test("reports an unavailable sitemap page with its URL and status", () => {
  const location = `${primaryOrigin}/terms/`;
  const checks = publishedSitemapPageChecks(location, {
    status: 503,
    finalUrl: location,
    body: "Service unavailable",
  });

  const httpCheck = checks.find((check) => check.label === `HTTP sitemap page ${location}`);
  assert.equal(httpCheck?.passed, false);
  assert.equal(httpCheck?.observed, `503 ${location}`);
});

test("reports a missing title with its sitemap URL", () => {
  const location = `${primaryOrigin}/terms/`;
  const checks = publishedSitemapPageChecks(location, {
    status: 200,
    finalUrl: location,
    body: '<meta name="robots" content="index, follow"><main>No title here</main>',
  });

  const titleCheck = checks.find((check) => check.label === `${location} title length`);
  assert.equal(titleCheck?.passed, false);
  assert.equal(titleCheck?.observed, "(missing title)");
});

test("rejects too-short and too-long titles on indexable sitemap pages", () => {
  const location = `${primaryOrigin}/terms/`;
  for (const [name, title, passed] of [
    ["minimum boundary", "x".repeat(STATIC_TITLE_MIN_LENGTH), true],
    ["too short", "x".repeat(STATIC_TITLE_MIN_LENGTH - 1), false],
    ["too long", "x".repeat(STATIC_TITLE_MAX_LENGTH + 1), false],
  ]) {
    const checks = publishedSitemapPageChecks(location, {
      status: 200,
      finalUrl: location,
      body: `<meta name="robots" content="index, follow"><link rel="canonical" href="${location}"><title>${title}</title>`,
    });
    assert.equal(checks.find((check) => check.label === `${location} title length`)?.passed, passed, name);
  }
});

test("accepts valid sitemap titles and rejects noindex URLs listed in the sitemap", () => {
  const validLocation = `${primaryOrigin}/terms/`;
  const validChecks = publishedSitemapPageChecks(validLocation, {
    status: 200,
    finalUrl: validLocation,
    body: '<meta name="robots" content="index, follow"><link rel="canonical" href="https://careerreality.in/terms/"><title>Terms of Use for CareerReality | Career Decisions in India</title>',
  });
  assert.equal(validChecks.find((check) => check.label === `${validLocation} title length`)?.passed, true);

  const noindexLocation = `${primaryOrigin}/search/`;
  const noindexChecks = publishedSitemapPageChecks(noindexLocation, {
    status: 200,
    finalUrl: noindexLocation,
    body: '<meta name="robots" content="noindex, follow"><link rel="canonical" href="https://careerreality.in/search/"><title>CareerReality app route</title>',
  });
  assert.deepEqual(noindexChecks.map((check) => check.label), [
    `HTTP sitemap page ${noindexLocation}`,
    `${noindexLocation} canonical`,
    `${noindexLocation} indexability`,
    `${noindexLocation} title validation exemption`,
  ]);
  assert.equal(noindexChecks.find((check) => check.label.endsWith(" indexability"))?.passed, false);
  const exemption = noindexChecks.at(-1);
  assert.equal(exemption?.passed, true);
  assert.equal(exemption?.expected, "intentional exemption for noindex page");
  assert.match(exemption?.observed ?? "", /title length check skipped intentionally/);
});

test("reports sitemap canonical drift with the sitemap URL and observed canonical", () => {
  const location = `${primaryOrigin}/terms/`;
  const checks = publishedSitemapPageChecks(location, {
    status: 200,
    finalUrl: location,
    body: '<meta name="robots" content="index, follow"><link rel="canonical" href="https://careerreality.in/editorial/"><title>Terms of Use for CareerReality | Career Decisions in India</title>',
  });

  const canonicalCheck = checks.find((check) => check.label === `${location} canonical`);
  assert.equal(canonicalCheck?.passed, false);
  assert.equal(canonicalCheck?.expected, location);
  assert.equal(canonicalCheck?.observed, "https://careerreality.in/editorial/");
});

test("enforces published title boundaries for indexable pages", () => {
  const fixtures = [
    {
      name: "minimum boundary",
      title: "x".repeat(STATIC_TITLE_MIN_LENGTH),
      passed: true,
    },
    {
      name: "maximum boundary",
      title: "x".repeat(STATIC_TITLE_MAX_LENGTH),
      passed: true,
    },
    {
      name: "missing title",
      title: null,
      passed: false,
    },
    {
      name: "too short",
      title: "x".repeat(STATIC_TITLE_MIN_LENGTH - 1),
      passed: false,
    },
    {
      name: "too long",
      title: "x".repeat(STATIC_TITLE_MAX_LENGTH + 1),
      passed: false,
    },
  ];

  for (const fixture of fixtures) {
    const check = publishedTitleCheck(`Fixture ${fixture.name}`, titleFixture(fixture.title));
    assert.ok(check, `${fixture.name} should be checked`);
    assert.equal(check.passed, fixture.passed, fixture.name);
  }
});

test("keeps app-shell and legacy handoff titles exempt when noindex", () => {
  const fixtures = [
    ["app shell", "CareerReality app route"],
    ["legacy handoff", "Company handoff to /companies/"],
  ];

  for (const [name, title] of fixtures) {
    const check = publishedTitleCheck(`Fixture ${name}`, titleFixture(title, "noindex, follow"));
    assert.deepEqual(check, {
      label: `Fixture ${name} title validation exemption`,
      passed: true,
      expected: "intentional exemption for noindex page",
      observed: "noindex, follow; title length check skipped intentionally",
      kind: "live",
    }, `${name} should remain exempt without blocking`);
  }
});

test("continues enforcing title lengths on indexable pages", () => {
  for (const [name, title] of [
    ["missing", null],
    ["too short", "x".repeat(STATIC_TITLE_MIN_LENGTH - 1)],
    ["too long", "x".repeat(STATIC_TITLE_MAX_LENGTH + 1)],
  ]) {
    const check = publishedTitleCheck(`Fixture ${name}`, titleFixture(title, "index, follow"));
    assert.equal(check?.passed, false, `${name} indexable title should block`);
  }
});

test("rejects missing fields and wrong schema", () => {
  assert.match(validationErrors({ schemaVersion: 2 }).join("; "), /schemaVersion must be 1/);

  const report = copyReport();
  delete report.observations;
  const errors = validationErrors(report);
  assert.match(errors.join("; "), /primary route observations are missing/);
  assert.match(errors.join("; "), /alternate route observations are missing/);

  const missingChecks = copyReport();
  delete missingChecks.checks;
  assert.match(validationErrors(missingChecks).join("; "), /passing check records are missing/);
});

test("rejects host drift and incomplete route observations", () => {
  const hostDrift = copyReport();
  hostDrift.origin = "https://wrong.example";
  hostDrift.alternateOrigins = ["https://another.example"];
  const hostErrors = validationErrors(hostDrift).join("; ");
  assert.match(hostErrors, /origin must be https:\/\/careerreality\.in/);
  assert.match(hostErrors, /alternateOrigins do not match/);

  const incomplete = copyReport();
  delete incomplete.observations.primary[routes.article];
  const incompleteErrors = validationErrors(incomplete).join("; ");
  assert.match(incompleteErrors, /primary observation is incomplete for \/article\/indian-it-layoff-cycle-2026\//);
});

test("rejects failed check records and unsafe report content", () => {
  const failedCheck = copyReport();
  failedCheck.checks[0].passed = false;
  assert.match(validationErrors(failedCheck).join("; "), /check record is not a passing diagnostic/);

  const rawHtml = copyReport();
  rawHtml.observations.primary[routes.article].rawHtml = "<html>private page</html>";
  assert.match(validationErrors(rawHtml).join("; "), /raw HTML content is not allowed/);

  const credentialLike = copyReport();
  credentialLike.observations.primary[routes.article].diagnostic = "api_key=not-a-real-key";
  assert.match(validationErrors(credentialLike).join("; "), /credential-like content is not allowed/);
});

test("archive-only CLI rejects truncated JSON with a failing exit code", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-report-"));
  const reportPath = path.join(tempDir, "truncated.json");
  fs.writeFileSync(reportPath, "{\"schemaVersion\":1\n");
  const result = spawnSync(process.execPath, [scriptPath, "--validate-archive-only", `--archive=${reportPath}`], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}${result.stderr}`, /KNOWN-GOOD SEO REPORT REJECTED/);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("archive-only CLI accepts a valid sanitized report", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-report-"));
  const reportPath = path.join(tempDir, "known-good.json");
  try {
    fs.writeFileSync(reportPath, `${JSON.stringify(validReport())}\n`);
    const result = execFileSync(process.execPath, [scriptPath, "--validate-archive-only", `--archive=${reportPath}`], { encoding: "utf8" });
    assert.match(result, /KNOWN-GOOD SEO REPORT VALID/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("keeps the SEO failure when a published page and release-summary write both fail", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-unavailable-page-"));
  const reportPath = path.join(tempDir, "known-good.json");
  const performanceReportPath = path.join(tempDir, "corrupt-performance-history.json");
  const corruptHistory = '{"schemaVersion":2,"audits":[]}\n';
  const blockedReleaseSummaryParent = path.join(tempDir, "blocked-release-summary");
  const releaseSummaryPath = path.join(blockedReleaseSummaryParent, "release-summary.json");
  const preloadPath = path.join(tempDir, "mock-seo-fetch.mjs");
  const artifactRoot = path.resolve(path.dirname(scriptPath), "..");
  const unavailablePageUrl = `${primaryOrigin}/tools/`;
  const preloadSource = `
import fs from "node:fs";
import path from "node:path";

const artifactRoot = ${JSON.stringify(artifactRoot)};
const unavailablePageUrl = ${JSON.stringify(unavailablePageUrl)};
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  let status = 200;
  let location = null;
  let body;
  if (url.hostname === "www.careerreality.in") {
    status = 301;
    location = "https://careerreality.in" + url.pathname + url.search;
    body = "";
  } else if (url.href === unavailablePageUrl) {
    status = 503;
    body = "Service unavailable";
  } else if (options.redirect === "manual" && url.pathname.startsWith("/article/")) {
    if (!url.pathname.endsWith("/")) {
      status = 301;
      location = "https://careerreality.in" + url.pathname + "/";
      body = "";
    } else {
      const routeParts = url.pathname.split("/").filter(Boolean);
      const snapshotPath = path.join(artifactRoot, "dist", "public", ...routeParts, "index.html");
      body = fs.existsSync(snapshotPath)
        ? fs.readFileSync(snapshotPath, "utf8")
        : '<link rel="canonical" href="' + url.href + '"><meta name="robots" content="noindex, follow"><title>CareerReality article hold</title>';
    }
  } else if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") {
    body = fs.readFileSync(path.join(artifactRoot, "public", url.pathname.slice(1)), "utf8");
  } else if (url.pathname === "/companies/groww/") {
    body = '<link rel="canonical" href="https://careerreality.in/companies/"><meta name="robots" content="noindex, follow"><title>Company handoff | CareerReality</title>';
  } else {
    const routeParts = url.pathname.split("/").filter(Boolean);
    const snapshotPath = path.join(artifactRoot, "dist", "public", ...routeParts, "index.html");
    body = fs.existsSync(snapshotPath)
      ? fs.readFileSync(snapshotPath, "utf8")
      : '<link rel="canonical" href="' + url.href + '"><meta name="robots" content="index, follow"><title>CareerReality | Practical career guidance in India</title>';
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    url: url.href,
    headers: { get: (name) => name.toLowerCase() === "location" ? location : null },
    text: async () => body,
  };
};
`;

  try {
    fs.writeFileSync(performanceReportPath, corruptHistory);
    fs.writeFileSync(blockedReleaseSummaryParent, "not a directory");
    fs.writeFileSync(preloadPath, preloadSource);
    const run = spawnSync(process.execPath, [
      "--import",
      preloadPath,
      scriptPath,
      `--origin=${primaryOrigin}`,
      "--alternate-origins=",
      `--archive=${reportPath}`,
      `--performance-report=${performanceReportPath}`,
      `--release-summary=${releaseSummaryPath}`,
    ], {
      encoding: "utf8",
      env: { ...process.env, SEO_ALTERNATE_ORIGINS: "" },
    });
    const output = `${run.stdout}\n${run.stderr}`;

    assert.equal(run.status, 1, output);
    assert.ok(
      output.includes(`FAIL [live] HTTP sitemap page ${unavailablePageUrl} — expected 2xx response; observed 503 ${unavailablePageUrl} (retry exhausted; 2 attempts)`),
      output,
    );
    assert.match(output, /WARNING: Sitemap performance history was not updated:.*report schema or audit entries are invalid/);
    assert.match(output, /WARNING: Sitemap release summary was not updated:/);
    assert.match(output, /STALE PUBLISHED BUILD:/);
    assert.doesNotMatch(output, /KNOWN-GOOD SEO REPORT SAVED:/);
    assert.equal(fs.readFileSync(performanceReportPath, "utf8"), corruptHistory, "failed SEO must not quarantine or replace invalid history");
    assert.deepEqual(
      fs.readdirSync(tempDir).filter((name) => name.startsWith("corrupt-performance-history.json.corrupt-")),
      [],
      "failed SEO must not create a recovery copy",
    );
    assert.equal(fs.existsSync(reportPath), false, "a failing audit must not create a known-good archive");
    assert.equal(fs.existsSync(releaseSummaryPath), false, "an unwritable release summary must not appear to have been saved");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("keeps passing SEO results and a clean archive when performance reporting fails", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-startup-warning-"));
  const reportPath = path.join(tempDir, "known-good.json");
  const performanceReportParent = path.join(tempDir, "blocked-performance-report");
  const performanceReportPath = path.join(performanceReportParent, "history.json");
  const releaseSummaryPath = path.join(performanceReportParent, "release-summary.json");
  const preloadPath = path.join(tempDir, "mock-seo-fetch.mjs");
  const artifactRoot = path.resolve(path.dirname(scriptPath), "..");
  const warning = sitemapAuditConfigurationWarning("not-a-number");
  const performanceWarningPrefix = "WARNING: Sitemap performance history was not updated:";
  const releaseSummaryWarningPrefix = "WARNING: Sitemap release summary was not updated:";
  const preloadSource = `
import fs from "node:fs";
import path from "node:path";

const artifactRoot = ${JSON.stringify(artifactRoot)};
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  let status = 200;
  let location = null;
  let body;
  if (url.hostname === "www.careerreality.in") {
    status = 301;
    location = "https://careerreality.in" + url.pathname + url.search;
    body = "";
  } else if (options.redirect === "manual" && url.pathname.startsWith("/article/")) {
    if (!url.pathname.endsWith("/")) {
      status = 301;
      location = "https://careerreality.in" + url.pathname + "/";
      body = "";
    } else {
      const routeParts = url.pathname.split("/").filter(Boolean);
      const snapshotPath = path.join(artifactRoot, "dist", "public", ...routeParts, "index.html");
      body = fs.existsSync(snapshotPath)
        ? fs.readFileSync(snapshotPath, "utf8")
        : '<link rel="canonical" href="' + url.href + '"><meta name="robots" content="noindex, follow"><title>CareerReality article hold</title>';
    }
  } else if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") {
    body = fs.readFileSync(path.join(artifactRoot, "public", url.pathname.slice(1)), "utf8");
  } else if (url.pathname === "/companies/groww/") {
    body = '<link rel="canonical" href="https://careerreality.in/companies/"><meta name="robots" content="noindex, follow"><title>Company handoff | CareerReality</title>';
  } else {
    const routeParts = url.pathname.split("/").filter(Boolean);
    const snapshotPath = path.join(artifactRoot, "dist", "public", ...routeParts, "index.html");
    body = fs.existsSync(snapshotPath)
      ? fs.readFileSync(snapshotPath, "utf8")
      : '<link rel="canonical" href="' + url.href + '"><meta name="robots" content="index, follow"><title>CareerReality | Practical career guidance in India</title>';
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    url: url.href,
    headers: { get: (name) => name.toLowerCase() === "location" ? location : null },
    text: async () => body,
  };
};
`;

  try {
    fs.writeFileSync(performanceReportParent, "not a directory");
    fs.writeFileSync(preloadPath, preloadSource);
    const args = [
      "--import",
      preloadPath,
      scriptPath,
      `--origin=${primaryOrigin}`,
      "--alternate-origins=",
      `--archive=${reportPath}`,
      `--performance-report=${performanceReportPath}`,
      `--release-summary=${releaseSummaryPath}`,
    ];
    const env = {
      ...process.env,
      SEO_ALTERNATE_ORIGINS: "",
      SEO_SITEMAP_AUDIT_WARN_MS: "not-a-number",
    };
    const run = spawnSync(process.execPath, args, { encoding: "utf8", env });

    assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
    assert.match(run.stderr, new RegExp(warning.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(run.stderr, new RegExp(performanceWarningPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(run.stderr, new RegExp(releaseSummaryWarningPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(run.stdout, /Published SEO smoke check passed\./);
    assert.match(run.stdout, /KNOWN-GOOD SEO REPORT SAVED:/);
    assert.equal(fs.existsSync(releaseSummaryPath), false);

    const serializedReport = fs.readFileSync(reportPath, "utf8");
    const report = JSON.parse(serializedReport);
    assert.equal(serializedReport.includes(performanceWarningPrefix), false);
    assert.equal(serializedReport.includes(releaseSummaryWarningPrefix), false);
    assert.equal(JSON.stringify(report.checks).includes(performanceWarningPrefix), false);
    assert.equal(JSON.stringify(report.checks).includes(releaseSummaryWarningPrefix), false);
    assert.equal(JSON.stringify(report.observations).includes(performanceWarningPrefix), false);
    assert.equal(JSON.stringify(report.observations).includes(releaseSummaryWarningPrefix), false);
    assert.equal(report.observations.primary[routes.article]?.status, 200, JSON.stringify(report.observations.primary[routes.article]));
    assert.equal(report.observations.primary[routes.article]?.finalUrl, `${primaryOrigin}${routes.article}`);
    assert.equal(serializedReport.includes(warning), false);
    assert.equal(JSON.stringify(report.checks).includes(warning), false);
    assert.equal(JSON.stringify(report.observations).includes(warning), false);

    const validation = spawnSync(
      process.execPath,
      [scriptPath, "--validate-archive-only", `--origin=${primaryOrigin}`, "--alternate-origins=", `--archive=${reportPath}`],
      { encoding: "utf8", env },
    );
    assert.equal(validation.status, 0, `${validation.stdout}\n${validation.stderr}`);
    assert.match(validation.stdout, /KNOWN-GOOD SEO REPORT VALID/);

    const corruptHistory = '{"schemaVersion":2,"audits":[]}\n';
    const corruptHistoryPath = path.join(tempDir, "corrupt-performance-history.json");
    const corruptArchivePath = path.join(tempDir, "corrupt-history-known-good.json");
    const corruptSummaryPath = path.join(tempDir, "corrupt-history-release-summary.json");
    fs.writeFileSync(corruptHistoryPath, corruptHistory);

    const corruptHistoryRun = spawnSync(process.execPath, [
      "--import",
      preloadPath,
      scriptPath,
      `--origin=${primaryOrigin}`,
      "--alternate-origins=",
      `--archive=${corruptArchivePath}`,
      `--performance-report=${corruptHistoryPath}`,
      `--release-summary=${corruptSummaryPath}`,
    ], {
      encoding: "utf8",
      env: {
        ...process.env,
        SEO_ALTERNATE_ORIGINS: "",
        SEO_SITEMAP_AUDIT_WARN_MS: "2147483647",
      },
    });
    const corruptHistoryOutput = `${corruptHistoryRun.stdout}\n${corruptHistoryRun.stderr}`;

    assert.equal(corruptHistoryRun.status, 0, corruptHistoryOutput);
    assert.match(corruptHistoryRun.stderr, /WARNING: Invalid sitemap performance history was preserved at .*corrupt-performance-history\.json\.corrupt-/);
    assert.match(corruptHistoryRun.stdout, /Published SEO smoke check passed\./);
    assert.match(corruptHistoryRun.stdout, /KNOWN-GOOD SEO REPORT SAVED:/);
    const quarantinedHistoryPath = fs.readdirSync(tempDir)
      .map((name) => path.join(tempDir, name))
      .find((filePath) => filePath.startsWith(`${corruptHistoryPath}.corrupt-`));
    assert.ok(quarantinedHistoryPath, "corrupt supplemental history is quarantined");
    assert.equal(fs.readFileSync(quarantinedHistoryPath, "utf8"), corruptHistory, "original supplemental history is preserved");
    const recoveredHistory = readSitemapAuditPerformanceReport(corruptHistoryPath);
    assert.equal(recoveredHistory.audits.length, 1, "the passing audit seeds the recovered history");

    const corruptArchiveText = fs.readFileSync(corruptArchivePath, "utf8");
    const corruptArchive = JSON.parse(corruptArchiveText);
    assert.equal(corruptArchive.schemaVersion, 1);
    assert.equal(corruptArchive.origin, primaryOrigin);
    assert.deepEqual(corruptArchive.alternateOrigins, []);
    assert.doesNotMatch(corruptArchiveText, /Sitemap performance history|Sitemap performance report could not be read|report schema or audit entries are invalid/);

    const corruptArchiveValidation = spawnSync(
      process.execPath,
      [scriptPath, "--validate-archive-only", `--origin=${primaryOrigin}`, "--alternate-origins=", `--archive=${corruptArchivePath}`],
      { encoding: "utf8", env: { ...process.env, SEO_ALTERNATE_ORIGINS: "" } },
    );
    assert.equal(corruptArchiveValidation.status, 0, `${corruptArchiveValidation.stdout}\n${corruptArchiveValidation.stderr}`);
    assert.match(corruptArchiveValidation.stdout, /KNOWN-GOOD SEO REPORT VALID/);

    const truncatedHistory = '{"schemaVersion":1,"audits":[{"generatedAt":"2026-09-17T12:00:00.000Z","releaseId":"truncated-history';
    const truncatedHistoryPath = path.join(tempDir, "truncated-performance-history.json");
    const truncatedArchivePath = path.join(tempDir, "truncated-history-known-good.json");
    fs.writeFileSync(truncatedHistoryPath, truncatedHistory);

    const truncatedHistoryRun = spawnSync(process.execPath, [
      "--import",
      preloadPath,
      scriptPath,
      `--origin=${primaryOrigin}`,
      "--alternate-origins=",
      `--archive=${truncatedArchivePath}`,
      `--performance-report=${truncatedHistoryPath}`,
      `--release-summary=${path.join(tempDir, "truncated-history-release-summary.json")}`,
    ], {
      encoding: "utf8",
      env: {
        ...process.env,
        SEO_ALTERNATE_ORIGINS: "",
        SEO_SITEMAP_AUDIT_WARN_MS: "2147483647",
      },
    });
    const truncatedHistoryOutput = `${truncatedHistoryRun.stdout}\n${truncatedHistoryRun.stderr}`;

    assert.equal(truncatedHistoryRun.status, 0, truncatedHistoryOutput);
    assert.match(truncatedHistoryRun.stderr, /WARNING: Invalid sitemap performance history was preserved at .*truncated-performance-history\.json\.corrupt-/);
    assert.match(truncatedHistoryRun.stdout, /Published SEO smoke check passed\./);
    assert.match(truncatedHistoryRun.stdout, /KNOWN-GOOD SEO REPORT SAVED:/);
    const quarantinedTruncatedHistoryPath = fs.readdirSync(tempDir)
      .map((name) => path.join(tempDir, name))
      .find((filePath) => filePath.startsWith(`${truncatedHistoryPath}.corrupt-`));
    assert.ok(quarantinedTruncatedHistoryPath, "truncated supplemental history is quarantined");
    assert.equal(fs.readFileSync(quarantinedTruncatedHistoryPath, "utf8"), truncatedHistory, "original truncated history is preserved");
    assert.equal(readSitemapAuditPerformanceReport(truncatedHistoryPath).audits.length, 1, "the passing audit seeds recovered history");

    const truncatedArchiveText = fs.readFileSync(truncatedArchivePath, "utf8");
    const truncatedArchive = JSON.parse(truncatedArchiveText);
    assert.equal(truncatedArchive.schemaVersion, 1);
    assert.equal(truncatedArchive.origin, primaryOrigin);
    assert.deepEqual(truncatedArchive.alternateOrigins, []);
    assert.doesNotMatch(truncatedArchiveText, /WARNING:|Sitemap performance history|Sitemap performance report could not be read|Unexpected end|JSON\.parse/);

    const truncatedArchiveValidation = spawnSync(
      process.execPath,
      [scriptPath, "--validate-archive-only", `--origin=${primaryOrigin}`, "--alternate-origins=", `--archive=${truncatedArchivePath}`],
      { encoding: "utf8", env: { ...process.env, SEO_ALTERNATE_ORIGINS: "" } },
    );
    assert.equal(truncatedArchiveValidation.status, 0, `${truncatedArchiveValidation.stdout}\n${truncatedArchiveValidation.stderr}`);
    assert.match(truncatedArchiveValidation.stdout, /KNOWN-GOOD SEO REPORT VALID/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
