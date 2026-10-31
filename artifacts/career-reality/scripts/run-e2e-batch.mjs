import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const offset = args[0] === "--" ? 1 : 0;
const batchNumber = args[offset];
const extraArgs = args.slice(offset + 1);
const batch = Number(batchNumber);
const totalBatches = 4;

if (
  extraArgs.length > 0
  || !Number.isInteger(batch)
  || batch < 1
  || batch > totalBatches
) {
  console.error(`Usage: pnpm run test:e2e:batch -- <1-${totalBatches}>`);
  process.exit(2);
}

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    `--shard=${batch}/${totalBatches}`,
    "--workers=2",
    "--reporter=line",
  ],
  { stdio: "inherit", env: process.env },
);

if (result.error) {
  console.error(`Could not start Playwright batch ${batch}/${totalBatches}:`, result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
