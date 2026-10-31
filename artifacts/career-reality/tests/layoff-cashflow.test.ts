import assert from "node:assert/strict";
import test from "node:test";
import { isValidRunwayStartMonth, projectRunwayCashFlow } from "../src/lib/layoff-cashflow";

const emptyExpenses = {
  housing: 0,
  food: 0,
  utilities: 0,
  transport: 0,
  healthcare: 0,
  debt: 0,
  other: 0,
};

test("projects monthly income, timed one-time pay, essentials, and shortfall month", () => {
  const result = projectRunwayCashFlow({
    startingCash: 300_000,
    startMonth: "2026-10",
    oneTimePay: 60_000,
    oneTimePayMonth: 2,
    monthlyIncome: 15_000,
    incomeThroughMonth: 3,
    monthlyExpenses: { ...emptyExpenses, housing: 30_000, food: 10_000 },
  });

  assert.equal(result.monthlyEssentials, 40_000);
  assert.equal(result.monthlyNetChange, -25_000);
  assert.deepEqual(result.rows[0], {
    month: 1,
    label: "Oct 2026",
    openingBalance: 300_000,
    income: 15_000,
    oneTimePay: 0,
    expenses: 40_000,
    closingBalance: 275_000,
  });
  assert.equal(result.rows[1].closingBalance, 310_000);
  assert.equal(result.firstShortfall?.month, 11);
  assert.equal(result.endBalance, -75_000);
});

test("continues the projection when income covers monthly essentials", () => {
  const result = projectRunwayCashFlow({
    startingCash: 50_000,
    startMonth: "2026-12",
    oneTimePay: 0,
    oneTimePayMonth: 1,
    monthlyIncome: 20_000,
    incomeThroughMonth: 12,
    monthlyExpenses: { ...emptyExpenses, housing: 15_000, food: 5_000 },
  });

  assert.equal(result.firstShortfall, null);
  assert.equal(result.endBalance, 50_000);
  assert.equal(result.rows[1].label, "Jan 2027");
});

test("rejects an invalid starting month instead of silently guessing", () => {
  assert.equal(isValidRunwayStartMonth("2026-10"), true);
  assert.equal(isValidRunwayStartMonth("2026-13"), false);
  assert.throws(() => projectRunwayCashFlow({
    startingCash: 100_000,
    startMonth: "",
    oneTimePay: 0,
    oneTimePayMonth: 1,
    monthlyIncome: 0,
    incomeThroughMonth: 0,
    monthlyExpenses: emptyExpenses,
  }), /valid starting month/);
});
