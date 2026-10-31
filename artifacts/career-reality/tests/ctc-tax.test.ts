import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCtc,
  compareCtcOffers,
  ctcWorkedExampleResults,
  estimateIncomeTax,
} from "../src/lib/ctc-calculator";
import { calculateCareerTool, estimateOldRegimeTax } from "../../../lib/career-tools/src/index";

test("old-regime tax uses AY 2026–27 slabs and applies rebate only through ₹5 lakh taxable income", () => {
  const atRebateLimit = estimateOldRegimeTax(550_000);
  assert.equal(atRebateLimit.taxableIncome, 500_000);
  assert.equal(atRebateLimit.taxBeforeRebate, 12_500);
  assert.equal(atRebateLimit.rebate, 12_500);
  assert.equal(atRebateLimit.tax, 0);

  const oneRupeeAbove = estimateOldRegimeTax(550_001);
  assert.equal(oneRupeeAbove.taxableIncome, 500_001);
  assert.equal(oneRupeeAbove.rebate, 0);
  assert.ok(Math.abs(oneRupeeAbove.tax - 13_000.208) < 0.000001);

  const standardPackage = estimateOldRegimeTax(2_000_000);
  assert.equal(standardPackage.taxableIncome, 1_950_000);
  assert.equal(standardPackage.taxBeforeRebate, 397_500);
  assert.equal(standardPackage.cess, 15_900);
  assert.equal(standardPackage.tax, 413_400);
});

test("old-regime marginal bands match the official under-60 AY 2026–27 schedule", () => {
  const atFiveLakh = estimateOldRegimeTax(550_000);
  const atTenLakh = estimateOldRegimeTax(1_050_000);
  const aboveTenLakh = estimateOldRegimeTax(1_050_001);
  assert.equal(atFiveLakh.taxableIncome, 500_000);
  assert.equal(atFiveLakh.taxBeforeRebate, 12_500);
  assert.equal(atTenLakh.taxableIncome, 1_000_000);
  assert.equal(atTenLakh.taxBeforeRebate, 112_500);
  assert.equal(aboveTenLakh.taxBeforeRebate, 112_500.3);
});

test("old-regime surcharge marginal relief applies at the ₹50 lakh and ₹5 crore thresholds", () => {
  const justAbove50L = estimateOldRegimeTax(5_050_001);
  assert.equal(justAbove50L.taxableIncome, 5_000_001);
  assert.ok(Math.abs(justAbove50L.tax - 1_365_001.04) < 0.01);

  const at5Cr = estimateOldRegimeTax(50_050_000);
  const oneRupeeAbove5Cr = estimateOldRegimeTax(50_050_001);
  assert.ok(Math.abs(at5Cr.tax - 19_256_250) < 0.01);
  assert.ok(Math.abs(oneRupeeAbove5Cr.tax - 19_256_251.04) < 0.01);
});

test("tax comparison returns calculated old and shared-engine new regime totals", () => {
  const newTax = estimateIncomeTax(2_000_000, "assessment-year-2026-27").tax;
  const result = calculateCareerTool("tax-regime-comparison", {
    grossSalary: 2_000_000,
    oldRegimeDeductions: 100_000,
    newTax,
  });
  assert.equal(result.rows.find((row) => row.label === "Estimated old-regime tax")?.value, estimateOldRegimeTax(2_000_000, 100_000).tax);
  assert.equal(result.rows.find((row) => row.label === "Estimated new-regime tax")?.value, estimateIncomeTax(2_000_000, "assessment-year-2026-27").tax);
  assert.match(result.summary, /AY 2026–27/u);
  assert.ok(result.links?.some((link) => link.url === "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?Id=292"));
});

test("old-regime comparison exposes capped 80C, 80D, NPS, HRA, and break-even inputs", () => {
  const result = calculateCareerTool("tax-regime-comparison", {
    grossSalary: 2_000_000,
    section80C: 200_000,
    section80D: 40_000,
    nps80ccd1b: 60_000,
    annualBasicSalary: 800_000,
    annualHraReceived: 300_000,
    annualRentPaid: 360_000,
    hraCityType: "non-metro",
    newTax: estimateIncomeTax(2_000_000, "assessment-year-2026-27").tax,
  });
  assert.equal(result.rows.find((row) => row.label.includes("Section 80C"))?.value, 150_000);
  assert.equal(result.rows.find((row) => row.label.includes("Section 80D"))?.value, 25_000);
  assert.equal(result.rows.find((row) => row.label === "Additional NPS deduction entered under 80CCD(1B)")?.value, 50_000);
  assert.equal(result.rows.find((row) => row.label === "HRA exemption estimate")?.value, 280_000);
  assert.ok(result.rows.some((row) => row.label.includes("Additional eligible old-regime deduction")));
});

