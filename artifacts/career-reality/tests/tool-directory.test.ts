import assert from "node:assert/strict";
import test from "node:test";
import { applicationReadiness, calculateApplicationScore, effectiveReadinessStatus } from "../src/data/application-readiness";
import { toolRoutes } from "../src/data/public-routes";
import { toolDirectoryCategories, toolDirectoryItems } from "../src/data/tool-directory";

test("the prioritized directory covers each registered tool route exactly once", () => {
  const registeredPaths = toolRoutes.map((route) => route.path).sort();
  const directoryPaths = toolDirectoryItems.map((item) => item.route.path).sort();
  const priorities = toolDirectoryItems.map((item) => item.priority);

  assert.equal(toolDirectoryItems.length, 15);
  assert.deepEqual(directoryPaths, registeredPaths);
  assert.equal(new Set(directoryPaths).size, directoryPaths.length);
  assert.deepEqual(priorities, Array.from({ length: 15 }, (_, index) => index + 1));
  assert.ok(toolDirectoryCategories.every((category) => toolDirectoryItems.some((item) => item.category === category.id)));
});

test("all eight unmatched routes have technical evidence notes without invented scorecards", () => {
  const unassessed = toolDirectoryItems.filter((item) => !applicationReadiness.some((entry) => entry.route === item.route.path));
  const expectedUnassessedIds = [
    "offer-comparison",
    "tax-regime-comparison",
    "job-posting-reality-check",
    "layoff-runway",
    "final-pay-estimator",
    "gratuity-estimator",
    "resign-or-stay",
    "home-loan-stress-test",
  ];

  assert.deepEqual(unassessed.map((item) => item.toolId).sort(), expectedUnassessedIds.sort());
  for (const item of unassessed) {
    assert.ok(item.technicalReview?.evidence, item.toolId);
    assert.ok(item.technicalReview?.remainingGate, item.toolId);
  }

  for (const toolId of ["offer-comparison", "layoff-runway", "resign-or-stay"]) {
    const item = toolDirectoryItems.find((candidate) => candidate.toolId === toolId);
    assert.ok(item);
    assert.ok(item.legacyAssessment?.note);
  }
});

test("route-matched readiness assessments retain their recorded status and score", () => {
  const ctcTool = toolDirectoryItems.find((item) => item.toolId === "ctc-calculator");
  assert.ok(ctcTool);
  const assessment = applicationReadiness.find((entry) => entry.route === ctcTool.route.path);
  assert.ok(assessment);
  assert.equal(effectiveReadinessStatus(assessment), "BLOCKED BY HUMAN INPUT");
  assert.equal(typeof calculateApplicationScore(assessment.scorecard), "number");
});
