import assert from "node:assert/strict";
import test from "node:test";
import {
  compareCtcAmounts,
  calculateEscapePlanHours,
  calculateSalaryDrop,
  createAiTaskReadout,
  createCareerRealityIndexReflection,
  createCompassDecisionReadouts,
  createResignationPlan,
  getEscapePlanTasks,
} from "../src/lib/application-models";

test("Compass compares annual CTC directly without implying take-home pay", () => {
  const result = compareCtcAmounts("2200000", "2800000");

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.currentCtc, 2_200_000);
  assert.equal(result.offerCtc, 2_800_000);
  assert.equal(result.annualDifference, 600_000);
});

test("Compass withholds CTC comparison for invalid input", () => {
  for (const value of ["", "unknown", "-1", "100000001"]) {
    assert.equal(compareCtcAmounts(value, "2800000").ok, false);
    assert.equal(compareCtcAmounts("2200000", value).ok, false);
  }
});

test("Compass readouts stay separate and never invent a score or recommendation", () => {
  const readouts = createCompassDecisionReadouts({
    role: "Software engineer",
    city: "Bengaluru",
    currentCtc: "2200000",
    offerCtc: "2800000",
    noticePeriodDays: 48,
    salaryEvidence: "No current benchmark",
    companyEvidence: "No verified company assessment",
    layoffEvidence: "No matched report",
  });

  assert.match(readouts.offer.signals[2].value, /₹6\.00L annual CTC/);
  assert.match(readouts.offer.read, /not an accept-or-reject recommendation/i);
  assert.match(readouts.move.signals[1].value, /No verified company assessment/);
  assert.match(readouts.stay.read, /cannot forecast/i);
  assert.ok(!JSON.stringify(readouts).match(/(?:score|probability|risk band)\s*[:=]\s*\d+/i));
});

test("Compass readouts do not substitute zero when either CTC is invalid", () => {
  const readouts = createCompassDecisionReadouts({
    role: "Software engineer",
    city: "Bengaluru",
    currentCtc: "",
    offerCtc: "2800000",
    noticePeriodDays: 48,
    salaryEvidence: "Unavailable",
    companyEvidence: "Unavailable",
    layoffEvidence: "Unavailable",
  });

  assert.equal(readouts.offer.signals[0].value, "Not entered");
  assert.match(readouts.offer.signals[2].value, /Unavailable until both CTC inputs are valid/);
});

test("Career Reality Check routes lower-satisfaction answers to relevant evidence checks", () => {
  const reflection = createCareerRealityIndexReflection({
    pay: "Satisfied",
    stability: "Not satisfied",
    optionality: "Somewhat satisfied",
    ai: "Neutral",
  });

  assert.match(reflection.verdict, /Company confidence, Ability to move/);
  assert.match(reflection.evidence, /pay Satisfied/);
  assert.match(reflection.evidence, /company confidence Not satisfied/);
  assert.match(reflection.evidence, /ability to move Somewhat satisfied/);
  assert.match(reflection.truth, /lower satisfaction/i);
  assert.match(reflection.truth, /cannot verify/i);
  assert.match(reflection.lever, /does not rank/i);
  assert.equal(reflection.nextTools[0].href, "/companies");
  assert.equal(reflection.nextTools[1].href, "/escape-plan");
  assert.equal(reflection.questions.length, 2);
});

test("Career Reality Check distinguishes neutral answers from positive self-reports", () => {
  const neutral = createCareerRealityIndexReflection({
    pay: "Satisfied",
    stability: "Neutral",
    optionality: "Super satisfied",
    ai: "Satisfied",
  });
  const positive = createCareerRealityIndexReflection({
    pay: "Satisfied",
    stability: "Super satisfied",
    optionality: "Satisfied",
    ai: "Super satisfied",
  });

  assert.match(neutral.verdict, /Company confidence as open questions/);
  assert.deepEqual(neutral.nextTools.map((tool) => tool.href), ["/companies"]);
  assert.match(positive.verdict, /answers are positive/);
  assert.equal(positive.nextTools.length, 4);
  assert.match(positive.lever, /does not rank or score/i);
});

