import assert from "node:assert/strict";
import test from "node:test";
import { calculateCareerTool } from "../../../lib/career-tools/src/index";

test("runway shows twelve reproducible monthly cash-flow rows", () => {
  const result = calculateCareerTool("layoff-runway", {
    liquidSavings: 300_000,
    severance: 60_000,
    essentialMonthlyCosts: 40_000,
    monthlyDebtPayments: 5_000,
    otherMonthlyIncome: 5_000,
  });
  assert.equal(result.rows.find((row) => row.label.includes("Runway"))?.value, 9);
  assert.equal(result.tables?.[0].rows.length, 12);
  assert.deepEqual(result.tables?.[0].rows[0], [1, 360_000, -40_000, 320_000]);
  assert.deepEqual(result.tables?.[0].rows[8], [9, 40_000, -40_000, 0]);
});

test("runway reports no finite depletion when monthly income covers costs", () => {
  const result = calculateCareerTool("layoff-runway", {
    liquidSavings: 5_000,
    essentialMonthlyCosts: 20_000,
    monthlyDebtPayments: 2_000,
    otherMonthlyIncome: 22_000,
  });
  assert.equal(result.rows.find((row) => row.label.includes("Runway"))?.value, "Not calculated");
  assert.equal(result.tables?.[0].rows[0][3], 5_000);
  assert.equal(result.rows.find((row) => row.label === "First month projected below zero")?.value, "No depletion at this monthly net flow");
});

test("runway carries surplus and shortfall balances consistently", () => {
  const surplus = calculateCareerTool("layoff-runway", {
    liquidSavings: 5_000,
    essentialMonthlyCosts: 20_000,
    monthlyDebtPayments: 2_000,
    otherMonthlyIncome: 25_000,
  });
  assert.deepEqual(surplus.tables?.[0].rows[0], [1, 5_000, 3_000, 8_000]);
  assert.equal(surplus.tables?.[0].rows[1][1], surplus.tables?.[0].rows[0][3]);

  const shortfall = calculateCareerTool("layoff-runway", {
    liquidSavings: 360_000,
    essentialMonthlyCosts: 40_000,
    monthlyDebtPayments: 5_000,
    otherMonthlyIncome: 5_000,
  });
  assert.equal(shortfall.rows.find((row) => row.label === "First month projected below zero")?.value, "Month 10");
  assert.equal(shortfall.tables?.[0].rows[9][3], -40_000);
});

test("home-loan schedule reconciles payment, principal, and interest", () => {
  const result = calculateCareerTool("home-loan-stress-test", {
    loanPrincipal: 120_000,
    annualRatePercent: 0,
    stressRatePercent: 2,
    termMonths: 12,
    monthlyTakeHome: 30_000,
    otherMonthlyCosts: 1_000,
  });
  assert.equal(result.tables?.[0].rows.length, 12);
  assert.equal(result.rows.find((row) => row.label === "Monthly payment at entered rate")?.value, 10_000);
  assert.equal(result.rows.find((row) => row.label === "Total scheduled payments at entered rate")?.value, 120_000);
  assert.equal(result.rows.find((row) => row.label === "Total interest at entered rate")?.value, 0);
  assert.equal(result.tables?.[0].rows[11][5], 0);
});

test("home-loan calculator rejects fractional month terms", () => {
  assert.throws(() => calculateCareerTool("home-loan-stress-test", {
    loanPrincipal: 1_000_000,
    annualRatePercent: 8,
    stressRatePercent: 10,
    termMonths: 12.5,
    monthlyTakeHome: 50_000,
  }), /whole number of months/);
});

test("gratuity cap is dated and the worksheet states its excluded cases", () => {
  const result = calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 1_000_000,
    completedYears: 10,
    additionalMonths: 7,
  });
  assert.equal(result.rows.find((row) => row.label === "Formula service years")?.value, 11);
  assert.equal(result.rows.find((row) => row.label === "Ceiling-limited estimate")?.value, 2_000_000);
  assert.ok(result.notes.some((note) => note.includes("₹20 lakh")));
  assert.ok(result.notes.some((note) => note.includes("fixed-term")));
});

test("fixed-term gratuity uses exact months and its one-year threshold", () => {
  const underYear = calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 0, additionalMonths: 11, serviceType: "fixed-term",
  });
  const completedYear = calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 1, additionalMonths: 0, serviceType: "fixed-term",
  });
  assert.equal(underYear.rows.find((row) => row.label === "Five-year / one-year threshold met for selected category")?.value, "No");
  assert.equal(completedYear.rows.find((row) => row.label === "Five-year / one-year threshold met for selected category")?.value, "Yes");
  assert.equal(completedYear.rows.find((row) => row.label === "Formula amount before ceiling")?.value, 15_000);
});

test("gratuity rounds ordinary service only above six months and rejects fractional service units", () => {
  const sixMonths = calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 5, additionalMonths: 6,
  });
  const sevenMonths = calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 5, additionalMonths: 7,
  });
  assert.equal(sixMonths.rows.find((row) => row.label === "Formula service years")?.value, 5);
  assert.equal(sevenMonths.rows.find((row) => row.label === "Formula service years")?.value, 6);
  assert.throws(() => calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 5.5, additionalMonths: 0,
  }), /whole number/);
  assert.throws(() => calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 5, additionalMonths: 1.5,
  }), /whole number/);
});

test("gratuity separates deceased-employee pro rata from disablement rounding", () => {
  const death = calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 2, additionalMonths: 2, serviceType: "death",
  });
  const disablement = calculateCareerTool("gratuity-estimator", {
    monthlyWageBase: 26_000, completedYears: 2, additionalMonths: 7, serviceType: "disablement",
  });
  assert.equal(death.rows.find((row) => row.label === "Formula service years")?.value, 26 / 12);
  assert.ok(Math.abs(Number(death.rows.find((row) => row.label === "Formula amount before ceiling")?.value) - 32_500) < 1e-8);
  assert.equal(death.rows.find((row) => row.label === "Five-year / one-year threshold met for selected category")?.value, "Yes");
  assert.equal(disablement.rows.find((row) => row.label === "Formula service years")?.value, 3);
  assert.equal(disablement.rows.find((row) => row.label === "Five-year / one-year threshold met for selected category")?.value, "Yes");
});

test("final-pay estimate reconciles its entered daily-rate basis and rejects invalid divisors", () => {
  const result = calculateCareerTool("final-pay-estimator", {
    monthlyCash: 52_000, monthlyDaysBasis: 26, noticeDays: 15, unusedLeaveDays: 5,
  });
  assert.deepEqual(result.rows.map((row) => row.value), [2_000, 30_000, 10_000, 40_000]);
  assert.throws(() => calculateCareerTool("final-pay-estimator", {
    monthlyCash: 52_000, monthlyDaysBasis: 0, noticeDays: 15, unusedLeaveDays: 5,
  }), /between 1 and 31/);
});

test("tax and runway reject negative required amounts", () => {
  assert.throws(() => calculateCareerTool("tax-regime-comparison", {
    grossSalary: -1,
    newTax: 0,
  }), /between 0 and/);
  assert.throws(() => calculateCareerTool("layoff-runway", {
    liquidSavings: -1,
    essentialMonthlyCosts: 20_000,
  }), /between 0 and/);
});