test("new regime applies each progressive band and cess", () => {
  const result = estimateIncomeTax(2_475_000);
  assert.equal(result.taxableIncome, 2_400_000);
  assert.equal(result.taxBeforeRebate, 300_000);
  assert.equal(result.rebate, 0);
  assert.equal(result.cess, 12_000);
  assert.equal(result.tax, 312_000);
});

test("current Tax Year 2026–27 and AY 2026–27 carry explicit periods with the same verified salary schedule", () => {
  const currentTaxYear = estimateIncomeTax(2_000_000, "tax-year-2026-27");
  const priorAssessmentYear = estimateIncomeTax(2_000_000, "assessment-year-2026-27");

  assert.equal(currentTaxYear.taxPeriod, "tax-year-2026-27");
  assert.equal(priorAssessmentYear.taxPeriod, "assessment-year-2026-27");
  assert.equal(currentTaxYear.standardDeduction, 75_000);
  assert.equal(priorAssessmentYear.standardDeduction, 75_000);
  assert.equal(currentTaxYear.taxableIncome, priorAssessmentYear.taxableIncome);
  assert.equal(currentTaxYear.tax, priorAssessmentYear.tax);
});

test("new regime rebate removes tax at the 12L taxable threshold", () => {
  const result = estimateIncomeTax(1_275_000);
  assert.equal(result.taxableIncome, 1_200_000);
  assert.equal(result.taxBeforeRebate, 60_000);
  assert.equal(result.rebate, 60_000);
  assert.equal(result.tax, 0);
});

test("new-regime estimate applies only the verified standard deduction", () => {
  const result = estimateIncomeTax(900_000);
  assert.equal(result.taxableIncome, 900_000 - 75_000);
});

test("new regime applies rebate marginal relief just above ₹12L total income", () => {
  const result = estimateIncomeTax(1_325_000);
  assert.equal(result.taxableIncome, 1_250_000);
  assert.equal(result.taxBeforeRebate, 67_500);
  assert.equal(result.rebate, 0);
  assert.equal(result.rebateMarginalRelief, 17_500);
  assert.equal(result.taxAfterRebate, 50_000);
  assert.equal(result.cess, 2_000);
  assert.equal(result.tax, 52_000);
});

test("rebate behavior is checked at the statutory boundaries", () => {
  const newRegimeAtLimit = estimateIncomeTax(1_275_000);
  const newRegimeOneRupeeOver = estimateIncomeTax(1_275_001);
  assert.equal(newRegimeAtLimit.taxableIncome, 1_200_000);
  assert.equal(newRegimeAtLimit.tax, 0);
  assert.equal(newRegimeOneRupeeOver.taxableIncome, 1_200_001);
  assert.ok(Math.abs(newRegimeOneRupeeOver.rebateMarginalRelief - 59_999.15) < 0.000001);
  assert.ok(Math.abs(newRegimeOneRupeeOver.tax - 1.04) < 0.000001);

});

test("applies surcharge marginal relief at each relevant income threshold", () => {
  const cases = [
    {
      taxableIncome: 5_000_001,
      surchargeRate: 0.1,
      surcharge: 0.7,
      surchargeMarginalRelief: 107_999.33,
      cess: 43_200.04,
      tax: 1_123_201.04,
    },
    {
      taxableIncome: 10_000_001,
      surchargeRate: 0.15,
      surcharge: 258_000.7,
      surchargeMarginalRelief: 128_999.345,
      cess: 113_520.04,
      tax: 2_951_521.04,
    },
    {
      taxableIncome: 20_000_001,
      surchargeRate: 0.25,
      surcharge: 837_000.7,
      surchargeMarginalRelief: 557_999.375,
      cess: 256_680.04,
      tax: 6_673_681.04,
    },
  ];

  for (const expected of cases) {
    const result = estimateIncomeTax(expected.taxableIncome + 75_000);
    assert.equal(result.taxableIncome, expected.taxableIncome);
    assert.equal(result.surchargeRate, expected.surchargeRate);
    assert.ok(Math.abs(result.surcharge - expected.surcharge) < 0.01);
    assert.ok(Math.abs(result.surchargeMarginalRelief - expected.surchargeMarginalRelief) < 0.01);
    assert.ok(Math.abs(result.cess - expected.cess) < 0.01);
    assert.ok(Math.abs(result.tax - expected.tax) < 0.01);
  }
});

