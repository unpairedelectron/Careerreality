import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ArrowDown, ArrowUpRight, CircleAlert, RotateCcw, ShieldCheck } from "lucide-react";
import { Form } from "@/components/ui/form";
import { PublicPage } from "@/components/shared/public-shell";
import { trackDecisionToolCompletion } from "@/lib/analytics";
import { ResultSharePanel } from "@/components/shared/result-share-panel";
import {
  calculateCtc,
  ctcWorkedExampleResults,
  ctcTaxPeriodLabels,
  defaultCtcInputs,
  type CtcInputs,
  type CtcTaxPeriod,
} from "@/lib/ctc-calculator";

type NumericKey = Exclude<keyof CtcInputs, "employerPfIncluded" | "stateOrUt" | "pfContributionBasis">;
type Draft = Omit<Record<keyof CtcInputs, string>, "employerPfIncluded" | "pfContributionBasis"> & {
  employerPfIncluded: boolean;
  pfContributionBasis: NonNullable<CtcInputs["pfContributionBasis"]>;
};

const numericFields: Array<{ key: NumericKey; label: string; hint: string; min?: number; max?: number; step?: number }> = [
  { key: "annualCtc", label: "Headline annual CTC", hint: "As written in the offer, in rupees.", min: 1 },
  { key: "annualFixedPay", label: "Annual fixed pay", hint: "Fixed gross cash before employee deductions.", min: 0 },
  { key: "annualVariablePay", label: "Target variable pay", hint: "A target, not guaranteed monthly cash.", min: 0 },
  { key: "basicPercentOfFixed", label: "Basic as % of fixed pay", hint: "Use the offer's split if available.", min: 0, max: 100, step: 0.1 },
  { key: "annualEmployeePfAtZeroVariable", label: "Employee PF at fixed pay (annual)", hint: "Use the amount from payroll or your offer; no rate is inferred.", min: 0 },
  { key: "annualEmployeePfAtTarget", label: "Employee PF at full target (annual)", hint: "Use the amount for the full-target scenario; no rate is inferred.", min: 0 },
  { key: "annualEmployerPfAtTarget", label: "Employer PF at full target (annual)", hint: "Use the offer or payroll amount; counted in CTC only if marked below.", min: 0 },
  { key: "annualProfessionalTax", label: "Annual professional tax", hint: "Enter the employee-paid amount for your state or UT. Employer-paid tax may need salary gross-up.", min: 0 },
  { key: "annualGratuityInCtc", label: "Annual gratuity included in CTC", hint: "Enter only the offer amount. We do not infer it.", min: 0 },
  { key: "annualOtherEmployerCosts", label: "Other employer costs in CTC", hint: "Enter any employer-side items shown in the offer.", min: 0 },
];

