import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultLcpBudgetMs, evaluateAudits, observationWindowMs, range, runCount } from "./homepage-lighthouse-results.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previewPort = Number(process.env.LIGHTHOUSE_PREVIEW_PORT ?? 4175);
const baseUrl = `http://127.0.0.1:${previewPort}/`;
const lcpBudgetMs = Number(process.env.HOMEPAGE_LCP_BUDGET_MS ?? defaultLcpBudgetMs);
const chromePath = process.env.CHROME_PATH ?? "/repl/tools/bin/chromium";
// Never audit a fixture-auth build or inherit the managed preview's path prefix.
const productionEnv = {
  ...process.env,
  NODE_ENV: "production",
  BASE_PATH: "/",
  PORT: String(previewPort),
  VITE_E2E: "false",
  VITE_E2E_AUTH_RUNTIME: "false",
  VITE_E2E_AUTH_CACHE_PROBE: "false",
};

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
  `--pause-after-load-ms=${observationWindowMs}`,
  "--save-assets",
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
  // Readiness can be polling when an occupied port makes the server exit.
  void completion.catch(() => undefined);
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
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2_000) });
      const html = await response.text();
      if (response.ok && html.includes("snapshot-home")) {
        // Give an already-bound port failure time to surface before auditing.
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (preview.child.exitCode !== null) await preview.completion;
        return;
      }
      lastError = new Error(`Preview returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Production preview did not become ready: ${lastError ?? "timeout"}`);
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
  return {
    report: JSON.parse(await readFile(outputPath, "utf8")),
    devtoolsLog: JSON.parse(await readFile(outputPath.replace(/\.json$/, "-0.devtoolslog.json"), "utf8")),
  };
}

if (!Number.isInteger(previewPort) || previewPort < 1 || previewPort > 65535) {
  throw new Error("LIGHTHOUSE_PREVIEW_PORT must be a valid TCP port.");
}
if (!Number.isFinite(lcpBudgetMs) || lcpBudgetMs <= 0) {
  throw new Error("HOMEPAGE_LCP_BUDGET_MS must be a positive number.");
}

const reportsRoot = path.resolve(packageRoot, "../../generated-artifacts/homepage-lighthouse");
await mkdir(reportsRoot, { recursive: true });
const outputDir = await mkdtemp(path.join(reportsRoot, "run-"));
console.log("Building production homepage with real auth runtime (no E2E fixtures)...");
const build = await spawnLogged("pnpm", ["run", "build"], { env: productionEnv }).completion;
console.log(build.stdout);
const preview = spawnLogged(process.execPath, ["scripts/serve-published.mjs"], { env: productionEnv });

try {
  await waitForPreview(preview);
  const runs = [];
  for (let index = 0; index < runCount; index += 1) {
    runs.push(await runAudit(index, outputDir));
    console.log(`Completed mobile Lighthouse run ${index + 1}/${runCount}.`);
  }

  const result = evaluateAudits(runs, lcpBudgetMs);
  const { scores, lcp, fcp, cls, medianLcpMs, failures } = result;
  await writeFile(path.join(outputDir, "summary.json"), JSON.stringify({
    ...result,
    homepage: baseUrl,
    lighthouseVersion: runs[0].report.lighthouseVersion,
    profile: lighthouseOptions,
    runs: runCount,
  }, null, 2));

  console.log(`Homepage: ${baseUrl}`);
  console.log(`Profile: mobile 412×823, DPR 1.75; simulated 150 ms RTT, 1,638.4 Kbps, 4× CPU slowdown.`);
  console.log(`Lighthouse: ${runs[0].report.lighthouseVersion}; runs: ${runCount}; post-load observation: ${observationWindowMs} ms`);
  console.log(`Performance score range: ${range(scores, 1, 0)} / 100`);
  console.log(`LCP range: ${range(lcp, 1_000)} s; median: ${(medianLcpMs / 1_000).toFixed(2)} s; budget: ${(lcpBudgetMs / 1_000).toFixed(2)} s`);
  console.log(`FCP range: ${range(fcp, 1_000)} s`);
  console.log(`CLS range: ${range(cls, 1, 3)}`);

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
  console.log(`Audit reports, traces, network logs and summary: ${outputDir}`);
}
