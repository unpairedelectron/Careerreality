import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiTestFiles = [
  "../artifacts/api-server/tests/public-evidence.test.ts",
  "../artifacts/api-server/tests/company-data-publication.test.ts",
  "../artifacts/api-server/tests/seed-public-data.test.ts",
  "../artifacts/api-server/tests/resume-intelligence.test.ts",
];
const steps = [
  ["Workspace typecheck", ["run", "typecheck"]],
  ["API provenance and no-data regression tests", ["--filter", "@workspace/scripts", "exec", "tsx", "--test", ...apiTestFiles]],
  ["Public-data provenance audit", ["--filter", "@workspace/api-server", "run", "audit:public-data-provenance"]],
  ["Tax regression tests", ["--filter", "@workspace/career-reality", "run", "test:ctc-tax"]],
  ["Content audit tests", ["--filter", "@workspace/career-reality", "run", "test:content-audit"]],
  ["Contrast audit", ["--filter", "@workspace/career-reality", "run", "verify:aa-contrast"]],
  ["Published SEO report unit tests", ["--filter", "@workspace/career-reality", "run", "test:published-seo-report"]],
  ["Indexed route tests", ["--filter", "@workspace/career-reality", "run", "test:indexed-routes"]],
  ["API production build", ["--filter", "@workspace/api-server", "run", "build"]],
  ["CareerReality production build and snapshots", ["--filter", "@workspace/career-reality", "run", "build"], { PORT: "5173", BASE_PATH: "/" }],
  ["Guide date regression test", ["--filter", "@workspace/career-reality", "run", "test:pillar-guide-metadata"]],
  ["Editorial metadata audit", ["--filter", "@workspace/career-reality", "run", "audit:editorial-metadata"]],
  ["Focused privacy and accessibility browser tests", ["--filter", "@workspace/career-reality", "exec", "playwright", "test", "tests/tool-analytics.spec.ts", "tests/analytics-privacy.spec.ts", "tests/remediation-accessibility-smoke.spec.ts"]],
];

const results = [];
for (const [name, args, env = {}] of steps) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync("pnpm", args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  const passed = result.status === 0;
  results.push({ name, status: passed ? "PASS" : "FAIL", exitCode: result.status ?? 1 });
  if (result.error) console.error(result.error);
}

console.log("\n=== Local verification summary ===");
for (const result of results) console.log(`${result.status} ${result.name}${result.status === "FAIL" ? ` (exit ${result.exitCode})` : ""}`);
console.log("SKIPPED Lint: no lint command is configured in the workspace.");
console.log("EXTERNAL Published SEO, Search Console, field Core Web Vitals, analytics, and revenue checks are not part of this local command.");
const failures = results.filter((result) => result.status === "FAIL").length;
console.log(`${results.length - failures} passed; ${failures} failed; 1 local check skipped.`);
if (failures) process.exitCode = 1;
