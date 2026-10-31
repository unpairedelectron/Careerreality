export type TaxEstimate = {
  taxPeriod: CtcTaxPeriod;
  grossSalary: number;
  standardDeduction: number;
  employmentTaxDeduction: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  rebateMarginalRelief: number;
  taxAfterRebate: number;
  surchargeRate: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  cess: number;
  tax: number;
  bands: Array<{ label: string; amount: number; rate: number; tax: number }>;
};

export type CtcTaxPeriod = "tax-year-2026-27" | "assessment-year-2026-27";

export const ctcTaxPeriodLabels: Record<CtcTaxPeriod, string> = {
  "tax-year-2026-27": "Tax Year 2026–27 · Income-tax Act, 2025",
  "assessment-year-2026-27": "Assessment Year 2026–27 · income earned in FY 2025–26",
};

export type CtcInputs = {
  annualCtc: number;
  annualFixedPay: number;
  annualVariablePay: number;
  basicPercentOfFixed: number;
  annualEmployeePfAtZeroVariable: number;
  annualEmployeePfAtTarget: number;
  annualEmployerPfAtTarget: number;
  pfContributionBasis?: "statutory-ceiling" | "actual-basic" | "manual";
  pfEmploymentStartDate?: string;
  employerPfIncluded: boolean;
  stateOrUt: string;
  annualProfessionalTax: number;
  annualGratuityInCtc: number;
  annualOtherEmployerCosts: number;
};

export type CtcCalculation = {
  taxPeriod: CtcTaxPeriod;
  inputs: CtcInputs;
  annualGrossAtTarget: number;
  annualGrossAtZeroVariable: number;
  annualBasic: number;
  monthlyBasic: number;
  monthlyEmployeePfAtZeroVariable: number;
  monthlyEmployeePf: number;
  annualEmployeePfAtZeroVariable: number;
  annualEmployeePf: number;
  annualEmployerPf: number;
  annualEmployerEps: number;
  annualEmployerEpf: number;
  annualPfWageBase: number;
  pfMonthlySchedule: Array<{
    month: string;
    employedDays: number;
    wageBase: number;
    employeeContribution: number;
    employerContribution: number;
    employerEps: number;
    employerEpf: number;
  }>;
  annualEmployerComponents: number;
  annualUnallocatedCtc: number;
  ctcShortfall: number;
  taxAtTarget: TaxEstimate;
  taxAtZeroVariable: TaxEstimate;
  annualTaxAtTarget: number;
  annualTaxAtZeroVariable: number;
  annualTakeHomeAtTarget: number;
  annualTakeHomeAtZeroVariable: number;
  monthlyTaxOnlyAtTarget: number;
  monthlyTaxOnlyAtZeroVariable: number;
  monthlyInHandAtTargetAverage: number;
  monthlyInHandAtZeroVariable: number;
  effectiveTaxRateAtTarget: number;
  effectiveDeductionRateAtTarget: number;
};

type TaxBand = { label: string; upTo: number; rate: number };