test("AI task readout changes with task context and never creates an exposure score", () => {
  const bounded = createAiTaskReadout({
    taskName: "Draft a weekly status summary",
    repeatability: "Repeatable",
    errorImpact: "Moderate",
    humanReview: "Yes, always",
  });
  const consequential = createAiTaskReadout({
    taskName: "Approve a high-value payment",
    repeatability: "Context-heavy",
    errorImpact: "High",
    humanReview: "No",
  });

  assert.equal("error" in bounded, false);
  assert.equal("error" in consequential, false);
  if ("error" in bounded || "error" in consequential) return;
  assert.match(bounded.label, /bounded, supervised pilot/);
  assert.match(consequential.label, /Keep a person accountable/);
  assert.match(consequential.checks.join(" "), /verify every consequential output/);
  assert.match(consequential.checks.join(" "), /identified reviewer and a correction path/);
  const invalid = createAiTaskReadout({
    taskName: "x",
    repeatability: "Repeatable",
    errorImpact: "Low",
    humanReview: "Yes, always",
  });
  assert.equal("error" in invalid, true);
  if ("error" in invalid) assert.equal(invalid.error, "Describe the task in 3 to 180 characters.");
});

test("resignation planner reports only the selected facts and next checks", () => {
  const result = createResignationPlan({
    noticeDays: 60,
    hasRepaymentClause: true,
    offerStatus: "Verbal offer only",
    cashRunwayMonths: 3.5,
  });

  assert.equal("error" in result, false);
  if ("error" in result) return;
  assert.equal(result.noticeDays, 60);
  assert.equal(result.cashRunwayMonths, 3.5);
  assert.ok(result.nextSteps.some((step) => step.includes("in writing")));
  assert.ok(result.nextSteps.some((step) => step.includes("qualified professional")));
  assert.ok(result.nextSteps.every((step) => !/score|probability|risk band/i.test(step)));
});

test("resignation planner rejects non-finite and out-of-range runway", () => {
  for (const cashRunwayMonths of [Number.NaN, Number.POSITIVE_INFINITY, -1, 61]) {
    const result = createResignationPlan({
      noticeDays: 30,
      hasRepaymentClause: false,
      offerStatus: "No offer",
      cashRunwayMonths,
    });
    assert.equal("error" in result, true);
  }
});

test("salary-drop calculation uses the shared tax model across variable-pay scenarios", () => {
  const result = calculateSalaryDrop({
    currentCtc: "2400000",
    newCtc: "2100000",
    variablePayPercent: "10",
    monthlyCostBaseline: "80000",
    bufferMonths: "6",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.calculation.currentAssumedFixedCash, 2_160_000);
  assert.equal(result.calculation.newAssumedFixedCash, 1_890_000);
  assert.deepEqual(
    result.calculation.takeHomeScenarios.map(({ realizationPercent }) => realizationPercent),
    [0, 50, 100],
  );
  assert.equal(
    result.calculation.monthlyCashDelta,
    result.calculation.takeHomeScenarios[0].monthlyTakeHomeDelta,
  );
  assert.equal(
    result.calculation.annualCashDelta,
    result.calculation.takeHomeScenarios[0].annualTakeHomeDelta,
  );
  assert.equal(
    result.calculation.currentNetTakeHomeAtZeroVariable,
    result.calculation.takeHomeScenarios[0].currentAnnualTakeHome,
  );
  assert.ok(
    result.calculation.takeHomeScenarios[2].currentAnnualTakeHome >
      result.calculation.takeHomeScenarios[0].currentAnnualTakeHome,
  );
  assert.equal(
    result.calculation.selectedBufferAmount,
    Math.abs(Math.min(result.calculation.monthlyCashDelta, 0)) * 6,
  );
  assert.equal(
    result.calculation.monthlyCostChangePercent,
    (result.calculation.monthlyCashDelta / 80_000) * 100,
  );
});

test("salary-drop calculation withholds results for blank, malformed, and out-of-range input", () => {
  const base = {
    currentCtc: "2400000",
    newCtc: "2100000",
    variablePayPercent: "10",
    monthlyCostBaseline: "80000",
    bufferMonths: "6",
  };
  for (const input of [
    { ...base, currentCtc: "" },
    { ...base, newCtc: "not a number" },
    { ...base, variablePayPercent: "101" },
    { ...base, monthlyCostBaseline: "0" },
    { ...base, bufferMonths: "25" },
  ]) {
    assert.equal(calculateSalaryDrop(input).ok, false);
  }
});

test("escape plan is goal-specific and time budget is exact arithmetic", () => {
  const salaryTasks = getEscapePlanTasks("More money");
  const roleTasks = getEscapePlanTasks("A better role");
  assert.equal(salaryTasks.length, 5);
  assert.notDeepEqual(salaryTasks, roleTasks);
  assert.ok(salaryTasks.some((task) => task.includes("fixed pay")));
  assert.deepEqual(calculateEscapePlanHours("4", "8"), {
    ok: true,
    totalHours: 32,
  });
  assert.equal(calculateEscapePlanHours("0", "8").ok, false);
});
