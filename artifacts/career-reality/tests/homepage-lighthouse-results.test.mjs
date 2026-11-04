import assert from "node:assert/strict";
import test from "node:test";
import { defaultClsBudget, evaluateAudits, range } from "../scripts/homepage-lighthouse-results.mjs";

function run(lcp = 1000, url = "http://127.0.0.1/assets/home.js", cls = 0.001) {
  return {
    report: {
      categories: { performance: { score: 0.97 } },
      audits: {
        "largest-contentful-paint": { numericValue: lcp },
        "first-contentful-paint": { numericValue: 900 },
        "cumulative-layout-shift": { numericValue: cls },
      },
    },
    devtoolsLog: [{ method: "Network.requestWillBeSent", params: { request: { url } } }],
  };
}

test("uses median rather than a single slow run and reports ranges", () => {
  const result = evaluateAudits([run(1100), run(900), run(4000)]);
  assert.equal(result.medianLcpMs, 1100);
  assert.deepEqual(result.failures, []);
  assert.equal(range(result.lcp, 1000), "0.90–4.00");
  assert.equal(range(result.scores, 1, 0), "97–97");
  assert.equal(range(result.fcp, 1000), "0.90–0.90");
  assert.equal(range(result.cls, 1, 3), "0.001–0.001");
});

test("fails above the budget, accepts its exact boundary, and supports explicit budgets", () => {
  assert.match(evaluateAudits([run(2001), run(2200), run(1000)]).failures[0], /exceeded.*2.00 s budget/);
  assert.deepEqual(evaluateAudits([run(2000), run(2000), run(2000)]).failures, []);
  assert.equal(evaluateAudits([run(), run(), run()], 999).failures.length, 1);
});

test("fails when any CLS run exceeds the budget and accepts its exact boundary", () => {
  assert.equal(defaultClsBudget, 0.1);
  const passing = evaluateAudits([run(), run(), run()], 2000, 0.1);
  assert.equal(passing.maxCls, 0.001);
  assert.deepEqual(passing.failures, []);

  const failing = evaluateAudits([run(), run(), run(1000, undefined, 0.101)], 2000, 0.1);
  assert.equal(failing.maxCls, 0.101);
  assert.match(failing.failures[0], /CLS 0\.101 exceeded.*in at least one run/);
  const boundary = evaluateAudits([run(1000), run(1000), run(1000, undefined, 0.1)], 2000, 0.1);
  assert.deepEqual(boundary.failures, []);
});

test("any Clerk attempt fails, including a failed request without a completed-resource entry", () => {
  for (const url of [
    "https://example.clerk.accounts.dev/v1/client",
    "https://cdn.example.com/npm/@clerk/clerk-js/index.js",
    "http://127.0.0.1/assets/clerk-runtime-abcd.js",
  ]) {
    const result = evaluateAudits([run(), run(1000, url), run()]);
    assert.match(result.failures[0], /Clerk request/);
    assert.deepEqual(result.clerkUrls, [url]);
  }
});

test("does not hide simultaneous timing and auth failures", () => {
  assert.equal(evaluateAudits([run(3000, "https://clerk.example.com"), run(3000), run(3000)]).failures.length, 2);
});

test("fails closed on incomplete or invalid audit data", () => {
  assert.throws(() => evaluateAudits([run(), run()]), /three/);
  for (const budget of [NaN, 0, -1, Infinity]) {
    assert.throws(() => evaluateAudits([run(), run(), run()], budget), /budget/);
  }
  for (const budget of [NaN, -0.01, Infinity]) {
    assert.throws(() => evaluateAudits([run(), run(), run()], 2000, budget), /CLS budget/);
  }
  for (const mutate of [
    (r) => { r.report.audits["largest-contentful-paint"].numericValue = NaN; },
    (r) => { r.report.categories.performance.score = null; },
    (r) => { r.devtoolsLog = []; },
    (r) => { r.report.runtimeError = { message: "navigation failed" }; },
  ]) {
    const invalid = run();
    mutate(invalid);
    assert.throws(() => evaluateAudits([run(), invalid, run()]));
  }
});
