import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const verifierPath = path.join(root, "scripts", "verify-published-seo.mjs");
const MAX_STABILITY_RUNS = 2;

function parseStabilityRuns(args = process.argv.slice(2)) {
  const runArguments = args.filter((argument) => argument.startsWith("--runs="));
  const unknownArguments = args.filter((argument) => !argument.startsWith("--runs="));
  if (unknownArguments.length || runArguments.length > 1) {
    throw new Error("Usage: verify-published-seo-stability.mjs [--runs=1|2]");
  }

  const runs = runArguments.length ? Number(runArguments[0].slice("--runs=".length)) : 1;
  if (!Number.isInteger(runs) || runs < 1 || runs > MAX_STABILITY_RUNS) {
    throw new Error(`Stability runs must be an integer from 1 to ${MAX_STABILITY_RUNS}; use --runs=2 for the two-pass report comparison.`);
  }
  return runs;
}

function formatRequestBudget(runs) {
  return `Request budget: ${runs} published verifier pass${runs === 1 ? "" : "es"}; up to ${runs} full sets of primary, alternate-origin, and sitemap checks. Sitemap page requests remain in batches of 8, with up to 2 attempts per page.`;
}

function normalizeKnownGoodReport(report) {
  const normalized = JSON.parse(JSON.stringify(report));
  delete normalized.generatedAt;
  return normalized;
}

function reportPathForKey(parentPath, key) {
  return /^[A-Za-z_$][\w$]*$/.test(String(key))
    ? `${parentPath}.${key}`
    : `${parentPath}[${JSON.stringify(String(key))}]`;
}

function findReportDifference(before, after, currentPath = "$") {
  if (Object.is(before, after)) return null;

  const beforeIsObject = before !== null && typeof before === "object";
  const afterIsObject = after !== null && typeof after === "object";
  if (beforeIsObject && afterIsObject) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .sort((left, right) => left.localeCompare(right));
    for (const key of keys) {
      const difference = findReportDifference(
        before[key],
        after[key],
        reportPathForKey(currentPath, key),
      );
      if (difference) return difference;
    }
    return null;
  }

  if (JSON.stringify(before) === JSON.stringify(after)) return null;
  return { path: currentPath, before, after };
}

function safeDifferenceValue(value) {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return "undefined";
  if (
    /<(?:!doctype|html|head|body|script|meta)\b/i.test(serialized)
    || /(?:-----BEGIN|api[_-]?key|authorization|cookie|password|secret)/i.test(serialized)
  ) {
    return "[redacted unsafe content]";
  }
  if (serialized.length > 240) return `${serialized.slice(0, 237)}...`;
  return serialized;
}

function formatReportDifference(difference) {
  return `Normalized published SEO reports differ at ${difference.path}: first ${safeDifferenceValue(difference.before)}; second ${safeDifferenceValue(difference.after)}. Only generatedAt may vary between identical runs.`;
}

function runVerifier(archivePath) {
  const result = spawnSync(
    process.execPath,
    [verifierPath, `--archive=${archivePath}`],
    {
      cwd: root,
      env: process.env,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`Published SEO verifier failed with exit status ${result.status ?? "unknown"}.`);
  }
}

function main(args = process.argv.slice(2)) {
  const runs = parseStabilityRuns(args);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "published-seo-stability-"));
  const archives = Array.from({ length: runs }, (_, index) => path.join(tempDir, `run-${index + 1}.json`));

  try {
    console.log(formatRequestBudget(runs));
    archives.forEach((archivePath) => runVerifier(archivePath));

    const firstReport = JSON.parse(fs.readFileSync(archives[0], "utf8"));
    if (runs === 1) {
      console.log("Published SEO single-pass check passed. Report stability comparison was skipped; run `pnpm --filter @workspace/career-reality run verify:published-seo:stability:repeat` to compare two live reports.");
      return;
    }

    const secondReport = JSON.parse(fs.readFileSync(archives[1], "utf8"));
    const firstNormalized = normalizeKnownGoodReport(firstReport);
    const secondNormalized = normalizeKnownGoodReport(secondReport);
    const difference = findReportDifference(firstNormalized, secondNormalized);
    if (difference) {
      throw new Error(formatReportDifference(difference));
    }
    console.log("Published SEO report stability check passed: repeated runs differ only in generatedAt.");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export {
  findReportDifference,
  formatRequestBudget,
  formatReportDifference,
  normalizeKnownGoodReport,
  parseStabilityRuns,
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(`Published SEO report stability check failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}