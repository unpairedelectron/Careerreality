import assert from "node:assert/strict";
import test from "node:test";
import {
  applicationReadiness,
  applicationScoreWeights,
  calculateApplicationScore,
  effectiveReadinessStatus,
  type ApplicationScorecard,
} from "../src/data/application-readiness";

const allDimensions = (value: number): ApplicationScorecard => ({
  productClarity: value,
  accuracy: value,
  provenance: value,
  methodology: value,
  userValue: value,
  ux: value,
  accessibility: value,
  mobile: value,
  performance: value,
  errorResilience: value,
  privacySecurity: value,
  contentTrust: value,
});

test("application score weights total 100 and all-constant scorecards retain their value", () => {
  assert.equal(Object.values(applicationScoreWeights).reduce((sum, weight) => sum + weight, 0), 100);
  assert.equal(calculateApplicationScore(allDimensions(0)), 0);
  assert.equal(calculateApplicationScore(allDimensions(100)), 100);
  assert.equal(calculateApplicationScore(allDimensions(73)), 73);
});

test("application scores use the weighted dimension contributions", () => {
  const scorecard = { ...allDimensions(0), accuracy: 100, provenance: 100 };
  assert.equal(
    calculateApplicationScore(scorecard),
    applicationScoreWeights.accuracy + applicationScoreWeights.provenance,
  );
});

test("invalid scorecard values fail explicitly", () => {
  for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, -1, 101]) {
    assert.throws(() => calculateApplicationScore({ ...allDimensions(50), methodology: invalid }));
  }
});

test("hard blockers override a ready recommendation", () => {
  assert.equal(
    effectiveReadinessStatus({ status: "READY", hardBlockers: ["Review pending"], scorecard: allDimensions(100) }),
    "NOT READY",
  );
  assert.equal(
    effectiveReadinessStatus({ status: "READY WITH WARNINGS", hardBlockers: ["Review pending"], scorecard: allDimensions(100) }),
    "NOT READY",
  );
  assert.equal(
    effectiveReadinessStatus({ status: "BLOCKED BY HUMAN INPUT", hardBlockers: ["Review pending"], scorecard: allDimensions(100) }),
    "BLOCKED BY HUMAN INPUT",
  );
  assert.equal(effectiveReadinessStatus({ status: "READY", hardBlockers: [], scorecard: allDimensions(100) }), "READY");
  assert.equal(
    effectiveReadinessStatus({ status: "READY WITH WARNINGS", hardBlockers: [], scorecard: allDimensions(89) }),
    "NOT READY",
  );
  assert.equal(
    effectiveReadinessStatus({ status: "NOT READY", hardBlockers: [], scorecard: allDimensions(100) }),
    "NOT READY",
  );
});

test("readiness register has unique routes, explicit checks, and no empty scorecards", () => {
  const ids = applicationReadiness.map((entry) => entry.id);
  const routes = applicationReadiness.map((entry) => entry.route);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(routes).size, routes.length);
  assert.ok(ids.length >= 10);
  for (const entry of applicationReadiness) {
    assert.ok(entry.checks.length >= 5, `${entry.id} needs category-level checks`);
    assert.ok(entry.tests.length >= 1, `${entry.id} needs a test record`);
    assert.ok(Number.isFinite(calculateApplicationScore(entry.scorecard)));
    const effectiveStatus = effectiveReadinessStatus(entry);
    if (effectiveStatus.startsWith("READY")) {
      assert.ok(calculateApplicationScore(entry.scorecard) >= 90, `${entry.id} must meet the release score target`);
      assert.deepEqual(entry.hardBlockers, [], `${entry.id} cannot be ready with a hard blocker`);
    }
  }
});