const NEW_REGIME_BANDS: TaxBand[] = [
  { label: "₹0–4L", upTo: 400_000, rate: 0 },
  { label: "₹4–8L", upTo: 800_000, rate: 0.05 },
  { label: "₹8–12L", upTo: 1_200_000, rate: 0.1 },
  { label: "₹12–16L", upTo: 1_600_000, rate: 0.15 },
  { label: "₹16–20L", upTo: 2_000_000, rate: 0.2 },
  { label: "₹20–24L", upTo: 2_400_000, rate: 0.25 },
  { label: "Above ₹24L", upTo: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const NEW_REGIME_REBATE_LIMIT = 1_200_000;
const NEW_REGIME_REBATE_CAP = 60_000;
const CESS_RATE = 0.04;
const SURCHARGE_THRESHOLDS = [5_000_000, 10_000_000, 20_000_000, 50_000_000];
const PF_OLD_MONTHLY_CEILING = 15_000;
const PF_REVISED_MONTHLY_CEILING = 25_000;
const PF_TRANSITION_DATE = "2026-09-17";
const PF_ESTIMATE_START = "2026-04-01";
const PF_ESTIMATE_END = "2027-03-31";
const EMPLOYEE_PF_RATE = 0.12;
const EMPLOYER_EPS_RATE = 0.0833;

function calculatePfSchedule(
  annualBasic: number,
  basis: NonNullable<CtcInputs["pfContributionBasis"]>,
  employmentStartDate?: string,
) {
  if (basis === "manual") return [];
  if (!employmentStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(employmentStartDate)) {
    throw new Error("Enter a PF start date in Tax Year 2026–27.");
  }
  const startDate = new Date(`${employmentStartDate}T00:00:00.000Z`);
  if (
    Number.isNaN(startDate.getTime()) ||
    startDate.toISOString().slice(0, 10) !== employmentStartDate ||
    employmentStartDate < PF_ESTIMATE_START ||
    employmentStartDate > PF_ESTIMATE_END
  ) {
    throw new Error("PF start date must fall within Tax Year 2026–27.");
  }

  const monthlyBasic = annualBasic / 12;
  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(Date.UTC(2026, 3 + index, 1));
    const monthEnd = new Date(Date.UTC(2026, 4 + index, 0));
    const daysInMonth = monthEnd.getUTCDate();
    const activeStart = startDate > monthStart ? startDate : monthStart;
    const activeDays = activeStart > monthEnd ? 0 : monthEnd.getUTCDate() - activeStart.getUTCDate() + 1;
    const segments = index === 5
      ? [
        { startDay: 1, endDay: 16, ceiling: PF_OLD_MONTHLY_CEILING },
        { startDay: 17, endDay: 30, ceiling: PF_REVISED_MONTHLY_CEILING },
      ]
      : [{ startDay: 1, endDay: daysInMonth, ceiling: index < 5 ? PF_OLD_MONTHLY_CEILING : PF_REVISED_MONTHLY_CEILING }];
    const bases = segments.reduce((total, segment) => {
      const segmentStartDay = Math.max(segment.startDay, activeStart <= monthEnd ? activeStart.getUTCDate() : daysInMonth + 1);
      const days = Math.max(0, segment.endDay - segmentStartDay + 1);
      const monthlyWageBase = basis === "statutory-ceiling"
        ? Math.min(monthlyBasic, segment.ceiling)
        : monthlyBasic;
      return {
        wageBase: total.wageBase + monthlyWageBase * days / daysInMonth,
        epsWageBase: total.epsWageBase + Math.min(monthlyBasic, segment.ceiling) * days / daysInMonth,
      };
    }, { wageBase: 0, epsWageBase: 0 });
    const { wageBase } = bases;
    const employerContribution = wageBase * EMPLOYEE_PF_RATE;
    const employerEps = bases.epsWageBase * EMPLOYER_EPS_RATE;
    return {
      month: monthStart.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }) + (monthStart.getUTCMonth() < 3 ? " 2027" : " 2026"),
      employedDays: activeDays,
      wageBase,
      employeeContribution: wageBase * EMPLOYEE_PF_RATE,
      employerContribution,
      employerEps,
      employerEpf: employerContribution - employerEps,
    };
  });
}

function calculateSlabs(taxableIncome: number) {
  const bands = NEW_REGIME_BANDS
    .map((band, index, all) => {
      const previous = index === 0 ? 0 : all[index - 1].upTo;
      const amount = Math.max(0, Math.min(taxableIncome, band.upTo) - previous);
      return { ...band, amount, tax: amount * band.rate };
    });
  return { bands, tax: bands.reduce((sum, band) => sum + band.tax, 0) };
}

function surchargeRateFor(taxableIncome: number): number {
  if (taxableIncome > 50_000_000) return 0.25;
  if (taxableIncome > 20_000_000) return 0.25;
  if (taxableIncome > 10_000_000) return 0.15;
  if (taxableIncome > 5_000_000) return 0.1;
  return 0;
}

function rebateFor(
  taxableIncome: number,
  taxBeforeRebate: number,
): { rebate: number; rebateMarginalRelief: number; taxAfterRebate: number } {
  const rebate = taxableIncome <= NEW_REGIME_REBATE_LIMIT
    ? Math.min(taxBeforeRebate, NEW_REGIME_REBATE_CAP)
    : 0;
  const postRebateTax = taxBeforeRebate - rebate;
  const rebateMarginalRelief = taxableIncome > NEW_REGIME_REBATE_LIMIT
    ? Math.max(0, postRebateTax - (taxableIncome - NEW_REGIME_REBATE_LIMIT))
    : 0;
  return {
    rebate,
    rebateMarginalRelief,
    taxAfterRebate: postRebateTax - rebateMarginalRelief,
  };
}