test("surcharge rates and marginal relief stay aligned at exact band boundaries", () => {
  const thresholds = [
    { taxableIncome: 5_000_000, exactRate: 0, nextRate: 0.1 },
    { taxableIncome: 10_000_000, exactRate: 0.1, nextRate: 0.15 },
    { taxableIncome: 20_000_000, exactRate: 0.15, nextRate: 0.25 },
    { taxableIncome: 50_000_000, exactRate: 0.25, nextRate: 0.25 },
  ];

  for (const { taxableIncome, exactRate, nextRate } of thresholds) {
    const atThreshold = estimateIncomeTax(taxableIncome + 75_000);
    const oneRupeeOver = estimateIncomeTax(taxableIncome + 1 + 75_000);
    assert.equal(atThreshold.surchargeRate, exactRate, `New regime at ₹${taxableIncome}`);
    assert.equal(oneRupeeOver.surchargeRate, nextRate, `New regime above ₹${taxableIncome}`);
    assert.ok(
      oneRupeeOver.tax - atThreshold.tax <= 1.04 + 0.000001,
      `New-regime marginal relief at ₹${taxableIncome}`,
    );
  }
});

test("Tax Year 2026–27 caps new-regime surcharge at 25% above ₹5Cr", () => {
  const newRegime = estimateIncomeTax(60_075_000);
  assert.equal(newRegime.taxableIncome, 60_000_000);
  assert.equal(newRegime.taxBeforeRebate, 17_580_000);
  assert.equal(newRegime.surchargeRate, 0.25);
  assert.equal(newRegime.surcharge, 4_395_000);
  assert.equal(newRegime.surchargeMarginalRelief, 0);
  assert.equal(newRegime.cess, 879_000);
  assert.equal(newRegime.tax, 22_854_000);
});

test("20L worked example reconciles to the shared CTC model", () => {
  const example = ctcWorkedExampleResults.find((item) => item.id === "20lpa");
  assert.ok(example);
  const { result } = example;
  assert.equal(result.ctcShortfall, 0);
  assert.equal(result.annualUnallocatedCtc, 6_640);
  assert.equal(result.annualGrossAtTarget, 1_964_000);
  assert.ok(Math.abs(result.monthlyEmployeePf - 2_446.6666666666665) < 0.001);
  assert.ok(Math.abs(result.annualEmployerPf - 29_360) < 0.001);
  assert.equal(result.annualTaxAtTarget, 184_912);
  assert.ok(Math.abs(result.monthlyInHandAtTargetAverage - 145_810.66666666666) < 0.001);
  assert.ok(Math.abs(result.monthlyInHandAtZeroVariable - 133_930.66666666666) < 0.001);
});

test("PF model applies both ceiling periods and the September 2026 16/14-day split", () => {
  const input = {
    annualCtc: 1_200_000,
    annualFixedPay: 1_200_000,
    annualVariablePay: 0,
    basicPercentOfFixed: 50,
    annualEmployeePfAtZeroVariable: 0,
    annualEmployeePfAtTarget: 0,
    annualEmployerPfAtTarget: 0,
    employerPfIncluded: true,
    pfContributionBasis: "statutory-ceiling" as const,
    pfEmploymentStartDate: "2026-04-01",
    stateOrUt: "Not specified",
    annualProfessionalTax: 0,
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  };
  const capped = calculateCtc(input);
  assert.ok(Math.abs(capped.annualPfWageBase - 244_666.66666666666) < 0.001);
  assert.ok(Math.abs(capped.annualEmployeePf - 29_360) < 0.001);
  assert.ok(Math.abs(capped.annualEmployerEps - 20_380.733333333334) < 0.001);
  assert.ok(Math.abs(capped.annualEmployerEpf - 8_979.266666666666) < 0.001);
  assert.equal(capped.pfMonthlySchedule.length, 12);
  assert.equal(capped.pfMonthlySchedule[4].wageBase, 15_000);
  assert.ok(Math.abs(capped.pfMonthlySchedule[5].wageBase - 19_666.666666666664) < 0.001);
  assert.equal(capped.pfMonthlySchedule[6].wageBase, 25_000);
  const actual = calculateCtc({ ...input, pfContributionBasis: "actual-basic" });
  assert.equal(actual.annualEmployeePf, 72_000);
  assert.equal(actual.annualEmployerPf, 72_000);
});

