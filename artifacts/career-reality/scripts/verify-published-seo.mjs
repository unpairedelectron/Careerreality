import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import {
  STATIC_TITLE_MAX_LENGTH,
  STATIC_TITLE_MIN_LENGTH,
} from "./seo-title-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const distRoot = path.join(root, "dist", "public");
const routeRegistry = JSON.parse(fs.readFileSync(path.join(root, "src/data/route-registry.json"), "utf8"));
const legacyRedirects = new Map(routeRegistry.redirects.map((entry) => [
  entry.from.replace(/\/+$/, "") || "/",
  entry.to,
]));
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
const requestedArchive = process.argv.find((argument) => argument.startsWith("--archive="))?.slice("--archive=".length)
  ?? process.env.SEO_KNOWN_GOOD_REPORT
  ?? path.join(root, "reports", "published-seo-known-good.json");
const archivePath = path.resolve(requestedArchive);
const requestedPerformanceReport = process.argv.find((argument) => argument.startsWith("--performance-report="))?.slice("--performance-report=".length)
  ?? process.env.SEO_SITEMAP_PERFORMANCE_REPORT
  ?? path.join(root, "reports", "published-sitemap-performance.json");
const performanceReportPath = path.resolve(requestedPerformanceReport);
const requestedReleaseSummary = process.argv.find((argument) => argument.startsWith("--release-summary="))?.slice("--release-summary=".length)
  ?? process.env.SEO_SITEMAP_RELEASE_SUMMARY
  ?? process.env.SEO_RELEASE_SUMMARY
  ?? path.join(root, "reports", "published-seo-release-summary.json");
const releaseSummaryPath = path.resolve(requestedReleaseSummary);

const routes = {
  search: "/search/",
  sitemap: "/sitemap.xml",
  robots: "/robots.txt",
  article: "/article/indian-it-layoff-cycle-2026/",
  trust: "/editorial/",
};
const cleanupRoutes = {
  candidate: "/article/ai-upskilling-trap-india-api-wrapper-reality/",
  legacyCompany: "/companies/groww/",
  pro: "/pro/",
  mobile: "/mobile-app/",
};

const checks = [];
const fetched = new Map();
const sitemapPageObservations = new Map();
const SITEMAP_AUDIT_BATCH_SIZE = 8;
const SITEMAP_PAGE_MAX_ATTEMPTS = 2;
const DEFAULT_SITEMAP_AUDIT_WARN_MS = 5_000;
const SITEMAP_PERFORMANCE_HISTORY_LIMIT = 20;
const SITEMAP_PERFORMANCE_SCHEMA_VERSION = 1;
const SITEMAP_RELEASE_SUMMARY_SCHEMA_VERSION = 1;

function parseSitemapAuditWarnMs(value, fallback = DEFAULT_SITEMAP_AUDIT_WARN_MS) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const SITEMAP_AUDIT_WARN_MS = parseSitemapAuditWarnMs(process.env.SEO_SITEMAP_AUDIT_WARN_MS);

function sitemapAuditConfigurationWarning(value, fallback = DEFAULT_SITEMAP_AUDIT_WARN_MS) {
  if (value === undefined) return null;
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) return null;
  return `WARNING: SEO_SITEMAP_AUDIT_WARN_MS=${JSON.stringify(String(value))} is invalid; using the safe default of ${fallback} ms. Set a positive integer in milliseconds or unset the variable.`;
}

function sitemapAuditConfigurationWarningEntry(value, fallback = DEFAULT_SITEMAP_AUDIT_WARN_MS) {
  if (!sitemapAuditConfigurationWarning(value, fallback)) return null;
  return {
    code: "invalid-sitemap-audit-warning-threshold",
    setting: "SEO_SITEMAP_AUDIT_WARN_MS",
    effectiveThresholdMs: fallback,
  };
}

function sitemapReleaseSummary({
  generatedAt = new Date().toISOString(),
  configurationWarnings = [],
  localFailureCount = 0,
  publishedFailureCount = 0,
  effectiveThresholdMs = SITEMAP_AUDIT_WARN_MS,
} = {}) {
  return {
    schemaVersion: SITEMAP_RELEASE_SUMMARY_SCHEMA_VERSION,
    generatedAt,
    seoStatus: localFailureCount || publishedFailureCount ? "fail" : "pass",
    configurationStatus: configurationWarnings.length ? "warning" : "ok",
    effectiveSitemapAuditWarnMs: effectiveThresholdMs,
    configurationWarnings,
    localFailureCount,
    publishedFailureCount,
  };
}

function writeSitemapReleaseSummary(summary, summaryPath = releaseSummaryPath) {
  const serialized = JSON.stringify(summary, null, 2);
  if (/(?:-----BEGIN|api[_-]?key|authorization|cookie|password|secret)/i.test(serialized)) {
    throw new Error("Sitemap release summary contains credential-like content");
  }
  if (/<(?:!doctype|html|head|body|script|meta)\b/i.test(serialized)) {
    throw new Error("Sitemap release summary contains raw HTML content");
  }
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, `${serialized}\n`);
  return summaryPath;
}

function addCheck(label, passed, expected, observed, kind = "live") {
  checks.push({ label, passed, expected, observed, kind });
}

function attributeFromTag(html, tagPattern, attribute) {
  const tag = html.match(tagPattern)?.[0] ?? "";
  return tag.match(new RegExp(`\\b${attribute}=["']([^"']*)["']`, "i"))?.[1] ?? "";
}

function metaContent(html, name) {
  return attributeFromTag(html, new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, "i"), "content");
}

function propertyContent(html, property) {
  return attributeFromTag(html, new RegExp(`<meta\\b[^>]*\\bproperty=["']${property}["'][^>]*>`, "i"), "content");
}

function pageTitle(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
}

function sitemapResultStatus(result) {
  return typeof result?.status === "number"
    ? result.status
    : typeof result?.response?.status === "number"
      ? result.response.status
      : null;
}

function isTransientSitemapFailure(result) {
  if (result?.error) return true;
  const status = sitemapResultStatus(result);
  return status !== null && status >= 500 && status < 600;
}

function sitemapRetryOutcome(result) {
  if (typeof result?.attempts !== "number" || result.attempts <= 1) return "not-needed";
  return isTransientSitemapFailure(result) ? "exhausted" : "recovered";
}

function sitemapRetryDiagnostic(result) {
  if (typeof result?.attempts !== "number") return "";
  const attempts = result.attempts;
  const outcome = result.retryOutcome ?? sitemapRetryOutcome(result);
  return ` (retry ${outcome}; ${attempts} attempt${attempts === 1 ? "" : "s"})`;
}

async function fetchSitemapPage(location, initialResult = null, {
  fetchImpl = fetch,
  maxAttempts = SITEMAP_PAGE_MAX_ATTEMPTS,
} = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error(`Sitemap page max attempts must be a positive integer: ${maxAttempts}`);
  }

  let result = initialResult;
  for (let attempts = 1; attempts <= maxAttempts; attempts += 1) {
    if (!result) {
      try {
        const response = await fetchImpl(location, { redirect: "follow" });
        const body = await response.text();
        result = { response, body };
      } catch (error) {
        result = { error };
      }
    }

    if (!isTransientSitemapFailure(result) || attempts === maxAttempts) {
      return {
        ...result,
        attempts,
        retryOutcome: sitemapRetryOutcome({ ...result, attempts }),
      };
    }
    result = null;
  }

  throw new Error(`Sitemap page fetch exhausted its request budget for ${location}`);
}

function sitemapPageObservation(location, result) {
  const body = result?.body ?? "";
  const status = sitemapResultStatus(result);
  const indexable = !/noindex\b/i.test(metaContent(body, "robots"));
  const titleLength = indexable ? pageTitle(body).length : null;
  const observedCanonical = canonical(body);
  const httpPassed = status !== null && status >= 200 && status < 300;
  const titlePassed = !indexable || (titleLength >= STATIC_TITLE_MIN_LENGTH && titleLength <= STATIC_TITLE_MAX_LENGTH);
  const canonicalPassed = canonicalMatchesSitemapLocation(location, observedCanonical);
  const observation = {
    status,
    finalUrl: result?.finalUrl ?? result?.response?.url ?? null,
    indexable,
    titleLength,
    canonical: observedCanonical || null,
    passed: httpPassed && titlePassed && canonicalPassed,
  };
  if (typeof result?.attempts === "number") observation.attempts = result.attempts;
  if (result?.retryOutcome) observation.retryOutcome = result.retryOutcome;
  if (result?.error) {
    observation.error = result.error instanceof Error ? result.error.message : String(result.error);
  }
  return observation;
}