function taxAfterRebateAt(taxableIncome: number): number {
  const { tax } = calculateSlabs(taxableIncome);
  return rebateFor(taxableIncome, tax).taxAfterRebate;
}

/** New/default-regime salary estimate for a resident individual below age 60. */
export function estimateIncomeTax(
  grossSalary: number,
  taxPeriod: CtcTaxPeriod = "tax-year-2026-27",
  employmentTaxPaid = 0,
): TaxEstimate {
  const safeGrossSalary = Math.max(0, grossSalary);
  const standardDeduction = Math.min(safeGrossSalary, 75_000);
  const safeEmploymentTaxPaid = Number.isFinite(employmentTaxPaid)
    ? Math.max(0, employmentTaxPaid)
    : 0;
  const employmentTaxDeduction = Math.min(
    safeEmploymentTaxPaid,
    Math.max(0, safeGrossSalary - standardDeduction),
  );
  const taxableIncome = Math.max(0, safeGrossSalary - standardDeduction - employmentTaxDeduction);
  const { bands, tax: taxBeforeRebate } = calculateSlabs(taxableIncome);
  const rebateResult = rebateFor(taxableIncome, taxBeforeRebate);
  const surchargeRate = surchargeRateFor(taxableIncome);
  const surchargeBeforeRelief = rebateResult.taxAfterRebate * surchargeRate;
  const taxAndSurchargeBeforeRelief = rebateResult.taxAfterRebate + surchargeBeforeRelief;
  const allowedTaxAndSurcharge = SURCHARGE_THRESHOLDS
    .filter((threshold) => taxableIncome > threshold)
    .reduce((allowed, threshold) => {
      const thresholdTax = taxAfterRebateAt(threshold);
      const thresholdSurcharge = thresholdTax * surchargeRateFor(threshold);
      return Math.min(allowed, thresholdTax + thresholdSurcharge + taxableIncome - threshold);
    }, Number.POSITIVE_INFINITY);
  const surchargeMarginalRelief = Number.isFinite(allowedTaxAndSurcharge)
    ? Math.max(0, taxAndSurchargeBeforeRelief - allowedTaxAndSurcharge)
    : 0;
  const surcharge = Math.max(0, surchargeBeforeRelief - surchargeMarginalRelief);
  const cess = (rebateResult.taxAfterRebate + surcharge) * CESS_RATE;

  return {
    taxPeriod,
    grossSalary: safeGrossSalary,
    standardDeduction,
    employmentTaxDeduction,
    taxableIncome,
    taxBeforeRebate,
    ...rebateResult,
    surchargeRate,
    surcharge,
    surchargeMarginalRelief,
    cess,
    tax: rebateResult.taxAfterRebate + surcharge + cess,
    bands,
  };
}