test("PF projections respect an explicitly entered start date within the transition year", () => {
  const base = {
    annualCtc: 1_200_000,
    annualFixedPay: 480_000,
    annualVariablePay: 0,
    basicPercentOfFixed: 50,
    annualEmployeePfAtZeroVariable: 0,
    annualEmployeePfAtTarget: 0,
    annualEmployerPfAtTarget: 0,
    employerPfIncluded: true,
    pfContributionBasis: "statutory-ceiling" as const,
    stateOrUt: "Not specified",
    annualProfessionalTax: 0,
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  };
  const septemberStart = calculateCtc({ ...base, pfEmploymentStartDate: "2026-09-01" });
  assert.equal(septemberStart.pfMonthlySchedule.slice(0, 5).reduce((sum, month) => sum + month.employedDays, 0), 0);
  assert.equal(septemberStart.pfMonthlySchedule[5].employedDays, 30);
  assert.ok(Math.abs(septemberStart.pfMonthlySchedule[5].wageBase - 17_333.333333333332) < 0.001);
  assert.equal(septemberStart.pfMonthlySchedule[6].wageBase, 20_000);
  const octoberStart = calculateCtc({ ...base, pfEmploymentStartDate: "2026-10-01" });
  assert.equal(octoberStart.pfMonthlySchedule[5].wageBase, 0);
  assert.equal(octoberStart.annualPfWageBase, 120_000);
});

test("calculated PF rejects a missing or out-of-year employment start date", () => {
  const input = {
    annualCtc: 600_000,
    annualFixedPay: 600_000,
    annualVariablePay: 0,
    basicPercentOfFixed: 50,
    annualEmployeePfAtZeroVariable: 0,
    annualEmployeePfAtTarget: 0,
    annualEmployerPfAtTarget: 0,
    employerPfIncluded: true,
    pfContributionBasis: "statutory-ceiling" as const,
    stateOrUt: "Not specified",
    annualProfessionalTax: 0,
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  };
  assert.throws(() => calculateCtc(input), /Enter a PF start date/);
  assert.throws(() => calculateCtc({ ...input, pfEmploymentStartDate: "2027-04-01" }), /must fall within Tax Year/);
});

test("PF ceiling boundaries cap monthly wages at each applicable ceiling", () => {
  const input = {
    annualCtc: 600_000,
    annualFixedPay: 600_000,
    annualVariablePay: 0,
    basicPercentOfFixed: 50,
    annualEmployeePfAtZeroVariable: 0,
    annualEmployeePfAtTarget: 0,
    annualEmployerPfAtTarget: 0,
    employerPfIncluded: true,
    pfContributionBasis: "statutory-ceiling" as const,
    pfEmploymentStartDate: "2026-10-01",
    stateOrUt: "Not specified",
    annualProfessionalTax: 0,
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  };
  const atCeiling = calculateCtc(input);
  assert.equal(atCeiling.pfMonthlySchedule[6].wageBase, 25_000);
  const aboveCeiling = calculateCtc({ ...input, annualFixedPay: 600_024 });
  assert.equal(aboveCeiling.pfMonthlySchedule[6].wageBase, 25_000);
  const belowCeiling = calculateCtc({ ...input, annualFixedPay: 599_976 });
  assert.equal(belowCeiling.pfMonthlySchedule[6].wageBase, 24_999);
});