function formatSitemapAuditSummary({ pageCount, batchSize, elapsedMs, workerFailures = 0, warningThresholdMs = SITEMAP_AUDIT_WARN_MS }) {
  return `Sitemap page audit: ${pageCount} pages; batch size ${batchSize}; elapsed ${elapsedMs} ms; warning threshold ${warningThresholdMs} ms (SEO_SITEMAP_AUDIT_WARN_MS); worker failures ${workerFailures}.`;
}

function sitemapAuditElapsedMs(startedAt, endedAt) {
  return endedAt - startedAt;
}

function sitemapAuditPerformanceWarning(elapsedMs, warningThresholdMs = SITEMAP_AUDIT_WARN_MS) {
  if (elapsedMs <= warningThresholdMs) return null;
  return `WARNING: Sitemap page audit took ${elapsedMs} ms, exceeding the configured ${warningThresholdMs} ms threshold. This is a performance warning only; SEO pass/fail is unchanged.`;
}

function sitemapAuditPerformanceEntry({
  generatedAt = new Date().toISOString(),
  releaseId = null,
  pageCount,
  batchSize,
  elapsedMs,
  warningThresholdMs = SITEMAP_AUDIT_WARN_MS,
  workerFailures = 0,
}) {
  return {
    generatedAt,
    ...(releaseId ? { releaseId } : {}),
    pageCount,
    batchSize,
    elapsedMs,
    warningThresholdMs,
    workerFailures,
    slow: elapsedMs > warningThresholdMs,
  };
}

function isSitemapAuditPerformanceEntry(entry) {
  const allowedKeys = new Set([
    "batchSize",
    "elapsedMs",
    "generatedAt",
    "pageCount",
    "releaseId",
    "slow",
    "warningThresholdMs",
    "workerFailures",
  ]);
  return Boolean(
    entry
    && Object.keys(entry).every((key) => allowedKeys.has(key))
    && typeof entry.generatedAt === "string"
    && Number.isInteger(entry.pageCount)
    && entry.pageCount >= 0
    && Number.isInteger(entry.batchSize)
    && entry.batchSize > 0
    && Number.isInteger(entry.elapsedMs)
    && entry.elapsedMs >= 0
    && Number.isInteger(entry.warningThresholdMs)
    && entry.warningThresholdMs > 0
    && Number.isInteger(entry.workerFailures)
    && entry.workerFailures >= 0
    && typeof entry.slow === "boolean"
    && entry.slow === (entry.elapsedMs > entry.warningThresholdMs)
    && (entry.releaseId === undefined || typeof entry.releaseId === "string"),
  );
}

function sitemapAuditPerformanceHistorySummary(entries) {
  const history = Array.isArray(entries) ? entries.filter(isSitemapAuditPerformanceEntry) : [];
  let consecutiveSlowAudits = 0;
  for (let index = history.length - 1; index >= 0 && history[index].slow; index -= 1) {
    consecutiveSlowAudits += 1;
  }
  let increasingAuditStreak = 0;
  for (let index = history.length - 1; index > 0 && history[index].elapsedMs > history[index - 1].elapsedMs; index -= 1) {
    increasingAuditStreak += 1;
  }
  const slowAuditCount = history.filter((entry) => entry.slow).length;
  const latest = history.at(-1) ?? null;
  const previous = history.at(-2) ?? null;
  return {
    auditCount: history.length,
    slowAuditCount,
    consecutiveSlowAudits,
    increasingAuditStreak,
    latest,
    latestDeltaMs: latest && previous ? latest.elapsedMs - previous.elapsedMs : null,
    repeatedSlowdown: consecutiveSlowAudits >= 2,
  };
}

function formatSitemapAuditPerformanceHistory(summary, reportPath = performanceReportPath) {
  if (!summary || summary.auditCount === 0) {
    return `Sitemap performance history: no completed audits recorded (${reportPath}).`;
  }
  const latestTiming = `latest ${summary.latest.elapsedMs} ms${summary.latestDeltaMs === null ? "" : ` (${summary.latestDeltaMs >= 0 ? "+" : ""}${summary.latestDeltaMs} ms vs prior release)`}`;
  return `Sitemap performance history: ${summary.slowAuditCount} slow audit${summary.slowAuditCount === 1 ? "" : "s"} in the last ${summary.auditCount}; ${latestTiming}; increasing audit streak ${summary.increasingAuditStreak}; consecutive slow audits ${summary.consecutiveSlowAudits}; report ${reportPath}.`;
}

function sitemapAuditPerformanceHistoryWarning(summary) {
  if (!summary?.repeatedSlowdown) return null;
  return `WARNING: Sitemap page audit exceeded its configured budget in ${summary.consecutiveSlowAudits} consecutive releases (${summary.slowAuditCount} of ${summary.auditCount} recorded audits). Investigate the sustained slowdown before it causes workflow timeouts. SEO pass/fail is unchanged.`;
}