/** The shared CTC-to-in-hand model used by the UI, examples, snapshots, and tests. */
export function calculateCtc(
  inputs: CtcInputs,
  taxPeriod: CtcTaxPeriod = "tax-year-2026-27",
): CtcCalculation {
  const annualGrossAtTarget = Math.max(0, inputs.annualFixedPay) + Math.max(0, inputs.annualVariablePay);
  const annualGrossAtZeroVariable = Math.max(0, inputs.annualFixedPay);
  const annualBasic = Math.max(0, inputs.annualFixedPay) * Math.min(100, Math.max(0, inputs.basicPercentOfFixed)) / 100;
  const monthlyBasic = annualBasic / 12;
  const pfBasis = inputs.pfContributionBasis ?? "manual";
  const pfMonthlySchedule = calculatePfSchedule(annualBasic, pfBasis, inputs.pfEmploymentStartDate);
  const annualPfWageBase = pfMonthlySchedule.reduce((sum, month) => sum + month.wageBase, 0);
  const annualEmployeePfAtZeroVariable = pfBasis === "manual"
    ? Math.max(0, inputs.annualEmployeePfAtZeroVariable)
    : pfMonthlySchedule.reduce((sum, month) => sum + month.employeeContribution, 0);
  const annualEmployeePf = pfBasis === "manual"
    ? Math.max(0, inputs.annualEmployeePfAtTarget)
    : pfMonthlySchedule.reduce((sum, month) => sum + month.employeeContribution, 0);
  const monthlyEmployeePfAtZeroVariable = annualEmployeePfAtZeroVariable / 12;
  const monthlyEmployeePf = annualEmployeePf / 12;
  const annualEmployerPfContribution = pfBasis === "manual"
    ? Math.max(0, inputs.annualEmployerPfAtTarget)
    : pfMonthlySchedule.reduce((sum, month) => sum + month.employerContribution, 0);
  const annualEmployerEps = pfBasis === "manual"
    ? 0
    : pfMonthlySchedule.reduce((sum, month) => sum + month.employerEps, 0);
  const annualEmployerEpf = pfBasis === "manual"
    ? annualEmployerPfContribution
    : pfMonthlySchedule.reduce((sum, month) => sum + month.employerEpf, 0);
  const annualEmployerPf = inputs.employerPfIncluded ? annualEmployerPfContribution : 0;
  const annualProfessionalTax = Math.max(0, inputs.annualProfessionalTax);
  const annualGratuityInCtc = Math.max(0, inputs.annualGratuityInCtc);
  const annualOtherEmployerCosts = Math.max(0, inputs.annualOtherEmployerCosts);
  const annualEmployerComponents = annualEmployerPf + annualGratuityInCtc + annualOtherEmployerCosts;
  const ctcShortfall = Math.max(
    0,
    annualGrossAtTarget + annualEmployerComponents - Math.max(0, inputs.annualCtc),
  );
  const annualUnallocatedCtc = Math.max(
    0,
    Math.max(0, inputs.annualCtc) - annualGrossAtTarget - annualEmployerComponents,
  );
  const taxAtTarget = estimateIncomeTax(annualGrossAtTarget, taxPeriod, annualProfessionalTax);
  const taxAtZeroVariable = estimateIncomeTax(annualGrossAtZeroVariable, taxPeriod, annualProfessionalTax);
  const annualTaxAtTarget = taxAtTarget.tax;
  const annualTaxAtZeroVariable = taxAtZeroVariable.tax;
  const annualTakeHomeAtTarget = annualGrossAtTarget - annualEmployeePf - annualProfessionalTax - annualTaxAtTarget;
  const annualTakeHomeAtZeroVariable = annualGrossAtZeroVariable - annualEmployeePfAtZeroVariable - annualProfessionalTax - annualTaxAtZeroVariable;

  return {
    taxPeriod,
    inputs,
    annualGrossAtTarget,
    annualGrossAtZeroVariable,
    annualBasic,
    monthlyBasic,
    monthlyEmployeePfAtZeroVariable,
    monthlyEmployeePf,
    annualEmployeePfAtZeroVariable,
    annualEmployeePf,
    annualEmployerPf,
    annualEmployerEps: inputs.employerPfIncluded ? annualEmployerEps : 0,
    annualEmployerEpf: inputs.employerPfIncluded ? annualEmployerEpf : 0,
    annualPfWageBase,
    pfMonthlySchedule,
    annualEmployerComponents,
    annualUnallocatedCtc,
    ctcShortfall,
    taxAtTarget,
    taxAtZeroVariable,
    annualTaxAtTarget,
    annualTaxAtZeroVariable,
    annualTakeHomeAtTarget,
    annualTakeHomeAtZeroVariable,
    monthlyTaxOnlyAtTarget: (annualGrossAtTarget - annualTaxAtTarget) / 12,
    monthlyTaxOnlyAtZeroVariable: (annualGrossAtZeroVariable - annualTaxAtZeroVariable) / 12,
    monthlyInHandAtTargetAverage: annualTakeHomeAtTarget / 12,
    monthlyInHandAtZeroVariable: annualTakeHomeAtZeroVariable / 12,
    effectiveTaxRateAtTarget: annualGrossAtTarget > 0 ? annualTaxAtTarget / annualGrossAtTarget : 0,
    effectiveDeductionRateAtTarget: annualGrossAtTarget > 0
      ? (annualTaxAtTarget + annualEmployeePf + annualProfessionalTax) / annualGrossAtTarget
      : 0,
  };
}

export type CtcOfferComparisonInput = {
  current: CtcInputs;
  offer: CtcInputs;
  taxPeriod?: CtcTaxPeriod;
  joiningBonusClawback: number;
  noticePeriodCost: number;
  relocationCost: number;
  additionalAnnualCommuteCost: number;
};

