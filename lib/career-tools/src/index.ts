export const CAREER_TOOL_IDS = [
  "offer-comparison",
  "tax-regime-comparison",
  "gratuity-estimator",
  "final-pay-estimator",
  "layoff-runway",
  "home-loan-stress-test",
  "resign-or-stay",
  "employer-due-diligence",
] as const;

export type CareerToolId = (typeof CAREER_TOOL_IDS)[number];
export type CareerToolInput = Record<string, string | number | boolean | undefined>;

export type CareerToolResult = {
  summary: string;
  rows: Array<{
    label: string;
    value: string | number;
    format?: "inr" | "months" | "decimal";
  }>;
  notes: string[];
  links?: Array<{ label: string; url: string }>;
  tables?: Array<{
    caption: string;
    columns: string[];
    rows: Array<Array<string | number>>;
  }>;
};

const MAX_AMOUNT = 1_000_000_000_000;

function numberInput(
  input: CareerToolInput,
  key: string,
  options: { min?: number; max?: number; fallback?: number } = {},
): number {
  const raw = input[key];
  if (raw === undefined || raw === "") {
    if (options.fallback !== undefined) return options.fallback;
    throw new Error(`Enter a value for ${key}.`);
  }
  const normalized = String(raw).replace(/[,\s₹]/g, "");
  const value = Number(normalized);
  const min = options.min ?? 0;
  const max = options.max ?? MAX_AMOUNT;
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Enter a number between ${min} and ${max} for ${key}.`);
  }
  return value;
}

function textInput(input: CareerToolInput, key: string, maxLength: number): string {
  const value = String(input[key] ?? "").trim();
  if (!value || value.length > maxLength) {
    throw new Error(`Enter a value for ${key} using no more than ${maxLength} characters.`);
  }
  return value;
}

function annualizedMonthly(monthly: number): number {
  return monthly * 12;
}

function loanEmi(principal: number, annualRatePercent: number, termMonths: number): number {
  const monthlyRate = annualRatePercent / 1200;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = (1 + monthlyRate) ** termMonths;
  return principal * monthlyRate * factor / (factor - 1);
}

function offerComparison(input: CareerToolInput): CareerToolResult {
  const currentFixed = numberInput(input, "currentFixed");
  const currentVariable = numberInput(input, "currentVariable", { fallback: 0 });
  const offerFixed = numberInput(input, "offerFixed");
  const offerVariable = numberInput(input, "offerVariable", { fallback: 0 });
  const currentAtTarget = currentFixed + currentVariable;
  const offerAtTarget = offerFixed + offerVariable;
  return {
    summary: "This is a comparison of the annual cash amounts you entered. Target variable pay is not guaranteed and is shown separately from fixed cash.",
    rows: [
      { label: "Current fixed annual cash", value: currentFixed, format: "inr" },
      { label: "Current annual cash at full variable target", value: currentAtTarget, format: "inr" },
      { label: "Offer fixed annual cash", value: offerFixed, format: "inr" },
      { label: "Offer annual cash at full variable target", value: offerAtTarget, format: "inr" },
      { label: "Fixed-cash difference (offer minus current)", value: offerFixed - currentFixed, format: "inr" },
      { label: "Target-cash difference (offer minus current)", value: offerAtTarget - currentAtTarget, format: "inr" },
    ],
    notes: [
      "This does not estimate take-home pay, tax, benefits, or the likelihood of a variable-pay payout.",
      "Confirm the fixed/variable split, payout conditions, joining-bonus recovery terms, and payment timing in the written offer.",
    ],
  };
}

type OldTaxEstimate = {
  grossSalary: number;
  standardDeduction: number;
  otherDeductions: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  cess: number;
  tax: number;
};

export function estimateOldRegimeTax(grossSalary: number, otherDeductions = 0): OldTaxEstimate {
  if (!Number.isFinite(grossSalary) || grossSalary < 0 || grossSalary > MAX_AMOUNT) {
    throw new Error("Enter a valid annual salary amount.");
  }
  if (!Number.isFinite(otherDeductions) || otherDeductions < 0 || otherDeductions > MAX_AMOUNT) {
    throw new Error("Enter a valid old-regime deduction amount.");
  }
  const standardDeduction = Math.min(grossSalary, 50_000);
  const taxableIncome = Math.max(0, grossSalary - standardDeduction - otherDeductions);
  const taxAt = (income: number) =>
    Math.max(0, Math.min(income, 500_000) - 250_000) * 0.05 +
    Math.max(0, Math.min(income, 1_000_000) - 500_000) * 0.2 +
    Math.max(0, income - 1_000_000) * 0.3;
  const taxBeforeRebate = taxAt(taxableIncome);
  const rebate = taxableIncome <= 500_000 ? Math.min(taxBeforeRebate, 12_500) : 0;
  const baseTax = taxBeforeRebate - rebate;
  const thresholds = [5_000_000, 10_000_000, 20_000_000, 50_000_000];
  const surchargeRate = (income: number) => income > 50_000_000 ? 0.37
    : income > 20_000_000 ? 0.25
      : income > 10_000_000 ? 0.15
        : income > 5_000_000 ? 0.1 : 0;
  const rawSurcharge = baseTax * surchargeRate(taxableIncome);
  const permittedWithSurcharge = thresholds
    .filter((threshold) => taxableIncome > threshold)
    .reduce((permitted, threshold) => {
      const thresholdTax = taxAt(threshold);
      return Math.min(permitted, thresholdTax + thresholdTax * surchargeRate(threshold) + taxableIncome - threshold);
    }, Number.POSITIVE_INFINITY);
  const surchargeMarginalRelief = Number.isFinite(permittedWithSurcharge)
    ? Math.max(0, baseTax + rawSurcharge - permittedWithSurcharge)
    : 0;
  const surcharge = Math.max(0, rawSurcharge - surchargeMarginalRelief);
  const cess = (baseTax + surcharge) * 0.04;
  return {
    grossSalary,
    standardDeduction,
    otherDeductions,
    taxableIncome,
    taxBeforeRebate,
    rebate,
    surcharge,
    surchargeMarginalRelief,
    cess,
    tax: baseTax + surcharge + cess,
  };
}

function taxRegimeComparison(input: CareerToolInput): CareerToolResult {
  const grossSalary = numberInput(input, "grossSalary");
  const section80C = Math.min(150_000, numberInput(input, "section80C", { fallback: 0 }));
  const section80D = Math.min(25_000, numberInput(input, "section80D", { fallback: 0 }));
  const nps80ccd1b = Math.min(50_000, numberInput(input, "nps80ccd1b", { fallback: 0 }));
  const additionalEligibleDeductions = numberInput(input, "oldRegimeDeductions", { fallback: 0 });
  const basicSalary = numberInput(input, "annualBasicSalary", { fallback: 0 });
  const hraReceived = numberInput(input, "annualHraReceived", { fallback: 0 });
  const rentPaid = numberInput(input, "annualRentPaid", { fallback: 0 });
  const metro = String(input.hraCityType ?? "non-metro") === "metro";
  const hraExemption = Math.max(0, Math.min(
    hraReceived,
    rentPaid - basicSalary * 0.1,
    basicSalary * (metro ? 0.5 : 0.4),
  ));
  const otherDeductions = section80C + section80D + nps80ccd1b + hraExemption + additionalEligibleDeductions;
  const old = estimateOldRegimeTax(grossSalary, otherDeductions);
  const newTax = numberInput(input, "newTax");
  const difference = Math.abs(old.tax - newTax);
  let low = 0;
  let high = grossSalary;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (estimateOldRegimeTax(grossSalary, otherDeductions + mid).tax <= newTax) high = mid;
    else low = mid;
  }
  const additionalDeductionNeeded = old.tax <= newTax ? 0 : high;
  return {
    summary: "A limited AY 2026–27 comparison for a resident salaried individual below age 60 with salary income only. The old-regime result uses the entered eligible deductions; the new-regime result uses the shared salary-tax model.",
    rows: [
      { label: "Annual gross salary entered", value: grossSalary, format: "inr" },
      { label: "Old-regime standard deduction used", value: old.standardDeduction, format: "inr" },
      { label: "Section 80C entered (limited to ₹1.5 lakh)", value: section80C, format: "inr" },
      { label: "Section 80D entered (limited to ₹25,000; under-60 case)", value: section80D, format: "inr" },
      { label: "Additional NPS deduction entered under 80CCD(1B)", value: nps80ccd1b, format: "inr" },
      { label: "HRA exemption estimate", value: hraExemption, format: "inr" },
      { label: "Other eligible deductions entered", value: additionalEligibleDeductions, format: "inr" },
      { label: "Old-regime deductions used", value: old.otherDeductions, format: "inr" },
      { label: "Old-regime taxable income estimate", value: old.taxableIncome, format: "inr" },
      { label: "Old-regime tax before rebate", value: old.taxBeforeRebate, format: "inr" },
      { label: "Old-regime rebate", value: old.rebate, format: "inr" },
      { label: "Old-regime surcharge", value: old.surcharge, format: "inr" },
      { label: "Old-regime surcharge marginal relief", value: old.surchargeMarginalRelief, format: "inr" },
      { label: "Old-regime cess", value: old.cess, format: "inr" },
      { label: "Estimated old-regime tax", value: old.tax, format: "inr" },
      { label: "Estimated new-regime tax", value: newTax, format: "inr" },
      { label: "Absolute difference", value: difference, format: "inr" },
      { label: "Additional eligible old-regime deduction needed to reach the new-regime tax", value: additionalDeductionNeeded, format: "inr" },
      { label: "Lower estimated tax", value: old.tax === newTax ? "The estimates are equal" : old.tax < newTax ? "Old regime" : "New regime" },
    ],
    notes: [
      "This estimate covers normal-rate salary income only. It does not handle special-rate income, other income heads, age-based slab relief, every exemption, or filing-specific rounding.",
      "The deductions field is a total you have verified as eligible under the old regime; this tool does not determine eligibility or section-specific limits. Do not enter the standard deduction again.",
      "The HRA figure is a basic three-part estimate from entered annual basic pay, HRA received, rent, and metro/non-metro selection. Confirm HRA eligibility, city classification, and salary components before relying on it. Section 80D uses the under-60 cap; age-specific and family cases are not modeled.",
      "The old-regime comparison uses the official AY 2026–27 rates and a ₹50,000 salary standard deduction. The new-regime side uses the separate CareerReality model for the same assessment year.",
      "Confirm both cases in the official Income Tax Department calculator before filing or changing payroll withholding.",
    ],
    links: [{
      label: "Income Tax Department: tax rates for AY 2026–27",
      url: "https://www.incometaxindia.gov.in/w/tax-rates%E2%80%8B",
    }, {
      label: "Income Tax Department: AY 2026–27 deductions, including salary standard deduction",
      url: "https://www.incometaxindia.gov.in/w/deductions-allowable-to-tax-payer",
    }, {
      label: "Income Tax Department: salaried individuals and deductions",
      url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?Id=292",
    }, {
      label: "Income Tax Department: official tax calculator",
      url: "https://www.incometaxindia.gov.in/income-tax-calculator",
    }],
  };
}

function gratuityEstimate(input: CareerToolInput): CareerToolResult {
  const monthlyWageBase = numberInput(input, "monthlyWageBase");
  const completedYears = numberInput(input, "completedYears", { max: 60 });
  const additionalMonths = numberInput(input, "additionalMonths", { max: 11, fallback: 0 });
  if (!Number.isInteger(completedYears)) throw new Error("Completed years of service must be a whole number.");
  if (!Number.isInteger(additionalMonths)) throw new Error("Additional service months must be a whole number.");
  const serviceType = String(input.serviceType ?? "standard");
  if (!["standard", "fixed-term", "death", "disablement"].includes(serviceType)) {
    throw new Error("Choose a listed gratuity service category.");
  }
  const totalMonths = completedYears * 12 + additionalMonths;
  const formulaYears = serviceType === "fixed-term" || serviceType === "death"
    ? totalMonths / 12
    : completedYears + (additionalMonths > 6 ? 1 : 0);
  const estimate = monthlyWageBase * 15 / 26 * formulaYears;
  const statutoryCeiling = 2_000_000;
  const eligible = serviceType === "fixed-term"
    ? totalMonths >= 12
    : serviceType === "standard"
      ? totalMonths >= 60
      : totalMonths > 0;
  const categoryLabel = serviceType === "fixed-term"
    ? "Fixed-term contract expiry"
    : serviceType === "death" ? "Death of employee"
      : serviceType === "disablement" ? "Disablement"
        : "Other termination";
  return {
    summary: "A gratuity estimate using the wage base and service category you entered. It is not a determination of the legally applicable wage base or final entitlement.",
    rows: [
      { label: "Service category selected", value: categoryLabel },
      { label: "Entered monthly wage base", value: monthlyWageBase, format: "inr" },
      { label: "Service months entered", value: totalMonths },
      { label: "Formula service years", value: formulaYears },
      { label: "Five-year / one-year threshold met for selected category", value: eligible ? "Yes" : "No" },
      { label: "Formula amount before ceiling", value: estimate, format: "inr" },
      { label: "Current Ministry-stated maximum", value: statutoryCeiling, format: "inr" },
      { label: "Ceiling-limited estimate", value: Math.min(estimate, statutoryCeiling), format: "inr" },
    ],
    notes: [
      "The Ministry's Labour Codes FAQ says five years is generally required, with exceptions for death, disablement, and fixed-term contract expiry. This worksheet uses exact-month pro-rata arithmetic for fixed-term expiry and deceased employees; disablement keeps the ordinary service-year rounding rule. It does not determine other special-case facts.",
      "The Ministry FAQ states a ₹20 lakh maximum as current. The amount entered as monthly wage base must be checked against the applicable statutory wage definition and employment records.",
      "The ordinary formula rounds a service fraction only when it exceeds six months. Piece-rated and seasonal cases are not modeled.",
    ],
    links: [{
      label: "Ministry of Labour and Employment: Additional FAQs on Labour Codes (16 March 2026)",
      url: "https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf",
    }, {
      label: "Ministry of Labour and Employment: FAQs on Labour Codes (30 December 2025)",
      url: "https://www.labour.gov.in/static/uploads/2026/01/de4758d5bfeffc456d7de97a801891b0.pdf",
    }, {
      label: "India Code: Code on Social Security, 2020",
      url: "https://www.indiacode.nic.in/indiacode/bitstream/123456789/16823/1/aA2020-36.pdf",
    }],
  };
}

function finalPayEstimate(input: CareerToolInput): CareerToolResult {
  const monthlyCash = numberInput(input, "monthlyCash");
  const monthlyDaysBasis = numberInput(input, "monthlyDaysBasis", { min: 1, max: 31 });
  const noticeDays = numberInput(input, "noticeDays", { max: 365, fallback: 0 });
  const unusedLeaveDays = numberInput(input, "unusedLeaveDays", { max: 365, fallback: 0 });
  const dailyRate = monthlyCash / monthlyDaysBasis;
  const noticePay = dailyRate * noticeDays;
  const leavePay = dailyRate * unusedLeaveDays;
  return {
    summary: "A gross arithmetic worksheet using the daily-rate basis and days you entered.",
    rows: [
      { label: "Daily rate used", value: dailyRate, format: "inr" },
      { label: "Notice amount at entered days", value: noticePay, format: "inr" },
      { label: "Leave amount at entered days", value: leavePay, format: "inr" },
      { label: "Combined gross arithmetic total", value: noticePay + leavePay, format: "inr" },
    ],
    notes: [
      "The tool does not decide whether notice pay or leave encashment is owed, which wage components apply, or which divisor your employer must use.",
      "Use the figures and policy terms confirmed in your contract, final statement, and applicable official rules. Tax, deductions, and other adjustments are not included.",
    ],
  };
}

function layoffRunway(input: CareerToolInput): CareerToolResult {
  const liquidSavings = numberInput(input, "liquidSavings");
  const severance = numberInput(input, "severance", { fallback: 0 });
  const essentialMonthlyCosts = numberInput(input, "essentialMonthlyCosts");
  const monthlyDebtPayments = numberInput(input, "monthlyDebtPayments", { fallback: 0 });
  const otherMonthlyIncome = numberInput(input, "otherMonthlyIncome", { fallback: 0 });
  const monthlyBurn = essentialMonthlyCosts + monthlyDebtPayments - otherMonthlyIncome;
  const availableFunds = liquidSavings + severance;
  const months = monthlyBurn > 0 ? availableFunds / monthlyBurn : null;
  const firstBelowZeroMonth = months === null ? null : Math.floor(months + 1e-10) + 1;
  let balance = availableFunds;
  const projection = Array.from({ length: 12 }, (_, index) => {
    const opening = balance;
    const closing = opening - monthlyBurn;
    balance = closing;
    return [index + 1, opening, -monthlyBurn, closing];
  });
  return {
    summary: months === null
      ? "The entered monthly income is at least as large as the entered costs, so this set of inputs has no positive monthly burn to divide."
      : "Arithmetic runway from the funds and monthly costs you entered; it is not a forecast of when another job will arrive.",
    rows: [
      { label: "Liquid savings plus stated severance", value: availableFunds, format: "inr" },
      { label: "Monthly net outflow (negative means surplus)", value: monthlyBurn, format: "inr" },
      { label: "Runway at the entered monthly burn", value: months ?? "Not calculated", ...(months === null ? {} : { format: "months" as const }) },
      { label: "First month projected below zero", value: firstBelowZeroMonth === null ? "No depletion at this monthly net flow" : `Month ${firstBelowZeroMonth}` },
    ],
    notes: [
      "Do not count unvested equity, unpaid variable pay, or a possible bonus as available cash.",
      "The calculation does not include tax, inflation, emergencies, benefit changes, or future income unless you enter them.",
      "The projection assumes the same monthly net burn in every month and does not model the dates or timing of payments.",
    ],
    tables: [{
      caption: "Illustrative 12-month cash projection at the entered monthly burn",
      columns: ["Month", "Opening available funds (₹)", "Monthly net change (₹)", "Closing available funds (₹)"],
      rows: projection,
    }],
  };
}

function homeLoanStressTest(input: CareerToolInput): CareerToolResult {
  const principal = numberInput(input, "loanPrincipal");
  const annualRate = numberInput(input, "annualRatePercent", { max: 100 });
  const stressRate = numberInput(input, "stressRatePercent", { max: 100 });
  const termMonths = numberInput(input, "termMonths", { min: 1, max: 600 });
  if (!Number.isInteger(termMonths)) throw new Error("Loan term must be a whole number of months.");
  const monthlyTakeHome = numberInput(input, "monthlyTakeHome");
  const otherMonthlyCosts = numberInput(input, "otherMonthlyCosts", { fallback: 0 });
  const currentEmi = loanEmi(principal, annualRate, termMonths);
  const stressEmi = loanEmi(principal, stressRate, termMonths);
  const monthlyRate = annualRate / 1200;
  let balance = principal;
  const amortization = Array.from({ length: termMonths }, (_, index) => {
    const opening = balance;
    const interest = opening * monthlyRate;
    const scheduledPrincipal = Math.min(opening, currentEmi - interest);
    balance = Math.max(0, opening - scheduledPrincipal);
    return [index + 1, opening, currentEmi, interest, scheduledPrincipal, balance];
  });
  const totalPaid = amortization.reduce((sum, row) => sum + Number(row[2]), 0);
  const totalInterest = amortization.reduce((sum, row) => sum + Number(row[3]), 0);
  return {
    summary: "Estimated monthly instalments from the loan amount, rates, and term you entered. The stressed rate is a scenario, not a prediction.",
    rows: [
      { label: "Monthly payment at entered rate", value: currentEmi, format: "inr" },
      { label: "Monthly payment at entered stress rate", value: stressEmi, format: "inr" },
      { label: "Payment increase in this scenario", value: stressEmi - currentEmi, format: "inr" },
      { label: "Total scheduled payments at entered rate", value: totalPaid, format: "inr" },
      { label: "Total interest at entered rate", value: totalInterest, format: "inr" },
      { label: "Monthly cash after stressed payment and stated costs", value: monthlyTakeHome - stressEmi - otherMonthlyCosts, format: "inr" },
      { label: "Loan term entered", value: termMonths, format: "months" },
    ],
    notes: [
      "This standard EMI arithmetic does not model lender fees, insurance, rate-reset timing, prepayments, or changes to tenure.",
      "Check your lender's amortisation schedule and loan agreement before relying on a payment figure.",
    ],
    tables: [{
      caption: "Monthly amortisation at the entered annual interest rate",
      columns: ["Month", "Opening balance (₹)", "Payment (₹)", "Interest (₹)", "Principal repaid (₹)", "Closing balance (₹)"],
      rows: amortization,
    }],
  };
}

const DECISION_FACTORS = [
  ["cash", "Cash and obligations"],
  ["health", "Health and energy"],
  ["scope", "Work scope and authority"],
  ["learning", "Learning and future proof"],
  ["location", "Location and daily life"],
] as const;

function resignOrStay(input: CareerToolInput): CareerToolResult {
  const rows = DECISION_FACTORS.map(([key, label]) => {
    const importance = numberInput(input, `${key}Importance`, { min: 1, max: 5 });
    const stay = numberInput(input, `${key}Stay`, { min: 1, max: 5 });
    const move = numberInput(input, `${key}Move`, { min: 1, max: 5 });
    return {
      label,
      stay: stay * importance,
      move: move * importance,
      importance,
    };
  });
  const stayTotal = rows.reduce((sum, row) => sum + row.stay, 0);
  const moveTotal = rows.reduce((sum, row) => sum + row.move, 0);
  return {
    summary: "These totals are only the weighted values you entered. They are not an outcome score, recommendation, or prediction.",
    rows: [
      ...rows.flatMap((row) => [
        { label: `${row.label}: stay value × importance`, value: row.stay },
        { label: `${row.label}: move value × importance`, value: row.move },
      ]),
      { label: "Stay: sum of entered weighted values", value: stayTotal },
      { label: "Move: sum of entered weighted values", value: moveTotal },
    ],
    notes: [
      "Before acting, verify the new offer and joining conditions, notice obligations, bonus or training recovery clauses, and the household cash runway.",
      "A difference between the totals does not settle the decision. Change the assumptions when new evidence arrives and keep non-negotiable constraints visible.",
    ],
  };
}

function employerDueDiligence(input: CareerToolInput): CareerToolResult {
  const employerName = textInput(input, "employerName", 120);
  return {
    summary: `A verification checklist for ${employerName}. No company record, rating, score, or safety claim is generated.`,
    rows: [
      { label: "Legal identity", value: "Match the name and registration details on the offer to the company's official filings." },
      { label: "Listed-company filings", value: "If listed, check exchange announcements and financial filings for the exact legal entity." },
      { label: "Role and authority", value: "Ask what work is funded now, who owns the decision, and what is still only a plan." },
      { label: "Written terms", value: "Confirm fixed pay, variable conditions, location, reporting line, notice, and any recovery clauses in writing." },
      { label: "Employment trail", value: "Check that the employing entity on payroll, tax, and provident-fund records matches what you were told." },
      { label: "Specific unresolved question", value: "Write the answer you still need and ask the recruiter or hiring manager to confirm it in writing." },
    ],
    notes: [
      "Search by the exact legal name, not only the brand name. A result with a similar name is not proof that it is the same employer.",
      "The checklist helps you collect evidence; it does not establish financial health, workplace quality, or future job security.",
    ],
    links: [
      {
        label: "Ministry of Corporate Affairs: company master data",
        url: "https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS/company-master-info.html",
      },
      {
        label: "National Stock Exchange: corporate filings and announcements",
        url: "https://www.nseindia.com/companies-listing/corporate-filings-announcements",
      },
      {
        label: "Employees' Provident Fund Organisation",
        url: "https://www.epfindia.gov.in/site_en/index.php",
      },
    ],
  };
}

export function calculateCareerTool(
  toolId: CareerToolId,
  input: CareerToolInput,
): CareerToolResult {
  switch (toolId) {
    case "offer-comparison": return offerComparison(input);
    case "tax-regime-comparison": return taxRegimeComparison(input);
    case "gratuity-estimator": return gratuityEstimate(input);
    case "final-pay-estimator": return finalPayEstimate(input);
    case "layoff-runway": return layoffRunway(input);
    case "home-loan-stress-test": return homeLoanStressTest(input);
    case "resign-or-stay": return resignOrStay(input);
    case "employer-due-diligence": return employerDueDiligence(input);
  }
}

export * from "./job-posting-analysis";
export * from "./job-posting-readiness";
