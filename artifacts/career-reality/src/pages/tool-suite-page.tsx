import { useState, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { ArrowUpRight, Calculator, Download, RotateCcw } from "lucide-react";
import {
  calculateCareerTool,
  type CareerToolId,
  type CareerToolInput,
  type CareerToolResult,
} from "@workspace/career-tools";
import { calculateCtc, compareCtcOffers, ctcTaxPeriodLabels, type CtcInputs, type CtcTaxPeriod } from "@/lib/ctc-calculator";
import { trackDecisionToolCompletion } from "@/lib/analytics";
import { LayoffAlertSignup } from "@/components/shared/layoff-alert-signup";
import { ResultSharePanel } from "@/components/shared/result-share-panel";
import { PublicPage } from "@/components/shared/public-shell";
import routeRegistry from "@/data/route-registry";

type Field = {
  key: string;
  label: string;
  hint?: string;
  type?: "number" | "text" | "date" | "select";
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
  options?: Array<{ value: string; label: string }>;
};

const decisionFields: Field[] = [
  ["cash", "Cash and obligations"],
  ["health", "Health and energy"],
  ["scope", "Work scope and authority"],
  ["learning", "Learning and future proof"],
  ["location", "Location and daily life"],
].flatMap(([key, label]) => [
  { key: `${key}Importance`, label: `${label}: importance`, hint: "1 = lower priority; 5 = non-negotiable", type: "number" as const, min: 1, max: 5, step: 1 },
  { key: `${key}Stay`, label: `${label}: staying option`, hint: "Your own rating from 1 to 5", type: "number" as const, min: 1, max: 5, step: 1 },
  { key: `${key}Move`, label: `${label}: moving option`, hint: "Your own rating from 1 to 5", type: "number" as const, min: 1, max: 5, step: 1 },
]);

const fieldsByTool: Record<CareerToolId, Field[]> = {
  "offer-comparison": [
    { key: "currentCtc", label: "Current annual CTC (₹)", type: "number", min: 0, step: 1000 },
    { key: "currentFixed", label: "Current fixed annual pay (₹)", type: "number", min: 0, step: 1000 },
    { key: "currentVariable", label: "Current annual variable at target (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "currentBasicPercent", label: "Current basic pay as % of fixed pay", type: "number", min: 0, max: 100, step: 0.1, optional: true },
    { key: "currentPfBasis", label: "Current PF calculation basis", type: "select", options: [{ value: "manual", label: "Use entered payroll amounts" }, { value: "statutory-ceiling", label: "12% on 2026–27 ceiling (₹15,000 → ₹25,000)" }, { value: "actual-basic", label: "12% of full basic pay" }] },
    { key: "currentPfStartDate", label: "Current PF start date in Tax Year 2026–27", type: "date", min: undefined, optional: true, hint: "Enter this yourself when using a calculated PF basis; use 1 April if employment began earlier." },
    { key: "currentEmployeePfZero", label: "Current employee PF at zero variable (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "currentEmployeePfTarget", label: "Current employee PF at full target (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "currentEmployerPf", label: "Current employer PF included in CTC (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "currentEmployerPfIncluded", label: "Is employer PF included in current CTC?", type: "select", options: [{ value: "false", label: "No" }, { value: "true", label: "Yes" }] },
    { key: "currentProfessionalTax", label: "Current professional tax (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "currentGratuity", label: "Current gratuity included in CTC (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "currentOtherCosts", label: "Other current employer costs in CTC (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "offerCtc", label: "New offer annual CTC (₹)", type: "number", min: 0, step: 1000 },
    { key: "offerFixed", label: "New offer fixed annual pay (₹)", type: "number", min: 0, step: 1000 },
    { key: "offerVariable", label: "New offer annual variable at target (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "offerBasicPercent", label: "New offer basic pay as % of fixed pay", type: "number", min: 0, max: 100, step: 0.1, optional: true },
    { key: "offerPfBasis", label: "New offer PF calculation basis", type: "select", options: [{ value: "manual", label: "Use entered payroll amounts" }, { value: "statutory-ceiling", label: "12% on 2026–27 ceiling (₹15,000 → ₹25,000)" }, { value: "actual-basic", label: "12% of full basic pay" }] },
    { key: "offerPfStartDate", label: "New offer PF start date in Tax Year 2026–27", type: "date", optional: true, hint: "Enter this yourself when using a calculated PF basis; use 1 April if employment began earlier." },
    { key: "offerEmployeePfZero", label: "New offer employee PF at zero variable (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "offerEmployeePfTarget", label: "New offer employee PF at full target (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "offerEmployerPf", label: "New offer employer PF included in CTC (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "offerEmployerPfIncluded", label: "Is employer PF included in new offer CTC?", type: "select", options: [{ value: "false", label: "No" }, { value: "true", label: "Yes" }] },
    { key: "offerProfessionalTax", label: "New offer professional tax (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "offerGratuity", label: "New offer gratuity included in CTC (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "offerOtherCosts", label: "Other new-offer employer costs in CTC (₹/year)", type: "number", min: 0, step: 100, optional: true },
    { key: "joiningBonusClawback", label: "Joining-bonus recovery on exit (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "noticePeriodCost", label: "Notice-period cost you expect to pay (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "relocationCost", label: "One-time relocation cost (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "additionalCommute", label: "Additional commute cost for 12 months (₹)", type: "number", min: 0, step: 1000, optional: true },
  ],
  "tax-regime-comparison": [
    { key: "grossSalary", label: "Annual gross salary for AY 2026–27 (₹)", type: "number", min: 0, step: 1000 },
    { key: "section80C", label: "Eligible Section 80C amount (₹)", type: "number", min: 0, step: 1000, optional: true, hint: "Capped at ₹1.5 lakh in this estimate; include only eligible investments or payments." },
    { key: "section80D", label: "Eligible Section 80D amount (₹)", type: "number", min: 0, step: 1000, optional: true, hint: "Under-60 self/family cap only; capped at ₹25,000 here." },
    { key: "nps80ccd1b", label: "Additional NPS deduction under 80CCD(1B) (₹)", type: "number", min: 0, step: 1000, optional: true, hint: "Separate eligible amount, capped at ₹50,000." },
    { key: "oldRegimeDeductions", label: "Other eligible old-regime deductions (₹)", type: "number", min: 0, step: 1000, optional: true, hint: "Enter only other amounts you verified. Do not repeat the standard deduction or the items above." },
    { key: "annualBasicSalary", label: "Annual basic salary for HRA estimate (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "annualHraReceived", label: "Annual HRA received (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "annualRentPaid", label: "Annual rent paid (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "hraCityType", label: "HRA city classification", type: "select", options: [{ value: "non-metro", label: "Non-metro (40%)" }, { value: "metro", label: "Metro (50%)" }] },
  ],
  "gratuity-estimator": [
    { key: "monthlyWageBase", label: "Monthly wage base to test (₹)", type: "number", min: 0, step: 100 },
    { key: "completedYears", label: "Completed years of service", type: "number", min: 0, max: 60, step: 1 },
    { key: "additionalMonths", label: "Additional completed months", type: "number", min: 0, max: 11, step: 1, optional: true },
    { key: "serviceType", label: "Service category", type: "select", options: [{ value: "standard", label: "Other termination (five-year rule)" }, { value: "fixed-term", label: "Fixed-term contract expiry" }, { value: "death", label: "Death of employee" }, { value: "disablement", label: "Disablement" }] },
  ],
  "final-pay-estimator": [
    { key: "monthlyCash", label: "Monthly cash amount used in your document (₹)", type: "number", min: 0, step: 100 },
    { key: "monthlyDaysBasis", label: "Days in the daily-rate divisor", type: "number", min: 1, max: 31, step: 1 },
    { key: "noticeDays", label: "Notice days to calculate", type: "number", min: 0, max: 365, step: 1, optional: true },
    { key: "unusedLeaveDays", label: "Unused leave days to calculate", type: "number", min: 0, max: 365, step: 1, optional: true },
  ],
  "layoff-runway": [
    { key: "liquidSavings", label: "Liquid savings available now (₹)", type: "number", min: 0, step: 1000 },
    { key: "severance", label: "Severance confirmed in writing (₹)", type: "number", min: 0, step: 1000, optional: true },
    { key: "essentialMonthlyCosts", label: "Essential monthly costs (₹)", type: "number", min: 0, step: 1000 },
    { key: "monthlyDebtPayments", label: "Monthly debt payments (₹)", type: "number", min: 0, step: 500, optional: true },
    { key: "otherMonthlyIncome", label: "Other monthly income you expect to continue (₹)", type: "number", min: 0, step: 500, optional: true },
  ],
  "home-loan-stress-test": [
    { key: "loanPrincipal", label: "Loan principal (₹)", type: "number", min: 0, step: 10000 },
    { key: "annualRatePercent", label: "Annual interest rate in your current scenario (%)", type: "number", min: 0, max: 100, step: 0.05 },
    { key: "stressRatePercent", label: "Annual interest rate in your stress scenario (%)", type: "number", min: 0, max: 100, step: 0.05 },
    { key: "termMonths", label: "Loan term (months)", type: "number", min: 1, max: 600, step: 1 },
    { key: "monthlyTakeHome", label: "Monthly take-home amount you enter (₹)", type: "number", min: 0, step: 1000 },
    { key: "otherMonthlyCosts", label: "Other monthly costs (₹)", type: "number", min: 0, step: 500, optional: true },
  ],
  "resign-or-stay": decisionFields,
  "employer-due-diligence": [
    { key: "employerName", label: "Employer or legal entity name", type: "text" },
  ],
};

function displayValue(value: string | number, format?: "inr" | "months" | "decimal"): string {
  if (typeof value !== "number") return value;
  if (format === "inr") return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  if (format === "months") return `${value.toFixed(1)} months`;
  if (format === "decimal") return value.toFixed(2);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safeText = typeof value === "string" && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function downloadOfferComparison(fields: Field[], values: Record<string, string>, result: CareerToolResult, taxPeriod: CtcTaxPeriod): void {
  const inputRows = fields.flatMap((field) => {
    const value = values[field.key] ?? field.options?.[0]?.value ?? "";
    if (!value.trim()) return [];
    const display = field.options?.find((option) => option.value === value)?.label ?? value;
    return [[field.label, display] as [string, string]];
  });
  const rows: Array<Array<string | number>> = [
    ["CareerReality — offer comparison"],
    ["Tax scope", ctcTaxPeriodLabels[taxPeriod]],
    ["Summary", result.summary],
    [],
    ["Entered inputs and assumptions"],
    ["Input", "Value"],
    ...inputRows,
    [],
    ["Calculated results"],
    ["Measure", "Value"],
    ...result.rows.map((row) => [row.label, row.value]),
  ];
  for (const table of result.tables ?? []) {
    rows.push([], [table.caption], table.columns, ...table.rows);
  }
  if (result.notes.length) rows.push([], ["Limits and notes"], ...result.notes.map((note) => [note]));

  const blob = new Blob(["\uFEFF", rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "careerreality-offer-comparison.csv";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function optionalAmount(values: Record<string, string>, key: string): number {
  const value = values[key]?.trim() ?? "";
  if (!value) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Enter a non-negative amount for ${key}.`);
  return parsed;
}

function offerCtcInputs(values: Record<string, string>, prefix: "current" | "offer"): CtcInputs {
  const read = (suffix: string, required = false) => {
    const key = `${prefix}${suffix}`;
    const raw = values[key]?.trim() ?? "";
    if (!raw && !required) return 0;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Enter a valid non-negative amount for ${key}.`);
    return parsed;
  };
  const annualCtc = read("Ctc", true);
  const annualFixedPay = read("Fixed", true);
  const annualVariablePay = read("Variable");
  const annualEmployerPfAtTarget = read("EmployerPf");
  const annualEmployeePfAtZeroVariable = read("EmployeePfZero");
  const annualEmployeePfAtTarget = read("EmployeePfTarget");
  const annualProfessionalTax = read("ProfessionalTax");
  const annualGratuityInCtc = read("Gratuity");
  const annualOtherEmployerCosts = read("OtherCosts");
  return {
    annualCtc,
    annualFixedPay,
    annualVariablePay,
    basicPercentOfFixed: read("BasicPercent"),
    annualEmployeePfAtZeroVariable,
    annualEmployeePfAtTarget,
    annualEmployerPfAtTarget,
    pfContributionBasis: (values[`${prefix}PfBasis`] as CtcInputs["pfContributionBasis"]) || "manual",
    pfEmploymentStartDate: values[`${prefix}PfStartDate`] || undefined,
    employerPfIncluded: values[`${prefix}EmployerPfIncluded`] === "true",
    stateOrUt: "Manual professional tax input",
    annualProfessionalTax,
    annualGratuityInCtc,
    annualOtherEmployerCosts,
  };
}

function calculateOfferComparison(values: Record<string, string>, taxPeriod: CtcTaxPeriod): CareerToolResult {
  const clawback = optionalAmount(values, "joiningBonusClawback");
  const noticeCost = optionalAmount(values, "noticePeriodCost");
  const relocationCost = optionalAmount(values, "relocationCost");
  const commute = optionalAmount(values, "additionalCommute");
  let comparison;
  try {
    comparison = compareCtcOffers({
      current: offerCtcInputs(values, "current"),
      offer: offerCtcInputs(values, "offer"),
      taxPeriod,
      joiningBonusClawback: clawback,
      noticePeriodCost: noticeCost,
      relocationCost,
      additionalAnnualCommuteCost: commute,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("components exceed")) {
      throw new Error(`${cause.message} Check the written breakdown.`);
    }
    throw cause;
  }
  const { current, offer, offerFirstYearAtZeroVariable, offerFirstYearAtTarget } = comparison;
  return {
    summary: `Both packages use the shared default/new-regime salary-tax model for ${ctcTaxPeriodLabels[taxPeriod]}. Zero-variable and full-target cases stay separate; one-time exit and move costs are subtracted from the new offer’s first-year cash estimate.`,
    rows: [
      { label: "Current estimated monthly take-home with zero variable", value: current.monthlyInHandAtZeroVariable, format: "inr" },
      { label: "New-offer estimated monthly take-home with zero variable", value: offer.monthlyInHandAtZeroVariable, format: "inr" },
      { label: "Zero-variable monthly difference (new offer minus current)", value: offer.monthlyInHandAtZeroVariable - current.monthlyInHandAtZeroVariable, format: "inr" },
      { label: "Current estimated monthly average at full variable target", value: current.monthlyInHandAtTargetAverage, format: "inr" },
      { label: "New-offer estimated monthly average at full variable target", value: offer.monthlyInHandAtTargetAverage, format: "inr" },
      { label: "Full-target monthly difference (new offer minus current)", value: offer.monthlyInHandAtTargetAverage - current.monthlyInHandAtTargetAverage, format: "inr" },
      { label: "Current CTC left unallocated by entered components", value: current.annualUnallocatedCtc, format: "inr" },
      { label: "New-offer CTC left unallocated by entered components", value: offer.annualUnallocatedCtc, format: "inr" },
      { label: "Joining-bonus clawback entered", value: clawback, format: "inr" },
      { label: "Notice-period cost entered", value: noticeCost, format: "inr" },
      { label: "Relocation cost entered", value: relocationCost, format: "inr" },
      { label: "Additional first-year commute cost entered", value: commute, format: "inr" },
      { label: "New offer first-year cash estimate at zero variable, after entered costs", value: offerFirstYearAtZeroVariable, format: "inr" },
      { label: "New offer first-year cash estimate at full target, after entered costs", value: offerFirstYearAtTarget, format: "inr" },
      { label: "First-year zero-variable difference after entered costs", value: offerFirstYearAtZeroVariable - current.annualTakeHomeAtZeroVariable, format: "inr" },
    ],
    tables: [
      {
        caption: "Monthly take-home and first-year comparison",
        columns: ["Outcome", "Current package", "New offer", "Difference"],
        rows: [
          ["Zero variable · monthly", current.monthlyInHandAtZeroVariable, offer.monthlyInHandAtZeroVariable, offer.monthlyInHandAtZeroVariable - current.monthlyInHandAtZeroVariable],
          ["Full target · monthly average", current.monthlyInHandAtTargetAverage, offer.monthlyInHandAtTargetAverage, offer.monthlyInHandAtTargetAverage - current.monthlyInHandAtTargetAverage],
          ["First year · zero variable, after entered costs", current.annualTakeHomeAtZeroVariable, offerFirstYearAtZeroVariable, offerFirstYearAtZeroVariable - current.annualTakeHomeAtZeroVariable],
          ["First year · full target, after entered costs", current.annualTakeHomeAtTarget, offerFirstYearAtTarget, offerFirstYearAtTarget - current.annualTakeHomeAtTarget],
        ],
      },
      {
        caption: "Entered first-year transition costs",
        columns: ["Cost", "Amount"],
        rows: [
          ["Joining-bonus clawback", clawback],
          ["Notice-period cost", noticeCost],
          ["Relocation", relocationCost],
          ["Additional commute over 12 months", commute],
          ["Total deducted from new-offer first year", comparison.oneTimeCosts + comparison.recurringFirstYearCost],
        ],
      },
    ],
    notes: [
      `The monthly figures are annual take-home estimates divided by 12, not payroll promises. Full-target variable pay assumes the entire stated target is paid; the zero-variable case excludes it. The tax estimate follows ${ctcTaxPeriodLabels[taxPeriod]}.`,
      "Professional tax is entered manually. PF may be entered from payroll or estimated month by month using the selected statutory-ceiling or actual-basic basis and the entered start date. The estimate does not determine eligibility or employer-specific payroll treatment.",
      "Clawback, notice, relocation, and commute amounts are subtracted as entered, with no tax treatment or reimbursement assumed. Basic-pay share affects PF only when a calculated basis is selected. Use the official Income Tax Department calculator to verify the relevant year and individual facts.",
    ],
  };
}

export function ToolSuitePage() {
  const [location] = useLocation();
  const routePath = location.replace(/\/+$/, "") || "/";
  const route = routeRegistry.routes.find((item) => item.path.replace(/\/+$/, "") === routePath);
  const toolId = route?.toolId as CareerToolId | undefined;
  const fields = toolId ? fieldsByTool[toolId] : undefined;
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CareerToolResult | null>(null);
  const [error, setError] = useState("");
  const [taxPeriod, setTaxPeriod] = useState<CtcTaxPeriod>("tax-year-2026-27");

  if (!route || !toolId || !fields) {
    return <main className="p-8 text-sm text-muted-foreground" role="status">This tool is not available.</main>;
  }
  const activeToolId = toolId;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    const input: CareerToolInput = { ...values };
    try {
      let calculatedResult: CareerToolResult;
      if (activeToolId === "offer-comparison") {
        calculatedResult = calculateOfferComparison(values, taxPeriod);
      } else if (activeToolId === "tax-regime-comparison") {
        const grossSalary = Number(values.grossSalary);
        const newRegime = calculateCtc({
          annualCtc: grossSalary,
          annualFixedPay: grossSalary,
          annualVariablePay: 0,
          basicPercentOfFixed: 0,
          annualEmployeePfAtZeroVariable: 0,
          annualEmployeePfAtTarget: 0,
          annualEmployerPfAtTarget: 0,
          employerPfIncluded: false,
          stateOrUt: "Not specified",
          annualProfessionalTax: 0,
          annualGratuityInCtc: 0,
          annualOtherEmployerCosts: 0,
        }, "assessment-year-2026-27");
        calculatedResult = calculateCareerTool(activeToolId, {
          grossSalary,
          section80C: values.section80C,
          section80D: values.section80D,
          nps80ccd1b: values.nps80ccd1b,
          oldRegimeDeductions: values.oldRegimeDeductions,
          annualBasicSalary: values.annualBasicSalary,
          annualHraReceived: values.annualHraReceived,
          annualRentPaid: values.annualRentPaid,
          hraCityType: values.hraCityType,
          newTax: newRegime.taxAtTarget.tax,
        });
      } else {
        calculatedResult = calculateCareerTool(activeToolId, input);
      }
      setResult(calculatedResult);
      trackDecisionToolCompletion(activeToolId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Check the entered values and try again.");
    }
  }

  function reset() {
    setValues({});
    setResult(null);
    setError("");
    setTaxPeriod("tax-year-2026-27");
  }

  const renderField = (field: Field) => (
    <label key={field.key} className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{field.label}</span>
      {field.type === "select" ? (
        <select
          value={values[field.key] ?? field.options?.[0]?.value ?? ""}
          onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
          className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
          data-testid={`input-${field.key}`}
        >
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input
          type={field.type ?? "number"}
          inputMode={field.type === "text" || field.type === "date" ? undefined : "decimal"}
          value={values[field.key] ?? ""}
          onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
          required={!field.optional}
          min={field.min}
          max={field.max}
          step={field.step}
          maxLength={field.type === "text" ? 250 : undefined}
          className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          data-testid={`input-${field.key}`}
        />
      )}
      {field.hint && <span className="block text-xs leading-5 text-muted-foreground">{field.hint}</span>}
    </label>
  );

  return (
    <PublicPage
      eyebrow={route.kind === "tool" ? "Decision tool / use your evidence" : "Employer research / checklist"}
      title={route.title}
      intro={route.description}
      seo={{
        title: `${route.title} | CareerReality`,
        description: route.description,
        path: route.path,
        breadcrumbs: [{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }, { name: route.title, path: route.path }],
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.72fr)]">
        <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-8" aria-labelledby="tool-input-title">
          <div className="mb-6 flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-3 text-primary"><Calculator size={19} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Your inputs stay in this page</p>
              <h2 id="tool-input-title" className="mt-2 font-display text-2xl">Enter the figures you can verify.</h2>
              {activeToolId === "offer-comparison" && <p className="mt-2 text-sm leading-6 text-muted-foreground" data-testid="tax-period-scope">Tax scope: {ctcTaxPeriodLabels[taxPeriod]}. The salary model uses the default/new regime for a resident individual below 60.</p>}
              <p className="mt-2 text-sm leading-6 text-muted-foreground">This tool calculates in your browser. It does not save or send these inputs to the server.</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={submit} data-testid={`form-tool-${activeToolId}`}>
            {activeToolId === "offer-comparison" && <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">Tax period</span>
              <select
                value={taxPeriod}
                onChange={(event) => {
                  setTaxPeriod(event.target.value as CtcTaxPeriod);
                  setResult(null);
                  setError("");
                }}
                className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                data-testid="input-taxPeriod"
              >
                <option value="tax-year-2026-27">{ctcTaxPeriodLabels["tax-year-2026-27"]}</option>
                <option value="assessment-year-2026-27">{ctcTaxPeriodLabels["assessment-year-2026-27"]}</option>
              </select>
              <span className="block text-xs leading-5 text-muted-foreground">The modeled salary schedule is numerically the same for these two periods; the selected legal period appears in results and CSV exports.</span>
            </label>}
            {activeToolId === "offer-comparison" ? (
              <div className="space-y-5" data-testid="offer-input-groups">
                {([
                  {
                    id: "current",
                    title: "Your current package",
                    description: "Use your latest payslip or written compensation breakdown. Start with CTC and fixed pay; variable pay is optional.",
                    prefix: "current",
                  },
                  {
                    id: "offer",
                    title: "The new offer",
                    description: "Use the written offer breakdown. Keep target variable pay separate from fixed pay.",
                    prefix: "offer",
                  },
                ] as const).map((group) => {
                  const packageFields = fields.filter((field) => field.key.startsWith(group.prefix));
                  const essentials = packageFields.filter((field) =>
                    ["Ctc", "Fixed", "Variable"].some((part) => field.key === `${group.prefix}${part}`),
                  );
                  const payrollDetails = packageFields.filter((field) => !essentials.includes(field));
                  const detailsLabel = group.id === "current" ? "Add current payroll details" : "Add offer payroll details";
                  return (
                    <fieldset key={group.id} className="min-w-0 rounded-2xl border border-border p-4 sm:p-5">
                      <legend className="px-2 font-display text-xl">{group.title}</legend>
                      <p className="mb-4 text-sm leading-6 text-muted-foreground">{group.description}</p>
                      <div className="grid gap-4 sm:grid-cols-2">{essentials.map(renderField)}</div>
                      <details className="mt-5 rounded-xl bg-secondary/40 p-4">
                        <summary className="cursor-pointer text-sm font-bold text-primary">{detailsLabel}</summary>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Optional payroll assumptions can refine the estimate. Leave details blank when you cannot verify them.</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid={`offer-${group.id}-payroll-fields`}>
                          {payrollDetails.map(renderField)}
                        </div>
                      </details>
                    </fieldset>
                  );
                })}
                <details className="rounded-2xl border border-border p-4 sm:p-5">
                  <summary className="cursor-pointer font-display text-xl">Add first-year transition costs</summary>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Optional costs to subtract from the new offer’s first-year estimate. Enter only amounts you can support with written terms or a realistic budget.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="offer-transition-cost-fields">
                    {fields.filter((field) => ["joiningBonusClawback", "noticePeriodCost", "relocationCost", "additionalCommute"].includes(field.key)).map(renderField)}
                  </div>
                </details>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">{fields.map(renderField)}</div>
            )}
            {activeToolId === "gratuity-estimator" && (
              <p className="rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                Fixed-term expiry has a one-year threshold and pro-rata estimate; a deceased employee’s estimate is also pro rata. Death and disablement waive the ordinary five-year threshold. Verify the wage base, service facts, and applicable rules.
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90" data-testid="button-calculate">
                Calculate from my inputs
              </button>
              <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-muted">
                <RotateCcw size={14} aria-hidden="true" /> Clear inputs
              </button>
            </div>
          </form>
          {error && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</p>}
        </section>

        <aside className="space-y-5">
          {result ? (
            <section className="rounded-[24px] border border-primary/25 bg-primary/[.04] p-5 sm:p-7" aria-live="polite" data-testid="tool-result">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Your result</p>
              <p className="mt-3 text-sm leading-6 text-foreground">{result.summary}</p>
              <dl className="mt-5 divide-y divide-border">
                {result.rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-semibold tabular-nums">{displayValue(row.value, row.format)}</dd>
                  </div>
                ))}
              </dl>
              {result.notes.length > 0 && (
                <div className="mt-5 space-y-2 border-t border-border pt-4">
                  {result.notes.map((note) => <p key={note} className="text-xs leading-5 text-muted-foreground">{note}</p>)}
                </div>
              )}
              {result.tables?.map((table) => (
                <div key={table.caption} className="mt-5 overflow-hidden border-t border-border pt-4">
                  <h3 className="text-sm font-bold">{table.caption}</h3>
                  <p className="mt-2 text-xs text-muted-foreground sm:hidden">Scroll horizontally to view all columns.</p>
                  <div className="mt-2 max-h-[32rem] overflow-auto rounded-xl border border-border" role="region" aria-label={table.caption} tabIndex={0}>
                    <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-muted">
                        <tr>{table.columns.map((column) => <th key={column} scope="col" className="border-b border-border p-3 font-semibold">{column}</th>)}</tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-border last:border-0">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="whitespace-nowrap p-3 tabular-nums">
                                {typeof cell === "number"
                                  ? cellIndex === 0
                                    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(cell)
                                    : displayValue(cell, "inr")
                                  : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {result.links?.length ? (
                <ul className="mt-4 space-y-2">
                  {result.links.map((link) => (
                    <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-primary underline underline-offset-4">{link.label}<ArrowUpRight size={13} aria-hidden="true" /></a></li>
                  ))}
                </ul>
              ) : null}
              <ResultSharePanel
                toolId={activeToolId}
                toolName={route.title}
                resultText={[
                  result.summary,
                  ...result.rows.map((row) => `${row.label}: ${displayValue(row.value, row.format)}`),
                  ...(result.tables ?? []).flatMap((table) => [
                    table.caption,
                    table.columns.join(" | "),
                    ...table.rows.map((row) => row.map((cell) => displayValue(cell)).join(" | ")),
                  ]),
                ].join("\n")}
              />
              {activeToolId === "offer-comparison" && <div className="mt-5 border-t border-border pt-4">
                <button type="button" onClick={() => downloadOfferComparison(fields, values, result, taxPeriod)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5" data-testid="button-download-offer-result">
                  <Download size={15} aria-hidden="true" /> Download offer comparison (CSV)
                </button>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Generated in your browser. The file is not sent to CareerReality.</p>
              </div>}
            </section>
          ) : (
            <section className="rounded-[24px] border border-border bg-secondary/35 p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Before you start</p>
              <h2 className="mt-3 font-display text-2xl">A worksheet, not a verdict.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Use written offer terms and current official sources where the question is legal, tax-related, or specific to an employer. Unknown values should stay unknown.</p>
              {activeToolId === "offer-comparison" && <p className="mt-3 text-sm leading-6 text-muted-foreground">Compare recurring monthly cash separately from one-time joining pay. Enter clawbacks, notice costs, relocation and commute only when you can support them with written terms or a realistic budget.</p>}
              {activeToolId === "final-pay-estimator" && <p className="mt-3 text-sm leading-6 text-muted-foreground">Keep notice pay, leave encashment and gratuity as separate lines. The employer’s policy, applicable law, wage definition and final service dates can change what payroll owes.</p>}
              <Link href="/methodology" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">Read methods and limits <ArrowUpRight size={14} /></Link>
            </section>
          )}
          <nav className="flex flex-wrap gap-3 text-sm">
            <Link href="/tools" className="font-bold text-primary">All tools</Link>
            <Link href="/guides" className="font-bold text-primary">Editorial guides</Link>
            <Link href="/sources" className="font-bold text-primary">Sources</Link>
          </nav>
          {activeToolId === "layoff-runway" && <LayoffAlertSignup />}
        </aside>
      </div>
    </PublicPage>
  );
}