export function compareCtcOffers(input: CtcOfferComparisonInput) {
  const taxPeriod = input.taxPeriod ?? "tax-year-2026-27";
  const current = calculateCtc(input.current, taxPeriod);
  const offer = calculateCtc(input.offer, taxPeriod);
  if (current.ctcShortfall > 0) throw new Error("The current pay components exceed current CTC.");
  if (offer.ctcShortfall > 0) throw new Error("The offer pay components exceed offer CTC.");
  const oneTimeCosts = input.joiningBonusClawback + input.noticePeriodCost + input.relocationCost;
  const recurringFirstYearCost = input.additionalAnnualCommuteCost;
  return {
    current,
    offer,
    oneTimeCosts,
    recurringFirstYearCost,
    offerFirstYearAtZeroVariable: offer.annualTakeHomeAtZeroVariable - oneTimeCosts - recurringFirstYearCost,
    offerFirstYearAtTarget: offer.annualTakeHomeAtTarget - oneTimeCosts - recurringFirstYearCost,
  };
}

export const ctcWorkedExamples: Array<{ id: string; label: string; description: string; inputs: CtcInputs }> = [
  {
    id: "lower",
    label: "₹8L package · no target bonus",
    description: "Illustrative only: employee PF and professional tax are both set to ₹0. Replace them with payroll amounts.",
    inputs: {
      annualCtc: 800_000,
      annualFixedPay: 764_000,
      annualVariablePay: 0,
      basicPercentOfFixed: 50,
      annualEmployeePfAtZeroVariable: 0,
      annualEmployeePfAtTarget: 0,
      annualEmployerPfAtTarget: 0,
      employerPfIncluded: true,
      stateOrUt: "Not specified",
      annualProfessionalTax: 0,
      annualGratuityInCtc: 0,
      annualOtherEmployerCosts: 0,
    },
  },
  {
    id: "mid",
    label: "₹12L package · modest target bonus",
    description: "6% target variable. Employee PF and professional tax are both set to ₹0; replace them with payroll amounts.",
    inputs: {
      annualCtc: 1_200_000,
      annualFixedPay: 1_092_000,
      annualVariablePay: 72_000,
      basicPercentOfFixed: 50,
      annualEmployeePfAtZeroVariable: 0,
      annualEmployeePfAtTarget: 0,
      annualEmployerPfAtTarget: 0,
      employerPfIncluded: true,
      stateOrUt: "Not specified",
      annualProfessionalTax: 0,
      annualGratuityInCtc: 0,
      annualOtherEmployerCosts: 0,
    },
  },
  {
    id: "20lpa",
    label: "₹20L package · 10% target variable",
    description: "Illustration using the FY 2026–27 statutory ceilings and an explicitly entered 1 April 2026 start date.",
    inputs: {
      annualCtc: 2_000_000,
      annualFixedPay: 1_784_000,
      annualVariablePay: 180_000,
      basicPercentOfFixed: 50,
      annualEmployeePfAtZeroVariable: 0,
      annualEmployeePfAtTarget: 0,
      annualEmployerPfAtTarget: 0,
      pfContributionBasis: "statutory-ceiling",
      pfEmploymentStartDate: "2026-04-01",
      employerPfIncluded: true,
      stateOrUt: "Not specified",
      annualProfessionalTax: 0,
      annualGratuityInCtc: 0,
      annualOtherEmployerCosts: 0,
    },
  },
  {
    id: "40lpa",
    label: "₹40L package · higher target bonus",
    description: "A higher package with the same 10% target variable share.",
    inputs: {
      annualCtc: 4_000_000,
      annualFixedPay: 3_604_000,
      annualVariablePay: 360_000,
      basicPercentOfFixed: 50,
      annualEmployeePfAtZeroVariable: 0,
      annualEmployeePfAtTarget: 0,
      annualEmployerPfAtTarget: 0,
      employerPfIncluded: true,
      stateOrUt: "Not specified",
      annualProfessionalTax: 0,
      annualGratuityInCtc: 0,
      annualOtherEmployerCosts: 0,
    },
  },
];

export const ctcWorkedExampleResults = ctcWorkedExamples.map((example) => ({
  ...example,
  result: calculateCtc(example.inputs),
}));

export const defaultCtcInputs: CtcInputs = {
  ...ctcWorkedExamples[2].inputs,
  pfContributionBasis: "manual",
  pfEmploymentStartDate: undefined,
  annualEmployeePfAtZeroVariable: 36_000,
  annualEmployeePfAtTarget: 36_000,
  annualEmployerPfAtTarget: 36_000,
};