const stateOrUtOptions = [
  "Not specified",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi NCT",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

function makeDraft(values: CtcInputs): Draft {
  return {
    annualCtc: String(values.annualCtc),
    annualFixedPay: String(values.annualFixedPay),
    annualVariablePay: String(values.annualVariablePay),
    basicPercentOfFixed: String(values.basicPercentOfFixed),
    annualEmployeePfAtZeroVariable: String(values.annualEmployeePfAtZeroVariable),
    annualEmployeePfAtTarget: String(values.annualEmployeePfAtTarget),
    annualEmployerPfAtTarget: String(values.annualEmployerPfAtTarget),
    pfContributionBasis: values.pfContributionBasis ?? "manual",
  pfEmploymentStartDate: values.pfEmploymentStartDate ?? "",
    employerPfIncluded: values.employerPfIncluded,
    stateOrUt: values.stateOrUt,
    annualProfessionalTax: String(values.annualProfessionalTax),
    annualGratuityInCtc: String(values.annualGratuityInCtc),
    annualOtherEmployerCosts: String(values.annualOtherEmployerCosts),
  };
}

function toInputs(draft: Draft): CtcInputs {
  return {
    annualCtc: Number(draft.annualCtc),
    annualFixedPay: Number(draft.annualFixedPay),
    annualVariablePay: Number(draft.annualVariablePay),
    basicPercentOfFixed: Number(draft.basicPercentOfFixed),
    annualEmployeePfAtZeroVariable: Number(draft.annualEmployeePfAtZeroVariable),
    annualEmployeePfAtTarget: Number(draft.annualEmployeePfAtTarget),
    annualEmployerPfAtTarget: Number(draft.annualEmployerPfAtTarget),
    pfContributionBasis: draft.pfContributionBasis,
    pfEmploymentStartDate: draft.pfEmploymentStartDate || undefined,
    employerPfIncluded: draft.employerPfIncluded,
    stateOrUt: draft.stateOrUt,
    annualProfessionalTax: Number(draft.annualProfessionalTax),
    annualGratuityInCtc: Number(draft.annualGratuityInCtc),
    annualOtherEmployerCosts: Number(draft.annualOtherEmployerCosts),
  };
}

function validate(draft: Draft): Partial<Record<keyof CtcInputs, string>> {
  const errors: Partial<Record<keyof CtcInputs, string>> = {};
  for (const field of numericFields) {
    const raw = draft[field.key];
    const number = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(number)) {
      errors[field.key] = "Enter a number to calculate this offer.";
    } else if (number < (field.min ?? 0)) {
      errors[field.key] = field.key === "annualCtc" ? "CTC must be greater than ₹0." : "Use zero or a positive amount.";
    } else if (field.max !== undefined && number > field.max) {
      errors[field.key] = `Enter a value no higher than ${field.max}.`;
    }
  }
  if (!draft.stateOrUt.trim()) errors.stateOrUt = "Enter a state or UT, or use “Not specified”.";
  if (draft.pfContributionBasis !== "manual") {
    if (!draft.pfEmploymentStartDate) {
      errors.pfEmploymentStartDate = "Enter the PF start date for this estimate year.";
    } else if (draft.pfEmploymentStartDate < "2026-04-01" || draft.pfEmploymentStartDate > "2027-03-31") {
      errors.pfEmploymentStartDate = "Use a date from 1 April 2026 through 31 March 2027.";
    }
  }
  const fixed = Number(draft.annualFixedPay);
  const professionalTax = Number(draft.annualProfessionalTax);
  if (Number.isFinite(fixed) && Number.isFinite(professionalTax) && professionalTax > fixed) {
    errors.annualProfessionalTax = "Professional tax cannot be higher than annual fixed pay.";
  }
  const variable = Number(draft.annualVariablePay);
  const fixedPf = Number(draft.annualEmployeePfAtZeroVariable);
  const targetPf = Number(draft.annualEmployeePfAtTarget);
  if (Number.isFinite(fixed) && Number.isFinite(fixedPf) && fixedPf > fixed) {
    errors.annualEmployeePfAtZeroVariable = "Employee PF cannot be higher than annual fixed pay.";
  }
  if (Number.isFinite(fixed) && Number.isFinite(variable) && Number.isFinite(targetPf) && targetPf > fixed + variable) {
    errors.annualEmployeePfAtTarget = "Employee PF cannot be higher than target gross pay.";
  }
  return errors;
}

function rupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function annual(value: number): string {
  return `${rupees(value)} / year`;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint: string; error?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-bold text-foreground">{label}</label>
      {children}
      <p id={`${id}-hint`} className="mt-1.5 text-[10px] leading-[1.55] text-muted-foreground">{hint}</p>
      {error && <p id={`${id}-error`} className="mt-1 flex items-start gap-1.5 text-[11px] leading-[1.45] text-destructive" role="alert"><CircleAlert size={13} className="mt-0.5 shrink-0" />{error}</p>}
    </div>
  );
}

function inputClass(error?: string) {
  return `h-12 w-full min-w-0 rounded-lg border bg-background px-3 text-[14px] font-semibold tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-primary focus:bg-card ${error ? "border-destructive" : "border-border"}`;
}

function Metric({ label, value, note, emphasis = false, testId }: { label: string; value: string; note: string; emphasis?: boolean; testId?: string }) {
  return (
    <div className={`min-w-0 rounded-xl border p-4 sm:p-5 ${emphasis ? "border-primary/25 bg-primary/[.07]" : "border-border/80 bg-background/65"}`} data-testid={testId}>
      <p className="font-data text-[9px] uppercase tracking-[.15em] text-muted-foreground">{label}</p>
      <p className={`mt-2 break-words font-display tracking-[-.045em] ${emphasis ? "text-[clamp(1.8rem,5vw,2.8rem)] leading-none text-primary" : "text-[clamp(1.35rem,4vw,1.8rem)] leading-tight"}`}>{value}</p>
      <p className="mt-2 text-[10px] leading-[1.55] text-muted-foreground">{note}</p>
    </div>
  );
}

function BreakdownRow({ label, value, note, testId }: { label: string; value: string; note?: string; testId?: string }) {
  return <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border/70 py-3 last:border-0" data-testid={testId}><div className="min-w-0"><p className="text-[11px] font-semibold">{label}</p>{note && <p className="mt-1 text-[10px] leading-[1.5] text-muted-foreground">{note}</p>}</div><p className="shrink-0 text-right font-data text-[11px] tabular-nums">{value}</p></div>;
}

