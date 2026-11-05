import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const workspaceRoot = path.resolve(new URL("..", import.meta.url).pathname);
const validator = path.join(workspaceRoot, "scripts", "validate-dependency-lock.mjs");
const fixtureRoot = path.join(workspaceRoot, "scripts", "fixtures", "dependency-lock");

function runValidator(root) {
  try {
    return {
      status: 0,
      output: execFileSync(process.execPath, [validator, "--root", root], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    };
  } catch (error) {
    return {
      status: error.status ?? 1,
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
    };
  }
}

const validResult = runValidator(fixtureRoot);
assert.equal(validResult.status, 0, `Expected the fixture lockfile to pass:\n${validResult.output}`);
assert.match(validResult.output, /Dependency lock validated/);

const staleRoot = fs.mkdtempSync(path.join(os.tmpdir(), "careerreality-dependency-lock-"));
try {
  for (const fileName of ["pnpm-workspace.yaml", "pnpm-lock.yaml"]) {
    fs.copyFileSync(path.join(fixtureRoot, fileName), path.join(staleRoot, fileName));
  }

  const staleLockfilePath = path.join(staleRoot, "pnpm-lock.yaml");
  // A package with peers has no bare snapshot key, only peer-qualified keys.
  const peerLockfile = fs.readFileSync(staleLockfilePath, "utf8").replace(
    "snapshots:\n  brace-expansion@5.0.12: {}",
    "snapshots:\n  brace-expansion@5.0.12(peer@1.0.0): {}",
  );
  fs.writeFileSync(staleLockfilePath, peerLockfile);
  const peerResult = runValidator(staleRoot);
  assert.equal(peerResult.status, 0, `Expected peer-qualified snapshots to pass:\n${peerResult.output}`);

  const staleLockfile = fs.readFileSync(staleLockfilePath, "utf8").replaceAll(
    "  fast-uri@3.1.9: {}",
    "  fast-uri@3.1.8: {}\n  fast-uri@3.1.9: {}",
  );
  fs.writeFileSync(staleLockfilePath, staleLockfile);

  const staleResult = runValidator(staleRoot);
  assert.equal(staleResult.status, 1, `Expected the stale fixture to fail:\n${staleResult.output}`);
  assert.match(staleResult.output, /package fast-uri: stale resolved version 3\.1\.8; expected 3\.1\.9/);

  fs.writeFileSync(staleLockfilePath, peerLockfile.replace(
    "brace-expansion@5.0.12(peer@1.0.0)",
    "brace-expansion@5.0.11(peer@1.0.0)",
  ));
  const stalePeerResult = runValidator(staleRoot);
  assert.equal(stalePeerResult.status, 1, `Expected stale peer-qualified snapshots to fail:\n${stalePeerResult.output}`);
  assert.match(stalePeerResult.output, /package brace-expansion: stale resolved version 5\.0\.11; expected 5\.0\.12/);
} finally {
  fs.rmSync(staleRoot, { recursive: true, force: true });
}

console.log("Dependency lock validator fixture checks passed: clean and stale lockfiles behave as expected.");