test("employee PF reduces take-home but not taxable income", () => {
  const inputs = {
    annualCtc: 2_400_000,
    annualFixedPay: 2_400_000,
    annualVariablePay: 0,
    basicPercentOfFixed: 50,
    annualEmployeePfAtZeroVariable: 0,
    annualEmployeePfAtTarget: 0,
    annualEmployerPfAtTarget: 0,
    employerPfIncluded: false,
    stateOrUt: "Not specified",
    annualProfessionalTax: 0,
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  } as const;
  const withoutDeductions = calculateCtc(inputs);
  const withDeductions = calculateCtc({
    ...inputs,
    annualEmployeePfAtZeroVariable: 120_000,
    annualEmployeePfAtTarget: 120_000,
  });

  assert.equal(withDeductions.taxAtTarget.taxableIncome, withoutDeductions.taxAtTarget.taxableIncome);
  assert.equal(withDeductions.taxAtTarget.tax, withoutDeductions.taxAtTarget.tax);
  assert.equal(withDeductions.monthlyTaxOnlyAtTarget, withoutDeductions.monthlyTaxOnlyAtTarget);
  assert.equal(withoutDeductions.annualTakeHomeAtTarget - withDeductions.annualTakeHomeAtTarget, 120_000);
  assert.equal(withoutDeductions.monthlyInHandAtTargetAverage - withDeductions.monthlyInHandAtTargetAverage, 10_000);
});

test("professional tax remains deductible under the new regime in both supported periods", () => {
  const inputs = {
    annualCtc: 2_400_000,
    annualFixedPay: 2_400_000,
    annualVariablePay: 0,
    basicPercentOfFixed: 50,
    annualEmployeePfAtZeroVariable: 0,
    annualEmployeePfAtTarget: 0,
    annualEmployerPfAtTarget: 0,
    employerPfIncluded: false,
    stateOrUt: "Maharashtra",
    annualProfessionalTax: 2_400,
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  } as const;
  const taxYear = calculateCtc(inputs, "tax-year-2026-27");
  const taxYearWithoutProfessionalTax = calculateCtc({
    ...inputs,
    annualProfessionalTax: 0,
  }, "tax-year-2026-27");
  const assessmentYear = calculateCtc(inputs, "assessment-year-2026-27");
  const assessmentYearWithoutProfessionalTax = calculateCtc({
    ...inputs,
    annualProfessionalTax: 0,
  }, "assessment-year-2026-27");

  assert.equal(taxYear.taxAtTarget.employmentTaxDeduction, 2_400);
  assert.equal(
    taxYear.taxAtTarget.taxableIncome,
    taxYearWithoutProfessionalTax.taxAtTarget.taxableIncome - 2_400,
  );
  assert.equal(taxYearWithoutProfessionalTax.annualTaxAtTarget - taxYear.annualTaxAtTarget, 624);
  assert.equal(
    assessmentYear.taxAtTarget.employmentTaxDeduction,
    2_400,
  );
  assert.equal(
    assessmentYear.taxAtTarget.taxableIncome,
    assessmentYearWithoutProfessionalTax.taxAtTarget.taxableIncome - 2_400,
  );
  assert.equal(
    assessmentYearWithoutProfessionalTax.annualTaxAtTarget - assessmentYear.annualTaxAtTarget,
    624,
  );
  assert.equal(
    assessmentYearWithoutProfessionalTax.annualTakeHomeAtTarget - assessmentYear.annualTakeHomeAtTarget,
    1_776,
  );
});

test("employment-tax deduction cannot reduce taxable salary below zero", () => {
  const result = estimateIncomeTax(80_000, "tax-year-2026-27", 20_000);
  assert.equal(result.standardDeduction, 75_000);
  assert.equal(result.employmentTaxDeduction, 5_000);
  assert.equal(result.taxableIncome, 0);
});

test("a CTC breakdown that exceeds the offer amount is marked invalid", () => {
  const example = ctcWorkedExampleResults.find((item) => item.id === "20lpa");
  assert.ok(example);
  const result = calculateCtc({
    ...example.inputs,
    annualOtherEmployerCosts: 100_000,
  });
  assert.equal(result.ctcShortfall, 93_360);
  assert.equal(result.annualUnallocatedCtc, 0);
});

