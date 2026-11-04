import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previewPort = Number(process.env.LIGHTHOUSE_PREVIEW_PORT ?? 4175);
const baseUrl = `http://127.0.0.1:${previewPort}/`;
const runCount = 3;
const lcpBudgetMs = Number(process.env.HOMEPAGE_LCP_BUDGET_MS ?? 2_000);
const chromePath = process.env.CHROME_PATH ?? "/repl/tools/bin/chromium";

const lighthouseOptions = [
  "--quiet",
  "--only-categories=performance",
  "--form-factor=mobile",
  "--screenEmulation.mobile",
  "--screenEmulation.width=412",
  "--screenEmulation.height=823",
  "--screenEmulation.deviceScaleFactor=1.75",
  "--throttling-method=simulate",
  "--throttling.rttMs=150",
  "--throttling.throughputKbps=1638.4",
  "--throttling.cpuSlowdownMultiplier=4",
  "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
];

function spawnLogged(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: packageRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
  const completion = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited ${code ?? signal}: ${stderr || stdout}`));
    });
  });
  return { child, completion };
}

async function waitForPreview(preview) {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    if (preview.child.exitCode !== null) {
      await preview.completion;
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
      lastError = new Error(`Preview returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Production preview did not become ready: ${lastError ?? "timeout"}`);
}

function metricValue(report, id) {
  const value = report.audits[id]?.numericValue;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Lighthouse report is missing a numeric ${id} value.`);
  }
  return value;
}

function range(values, divisor = 1, digits = 2) {
  const sorted = [...values].sort((a, b) => a - b);
  return `${(sorted[0] / divisor).toFixed(digits)}–${(sorted.at(-1) / divisor).toFixed(digits)}`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function runAudit(index, outputDir) {
  const outputPath = path.join(outputDir, `lighthouse-${index + 1}.json`);
  const args = [
    "exec",
    "lighthouse",
    baseUrl,
    ...lighthouseOptions,
    "--output=json",
    `--output-path=${outputPath}`,
  ];
  await spawnLogged("pnpm", args, {
    env: { ...process.env, CHROME_PATH: chromePath },
  }).completion;
  return JSON.parse(await readFile(outputPath, "utf8"));
}

if (!Number.isInteger(previewPort) || previewPort < 1 || previewPort > 65535) {
  throw new Error("LIGHTHOUSE_PREVIEW_PORT must be a valid TCP port.");
}
if (!Number.isFinite(lcpBudgetMs) || lcpBudgetMs <= 0) {
  throw new Error("HOMEPAGE_LCP_BUDGET_MS must be a positive number.");
}

const tempDir = await mkdtemp(path.join(os.tmpdir(), "careerreality-homepage-lighthouse-"));
const preview = spawnLogged("pnpm", [
  "exec",
  "vite",
  "preview",
  "--config",
  "vite.config.ts",
  "--host",
  "127.0.0.1",
  "--port",
  String(previewPort),
  "--strictPort",
]);

try {
  await waitForPreview(preview);
  const reports = [];
  for (let index = 0; index < runCount; index += 1) {
    reports.push(await runAudit(index, tempDir));
    console.log(`Completed mobile Lighthouse run ${index + 1}/${runCount}.`);
  }

  const lcp = reports.map((report) => metricValue(report, "largest-contentful-paint"));
  const fcp = reports.map((report) => metricValue(report, "first-contentful-paint"));
  const cls = reports.map((report) => metricValue(report, "cumulative-layout-shift"));
  const scores = reports.map((report) => {
    const score = report.categories?.performance?.score;
    if (typeof score !== "number") throw new Error("Lighthouse report is missing its performance score.");
    return score * 100;
  });
  const clerkUrls = reports.flatMap((report) => {
    const requests = report.audits["network-requests"]?.details?.items;
    if (!Array.isArray(requests)) throw new Error("Lighthouse report is missing network-request details.");
    return requests
      .map((request) => request.url)
      .filter((url) => typeof url === "string" && /clerk/i.test(url));
  });

  console.log(`Homepage: ${baseUrl}`);
  console.log(`Profile: mobile 412×823, DPR 1.75; simulated 150 ms RTT, 1,638.4 Kbps, 4× CPU slowdown.`);
  console.log(`Lighthouse: ${reports[0].lighthouseVersion}; runs: ${runCount}`);
  console.log(`Performance score range: ${range(scores, 1, 0)} / 100`);
  console.log(`LCP range: ${range(lcp, 1_000)} s; median: ${(median(lcp) / 1_000).toFixed(2)} s; budget: ${(lcpBudgetMs / 1_000).toFixed(2)} s`);
  console.log(`FCP range: ${range(fcp, 1_000)} s`);
  console.log(`CLS range: ${range(cls, 1, 3)}`);

  const failures = [];
  if (median(lcp) > lcpBudgetMs) {
    failures.push(`median LCP ${(median(lcp) / 1_000).toFixed(2)} s exceeded the ${(lcpBudgetMs / 1_000).toFixed(2)} s budget`);
  }
  if (clerkUrls.length > 0) {
    failures.push(`Lighthouse observed ${clerkUrls.length} Clerk request(s): ${[...new Set(clerkUrls)].join(", ")}`);
  }
  if (failures.length > 0) {
    console.error(`FAIL: ${failures.join("; ")}`);
    process.exitCode = 1;
  } else {
    console.log("PASS: median LCP is within budget and no Clerk requests were observed.");
  }
} finally {
  preview.child.kill("SIGTERM");
  await Promise.race([
    preview.completion.catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  await rm(tempDir, { recursive: true, force: true });
}