export function SalaryCalculatorPage() {
  const [taxPeriod, setTaxPeriod] = useState<CtcTaxPeriod>("tax-year-2026-27");
  const form = useForm<Draft>({ defaultValues: makeDraft(defaultCtcInputs), mode: "onChange" });
  const draft = form.watch();
  const isDirty = form.formState.isDirty;
  const errors = useMemo(() => validate(draft), [draft]);
  const hasErrors = Object.keys(errors).length > 0;
  const inputs = useMemo(() => toInputs(draft), [draft]);
  const result = useMemo(() => hasErrors ? null : calculateCtc(inputs, taxPeriod), [hasErrors, inputs, taxPeriod]);

  const reset = () => form.reset(makeDraft(defaultCtcInputs));
  const loadExample = (values: CtcInputs) => form.reset(makeDraft(values));

  const impossibleTakeHome = Boolean(result && result.ctcShortfall > 0);
  const targetTax = result?.taxAtTarget;
  const zeroTax = result?.taxAtZeroVariable;
  const completionTracked = useRef(false);

  useEffect(() => {
    if (isDirty && result && result.ctcShortfall === 0 && !completionTracked.current) {
      trackDecisionToolCompletion("ctc-calculator");
      completionTracked.current = true;
    }
  }, [isDirty, result]);

  return (
    <PublicPage
      eyebrow="Offer decoder / India"
      title="The offer says CTC. Your budget needs cash."
      intro="Separate fixed pay, target bonus, employer-side costs, PF and tax. The estimate follows your inputs; it does not assume every employer runs payroll the same way."
      seo={{
        title: "Salary Calculator — Decode CTC to Monthly Take-Home | CareerReality",
        description: "Compare headline CTC with estimated cash after income tax, employee PF and manually entered professional tax. See fixed-pay and target-variable scenarios.",
        path: "/salary-calculator",
      }}
    >
      <div className="space-y-9">
        <p className="rounded-xl border border-primary/20 bg-primary/[.04] p-4 text-sm leading-6 text-foreground" data-testid="tax-period-scope">
          Tax scope: {taxPeriod === "tax-year-2026-27"
            ? "Tax Year 2026–27 under the Income-tax Act, 2025."
            : "Assessment Year 2026–27 for income earned in FY 2025–26 under the Income-tax Act, 1961."}
          {" "}This estimate models a resident salaried individual below 60 under the default/new regime; it excludes special-rate income and filing-specific adjustments.
        </p>
        <section className="grid gap-6 lg:grid-cols-[minmax(0,.94fr)_minmax(0,1.06fr)] lg:items-start" aria-label="Salary calculator">
          <Form {...form}>
          <form className="min-w-0 rounded-[20px] border border-border bg-card/90 p-4 shadow-[0_16px_44px_hsl(var(--foreground)/.045)] sm:p-6" onSubmit={form.handleSubmit(() => undefined)} data-testid="form-salary-calculator">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
              <div>
                <p className="font-data text-[9px] uppercase tracking-[.17em] text-primary">01 / Offer inputs</p>
                <h2 className="mt-2 font-display text-[2rem] leading-none tracking-[-.04em]">Use the offer letter</h2>
              </div>
              <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-[11px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground" data-testid="button-reset-calculator">
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            <div className="mt-5 grid min-w-0 gap-x-4 gap-y-4 sm:grid-cols-2">
              {numericFields.slice(0, 4).map((field) => {
                const error = errors[field.key];
                const id = `salary-${field.key}`;
                return <Field key={field.key} id={id} label={field.label} hint={field.hint} error={error}>
                  <div className="relative">
                    {field.key !== "basicPercentOfFixed" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">₹</span>}
                    <input {...form.register(field.key)} id={id} data-testid={`input-${field.key}`} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step ?? 1} value={draft[field.key]} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} className={`${inputClass(error)} ${field.key === "basicPercentOfFixed" ? "pr-10" : "pl-7"}`} />
                    {field.key === "basicPercentOfFixed" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">%</span>}
                  </div>
                </Field>;
              })}
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Provident fund contribution basis</p>
              <Field id="salary-pfContributionBasis" label="How should PF be estimated?" hint="For Tax Year 2026–27, the ceiling is ₹15,000 through 16 September and ₹25,000 from 17 September. Actual-basic uses the full entered basic pay and must match payroll.">
                <select {...form.register("pfContributionBasis")} id="salary-pfContributionBasis" data-testid="input-pfContributionBasis" value={draft.pfContributionBasis} className={inputClass()}>
                  <option value="statutory-ceiling">12% on 2026–27 ceiling (₹15,000 → ₹25,000)</option>
                  <option value="actual-basic">12% of full basic pay (actual-wage basis)</option>
                  <option value="manual">Enter employee and employer PF amounts manually</option>
                </select>
              </Field>
              {draft.pfContributionBasis !== "manual" && <div className="mt-4 max-w-sm">
                <Field id="salary-pfEmploymentStartDate" label="PF employment start date in this estimate year" hint="Enter the date yourself. If employment began before 1 April 2026, enter 1 April 2026 to include all 12 estimate months." error={errors.pfEmploymentStartDate}>
                  <input {...form.register("pfEmploymentStartDate")} id="salary-pfEmploymentStartDate" data-testid="input-pfEmploymentStartDate" type="date" min="2026-04-01" max="2027-03-31" value={draft.pfEmploymentStartDate} aria-invalid={Boolean(errors.pfEmploymentStartDate)} aria-describedby={`salary-pfEmploymentStartDate-hint${errors.pfEmploymentStartDate ? " salary-pfEmploymentStartDate-error" : ""}`} className={inputClass(errors.pfEmploymentStartDate)} />
                </Field>
              </div>}
              {draft.pfContributionBasis === "manual" && <>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                {numericFields.slice(4, 7).map((field) => {
                  const error = errors[field.key];
                  const id = `salary-${field.key}`;
                  return <Field key={field.key} id={id} label={field.label} hint={field.hint} error={error}>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">₹</span>
                      <input {...form.register(field.key)} id={id} data-testid={`input-${field.key}`} type="number" inputMode="decimal" min={field.min} step="1" value={draft[field.key]} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} className={`${inputClass(error)} pl-7`} />
                    </div>
                  </Field>;
                })}
                <div className="flex min-h-12 items-center">
                  <label htmlFor="salary-employerPfIncluded" className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 text-[11px] font-semibold">
                    <input {...form.register("employerPfIncluded")} id="salary-employerPfIncluded" data-testid="input-employerPfIncluded" type="checkbox" checked={draft.employerPfIncluded} className="size-4 accent-[hsl(var(--primary))]" />
                    Employer PF is included inside CTC
                  </label>
                </div>
              </div>
              </>}
              <p className="mt-2 text-[10px] leading-[1.55] text-muted-foreground">Calculated PF uses the entered start date and a month-by-month wage base. September is split into 1–16 September at the earlier ceiling and 17–30 September at the revised ceiling. Employee PF is estimated at 12%; employer EPS at 8.33% is conditional and the balance is shown as EPF. This does not determine membership, eligibility, or employer payroll treatment.</p>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Offer details & tax</p>
              <div className="mt-4 grid min-w-0 gap-x-4 gap-y-4 sm:grid-cols-2">
                {numericFields.slice(7).map((field) => {
                  const error = errors[field.key];
                  const id = `salary-${field.key}`;
                  return <Field key={field.key} id={id} label={field.label} hint={field.hint} error={error}>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">₹</span>
                      <input {...form.register(field.key)} id={id} data-testid={`input-${field.key}`} type="number" inputMode="decimal" min={field.min} step="1" value={draft[field.key]} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} className={`${inputClass(error)} pl-7`} />
                    </div>
                  </Field>;
                })}
                  <Field id="salary-stateOrUt" label="State or UT" hint="Location is for context only; enter the employee-paid professional tax amount." error={errors.stateOrUt}>
                  <select {...form.register("stateOrUt")} id="salary-stateOrUt" data-testid="input-stateOrUt" value={draft.stateOrUt} aria-invalid={Boolean(errors.stateOrUt)} aria-describedby={`salary-stateOrUt-hint${errors.stateOrUt ? " salary-stateOrUt-error" : ""}`} className={inputClass(errors.stateOrUt)}>
                    {stateOrUtOptions.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </Field>
                <Field id="salary-taxRegime" label="Tax regime" hint="This CTC estimate uses the new regime. Use Tax regime comparison for a salary-only estimate of both regimes.">
                  <p id="salary-taxRegime" className={`${inputClass()} flex items-center`} data-testid="input-taxRegime">Default / new regime</p>
                </Field>
                <Field id="salary-taxPeriod" label="Tax period" hint="The rate bands match, but employment-tax deduction treatment differs between the two Acts.">
                  <select id="salary-taxPeriod" data-testid="input-taxPeriod" value={taxPeriod} onChange={(event) => setTaxPeriod(event.target.value as CtcTaxPeriod)} className={inputClass()}>
                    <option value="tax-year-2026-27">{ctcTaxPeriodLabels["tax-year-2026-27"]}</option>
                    <option value="assessment-year-2026-27">{ctcTaxPeriodLabels["assessment-year-2026-27"]}</option>
                  </select>
                </Field>
              </div>
              <div className="mt-4 rounded-lg border border-border/80 bg-secondary/35 p-3">
                <p className="text-[10px] leading-[1.6] text-muted-foreground"><strong className="text-foreground">Gratuity and other costs:</strong> enter only amounts shown in the offer. They are never inferred from basic pay.</p>
              </div>
            </div>
          </form>
          </Form>

          <section className="min-w-0 rounded-[20px] border border-primary/20 bg-card p-4 shadow-[0_18px_54px_hsl(var(--foreground)/.055)] sm:p-6" aria-labelledby="result-heading" aria-live="polite" aria-atomic="true" data-testid="salary-calculator-results">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
              <div>
                <p className="font-data text-[9px] uppercase tracking-[.17em] text-primary">02 / Cash readout</p>
                <h2 id="result-heading" className="mt-2 font-display text-[2rem] leading-none tracking-[-.04em]">What may reach you</h2>
              </div>
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[.06] px-3 font-data text-[9px] uppercase tracking-[.12em] text-primary"><ShieldCheck size={13} /> Local estimate</span>
            </div>
            {hasErrors ? (
              <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/[.06] p-4" role="alert" data-testid="validation-summary">
                <p className="flex items-center gap-2 text-[12px] font-bold text-destructive"><CircleAlert size={15} /> Check the highlighted fields</p>
                <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">Enter valid, non-negative amounts and basic pay between 0% and 100%. A result will appear once the inputs are usable.</p>
              </div>
            ) : impossibleTakeHome ? (
              <div className="mt-5 rounded-xl border border-amber-700/25 bg-amber-500/[.08] p-4 sm:p-5" role="alert" data-testid="ctc-shortfall-alert">
                <p className="font-data text-[9px] uppercase tracking-[.14em] text-amber-800 dark:text-amber-200">No valid take-home answer</p>
                <p className="mt-2 font-display text-3xl leading-none tracking-[-.04em]">{rupees(result!.ctcShortfall)} over CTC</p>
                <p className="mt-3 text-[11px] leading-[1.65] text-muted-foreground">Target gross plus the employer components you marked as inside CTC exceeds the headline package. Review the offer components; showing a cash result here would imply a valid CTC reconciliation when there is none.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4" data-testid="result-salary-calculator">
                <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4" data-testid="ctc-assumption-summary">
                  <p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">Inputs behind this estimate</p>
                  <p className="mt-2 text-[11px] leading-[1.65] text-muted-foreground">
                    <strong className="text-foreground">{ctcTaxPeriodLabels[taxPeriod]}</strong>; resident salaried individual below 60, default/new regime. Fixed gross {annual(inputs.annualFixedPay)}; target variable {annual(inputs.annualVariablePay)}; employee PF {draft.pfContributionBasis === "manual" ? "entered manually" : draft.pfContributionBasis === "statutory-ceiling" ? "estimated on the statutory ceiling" : "estimated on full basic pay"}; professional tax {annual(inputs.annualProfessionalTax)} ({inputs.stateOrUt}). Employer PF {inputs.employerPfIncluded ? "counted inside CTC" : "not counted inside CTC"}; gratuity and other employer costs are only included when entered.
                  </p>
                  <a href="#method" className="mt-2 inline-flex min-h-11 items-center text-[10px] font-bold text-primary underline underline-offset-2">Review deductions, exclusions, and official sources</a>
                </div>
                <Metric label="Fixed-pay monthly cash" value={rupees(result!.monthlyInHandAtZeroVariable)} note="Monthly average with zero variable pay, after estimated income tax, employee PF and entered professional tax." emphasis testId="metric-fixed-monthly-cash" />
                <Metric label="Monthly average at full target" value={rupees(result!.monthlyInHandAtTargetAverage)} note="Annual take-home divided by 12 assuming the full variable target is paid. It is not a guaranteed monthly payslip." testId="metric-target-monthly-average" />
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <Metric label="Tax-only · fixed / month" value={rupees(result!.monthlyTaxOnlyAtZeroVariable)} note="Fixed gross less income tax only; before PF and professional tax." testId="metric-tax-only-fixed" />
                  <Metric label="Tax-only · target / month" value={rupees(result!.monthlyTaxOnlyAtTarget)} note="Target gross less income tax only; before PF and professional tax." testId="metric-tax-only-target" />
                </div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <Metric label="Target variable at risk" value={annual(inputs.annualVariablePay)} note="A target amount, not promised cash." testId="metric-variable-at-risk" />
                  <Metric label="Effective deductions" value={percent(result!.effectiveDeductionRateAtTarget)} note="Income tax, employee PF and professional tax as a share of target gross." testId="metric-effective-deduction" />
                </div>
                <div className="rounded-xl border border-border/80 bg-background/65 p-4">
                  <p className="mb-1 font-data text-[9px] uppercase tracking-[.15em] text-muted-foreground">Annual estimate at target</p>
                  <BreakdownRow label="Target gross cash" value={annual(result!.annualGrossAtTarget)} />
                  <BreakdownRow label="Fixed gross cash" value={annual(result!.annualGrossAtZeroVariable)} />
                  <BreakdownRow label="Basic pay" value={annual(result!.annualBasic)} note={`${rupees(result!.monthlyBasic)} monthly basic`} />
                  <BreakdownRow label="Income tax" value={annual(result!.annualTaxAtTarget)} />
                  <BreakdownRow label="Employment-tax deduction from taxable salary" value={annual(result!.taxAtTarget.employmentTaxDeduction)} note={taxPeriod === "tax-year-2026-27" ? "Allowed under section 19 for Tax Year 2026–27, up to the amount paid." : "Allowed under section 16(iii) for AY 2026–27, up to the amount paid."} testId="breakdown-employment-tax-deduction" />
                  <BreakdownRow label="Employee PF at full target" value={annual(result!.annualEmployeePf)} note={`${rupees(result!.monthlyEmployeePf)} monthly average · ${draft.pfContributionBasis === "manual" ? "entered amount" : "12% of selected basic-wage base"}.`} />
                  <BreakdownRow label="Employee PF at fixed pay" value={annual(result!.annualEmployeePfAtZeroVariable)} note={`${rupees(result!.monthlyEmployeePfAtZeroVariable)} monthly average.`} />
                  {draft.pfContributionBasis !== "manual" && <>
                    <BreakdownRow label="PF wage base for entered employment period" value={annual(result!.annualPfWageBase)} />
                    <BreakdownRow label="Employer EPS component at target" value={annual(result!.annualEmployerEps)} />
                    <BreakdownRow label="Employer EPF component at target" value={annual(result!.annualEmployerEpf)} />
                    <div className="mt-3 overflow-x-auto" data-testid="pf-monthly-schedule">
                      <table className="w-full min-w-[680px] text-left text-[10px] tabular-nums">
                        <caption className="mb-2 text-left font-semibold text-muted-foreground">Illustrative month-by-month PF basis · Tax Year 2026–27</caption>
                        <thead><tr className="border-b border-border text-muted-foreground"><th className="py-2 pr-3">Month</th><th className="py-2 pr-3">Employed days</th><th className="py-2 pr-3">Wage base</th><th className="py-2 pr-3">Employee PF</th><th className="py-2 pr-3">Employer EPS</th><th className="py-2">Employer EPF</th></tr></thead>
                        <tbody>{result!.pfMonthlySchedule.map((month) => <tr key={month.month} className="border-b border-border/60"><th scope="row" className="py-2 pr-3 font-medium">{month.month}</th><td className="py-2 pr-3">{month.employedDays}</td><td className="py-2 pr-3">{rupees(month.wageBase)}</td><td className="py-2 pr-3">{rupees(month.employeeContribution)}</td><td className="py-2 pr-3">{rupees(month.employerEps)}</td><td className="py-2">{rupees(month.employerEpf)}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </>}
                  <BreakdownRow label="Professional tax entered" value={annual(inputs.annualProfessionalTax)} note={inputs.stateOrUt} />
                  <BreakdownRow label="Annual take-home at target" value={annual(result!.annualTakeHomeAtTarget)} />
                  <BreakdownRow label="Annual take-home at zero variable" value={annual(result!.annualTakeHomeAtZeroVariable)} />
                  <BreakdownRow label="Effective tax rate" value={percent(result!.effectiveTaxRateAtTarget)} note="Income tax as a share of target gross." />
                </div>
              </div>
            )}
            {!hasErrors && result && (
              <div className="mt-5 rounded-xl border border-border bg-secondary/35 p-4" data-testid="ctc-reconciliation">
                <p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">CTC check</p>
                <div className="mt-2">
                  <BreakdownRow label="Headline CTC" value={annual(inputs.annualCtc)} />
                  <BreakdownRow label="Employer PF inside CTC" value={annual(result.annualEmployerPf)} />
                  <BreakdownRow label="Gratuity entered" value={annual(inputs.annualGratuityInCtc)} />
                  <BreakdownRow label="Other employer costs entered" value={annual(inputs.annualOtherEmployerCosts)} />
                  <BreakdownRow label="Total employer components counted" value={annual(result.annualEmployerComponents)} />
                  <BreakdownRow label={impossibleTakeHome ? "Unreconciled shortfall" : "Unallocated CTC"} value={annual(impossibleTakeHome ? result.ctcShortfall : result.annualUnallocatedCtc)} />
                </div>
              </div>
            )}
            {!hasErrors && result && isDirty && !impossibleTakeHome && (
              <ResultSharePanel
                toolId="ctc-calculator"
                toolName="CTC Calculator"
                resultText={[
                  ctcTaxPeriodLabels[taxPeriod],
                  `Fixed-pay monthly cash: ${rupees(result.monthlyInHandAtZeroVariable)}`,
                  `Monthly average at full target: ${rupees(result.monthlyInHandAtTargetAverage)}`,
                  `Annual take-home at target: ${annual(result.annualTakeHomeAtTarget)}`,
                  `Annual take-home at zero variable: ${annual(result.annualTakeHomeAtZeroVariable)}`,
                  `Effective deductions at target: ${percent(result.effectiveDeductionRateAtTarget)}`,
                ].join("\n")}
              />
            )}
          </section>
        </section>

        <section className="rounded-[20px] border border-border bg-secondary/30 p-4 sm:p-6" aria-labelledby="examples-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div><p className="font-data text-[9px] uppercase tracking-[.17em] text-primary">Worked examples</p><h2 id="examples-heading" className="mt-2 font-display text-3xl tracking-[-.04em]">Start with a known shape</h2></div>
            <p className="max-w-sm text-[11px] leading-[1.6] text-muted-foreground">These use the shared worked-example results. Selecting one fills the inputs locally; nothing is saved or sent.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ctcWorkedExampleResults.map(({ id, label, description, inputs: exampleInputs, result: exampleResult }) => {
              const noTakeHome = exampleResult.ctcShortfall > 0;
              return <button key={id} type="button" onClick={() => loadExample(exampleInputs)} className="group flex min-h-[158px] min-w-0 flex-col rounded-xl border border-border bg-card p-4 text-left transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_12px_30px_hsl(var(--foreground)/.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" data-testid={`button-example-${id}`}>
                <span className="font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</span>
                <span className="mt-3 font-display text-2xl leading-none tracking-[-.035em]">{noTakeHome ? "Needs reconciliation" : rupees(exampleResult.monthlyInHandAtZeroVariable)}<span className="ml-1 font-sans text-[10px] tracking-normal text-muted-foreground">{noTakeHome ? "" : "/ month fixed"}</span></span>
                <span className="mt-2 text-[10px] leading-[1.55] text-muted-foreground">{description}</span>
                <span className="mt-auto flex items-center gap-1 pt-3 text-[10px] font-bold text-primary">Use this example <ArrowDown size={12} className="transition-transform group-hover:translate-y-0.5" /></span>
              </button>;
            })}
          </div>
        </section>

        <section id="method" data-testid="section-method-assumptions" className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]" aria-label="Method and assumptions">
          <div className="rounded-[20px] bg-primary p-5 text-primary-foreground sm:p-6">
            <p className="font-data text-[9px] uppercase tracking-[.17em] opacity-75">Read this carefully</p>
            <h2 className="mt-3 max-w-[12ch] font-display text-4xl leading-[.98] tracking-[-.04em]">A useful estimate is not a payslip.</h2>
            <p className="mt-4 text-[11px] leading-[1.75] opacity-85">Employers structure CTC differently. Use the offer’s actual fixed, variable, PF, gratuity and other-cost lines; then verify against the first payslip and payroll team.</p>
            <p className="mt-4 border-t border-primary-foreground/20 pt-4 font-data text-[9px] uppercase tracking-[.13em] opacity-75">Tax rules checked 26 October 2026 · PF basis selected from stated assumptions</p>
          </div>
          <div className="rounded-[20px] border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-3xl tracking-[-.04em]">Assumptions & exclusions</h2>
            <ul className="mt-4 grid gap-3 text-[11px] leading-[1.65] text-muted-foreground sm:grid-cols-2">
              <li className="border-l-2 border-primary/35 pl-3"><strong className="text-foreground">{taxPeriod === "tax-year-2026-27" ? "Tax Year 2026–27." : "Assessment Year 2026–27."}</strong> {taxPeriod === "tax-year-2026-27" ? "Income earned from 1 April 2026 to 31 March 2027, under the Income-tax Act, 2025." : "Income earned from 1 April 2025 to 31 March 2026, under the Income-tax Act, 1961."} The model is for a resident salaried individual below 60 using the default/new regime.</li>
              <li className="border-l-2 border-primary/35 pl-3"><strong className="text-foreground">Professional tax is entered manually.</strong> Employment tax paid is deductible from salary under section 19 for Tax Year 2026–27 and section 16(iii) for AY 2026–27, up to the amount paid and remaining salary income.</li>
              <li className="border-l-2 border-primary/35 pl-3"><strong className="text-foreground">PF basis is selectable.</strong> Choose the ₹25,000 ceiling, full basic pay, or manual payroll amounts. Estimated statutory-mode amounts use 12% employee and employer shares, with 8.33% of the employer share allocated to EPS.</li>
              <li className="border-l-2 border-primary/35 pl-3"><strong className="text-foreground">No inferred gratuity or costs.</strong> These are included only when entered from your offer.</li>
              <li className="border-l-2 border-primary/35 pl-3"><strong className="text-foreground">Variable pay is a target.</strong> The target annual average assumes the entire variable amount is paid; fixed monthly cash assumes zero variable.</li>
              <li className="border-l-2 border-primary/35 pl-3"><strong className="text-foreground">Not included:</strong> exemptions, special-rate income, equity valuation, reimbursements, bonuses beyond target, arrears, state payroll nuances or filing-specific adjustments.</li>
            </ul>
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-[11px] font-bold text-foreground">Official references</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[10px] leading-[1.5]">
                <a data-testid="source-income-tax-rates-ay" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.incometaxindia.gov.in/tax-rates" target="_blank" rel="noopener noreferrer">Income Tax Department: tax rates for AY 2026–27 <ArrowUpRight size={11} /></a>
                <a data-testid="source-salaried-ay" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: Salaried Individuals for AY 2026–27 <ArrowUpRight size={11} /></a>
                <a data-testid="source-ay-salary-deduction" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.incometaxindia.gov.in/w/section-16-64" target="_blank" rel="noopener noreferrer">Income-tax Act, 1961: salary deductions, section 16 <ArrowUpRight size={11} /></a>
                <a data-testid="source-tax-year-rates" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.incometaxindia.gov.in/w/section-202-78" target="_blank" rel="noopener noreferrer">Income-tax Act, 2025: default-regime rates, section 202 <ArrowUpRight size={11} /></a>
                <a data-testid="source-tax-year-salary-deduction" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.incometaxindia.gov.in/w/section-19-206" target="_blank" rel="noopener noreferrer">Income-tax Act, 2025: salary deduction, section 19 <ArrowUpRight size={11} /></a>
                <a data-testid="source-tax-year-rebate" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.incometaxindia.gov.in/w/section-156-88" target="_blank" rel="noopener noreferrer">Income-tax Act, 2025: resident rebate, section 156 <ArrowUpRight size={11} /></a>
                <a data-testid="source-finance-act-2026-memo" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.incometaxindia.gov.in/documents/81799/11848482/memo-2026.pdf" target="_blank" rel="noopener noreferrer">Income Tax Department: Finance Bill 2026 tax-rate memorandum <ArrowUpRight size={11} /></a>
                <a data-testid="source-labour-ministry-pf-ceiling" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-2" href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111&amp;lang=2&amp;reg=48" target="_blank" rel="noopener noreferrer">PIB: PF contribution split and ₹25,000 ceiling <ArrowUpRight size={11} /></a>
              </div>
              <a className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2" data-testid="source-epfo-ceiling-faq" href="https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf" target="_blank" rel="noopener noreferrer">EPFO: Wage Ceiling FAQ, including September 2026 examples</a>
              <p data-testid="source-verification-note" className="mt-3 text-[10px] leading-[1.6] text-muted-foreground">The EPFO FAQ documents the ₹15,000 ceiling through 16 September 2026 and ₹25,000 from 17 September 2026, with September contributions split 16/14 days. This estimate does not establish membership, eligibility, or employer-specific payroll treatment.</p>
              <p className="mt-3 text-[10px] leading-[1.6] text-muted-foreground">This is an estimate for offer comparison, not tax or payroll advice. Check current official rules and your employer’s policy before making a decision.</p>
            </div>
          </div>
        </section>
        <p className="text-center font-data text-[9px] uppercase tracking-[.14em] text-muted-foreground">No calculator save or share feature · input amounts stay off the URL</p>
      </div>
    </PublicPage>
  );
}

export default SalaryCalculatorPage;