test("PF employer contribution is not counted inside CTC when the offer excludes it", () => {
  const example = ctcWorkedExampleResults.find((item) => item.id === "20lpa");
  assert.ok(example);
  const result = calculateCtc({
    ...example.inputs,
    employerPfIncluded: false,
  });
  assert.equal(result.annualEmployerPf, 0);
  assert.equal(result.annualUnallocatedCtc, 36_000);
});

test("offer comparison reuses both CTC models and subtracts only entered transition costs", () => {
  const current = ctcWorkedExampleResults.find((item) => item.id === "20lpa");
  const offer = ctcWorkedExampleResults.find((item) => item.id === "40lpa");
  assert.ok(current);
  assert.ok(offer);
  const result = compareCtcOffers({
    current: current.inputs,
    offer: offer.inputs,
    joiningBonusClawback: 25_000,
    noticePeriodCost: 10_000,
    relocationCost: 15_000,
    additionalAnnualCommuteCost: 60_000,
  });
  assert.equal(result.offerFirstYearAtZeroVariable, result.offer.annualTakeHomeAtZeroVariable - 110_000);
  assert.equal(result.offerFirstYearAtTarget, result.offer.annualTakeHomeAtTarget - 110_000);
  assert.equal(Math.round(result.current.monthlyInHandAtZeroVariable), 133_931);
  assert.equal(Math.round(result.offer.monthlyInHandAtZeroVariable), 244_979);
  assert.equal(result.current.monthlyInHandAtTargetAverage, current.result.monthlyInHandAtTargetAverage);
  assert.equal(Math.round(result.offer.monthlyInHandAtTargetAverage), 265_619);
  assert.equal(Math.round(result.offerFirstYearAtZeroVariable), 2_829_752);
  assert.throws(() => compareCtcOffers({
    current: { ...current.inputs, annualOtherEmployerCosts: 100_000 },
    offer: offer.inputs,
    joiningBonusClawback: 0,
    noticePeriodCost: 0,
    relocationCost: 0,
    additionalAnnualCommuteCost: 0,
  }), /current pay components exceed current CTC/);
});

test("identical offer inputs produce identical zero-variable and full-target take-home", () => {
  const example = ctcWorkedExampleResults.find((item) => item.id === "40lpa");
  assert.ok(example);
  const result = compareCtcOffers({
    current: example.inputs,
    offer: example.inputs,
    joiningBonusClawback: 0,
    noticePeriodCost: 0,
    relocationCost: 0,
    additionalAnnualCommuteCost: 0,
  });
  assert.equal(result.current.annualTakeHomeAtZeroVariable, result.offer.annualTakeHomeAtZeroVariable);
  assert.equal(result.current.annualTakeHomeAtTarget, result.offer.annualTakeHomeAtTarget);
  assert.equal(result.offerFirstYearAtZeroVariable, result.current.annualTakeHomeAtZeroVariable);
  assert.equal(result.offerFirstYearAtTarget, result.current.annualTakeHomeAtTarget);
});

test("one-time and recurring first-year costs remain separate and reconcile", () => {
  const example = ctcWorkedExampleResults.find((item) => item.id === "40lpa");
  assert.ok(example);
  const baseInput = {
    current: example.inputs,
    offer: example.inputs,
    joiningBonusClawback: 0,
    noticePeriodCost: 0,
    relocationCost: 0,
    additionalAnnualCommuteCost: 0,
  };
  const noCosts = compareCtcOffers(baseInput);
  const oneTimeOnly = compareCtcOffers({
    ...baseInput,
    joiningBonusClawback: 25_000,
    noticePeriodCost: 10_000,
    relocationCost: 15_000,
  });
  const recurringOnly = compareCtcOffers({
    ...baseInput,
    additionalAnnualCommuteCost: 60_000,
  });
  assert.equal(noCosts.offerFirstYearAtZeroVariable - oneTimeOnly.offerFirstYearAtZeroVariable, 50_000);
  assert.equal(noCosts.offerFirstYearAtTarget - oneTimeOnly.offerFirstYearAtTarget, 50_000);
  assert.equal(noCosts.offerFirstYearAtZeroVariable - recurringOnly.offerFirstYearAtZeroVariable, 60_000);
  assert.equal(noCosts.offerFirstYearAtTarget - recurringOnly.offerFirstYearAtTarget, 60_000);
});