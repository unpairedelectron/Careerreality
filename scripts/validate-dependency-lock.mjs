import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootArgumentIndex = process.argv.indexOf("--root");
const workspaceRoot = rootArgumentIndex === -1
  ? process.cwd()
  : path.resolve(process.argv[rootArgumentIndex + 1] ?? process.cwd());

const workspaceFile = path.join(workspaceRoot, "pnpm-workspace.yaml");
const lockfile = path.join(workspaceRoot, "pnpm-lock.yaml");

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required dependency file: ${path.relative(workspaceRoot, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
    || (trimmed.startsWith("\"") && trimmed.endsWith("\""))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseMapBlock(source, heading, nextHeading) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${heading}:`);
  if (start === -1) return new Map();

  const values = new Map();
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (nextHeading && line.trim() === `${nextHeading}:`) break;
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!line.startsWith("  ")) break;

    const match = line.match(/^  (.+?):\s*(.+)$/);
    if (!match) continue;
    values.set(unquote(match[1]), unquote(match[2]));
  }
  return values;
}

function parseTopLevelKeys(source, heading, nextHeading) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${heading}:`);
  if (start === -1) return new Set();

  const keys = new Set();
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (nextHeading && line.trim() === `${nextHeading}:`) break;
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = line.match(/^  (.+?):(?:\s*\{\})?\s*$/);
    if (match) keys.add(unquote(match[1]));
  }
  return keys;
}

function versionsForPackage(keys, packageName) {
  const prefix = `${packageName}@`;
  return [...keys]
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length).split("(")[0]);
}

const workspaceSource = readRequired(workspaceFile);
const lockSource = readRequired(lockfile);
const workspaceOverrides = parseMapBlock(workspaceSource, "overrides");
const lockOverrides = parseMapBlock(lockSource, "overrides", "importers");
const packageKeys = parseTopLevelKeys(lockSource, "packages", "snapshots");
const snapshotKeys = parseTopLevelKeys(lockSource, "snapshots");
const errors = [];

for (const [name, expected] of workspaceOverrides) {
  const actual = lockOverrides.get(name);
  if (actual !== expected) {
    errors.push(`override ${name}: workspace requires ${expected}, lockfile has ${actual ?? "<missing>"}`);
  }
}

for (const [name, actual] of lockOverrides) {
  if (!workspaceOverrides.has(name)) {
    errors.push(`override ${name}: lockfile entry ${actual} is not present in pnpm-workspace.yaml`);
  }
}

const exactPinnedOverrides = [...workspaceOverrides].filter(([, value]) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value));
for (const [name, expected] of exactPinnedOverrides) {
  const packageKey = `${name}@${expected}`;
  if (!packageKeys.has(packageKey) || !snapshotKeys.has(packageKey)) {
    errors.push(`package ${name}: expected resolved version ${expected} in both lockfile packages and snapshots`);
  }

  const resolvedVersions = new Set([
    ...versionsForPackage(packageKeys, name),
    ...versionsForPackage(snapshotKeys, name),
  ]);
  for (const version of resolvedVersions) {
    if (version !== expected) {
      errors.push(`package ${name}: stale resolved version ${version}; expected ${expected}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Dependency lock validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const pinnedNames = exactPinnedOverrides.map(([name]) => name).join(", ");
console.log(`Dependency lock validated: workspace overrides match pnpm-lock.yaml; pinned packages are ${pinnedNames}.`);