function readSitemapAuditPerformanceReport(reportPath = performanceReportPath) {
  if (!fs.existsSync(reportPath)) return { schemaVersion: SITEMAP_PERFORMANCE_SCHEMA_VERSION, audits: [] };
  let content;
  try {
    content = fs.readFileSync(reportPath, "utf8");
  } catch (error) {
    throw new Error(`Sitemap performance report could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }

  let report;
  try {
    report = JSON.parse(content);
  } catch (error) {
    const invalidHistoryError = new Error(
      `Sitemap performance report could not be read: ${error instanceof Error ? error.message : String(error)}`,
    );
    invalidHistoryError.code = "INVALID_SITEMAP_PERFORMANCE_HISTORY";
    throw invalidHistoryError;
  }
  if (
    report?.schemaVersion !== SITEMAP_PERFORMANCE_SCHEMA_VERSION
    || !Array.isArray(report.audits)
    || report.audits.length > SITEMAP_PERFORMANCE_HISTORY_LIMIT
    || report.audits.some((entry) => !isSitemapAuditPerformanceEntry(entry))
  ) {
    const invalidHistoryError = new Error("Sitemap performance report could not be read: report schema or audit entries are invalid");
    invalidHistoryError.code = "INVALID_SITEMAP_PERFORMANCE_HISTORY";
    throw invalidHistoryError;
  }
  return report;
}

function quarantineInvalidSitemapAuditPerformanceReport(reportPath, generatedAt) {
  const timestamp = generatedAt.replace(/[^a-zA-Z0-9_-]/g, "-");
  const basePath = `${reportPath}.corrupt-${timestamp}`;
  let quarantinePath = basePath;
  let suffix = 1;
  while (fs.existsSync(quarantinePath)) {
    quarantinePath = `${basePath}-${suffix}`;
    suffix += 1;
  }
  fs.renameSync(reportPath, quarantinePath);
  return quarantinePath;
}

function recordSitemapAuditPerformance(audit, {
  reportPath = performanceReportPath,
  generatedAt = new Date().toISOString(),
  releaseId = process.env.SEO_RELEASE_ID ?? process.env.GITHUB_SHA ?? null,
  recoverInvalidHistory = false,
} = {}) {
  const entry = sitemapAuditPerformanceEntry({ ...audit, generatedAt, releaseId });
  if (!isSitemapAuditPerformanceEntry(entry)) {
    throw new Error("Sitemap performance audit entry is invalid");
  }

  let current;
  try {
    current = readSitemapAuditPerformanceReport(reportPath);
  } catch (error) {
    if (!recoverInvalidHistory || error?.code !== "INVALID_SITEMAP_PERFORMANCE_HISTORY") {
      throw error;
    }
    const quarantinedPath = quarantineInvalidSitemapAuditPerformanceReport(reportPath, generatedAt);
    console.warn(`WARNING: Invalid sitemap performance history was preserved at ${quarantinedPath}; starting a fresh history.`);
    current = { schemaVersion: SITEMAP_PERFORMANCE_SCHEMA_VERSION, audits: [] };
  }
  const audits = [...current.audits, entry].slice(-SITEMAP_PERFORMANCE_HISTORY_LIMIT);
  const next = {
    schemaVersion: SITEMAP_PERFORMANCE_SCHEMA_VERSION,
    generatedAt,
    audits,
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const temporaryPath = `${reportPath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx" });
    fs.renameSync(temporaryPath, reportPath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      try {
        fs.unlinkSync(temporaryPath);
      } catch {
        // A leftover temporary report is safer than masking the write or rename failure.
      }
    }
  }
  return sitemapAuditPerformanceHistorySummary(audits);
}

function publishedSitemapPageChecks(location, result, { includeHttpCheck = true } = {}) {
  const checksForPage = [];
  const expectedTitle = `${STATIC_TITLE_MIN_LENGTH}-${STATIC_TITLE_MAX_LENGTH} characters for indexable page`;
  const addPageCheck = (label, passed, expected, observed) => {
    checksForPage.push({ label, passed, expected, observed, kind: "live" });
  };

  let url;
  try {
    url = new URL(location);
  } catch {
    addPageCheck(`${location} title length`, false, expectedTitle, "invalid sitemap URL");
    return checksForPage;
  }

  if (url.origin !== origin) {
    addPageCheck(`${location} title length`, false, `${origin} sitemap URL`, `unexpected origin ${url.origin}`);
    return checksForPage;
  }

  if (includeHttpCheck) {
    if (result?.error) {
      addPageCheck(
        `HTTP sitemap page ${location}`,
        false,
        "reachable response",
        `${result.error instanceof Error ? result.error.message : String(result.error)}${sitemapRetryDiagnostic(result)}`,
      );
    } else if (typeof result?.status === "number") {
      addPageCheck(
        `HTTP sitemap page ${location}`,
        result.status >= 200 && result.status < 300,
        "2xx response",
        `${result.status} ${result.finalUrl ?? location}${sitemapRetryDiagnostic(result)}`,
      );
    } else {
      addPageCheck(
        `HTTP sitemap page ${location}`,
        false,
        "reachable response",
        `missing response${sitemapRetryDiagnostic(result)}`,
      );
    }
  }

  if (result?.error) {
    return checksForPage;
  }

  const observedCanonical = canonical(result?.body ?? "");
  addPageCheck(
    `${location} canonical`,
    canonicalMatchesSitemapLocation(location, observedCanonical),
    url.href,
    observedCanonical || "(missing)",
  );

  const robots = metaContent(result?.body ?? "", "robots");
  addPageCheck(`${location} indexability`, robots === "index, follow", "index, follow", robots || "(missing)");
  if (/noindex\b/i.test(robots)) {
    addPageCheck(
      `${location} title validation exemption`,
      true,
      "intentional exemption for noindex page",
      `${robots}; title length check skipped intentionally`,
    );
    return checksForPage;
  }
  if (robots !== "index, follow") {
    return checksForPage;
  }

  const title = pageTitle(result?.body ?? "");
  const titleLength = title.length;
  addPageCheck(
    `${location} title length`,
    titleLength >= STATIC_TITLE_MIN_LENGTH && titleLength <= STATIC_TITLE_MAX_LENGTH,
    expectedTitle,
    title ? `${titleLength} characters: ${title}` : "(missing title)",
  );
  return checksForPage;
}

function canonical(html) {
  return attributeFromTag(html, /<link\b[^>]*\brel=["']canonical["'][^>]*>/i, "href");
}

function canonicalMatchesSitemapLocation(location, observedCanonical) {
  if (!observedCanonical) return false;
  try {
    return new URL(observedCanonical).href === new URL(location).href;
  } catch {
    return false;
  }
}

function compareArchiveCheckRecords(left, right) {
  const kindOrder = { local: 0, live: 1, alternate: 2 };
  const kindDifference = (kindOrder[left.kind] ?? 99) - (kindOrder[right.kind] ?? 99);
  if (kindDifference) return kindDifference;

  for (const field of ["label", "expected", "observed", "status", "passed"]) {
    const before = String(left[field] ?? "");
    const after = String(right[field] ?? "");
    if (before < after) return -1;
    if (before > after) return 1;
  }
  return 0;
}

function archiveCheckRecords(sourceChecks = checks) {
  const archivedChecks = sourceChecks
    .filter((check) => !check.label.startsWith("HTTP sitemap page ") && !/^https?:\/\/\S+ (?:canonical|title length)$/.test(check.label))
    .map(({ label, passed, expected, observed, kind, status }) => ({
      label,
      passed,
      expected,
      observed,
      kind,
      status: status ?? (passed ? "pass" : "fail"),
    }));
  return archivedChecks.sort(compareArchiveCheckRecords);
}

function expectedUrl(route) {
  return `${origin}${route}`;
}

function readSnapshot(route) {
  const file = path.join(distRoot, route.replace(/^\/+/, ""), "index.html");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

function sitemapLocations(body) {
  return [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

function captureObservation(result, route) {
  if (!result) return { status: null, finalUrl: null };
  const { response, body } = result;
  const observation = {
    status: response.status,
    finalUrl: response.url,
  };
  if (route === routes.sitemap) {
    const locations = sitemapLocations(body);
    observation.locationCount = locations.length;
    observation.locationOrigins = [...new Set(locations.map((location) => {
      try {
        return new URL(location).origin;
      } catch {
        return "(invalid)";
      }
    }))].sort();
    observation.includesSearch = locations.some((location) => {
      try {
        return new URL(location).pathname.replace(/\/+$/, "") === "/search";
      } catch {
        return false;
      }
    });
  } else if (route === routes.robots) {
    observation.sitemapLine = body.match(/^Sitemap:.*$/im)?.[0] ?? null;
    observation.containsLegacyOrigin = /replit\.app/i.test(body);
  } else {
    observation.canonical = canonical(body);
    observation.ogUrl = propertyContent(body, "og:url");
    observation.robots = metaContent(body, "robots");
    observation.hasBreadcrumbs = /<nav\b[^>]*aria-label=["']Breadcrumb["']/i.test(body);
    observation.hasRealityCheck = body.includes("Reality check");
    observation.hasDecisionSummary = body.includes("Decision summary");
    observation.hasArticleSchema = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"Article"/i.test(body);
  }
  return observation;
}

function compareSnapshots(baseline, current, prefix = "") {
  const differences = [];
  const keys = new Set([...Object.keys(baseline ?? {}), ...Object.keys(current ?? {})]);
  for (const key of keys) {
    const label = prefix ? `${prefix}.${key}` : key;
    const before = baseline?.[key];
    const after = current?.[key];
    if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
      differences.push(...compareSnapshots(before, after, label));
    } else if (JSON.stringify(before) !== JSON.stringify(after)) {
      differences.push({ label, baseline: before ?? "(missing)", current: after ?? "(missing)" });
    }
  }
  return differences;
}

function archivePayload(observations, {
  generatedAt = new Date().toISOString(),
  sourceChecks = checks,
} = {}) {
  return {
    schemaVersion: 1,
    generatedAt,
    origin,
    alternateOrigins,
    observations,
    checks: archiveCheckRecords(sourceChecks),
  };
}

function hasValidatedPublishedArticleRedirect(observation, checksInReport) {
  if (
    observation?.status !== 301
    || observation.finalUrl !== expectedUrl(routes.article)
    || !Array.isArray(checksInReport)
  ) {
    return false;
  }

  const httpCheck = checksInReport.find((check) => check?.label === `HTTP ${routes.article}`);
  const destinationLabel = `Published archived article destination ${routes.article.replace(/\/+$/, "")}`;
  const destinationCheck = checksInReport.find((check) => check?.label === destinationLabel);
  if (
    httpCheck?.passed !== true
    || httpCheck.expected !== "2xx noindex hold or 301 to a registered guide"
    || httpCheck.observed !== `301 ${expectedUrl(routes.article)}`
    || destinationCheck?.passed !== true
    || destinationCheck.expected !== "301 to registered indexable guide"
  ) {
    return false;
  }

  const match = /^301 (\/guides\/[a-z0-9-]+\/?)$/.exec(destinationCheck.observed ?? "");
  if (!match) return false;
  try {
    const destination = new URL(match[1], origin);
    return destination.origin === origin && isRegisteredGuidePath(destination.pathname);
  } catch {
    return false;
  }
}

function validateKnownGoodReport(report) {
  const errors = [];
  if (!report || typeof report !== "object") errors.push("report must be an object");
  if (report?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (report?.origin !== origin) errors.push(`origin must be ${origin}`);
  if (!Array.isArray(report?.alternateOrigins)) {
    errors.push("alternateOrigins must be an array");
  } else if (JSON.stringify([...report.alternateOrigins].sort()) !== JSON.stringify([...alternateOrigins].sort())) {
    errors.push("alternateOrigins do not match the currently configured alternate hosts");
  }
  if (!report?.observations?.primary || typeof report.observations.primary !== "object") {
    errors.push("primary route observations are missing");
  }
  if (!report?.observations?.alternates || typeof report.observations.alternates !== "object") {
    errors.push("alternate route observations are missing");
  }
  const sitemapPages = report?.observations?.sitemapPages;
  if (!sitemapPages || typeof sitemapPages !== "object" || Array.isArray(sitemapPages) || Object.keys(sitemapPages).length === 0) {
    errors.push("sitemap page observations are missing");
  } else {
    for (const [location, page] of Object.entries(sitemapPages)) {
      if (
        !page
        || page.status !== 200
        || typeof page.finalUrl !== "string"
        || typeof page.indexable !== "boolean"
        || typeof page.canonical !== "string"
        || typeof page.passed !== "boolean"
        || page.passed !== true
        || (page.indexable && typeof page.titleLength !== "number")
        || (!page.indexable && page.titleLength !== null)
      ) {
        errors.push(`sitemap page observation is incomplete for ${location}`);
        break;
      }
    }
  }

  const checksInReport = report?.checks;
  for (const route of Object.values(routes)) {
    const observation = report?.observations?.primary?.[route];
    const acceptedArticleRedirect = route === routes.article
      && hasValidatedPublishedArticleRedirect(observation, checksInReport);
    if (
      !observation
      || (observation.status !== 200 && !acceptedArticleRedirect)
      || typeof observation.finalUrl !== "string"
    ) {
      errors.push(`primary observation is incomplete for ${route}`);
    }
  }
  for (const alternateOrigin of alternateOrigins) {
    const alternateRoutes = report?.observations?.alternates?.[alternateOrigin];
    if (!alternateRoutes) {
      errors.push(`alternate observations are missing for ${alternateOrigin}`);
      continue;
    }
    for (const route of Object.values(routes)) {
      const observation = alternateRoutes[route];
      if (!observation || observation.status !== 200 || typeof observation.finalUrl !== "string") {
        errors.push(`alternate observation is incomplete for ${alternateOrigin}${route}`);
      }
    }
  }

  if (!Array.isArray(checksInReport) || checksInReport.length === 0) {
    errors.push("passing check records are missing");
  } else {
    for (const check of checksInReport) {
      if (!check || check.passed !== true || typeof check.label !== "string" || typeof check.expected !== "string" || typeof check.observed !== "string") {
        errors.push(`check record is not a passing diagnostic: ${check?.label ?? "(unknown)"}`);
        break;
      }
    }
  }

  const serialized = JSON.stringify(report);
  if (/<(?:!doctype|html|head|body|script|meta)\b/i.test(serialized)) errors.push("raw HTML content is not allowed");
  if (/(?:-----BEGIN|api[_-]?key|authorization|cookie|password|secret)/i.test(serialized)) errors.push("credential-like content is not allowed");
  return { valid: errors.length === 0, errors };
}

function archiveOrCompare(observations, publishedFailures, localFailures) {
  if (publishedFailures.length || localFailures.length) {
    if (!fs.existsSync(archivePath)) {
      console.log(`No known-good SEO report yet; a passing run will create ${archivePath}.`);
      return;
    }
    try {
      const baseline = JSON.parse(fs.readFileSync(archivePath, "utf8"));
      const validation = validateKnownGoodReport(baseline);
      if (!validation.valid) {
        console.error(`KNOWN-GOOD SEO REPORT REJECTED: ${validation.errors.join("; ")}`);
        return;
      }
      const differences = compareSnapshots(baseline.observations, observations);
      console.log(`Known-good SEO report: ${archivePath}`);
      if (differences.length) {
        console.log(`Known-good comparison: ${differences.length} observation difference(s).`);
        for (const difference of differences.slice(0, 20)) {
          console.log(`  ${difference.label}: baseline ${JSON.stringify(difference.baseline)} → current ${JSON.stringify(difference.current)}`);
        }
      } else {
        console.log("Known-good comparison: no route-observation differences.");
      }
    } catch (error) {
      console.error(`Known-good SEO report could not be read: ${error instanceof Error ? error.message : String(error)}`);
    }
    return;
  }

  writeKnownGoodReport(observations);
}

function writeKnownGoodReport(observations, {
  reportPath = archivePath,
  generatedAt = new Date().toISOString(),
  sourceChecks = checks,
} = {}) {
  const report = archivePayload(observations, { generatedAt, sourceChecks });
  const validation = validateKnownGoodReport(report);
  if (!validation.valid) {
    throw new Error(`New known-good SEO report rejected: ${validation.errors.join("; ")}`);
  }

  if (fs.existsSync(reportPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      const existingValidation = validateKnownGoodReport(existing);
      if (existingValidation.valid) {
        const { generatedAt: _existingGeneratedAt, ...existingEvidence } = existing;
        const { generatedAt: _newGeneratedAt, ...newEvidence } = report;
        if (isDeepStrictEqual(existingEvidence, newEvidence)) {
          console.log(`KNOWN-GOOD SEO REPORT UNCHANGED: ${reportPath}`);
          return false;
        }
      }
    } catch {
      // A passing, validated report below can safely replace an unreadable archive.
    }
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`KNOWN-GOOD SEO REPORT SAVED: ${reportPath}`);
  return true;
}

function validateArchiveOnly() {
  if (!fs.existsSync(archivePath)) {
    console.error(`KNOWN-GOOD SEO REPORT REJECTED: report does not exist at ${archivePath}`);
    return 1;
  }
  try {
    const report = JSON.parse(fs.readFileSync(archivePath, "utf8"));
    const validation = validateKnownGoodReport(report);
    if (!validation.valid) {
      console.error(`KNOWN-GOOD SEO REPORT REJECTED: ${validation.errors.join("; ")}`);
      return 1;
    }
    console.log(`KNOWN-GOOD SEO REPORT VALID: ${archivePath}`);
    return 0;
  } catch (error) {
    console.error(`KNOWN-GOOD SEO REPORT REJECTED: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function fetchRoute(route) {
  const url = expectedUrl(route);
  const expectedRedirect = legacyRedirects.get(route.replace(/\/+$/, "") || "/");
  const articleHoldRoute = route === routes.article || route === cleanupRoutes.candidate;
  try {
    const response = await fetch(url, { redirect: expectedRedirect || articleHoldRoute ? "manual" : "follow" });
    const body = await response.text();
    fetched.set(route, { response, body });
    const expected = expectedRedirect
      ? "2xx response or mapped 301"
      : articleHoldRoute
        ? "200 noindex hold"
        : "2xx response";
    const validArticleHold = articleHoldRoute
      && response.status === 200
      && metaContent(body, "robots") === "noindex, follow";
    const passed = articleHoldRoute
      ? validArticleHold
      : response.ok || (expectedRedirect && response.status === 301);
    addCheck(
      `HTTP ${route}`,
      Boolean(passed),
      expected,
      `${response.status} ${response.url}`,
    );
    return { response, body };
  } catch (error) {
    addCheck(`HTTP ${route}`, false, "reachable response", error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function fetchAlternateRoute(alternateOrigin, route) {
  const url = `${alternateOrigin}${route}`;
  try {
    const response = await fetch(url, { redirect: "follow" });
    const body = await response.text();
    addCheck(
      `HTTP ${alternateOrigin}${route}`,
      response.ok,
      "2xx response",
      `${response.status} ${response.url}`,
      "alternate",
    );
    return { response, body };
  } catch (error) {
    addCheck(
      `HTTP ${alternateOrigin}${route}`,
      true,
      "reachable when configured",
      error instanceof Error ? `skipped: ${error.message}` : `skipped: ${String(error)}`,
      "alternate",
    );
    checks.at(-1).status = "skip";
    return null;
  }
}

async function verifyWwwApexRedirects() {
  const examples = [
    ["/", "?utm_source=apex-host-check"],
    ["/guides/read-the-offer-beyond-ctc/", "?ref=article-check"],
    ["/companies/", "?source=company-check"],
    ["/salary-calculator/", "?utm_campaign=tool-check&view=monthly"],
    ["/offer-comparison/", "?source=tool-check"],
  ];
  for (const [pathname, query] of examples) {
    const requestedUrl = `https://www.careerreality.in${pathname}${query}`;
    const expectedLocation = `https://careerreality.in${pathname}${query}`;
    try {
      const wwwResponse = await fetch(requestedUrl, { redirect: "manual" });
      const location = wwwResponse.headers.get("location");
      const redirectedOnce = wwwResponse.status === 301 && location === expectedLocation;
      const body = redirectedOnce ? "" : await wwwResponse.text();
      const expectedCanonical = expectedLocation.split("?")[0];
      const canonicalized = wwwResponse.status === 200 && canonical(body) === expectedCanonical;
      addCheck(
        `www primary-host signal ${pathname}`,
        redirectedOnce || canonicalized,
        `301 to ${expectedLocation} or 200 with apex canonical ${expectedCanonical}`,
        redirectedOnce ? `${wwwResponse.status} ${location}` : `${wwwResponse.status}; canonical ${canonical(body) || "(missing)"}`,
        "alternate",
      );
      if (!redirectedOnce) continue;

      const apexResponse = await fetch(expectedLocation, { redirect: "manual" });
      addCheck(
        `Apex destination does not redirect ${pathname}`,
        apexResponse.status === 200 && !apexResponse.headers.get("location"),
        "200 with no further Location",
        `${apexResponse.status} ${apexResponse.headers.get("location") ?? "(no Location)"}`,
        "alternate",
      );
    } catch (error) {
      addCheck(
        `www to apex one-hop redirect ${pathname}`,
        false,
        `301 to ${expectedLocation}`,
        error instanceof Error ? error.message : String(error),
        "alternate",
      );
    }
  }
}

async function verifySitemapPageTitle(location) {
  let url;
  try {
    url = new URL(location);
  } catch {
    sitemapPageObservations.set(location, sitemapPageObservation(location, null));
    for (const check of publishedSitemapPageChecks(location, null)) addCheck(check.label, check.passed, check.expected, check.observed, check.kind);
    return;
  }

  if (url.origin !== origin) {
    sitemapPageObservations.set(location, sitemapPageObservation(location, null));
    for (const check of publishedSitemapPageChecks(location, null)) addCheck(check.label, check.passed, check.expected, check.observed, check.kind);
    return;
  }

  const existingResult = [...fetched.values()].find((result) => result?.response?.url === url.href);
  const result = await fetchSitemapPage(url.href, existingResult);
  const pageResult = {
    status: sitemapResultStatus(result),
    finalUrl: result?.response?.url ?? result?.finalUrl ?? location,
    body: result?.body ?? "",
    error: result?.error,
    attempts: result?.attempts,
    retryOutcome: result?.retryOutcome,
  };
  sitemapPageObservations.set(location, sitemapPageObservation(location, pageResult));
  for (const check of publishedSitemapPageChecks(location, pageResult, {
    includeHttpCheck: !existingResult || result?.attempts > 1,
  })) {
    addCheck(check.label, check.passed, check.expected, check.observed, check.kind);
  }
}

async function verifyPublishedSitemapTitles({ now = Date.now } = {}) {
  const sitemap = fetched.get(routes.sitemap)?.body;
  if (!sitemap) return null;

  const locations = [...new Set(sitemapLocations(sitemap))];
  const startedAt = now();
  const results = await runSitemapAuditBatches(locations, verifySitemapPageTitle, SITEMAP_AUDIT_BATCH_SIZE);
  for (const { location, error } of results) {
    if (error) {
      addCheck(
        `Published sitemap page ${location} audit`,
        false,
        "completed sitemap page audit",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  const elapsedMs = sitemapAuditElapsedMs(startedAt, now());
  console.log(formatSitemapAuditSummary({
    pageCount: locations.length,
    batchSize: SITEMAP_AUDIT_BATCH_SIZE,
    elapsedMs,
    workerFailures: results.filter(({ error }) => Boolean(error)).length,
  }));
  const warning = sitemapAuditPerformanceWarning(elapsedMs);
  if (warning) console.warn(warning);
  return {
    pageCount: locations.length,
    batchSize: SITEMAP_AUDIT_BATCH_SIZE,
    elapsedMs,
    warningThresholdMs: SITEMAP_AUDIT_WARN_MS,
    workerFailures: results.filter(({ error }) => Boolean(error)).length,
  };
}

async function runSitemapAuditBatches(locations, auditPage, batchSize = SITEMAP_AUDIT_BATCH_SIZE) {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error(`Sitemap audit batch size must be a positive integer: ${batchSize}`);
  }

  const results = [];
  for (let index = 0; index < locations.length; index += batchSize) {
    const batch = await Promise.all(locations.slice(index, index + batchSize).map(async (location) => {
      try {
        await auditPage(location);
        return { location, error: null };
      } catch (error) {
        return { location, error };
      }
    }));
    results.push(...batch);
  }
  return results;
}

function verifySharedRoute(label, body, route, options = {}) {
  if (!body) return;
  const kind = options.kind ?? "live";
  const expected = expectedUrl(route);
  const actualCanonical = canonical(body);
  const actualOgUrl = propertyContent(body, "og:url");
  addCheck(`${label} canonical`, actualCanonical === expected, expected, actualCanonical || "(missing)", kind);
  addCheck(`${label} Open Graph URL`, actualOgUrl === expected, expected, actualOgUrl || "(missing)", kind);
  if (options.requireBreadcrumbs !== false) {
    addCheck(`${label} visible breadcrumbs`, /<nav\b[^>]*aria-label=["']Breadcrumb["']/i.test(body), "Breadcrumb navigation", "present or missing", kind);
  }
  addCheck(`${label} robots`, metaContent(body, "robots") === (options.noIndex ? "noindex, follow" : "index, follow"), options.noIndex ? "noindex, follow" : "index, follow", metaContent(body, "robots") || "(missing)", kind);
}

function verifyRetiredRouteStatus(label, result, kind = "live", { holdOnly = false } = {}) {
  const status = result?.response?.status;
  const body = result?.body ?? "";
  const sourcePath = new URL(result?.response?.url ?? expectedUrl(routes.article)).pathname.replace(/\/+$/, "") || "/";
  const target = legacyRedirects.get(sourcePath);
  const location = result?.response?.headers?.get("location");
  const heldNoindex = status === 200 && metaContent(body, "robots") === "noindex, follow";
  const mappedRedirect = status === 301 && Boolean(target) && isMappedRedirect(result.response, origin, target);
  const guideRedirect = status === 301 && !target && isRegisteredGuideRedirect(result?.response, origin);
  const passed = heldNoindex || (!holdOnly && (mappedRedirect || guideRedirect));
  if (heldNoindex) verifyPublishedTitle(label, body, kind);
  addCheck(
    holdOnly ? `${label} noindex hold` : `${label} noindex hold or registered handoff`,
    passed,
    holdOnly
      ? "200 noindex, follow at the original article URL"
      : target
        ? `noindex hold or 301 to ${target}`
        : "noindex hold or 301 to a registered guide",
    typeof status === "number"
      ? `${status} ${location ?? (heldNoindex ? "noindex, follow" : "(not a hold page or registered handoff)")}`
      : "(missing response)",
    kind,
  );
}

function isRegisteredGuidePath(value) {
  const normalized = value.replace(/\/+$/, "") || "/";
  return routeRegistry.routes.some((entry) =>
    entry.kind === "guide"
    && entry.indexability === "indexable"
    && (entry.path.replace(/\/+$/, "") || "/") === normalized,
  ) && !routeRegistry.redirects.some((entry) => (entry.from.replace(/\/+$/, "") || "/") === normalized);
}

function isRegisteredGuideRedirect(response, baseOrigin = origin, expectedPath = null) {
  const location = response?.headers?.get("location");
  if (!location) return false;
  try {
    const destination = new URL(location, response.url ?? baseOrigin);
    const normalizedPath = destination.pathname.replace(/\/+$/, "") || "/";
    return destination.origin === baseOrigin
      && isRegisteredGuidePath(normalizedPath)
      && (!expectedPath || normalizedPath === (expectedPath.replace(/\/+$/, "") || "/"));
  } catch {
    return false;
  }
}

function isMappedRedirect(response, baseOrigin, expectedPath) {
  const location = response?.headers?.get("location");
  if (!location) return false;
  try {
    const destination = new URL(location, response.url ?? baseOrigin);
    const normalizedPath = destination.pathname.replace(/\/+$/, "") || "/";
    const registeredRoute = routeRegistry.routes.some((route) =>
      (route.path.replace(/\/+$/, "") || "/") === normalizedPath,
    );
    return destination.origin === baseOrigin
      && registeredRoute
      && normalizedPath === (expectedPath.replace(/\/+$/, "") || "/");
  } catch {
    return false;
  }
}

async function verifyPublishedLegacyArticleHolds() {
  const articles = routeRegistry.drafts?.articles ?? [];
  addCheck(
    "Published archived article hold inventory",
    articles.length === 44,
    "44 archived article slugs checked",
    `${articles.length} archived slugs`,
  );
  const requests = articles.flatMap(({ slug }) => {
    const source = `/article/${slug}`;
    return [
      { route: source, kind: "slash-normalization", canonicalRoute: `${source}/` },
      { route: `${source}/`, kind: "hold", canonicalRoute: `${source}/` },
    ];
  });
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(8, requests.length) }, async () => {
    while (cursor < requests.length) {
      const current = requests[cursor++];
      try {
        const response = await fetch(`${origin}${current.route}`, { redirect: "manual" });
        const body = await response.text();
        const location = response.headers.get("location");
        let passed = false;
        if (current.kind === "slash-normalization") {
          try {
            const destination = new URL(location ?? "", response.url);
            passed = response.status === 301
              && destination.origin === origin
              && destination.pathname === current.canonicalRoute;
          } catch {
            passed = false;
          }
        } else {
          passed = response.status === 200
            && metaContent(body, "robots") === "noindex, follow"
            && canonical(body) === expectedUrl(current.canonicalRoute)
            && !/"@type"\s*:\s*"Article"/i.test(body);
        }
        addCheck(
          `Published archived article ${current.kind} ${current.route}`,
          passed,
          current.kind === "hold"
            ? "200 noindex hold with self-canonical and no Article schema"
            : `301 to ${current.canonicalRoute}`,
          current.kind === "hold"
            ? `${response.status}; robots=${metaContent(body, "robots") || "(missing)"}; canonical=${canonical(body) || "(missing)"}`
            : `${response.status} ${location ?? "(missing Location)"}`,
        );
      } catch (error) {
        addCheck(
          `Published archived article ${current.kind} ${current.route}`,
          false,
          current.kind === "hold"
            ? "200 noindex hold with self-canonical and no Article schema"
            : `301 to ${current.canonicalRoute}`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }));
}

async function verifyPublishedUnsitemapToolsAndGuides() {
  const routesToCheck = routeRegistry.routes.filter(
    (route) => (route.kind === "tool" || route.kind === "guide") && !route.sitemap,
  );
  await Promise.all(routesToCheck.map(async (route) => {
    const canonicalPath = route.path === "/" ? "/" : `${route.path.replace(/\/+$/, "")}/`;
    const expected = expectedUrl(canonicalPath);
    try {
      const response = await fetch(expected, { redirect: "manual" });
      const body = await response.text();
      addCheck(`Published tool/guide ${route.path} HTTP`, response.status === 200, "200 response", `${response.status} ${response.url}`);
      const expectedRobots = route.indexability === "indexable" ? "index, follow" : "noindex, follow";
      const actualRobots = metaContent(body, "robots");
      addCheck(`Published tool/guide ${route.path} robots`, actualRobots === expectedRobots, expectedRobots, actualRobots || "(missing)");
      const actualCanonical = canonical(body);
      addCheck(`Published tool/guide ${route.path} canonical`, canonicalMatchesSitemapLocation(expected, actualCanonical), expected, actualCanonical || "(missing)");
    } catch (error) {
      addCheck(`Published tool/guide ${route.path} HTTP`, false, "200 response", error instanceof Error ? error.message : String(error));
    }
  }));
}

function verifyPublishedTitle(label, body, kind = "live") {
  const check = publishedTitleCheck(label, body, kind);
  if (check) checks.push(check);
}

function publishedTitleCheck(label, body, kind = "live") {
  if (!body) return null;
  const robots = metaContent(body, "robots");
  if (/noindex\b/i.test(robots)) {
    return {
      label: `${label} title validation exemption`,
      passed: true,
      expected: "intentional exemption for noindex page",
      observed: `${robots}; title length check skipped intentionally`,
      kind,
    };
  }
  const title = pageTitle(body);
  const titleLength = title.length;
  const valid = titleLength >= STATIC_TITLE_MIN_LENGTH && titleLength <= STATIC_TITLE_MAX_LENGTH;
  return {
    label: `${label} title length`,
    passed: valid,
    expected: `${STATIC_TITLE_MIN_LENGTH}-${STATIC_TITLE_MAX_LENGTH} characters for indexable page`,
    observed: title ? `${titleLength} characters: ${title}` : "(missing title)",
    kind,
  };
}

function verifyAlternateRoute(alternateOrigin, route, result) {
  if (!result) return;
  const label = `Alternate ${alternateOrigin}`;
  const finalOrigin = new URL(result.response.url).origin;
  const expected = expectedUrl(route);
  const actualCanonical = canonical(result.body);
  if ([routes.search, routes.trust].includes(route)) {
    addCheck(
      `${label}${route} redirects or canonicalizes to primary`,
      finalOrigin === origin || actualCanonical === expected,
      `redirect to ${origin} or canonical ${expected}`,
      finalOrigin === origin ? `redirected to ${finalOrigin}` : actualCanonical || `served at ${finalOrigin} without canonical`,
      "alternate",
    );
  }

  if (route === routes.search) {
    verifyPublishedTitle(`${label} search`, result.body, "alternate");
    verifySharedRoute(`${label} search`, result.body, route, { noIndex: true, requireBreadcrumbs: false, kind: "alternate" });
  } else if (route === routes.article) {
    const finalPath = new URL(result.response.url).pathname.replace(/\/+$/, "");
    addCheck(`${label} legacy article hold path`, finalPath === route.replace(/\/+$/, ""), route.replace(/\/+$/, ""), finalPath, "alternate");
    addCheck(`${label} legacy article hold canonical`, canonical(result.body) === expected, expected, canonical(result.body) || "(missing)", "alternate");
    addCheck(`${label} legacy article hold robots`, metaContent(result.body, "robots") === "noindex, follow", "noindex, follow", metaContent(result.body, "robots") || "(missing)", "alternate");
    addCheck(`${label} legacy article has no Article schema`, !/"@type"\s*:\s*"Article"/i.test(result.body), "no Article schema", "absent", "alternate");
  } else if (route === routes.trust) {
    verifyPublishedTitle(`${label} trust route`, result.body, "alternate");
    verifySharedRoute(`${label} trust route`, result.body, route, { kind: "alternate" });
  } else if (route === routes.sitemap) {
    const locations = [...result.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
    const nonPrimary = locations.filter((location) => {
      try {
        return new URL(location).origin !== origin;
      } catch {
        return true;
      }
    });
    addCheck(`${label} sitemap origin`, nonPrimary.length === 0, origin, nonPrimary.length ? nonPrimary.slice(0, 3).join(", ") : "all URLs use the primary origin", "alternate");
    addCheck(`${label} sitemap excludes search`, !locations.some((location) => {
      try {
        return new URL(location).pathname.replace(/\/+$/, "") === "/search";
      } catch {
        return false;
      }
    }), "no /search/ URL", locations.find((location) => location.includes("/search")) ?? "absent", "alternate");
  } else if (route === routes.robots) {
    const alternateHost = new URL(alternateOrigin).hostname;
    const isReplitAlias = alternateHost.endsWith(".replit.app");
    addCheck(
      `${label} robots policy`,
      isReplitAlias
        ? /^Disallow:\s*\/\s*$/im.test(result.body)
        : new RegExp(`^Sitemap:\\s*${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap\\.xml$`, "im").test(result.body),
      isReplitAlias ? "Disallow: /" : `Sitemap: ${origin}/sitemap.xml`,
      isReplitAlias
        ? result.body.match(/^Disallow:.*$/im)?.[0] ?? "(missing)"
        : result.body.match(/^Sitemap:.*$/im)?.[0] ?? "(missing)",
      "alternate",
    );
    addCheck(`${label} robots has no legacy origin`, !/replit\.app/i.test(result.body), "no replit.app URL", /replit\.app/i.test(result.body) ? "legacy origin present" : "absent", "alternate");
  }
}

function verifySnapshotContract() {
  const searchSnapshot = readSnapshot(routes.search);
  const articleSnapshot = readSnapshot(routes.article);
  const trustSnapshot = readSnapshot(routes.trust);
  const candidateSnapshot = readSnapshot(cleanupRoutes.candidate);
  const legacyCompanySnapshot = readSnapshot(cleanupRoutes.legacyCompany);
  const proSnapshot = readSnapshot(cleanupRoutes.pro);
  const mobileSnapshot = readSnapshot(cleanupRoutes.mobile);
  const sitemapOriginIsApex = origin === "https://careerreality.in";
  addCheck(
    "Local SEO origin is the apex domain",
    sitemapOriginIsApex,
    "https://careerreality.in",
    origin,
    "local",
  );
  const snapshotsWithWwwInternalLinks = routeRegistry.routes
    .filter((route) => route.render === "snapshot")
    .filter((route) => {
      const html = readSnapshot(route.path);
      return Boolean(html && /(?:href|src)=["']https?:\/\/www\.careerreality\.in/i.test(html));
    })
    .map((route) => route.path);
  addCheck(
    "Local snapshots contain no www internal links",
    snapshotsWithWwwInternalLinks.length === 0,
    "no absolute www.careerreality.in links",
    snapshotsWithWwwInternalLinks.length ? snapshotsWithWwwInternalLinks.slice(0, 5).join(", ") : "none",
    "local",
  );

  addCheck(
    "Local build search snapshot",
    Boolean(searchSnapshot) && metaContent(searchSnapshot ?? "", "robots") === "noindex, follow",
    "noindex, follow",
    searchSnapshot ? metaContent(searchSnapshot, "robots") || "(missing)" : "dist snapshot missing; run pnpm build",
    "local",
  );
  addCheck(
    "Local build archived article stays on editorial hold",
    Boolean(articleSnapshot) && metaContent(articleSnapshot, "robots") === "noindex, follow",
    "noindex, follow hold shell",
    articleSnapshot ? metaContent(articleSnapshot, "robots") || "(missing robots)" : "hold snapshot missing",
    "local",
  );
  const articleRedirects = routeRegistry.redirects.filter((entry) => entry.from.startsWith("/article/"));
  addCheck(
    "Legacy article registry contains no invalid mappings",
    articleRedirects.every((entry) => entry.status === 301 && isRegisteredGuidePath(entry.to)),
    "each registered legacy mapping is a single-hop 301 to an indexable guide",
    `${articleRedirects.length} mappings; ${articleRedirects.filter((entry) => entry.status !== 301 || !isRegisteredGuidePath(entry.to)).length} invalid`,
    "local",
  );
  const generatedArticleSnapshots = articleRedirects.filter((entry) => {
    const directory = normalizeRoute(entry.from).slice(1);
    return fs.existsSync(path.join(distRoot, directory, "index.html"));
  });
  addCheck(
    "Local build contains no legacy article snapshots",
    generatedArticleSnapshots.length === 0,
    "no legacy article snapshots",
    generatedArticleSnapshots.length ? generatedArticleSnapshots.map((entry) => entry.from).slice(0, 3).join(", ") : "absent",
    "local",
  );
  if (trustSnapshot) verifySharedRoute("Local build trust route", trustSnapshot, routes.trust, { kind: "local" });
  addCheck(
    "Local build archived candidate stays on editorial hold",
    Boolean(candidateSnapshot) && metaContent(candidateSnapshot, "robots") === "noindex, follow",
    "noindex, follow hold shell",
    candidateSnapshot ? metaContent(candidateSnapshot, "robots") || "(missing robots)" : "hold snapshot missing",
    "local",
  );
  addCheck(
    "Local build retired company route absent",
    !legacyCompanySnapshot,
    "no generated company snapshot",
    legacyCompanySnapshot ? "snapshot present" : "absent",
    "local",
  );
  const localSitemap = fs.existsSync(path.join(root, "public", "sitemap.xml"))
    ? fs.readFileSync(path.join(root, "public", "sitemap.xml"), "utf8")
    : "";
  const localSitemapLocations = [...localSitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
  const sitemapUsesApex = localSitemapLocations.every((location) => {
    try {
      return new URL(location).origin === "https://careerreality.in";
    } catch {
      return false;
    }
  });
  addCheck(
    "Local sitemap contains apex URLs only",
    sitemapUsesApex && localSitemapLocations.length > 0,
    "all <loc> entries use https://careerreality.in",
    sitemapUsesApex ? `${localSitemapLocations.length} apex URLs` : "non-apex or invalid URL present",
    "local",
  );
  addCheck("Local sitemap includes indexable trust route", localSitemapLocations.includes(expectedUrl(routes.trust)), expectedUrl(routes.trust), localSitemapLocations.includes(expectedUrl(routes.trust)) ? "present" : "absent", "local");
  const expectedSitemapCount = routeRegistry.routes.filter((entry) => entry.indexability === "indexable" && entry.sitemap).length;
  const sitemapHasLegacyArticle = localSitemapLocations.some((location) => new URL(location).pathname.startsWith("/article/"));
  addCheck("Local sitemap matches registered indexable snapshots", localSitemapLocations.length === expectedSitemapCount && !sitemapHasLegacyArticle, `${expectedSitemapCount} registered routes; no article URLs`, `${localSitemapLocations.length} URLs; legacy article ${sitemapHasLegacyArticle ? "present" : "absent"}`, "local");
  for (const [label, snapshot] of [["Pro", proSnapshot], ["Mobile app", mobileSnapshot]]) {
    addCheck(
      `Local build ${label} noindex`,
      Boolean(snapshot) && metaContent(snapshot, "robots") === "noindex, follow",
      "noindex, follow",
      snapshot ? metaContent(snapshot, "robots") || "(missing robots)" : "dist snapshot missing; run pnpm build",
      "local",
    );
  }
}

function verifyLiveContract() {
  const search = fetched.get(routes.search)?.body;
  const article = fetched.get(routes.article);
  const trust = fetched.get(routes.trust)?.body;
  const sitemap = fetched.get(routes.sitemap)?.body;
  const robots = fetched.get(routes.robots)?.body;
  const candidate = fetched.get(cleanupRoutes.candidate);
  const legacyCompany = fetched.get(cleanupRoutes.legacyCompany);
  const pro = fetched.get(cleanupRoutes.pro)?.body;
  const mobile = fetched.get(cleanupRoutes.mobile)?.body;

  if (search) {
    verifyPublishedTitle("Published search", search);
    verifySharedRoute("Published search", search, routes.search, { noIndex: true, requireBreadcrumbs: false });
  }
  verifyRetiredRouteStatus("Published retired article", article, "live", { holdOnly: true });
  if (trust) {
    verifyPublishedTitle("Published trust route", trust);
    verifySharedRoute("Published trust route", trust, routes.trust);
  }

  if (sitemap) {
    const locations = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
    const unexpectedOrigins = locations.filter((location) => {
      try {
        return new URL(location).origin !== origin;
      } catch {
        return true;
      }
    });
    addCheck("Published sitemap origin", unexpectedOrigins.length === 0, origin, unexpectedOrigins.length ? unexpectedOrigins.slice(0, 3).join(", ") : "all URLs use the custom origin");
    addCheck("Published sitemap excludes search", !locations.some((location) => new URL(location).pathname.replace(/\/+$/, "") === "/search"), "no /search/ URL", locations.find((location) => location.includes("/search")) ?? "absent");
    addCheck("Published sitemap excludes retired article", !locations.includes(expectedUrl(routes.article)), `no ${expectedUrl(routes.article)}`, locations.includes(expectedUrl(routes.article)) ? "present" : "absent");
    addCheck("Published sitemap includes indexable trust route", locations.includes(expectedUrl(routes.trust)), expectedUrl(routes.trust), locations.includes(expectedUrl(routes.trust)) ? "present" : "absent");
    const localSitemap = fs.existsSync(path.join(root, "public", "sitemap.xml"))
      ? fs.readFileSync(path.join(root, "public", "sitemap.xml"), "utf8")
      : "";
    const localLocations = [...localSitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
    const liveSet = new Set(locations);
    const localSet = new Set(localLocations);
    const missingFromPublished = localLocations.filter((location) => !liveSet.has(location));
    const unexpectedInPublished = locations.filter((location) => !localSet.has(location));
    addCheck(
      "Published sitemap matches local route set",
      missingFromPublished.length === 0 && unexpectedInPublished.length === 0,
      `${localLocations.length} canonical URLs matching the local build`,
      `${locations.length} live URLs; missing ${missingFromPublished.length}${missingFromPublished.length ? ` (${missingFromPublished.slice(0, 3).join(", ")})` : ""}; unexpected ${unexpectedInPublished.length}${unexpectedInPublished.length ? ` (${unexpectedInPublished.slice(0, 3).join(", ")})` : ""}`,
    );
    for (const route of [cleanupRoutes.pro, cleanupRoutes.mobile]) {
      addCheck(
        `Published sitemap excludes ${route}`,
        !locations.includes(expectedUrl(route)),
        `no ${expectedUrl(route)}`,
        locations.includes(expectedUrl(route)) ? "present" : "absent",
      );
    }
  }
  if (robots) {
    addCheck("Published robots sitemap", new RegExp(`^Sitemap:\\s*${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap\\.xml$`, "im").test(robots), `Sitemap: ${origin}/sitemap.xml`, robots.match(/^Sitemap:.*$/im)?.[0] ?? "(missing)");
    addCheck("Published robots has no legacy origin", !/replit\.app/i.test(robots), "no replit.app URL", /replit\.app/i.test(robots) ? "legacy origin present" : "absent");
  }
  verifyRetiredRouteStatus("Published retired candidate article", candidate, "live", { holdOnly: true });
  verifyRetiredRouteStatus("Published retired company route", legacyCompany);
  for (const [label, body, route] of [["Pro", pro, cleanupRoutes.pro], ["Mobile app", mobile, cleanupRoutes.mobile]]) {
    if (body) {
      verifyPublishedTitle(`Published ${label}`, body);
      verifySharedRoute(`Published ${label}`, body, route, { noIndex: true });
    }
  }
}

async function main() {
  console.log(`Published SEO smoke check for ${origin}`);
  console.log(`Routes: ${Object.values(routes).join(", ")}`);
  console.log(`Alternate origins: ${alternateOrigins.length ? alternateOrigins.join(", ") : "(none configured)"}`);
  console.log(`Known-good report: ${archivePath}`);
  console.log(`Sitemap performance report: ${performanceReportPath}`);
  console.log(`Sitemap release summary: ${releaseSummaryPath}`);
  const configurationWarning = sitemapAuditConfigurationWarning(process.env.SEO_SITEMAP_AUDIT_WARN_MS);
  if (configurationWarning) console.warn(configurationWarning);
  const configurationWarnings = [
    sitemapAuditConfigurationWarningEntry(process.env.SEO_SITEMAP_AUDIT_WARN_MS),
  ].filter(Boolean);

  verifySnapshotContract();
  await verifyWwwApexRedirects();
  await Promise.all([...Object.values(routes), ...Object.values(cleanupRoutes)].map(fetchRoute));
  verifyLiveContract();
  await verifyPublishedLegacyArticleHolds();
  await verifyPublishedUnsitemapToolsAndGuides();
  const sitemapAudit = await verifyPublishedSitemapTitles();
  const observations = {
    primary: Object.fromEntries(Object.values(routes).map((route) => [route, captureObservation(fetched.get(route), route)])),
    alternates: {},
    sitemapPages: Object.fromEntries([...sitemapPageObservations.entries()].sort(([left], [right]) => left.localeCompare(right))),
  };
  const alternateResults = await Promise.all(alternateOrigins.flatMap((alternateOrigin) =>
    Object.values(routes).map(async (route) => ({ alternateOrigin, route, result: await fetchAlternateRoute(alternateOrigin, route) })),
  ));
  for (const { alternateOrigin, route, result } of alternateResults) {
    observations.alternates[alternateOrigin] ??= {};
    observations.alternates[alternateOrigin][route] = captureObservation(result, route);
    verifyAlternateRoute(alternateOrigin, route, result);
  }

  const localFailures = checks.filter((check) => check.kind === "local" && !check.passed);
  const publishedFailures = checks.filter((check) => ["live", "alternate"].includes(check.kind) && !check.passed && check.status !== "skip");
  if (sitemapAudit) {
    try {
      const performanceSummary = recordSitemapAuditPerformance(sitemapAudit, {
        recoverInvalidHistory: localFailures.length === 0 && publishedFailures.length === 0,
      });
      console.log(formatSitemapAuditPerformanceHistory(performanceSummary));
      const performanceWarning = sitemapAuditPerformanceHistoryWarning(performanceSummary);
      if (performanceWarning) console.warn(performanceWarning);
    } catch (error) {
      console.warn(`WARNING: Sitemap performance history was not updated: ${error instanceof Error ? error.message : String(error)} SEO pass/fail is unchanged.`);
    }
  }
  for (const check of checks) {
    const status = check.status === "skip" ? "SKIP" : check.passed ? "PASS" : "FAIL";
    console.log(`${status} [${check.kind}] ${check.label} — expected ${check.expected}; observed ${check.observed}`);
  }

  if (publishedFailures.length && localFailures.length === 0) {
    console.error(`\nSTALE PUBLISHED BUILD: ${publishedFailures.length} published check(s) failed while the current local build contract passed.`);
  } else if (publishedFailures.length || localFailures.length) {
    console.error(`\nSEO RELEASE BLOCKED: ${localFailures.length} local build check(s) and ${publishedFailures.length} published check(s) failed.`);
  } else {
    console.log("\nPublished SEO smoke check passed.");
  }

  try {
    const releaseSummary = sitemapReleaseSummary({
      configurationWarnings,
      localFailureCount: localFailures.length,
      publishedFailureCount: publishedFailures.length,
    });
    writeSitemapReleaseSummary(releaseSummary);
    console.log(`Sitemap release summary written: ${releaseSummaryPath}`);
  } catch (error) {
    console.warn(`WARNING: Sitemap release summary was not updated: ${error instanceof Error ? error.message : String(error)} SEO pass/fail is unchanged.`);
  }

  archiveOrCompare(observations, publishedFailures, localFailures);
  if (publishedFailures.length || localFailures.length) process.exitCode = 1;
}

export {
  archiveCheckRecords,
  writeKnownGoodReport,
  fetchSitemapPage,
  formatSitemapAuditSummary,
  isTransientSitemapFailure,
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
  writeSitemapReleaseSummary,
  sitemapPageObservation,
  validateKnownGoodReport,
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.includes("--validate-archive-only")) {
    process.exitCode = validateArchiveOnly();
  } else {
    await main();
  }
}