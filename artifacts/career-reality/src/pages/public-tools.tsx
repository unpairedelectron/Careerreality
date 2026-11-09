import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Redirect, useParams } from "wouter";
import { Link } from "@/components/shared/app-link";
import { ArrowUpRight, Check, CircleAlert, Filter, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  useCreateLayoffSignalReport,
  useGetPublicCompanySignal,
  useListLayoffSignals,
  useListPublicCompanySignals,
  useListSalaryBenchmarks,
  type ListLayoffSignalsParams,
  type PublicDataProvenance,
} from "@workspace/api-client-react";
import { PublicPage, FreshnessBadge } from "@/components/shared/public-shell";
import { SaveDecisionButton, WatchlistButton } from "@/components/shared/public-actions";
import { ToolEvidence } from "@/components/shared/tool-evidence";
import {
  parseBoundedNumber,
  provenanceStatusLabel,
  usableCompanySignals,
  usableDecisionSalaryBenchmarks,
  usableLayoffSignals,
} from "@/lib/public-evidence";
import { trackEvent, trackNextAction } from "@/lib/analytics";
import { useAppAuth } from "@/lib/app-auth-context";
import { getLegacyCompanyReplacement } from "@/data/legacy-routes";
import { experienceGuidance, roleOptions, roleProfiles, type RoleName } from "@/data/role-profiles";
import {
  calculateEscapePlanHours,
  calculateSalaryDrop,
  createAiTaskReadout,
  createCareerRealityIndexReflection,
  createResignationPlan,
  escapePlanGoals,
  escapePlanWeeks,
  getEscapePlanTasks,
  type EscapePlanGoal,
  type ResignationOfferStatus,
} from "@/lib/application-models";
import { LegacyCompanyPage } from "@/pages/legacy-replacements";
import routeRegistry from "@/data/route-registry";
export { SalaryCalculatorPage } from "./salary-calculator-page";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function validatedSourceUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function companyConfidenceLabel(company: { confidence: string; sourceUrl?: string | null }): string {
  return validatedSourceUrl(company.sourceUrl) ? `${company.confidence} confidence` : "Directional / unverified";
}

function companyEvidenceMeta<T extends { confidence: string }>(
  meta: T | undefined,
  hasValidatedSource: boolean,
): T | undefined {
  return meta ? { ...meta, confidence: hasValidatedSource ? meta.confidence : "Directional / unverified" } : undefined;
}

function EvidenceDetails({
  provenance,
  sourceUrl,
}: {
  provenance: PublicDataProvenance;
  sourceUrl?: string | null;
}) {
  const citation = validatedSourceUrl(sourceUrl);
  return (
    <details className="mt-3 text-[10px] leading-[1.6] text-muted-foreground">
      <summary className="cursor-pointer font-bold">Source, method, and limitations</summary>
      <div className="mt-2 space-y-1">
        <p>{provenance.methodologyName} v{provenance.methodologyVersion}: {provenance.methodologyCalculation}</p>
        <p>Source type: {provenance.sourceType}. Published {formatDate(provenance.publicationDate)}; retrieved {formatDate(provenance.retrievedDate)}; reviewed {formatDate(provenance.reviewedAt)}.</p>
        <p>Metric: {provenance.metric}. Transformation: {provenance.transformation}. Inputs: {provenance.methodologyInputs.join(", ")}.</p>
        <p>Limitations: {provenance.limitations.join(" ")}</p>
        {citation && <a href={citation} target="_blank" rel="noopener noreferrer" className="inline-block font-bold text-primary underline">Open source citation</a>}
      </div>
    </details>
  );
}

function formatLakhs(value: number): string {
  return `₹${(value / 100000).toFixed(1)}L`;
}

function formatRupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-bold text-muted-foreground">{label}</span>{children}{hint && <span className="mt-1.5 block text-[10px] text-muted-foreground">{hint}</span>}</label>;
}

function Input({ value, onChange, type = "text", min, max, step, placeholder, name, required, maxLength }: { value?: string; onChange: (value: string) => void; type?: string; min?: string; max?: string; step?: string; placeholder?: string; name?: string; required?: boolean; maxLength?: number }) {
  return <input data-testid={name ? `input-${name}` : undefined} name={name} required={required} maxLength={maxLength} {...(value === undefined ? {} : { value })} onChange={(event) => onChange(event.target.value)} type={type} min={min} max={max} step={step} placeholder={placeholder} className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:shadow-[0_0_0_4px_hsl(var(--primary)/.08)]" />;
}

function Select({ value, onChange, options, name }: { value: string; onChange: (value: string) => void; options: readonly string[]; name?: string }) {
  return <select data-testid={name ? `input-${name}` : undefined} name={name} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none transition-[border-color,box-shadow,background-color] focus:border-primary focus:bg-card focus:shadow-[0_0_0_4px_hsl(var(--primary)/.08)]">{options.map((option) => <option key={option}>{option}</option>)}</select>;
}

function ResultPanel({ children }: { children: React.ReactNode }) {
  return <div className="signal-scan rounded-[18px] border border-primary/25 bg-primary/[.07] p-5 sm:p-7">{children}</div>;
}


export function RiskAnalyzerPage() {
  const [notice, setNotice] = useState<30 | 60 | 90>(60);
  const [hasRepaymentClause, setHasRepaymentClause] = useState(false);
  const [cashRunwayMonths, setCashRunwayMonths] = useState("6");
  const [offer, setOffer] = useState<ResignationOfferStatus>("No offer");
  const [submitted, setSubmitted] = useState(false);
  const plan = submitted
    ? createResignationPlan({
        noticeDays: notice,
        hasRepaymentClause,
        offerStatus: offer,
        cashRunwayMonths: Number(cashRunwayMonths),
      })
    : null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };
  const reset = () => {
    setNotice(60);
    setHasRepaymentClause(false);
    setCashRunwayMonths("6");
    setOffer("No offer");
    setSubmitted(false);
  };
  return <PublicPage eyebrow="Tool / timing" title="Resignation checklist: what needs confirming first?" intro="Review the concrete terms around a possible move. This page does not calculate a resignation risk score or decide whether you should leave.">
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <form onSubmit={submit} className="surface-lift rounded-[20px] border border-border bg-card p-5 sm:p-7">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Review your situation</p>
        <h2 className="mt-2 font-display text-3xl">Separate the facts.</h2>
        <div className="mt-7 grid gap-4">
          <Field label="Notice period">
            <Select
              value={`${notice} days`}
              onChange={(value) => {
                setNotice(Number.parseInt(value, 10) as 30 | 60 | 90);
                setSubmitted(false);
              }}
              options={["30 days", "60 days", "90 days"]}
            />
          </Field>
          <Field label="Written offer status">
            <Select
              value={offer}
              onChange={(value) => {
                setOffer(value as ResignationOfferStatus);
                setSubmitted(false);
              }}
              options={["Written offer", "Verbal offer only", "No offer"]}
            />
          </Field>
          <Field label="Cash runway entered (months)" hint="Your own estimate. The tool does not infer expenses or apply a universal safety threshold.">
            <Input
              name="cash-runway-months"
              value={cashRunwayMonths}
              onChange={(value) => {
                setCashRunwayMonths(value);
                setSubmitted(false);
              }}
              type="number"
              min="0"
              max="60"
              step="0.5"
              required
            />
          </Field>
          <Field label="Any bond or repayment clause to review?">
            <Select
              value={hasRepaymentClause ? "Yes" : "No"}
              onChange={(value) => {
                setHasRepaymentClause(value === "Yes");
                setSubmitted(false);
              }}
              options={["No", "Yes"]}
            />
          </Field>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground">
            Build my checklist <ArrowUpRight size={15} />
          </button>
          <button type="button" onClick={reset} className="h-12 rounded-xl border border-border px-5 text-xs font-bold">
            Reset
          </button>
        </div>
      </form>
      {!plan ? (
        <div className="paper-grid flex min-h-[430px] flex-col justify-end rounded-[20px] border border-border p-6 sm:p-8">
          <p className="font-data text-[10px] uppercase tracking-[.16em] text-muted-foreground">No score or verdict</p>
          <p className="mt-3 max-w-[410px] font-display text-4xl leading-[.95] sm:text-5xl">Use your documents, not a made-up risk number.</p>
          <p className="mt-5 max-w-[390px] text-[12px] leading-[1.7] text-muted-foreground">The checklist keeps notice, offer, contract, and cash details separate. It cannot establish whether resigning is right for you.</p>
        </div>
      ) : "error" in plan ? (
        <ResultPanel><p role="alert" className="text-sm font-semibold text-destructive">{plan.error}</p></ResultPanel>
      ) : (
        <ResultPanel>
          <div role="status" aria-live="polite" data-testid="result-risk-plan">
            <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Your selected facts</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-4"><dt className="text-[10px] text-muted-foreground">Notice period</dt><dd className="mt-1 text-sm font-bold">{plan.noticeDays} days</dd></div>
              <div className="rounded-xl border border-border bg-background/60 p-4"><dt className="text-[10px] text-muted-foreground">Offer status</dt><dd className="mt-1 text-sm font-bold">{plan.offerStatus}</dd></div>
              <div className="rounded-xl border border-border bg-background/60 p-4"><dt className="text-[10px] text-muted-foreground">Cash runway entered</dt><dd className="mt-1 text-sm font-bold">{plan.cashRunwayMonths} months</dd></div>
              <div className="rounded-xl border border-border bg-background/60 p-4"><dt className="text-[10px] text-muted-foreground">Repayment clause selected</dt><dd className="mt-1 text-sm font-bold">{plan.hasRepaymentClause ? "Yes" : "No"}</dd></div>
            </dl>
            <h3 className="mt-7 text-[12px] font-bold">Checks before deciding</h3>
            <ol className="mt-3 space-y-3">
              {plan.nextSteps.map((step) => <li key={step} className="flex gap-3 text-[11px] leading-[1.7]"><span className="font-data text-primary">{String(plan.nextSteps.indexOf(step) + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
            </ol>
            <p className="mt-6 border-t border-border pt-4 text-[10px] leading-[1.7] text-muted-foreground">These inputs stay in the current page state; no result or personal selection is sent to analytics or saved by this tool. This is not legal, financial, or medical advice.</p>
          </div>
        </ResultPanel>
      )}
    </div>
  </PublicPage>;
}

export function LayoffRadarPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All signals");
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportCompany, setReportCompany] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportConfidence, setReportConfidence] = useState("Medium");
  const [reportError, setReportError] = useState<string | null>(null);
  const { isSignedIn } = useAppAuth();
  const reportMutation = useCreateLayoffSignalReport();
  const signalType =
    filter === "All signals"
      ? undefined
      : (filter as ListLayoffSignalsParams["type"]);
  const signalsQuery = useListLayoffSignals({ query: query || undefined, type: signalType });
  const returnedSignals = signalsQuery.isError ? [] : usableLayoffSignals(signalsQuery.data?.data);
  const highShare = returnedSignals.length ? returnedSignals.filter((item) => item.confidence === "High").length / returnedSignals.length * 100 : 0;
  const signalMix = returnedSignals.reduce<Record<string, number>>((mix, item) => ({ ...mix, [item.type]: (mix[item.type] ?? 0) + 1 }), {});
  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportError(null);
    const company = reportCompany.trim();
    const description = reportDescription.trim();
    if (company.length < 2) {
      setReportError("Add at least two characters for the company.");
      return;
    }
    if (description.length < 15) {
      setReportError("Describe the change in at least 15 characters.");
      return;
    }
    if (description.length > 2000) {
      setReportError("Keep the report under 2,000 characters.");
      return;
    }
    try {
      await reportMutation.mutateAsync({
        data: {
          company,
          description,
          confidence: reportConfidence as "Low" | "Medium" | "High",
        },
      });
      setReported(true);
      trackEvent("signal_report_submitted", {
        tool: "layoff_radar",
        outcome: "queued",
        route: "/layoff-radar",
      });
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? Number((error as { status?: unknown }).status)
          : 0;
      const outcome = status === 429 ? "rate_limited" : "unavailable";
      setReportError(
        status === 429
          ? "That is a lot of reports in a short time. Please try again later."
          : "We could not queue that report. Nothing was published; please try again.",
      );
      trackEvent("signal_report_submission_failed", {
        tool: "layoff_radar",
        outcome,
        route: "/layoff-radar",
      });
    }
  };
  return <PublicPage eyebrow="Desk / company signals" title="Layoffs are a pattern before they are a headline." intro="Search the signal table, check confidence, and submit a report if your team is showing a meaningful change. Reports are redacted, reviewed privately, and only become public when approved.">
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-border bg-card p-4"><div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3"><Search size={16} className="text-muted-foreground" /><input aria-label="Search the layoff radar" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or signal" className="h-10 w-full bg-transparent text-sm outline-none" /></div><div className="flex items-center gap-2"><Filter size={15} className="text-muted-foreground" /><select aria-label="Filter signals by type" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-background px-3 text-[11px] font-bold"><option>All signals</option><option>Layoff</option><option>Hiring freeze</option><option>Hiring signal</option><option>Restructure</option></select></div><Dialog.Trigger asChild><button onClick={() => setReported(false)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-bold text-primary-foreground">Report a signal <ArrowUpRight size={14} /></button></Dialog.Trigger></div>
     {!signalsQuery.isPending && !signalsQuery.isError && returnedSignals.length > 0 && <div data-testid="summary-layoff-signals" className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] font-bold text-muted-foreground">Signals returned</p><p className="mt-2 font-data text-2xl">{returnedSignals.length}</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] font-bold text-muted-foreground">High-confidence share</p><p className="mt-2 font-data text-2xl">{highShare.toFixed(0)}%</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] font-bold text-muted-foreground">Signal mix</p><p className="mt-2 text-[11px] leading-[1.6]">{Object.entries(signalMix).map(([type, count]) => `${type}: ${count}`).join(" · ")}</p></div><p className="sm:col-span-3 text-[11px] leading-[1.6] text-muted-foreground">Interpretation: this is a descriptive snapshot of returned public signals, not a forecast. Confidence describes evidence quality, not what will happen next.</p></div>}
     <div className="mt-5 overflow-hidden rounded-[18px] border border-border bg-card">
       <div className="hidden grid-cols-[1.1fr_2fr_.8fr_.7fr] gap-4 border-b border-border bg-muted/45 px-5 py-3 font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground sm:grid"><span>Company</span><span>Signal</span><span>Date observed</span><span>Confidence</span></div>
       {signalsQuery.isPending ? <div className="p-12 text-center"><p className="font-display text-2xl">Reading the latest signals…</p><p className="mt-2 text-[12px] text-muted-foreground">Checking the current public dataset.</p></div> : signalsQuery.isError ? <div className="p-12 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-4 font-display text-2xl">The radar is unavailable.</p><p className="mt-2 text-[12px] text-muted-foreground">Try again in a moment; no stale signal is being presented as current.</p><button type="button" onClick={() => void signalsQuery.refetch()} className="mt-5 text-[11px] font-bold text-primary">Retry</button></div> : returnedSignals.length === 0 ? <div className="p-12 text-center"><SlidersHorizontal className="mx-auto text-muted-foreground" /><p className="mt-4 font-display text-2xl">No publishable signals match that search.</p><p className="mt-2 text-[12px] text-muted-foreground">Signals without a citation and reviewed source record are withheld. Try a broader company name or clear the filter.</p></div> : returnedSignals.map((item) => {
         const citation = validatedSourceUrl(item.sourceUrl);
         return <div key={item.id} className="grid gap-3 border-b border-border px-5 py-5 last:border-0 sm:grid-cols-[1.1fr_2fr_.8fr_.7fr] sm:items-center sm:gap-4">
           <div><p className="font-semibold">{item.company}</p><p className="mt-1 text-[10px] text-muted-foreground sm:hidden">{formatDate(item.observedAt)} · {item.confidence} confidence</p><div className="mt-3 sm:hidden"><WatchlistButton company={item.company} signal={item.signal} note="Track this layoff or hiring signal." /></div></div>
           <div><p className="text-[12px] leading-[1.55]">{item.signal}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.type} · {item.source}</p><p className="mt-1 text-[10px]">{citation ? <a href={citation} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Open source citation</a> : <span className="text-muted-foreground">Citation unavailable</span>}</p><EvidenceDetails provenance={item.provenance} sourceUrl={item.sourceUrl} /></div>
           <span className="hidden font-data text-[10px] text-muted-foreground sm:block">{formatDate(item.observedAt)}</span>
           <div><span className="w-fit rounded-full bg-secondary px-2.5 py-1 font-data text-[9px] text-foreground">{item.confidence}</span><div className="mt-3 hidden sm:block"><WatchlistButton company={item.company} signal={item.signal} note="Track this layoff or hiring signal." /></div></div>
         </div>;
       })}
     </div>
    <ToolEvidence meta={signalsQuery.data?.meta} isPending={signalsQuery.isPending} isError={signalsQuery.isError} onRetry={() => void signalsQuery.refetch()} label="layoff evidence" />
     <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><FreshnessBadge label={signalsQuery.data?.meta?.refreshedAt ? `Latest source retrieved ${formatDate(signalsQuery.data.meta.refreshedAt)}` : signalsQuery.isPending ? "Checking source dates" : "Source retrieval date unavailable"} confidence={signalsQuery.data?.meta?.confidence ?? "Mixed"} /><p className="text-[11px] text-muted-foreground">Signals are directional, not an employment forecast.</p></div>
     <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" /><Dialog.Content aria-labelledby="signal-report-title" className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[500px] -translate-x-1/2 -translate-y-1/2"><form onSubmit={submitReport} noValidate className="rounded-[20px] border border-border bg-background p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Community signal intake</p><Dialog.Title id="signal-report-title" className="mt-2 font-display text-3xl">Submit a change report</Dialog.Title></div><Dialog.Close type="button" aria-label="Close signal report preview" className="text-[11px] font-bold text-muted-foreground">Close</Dialog.Close></div>{reported ? <div className="mt-8 rounded-xl border border-primary/25 bg-primary/10 p-5"><Check className="text-primary" size={20} /><p className="mt-3 font-bold">Report queued for review.</p><p className="mt-2 text-[12px] leading-[1.6] text-muted-foreground">We stored only a redacted company and signal description. A reviewer checks it before anything can appear in the public radar; approval is not guaranteed.</p><Dialog.Close type="button" className="mt-5 text-[11px] font-bold text-primary">Return to radar</Dialog.Close></div> : <><div className="mt-7 grid gap-4"><Field label="Company"><Input value={reportCompany} onChange={setReportCompany} placeholder="Company name" required /></Field><Field label="What changed?"><textarea value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} required maxLength={2000} placeholder="Describe the signal without naming individuals." className="min-h-[110px] w-full rounded-xl border border-border bg-background p-3 text-sm outline-none" /></Field><Field label="Source confidence"><Select value={reportConfidence} onChange={setReportConfidence} options={["Low", "Medium", "High"]} /></Field></div><p className="mt-4 text-[10px] leading-[1.6] text-muted-foreground">You can submit anonymously or while signed in. Direct contact details and links are redacted on the server. Reports stay private during moderation and are published only if approved.</p>{reportError && <p role="alert" className="mt-4 flex items-center gap-2 text-[11px] text-destructive"><CircleAlert size={14} /> {reportError}</p>}<button type="submit" disabled={reportMutation.isPending} className="mt-6 h-12 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-60">{reportMutation.isPending ? "Sending to review…" : "Submit for review"}</button></>}</form></Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </PublicPage>;
}

export function SalaryRealityPage() {
  const cityOptions = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune"] as const;
  const experienceOptions = ["0–2 years", "3–5 years", "5–8 years", "9+ years"] as const;
  const [role, setRole] = useState<RoleName>("Software engineer");
  const [city, setCity] = useState("Bengaluru");
  const [experience, setExperience] = useState("5–8 years");
  const [targetCtc, setTargetCtc] = useState("2400000");
  const benchmarksQuery = useListSalaryBenchmarks({ role, city, experienceBand: experience });
  const benchmark = benchmarksQuery.isError
    ? undefined
    : usableDecisionSalaryBenchmarks(benchmarksQuery.data?.data)[0];
  const roleProfile = roleProfiles[role];
  const experienceProfile = experienceGuidance[experience as keyof typeof experienceGuidance];
  const targetResult = parseBoundedNumber(targetCtc, 0, 100_000_000, "Target CTC");
  const target = targetResult.value;
  const bandSpread = benchmark ? benchmark.p75 - benchmark.p25 : 0;
  const targetLabel = benchmark && target !== null ? target < benchmark.p25 ? "Below P25" : target < benchmark.median ? "P25 to median" : target <= benchmark.p75 ? "Median to P75" : "Above P75" : "";
  const targetDelta = benchmark && target !== null ? target - benchmark.median : null;
  const targetRead = !benchmark
    ? "DATA CURRENTLY UNAVAILABLE: no eligible role-and-city benchmark is available."
    : target === null
      ? "Enter a valid annual CTC to compare it with this benchmark."
    : target < benchmark.p25
      ? `Your target is ${formatLakhs(benchmark.p25 - target)} below the observed lower quartile.`
      : target <= benchmark.median
        ? `Your target is ${formatLakhs(benchmark.median - target)} below the observed median.`
        : target <= benchmark.p75
          ? `Your target is ${formatLakhs(target - benchmark.median)} above the observed median.`
          : `Your target is ${formatLakhs(target - benchmark.p75)} above the observed upper quartile.`;
  useEffect(() => {
    if (benchmark) {
      trackEvent("salary_benchmark_viewed", {
        tool: "salary_reality",
        route: "/salary-reality",
      });
    }
  }, [benchmark]);
  return <PublicPage eyebrow="Desk / salary reality" title="What does your role actually pay here?" intro="A benchmark is useful when it names the city, experience, and distribution behind the headline. Start with a market band, then decode a specific offer.">
      <div className="rounded-[20px] border border-border bg-card p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Role"><Select value={role} onChange={(value) => setRole(value as RoleName)} options={roleOptions} /></Field>
          <Field label="City"><Select value={city} onChange={setCity} options={cityOptions} /></Field>
          <Field label="Experience"><Select value={experience} onChange={setExperience} options={experienceOptions} /></Field>
          <Field label="Target CTC (₹)" hint="Planning input, not sent to analytics."><Input name="target-ctc" value={targetCtc} onChange={setTargetCtc} type="number" min="0" max="100000000" /></Field>
        </div>
        {targetResult.error && <p className="mt-4 flex items-center gap-2 text-[11px] text-destructive" role="alert"><CircleAlert size={14} /> {targetResult.error}</p>}
        {benchmarksQuery.isPending ? (
          <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-8 text-center"><p className="font-display text-2xl">Reading the market band…</p></div>
        ) : benchmarksQuery.isError ? (
          <div className="mt-8 rounded-xl border border-destructive/25 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-4 font-display text-2xl">The benchmark is unavailable.</p><p className="mt-2 text-[12px] text-muted-foreground">No previous benchmark is being shown as current.</p><button type="button" onClick={() => void benchmarksQuery.refetch()} className="mt-4 text-[11px] font-bold text-primary">Retry</button></div>
        ) : !benchmark ? (
          <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-8 text-center"><p className="font-display text-2xl">No source-backed benchmark for this combination yet.</p><p className="mt-2 text-[12px] text-muted-foreground">Market ranges are withheld until their source and sample basis can be checked. The offer calculator remains available below.</p></div>
        ) : targetResult.error ? (
          <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-8 text-center"><p className="font-display text-2xl">Add a valid target to compare it.</p><p className="mt-2 text-[12px] text-muted-foreground">The benchmark is available, but this planning input is outside the supported range.</p></div>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {([["P25", benchmark.p25], ["Median", benchmark.median], ["P75", benchmark.p75]] as const).map(([name, value], index) => (
                <div key={name} className={`rounded-xl border p-5 ${index === 1 ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
                  <p className="font-data text-[10px] uppercase tracking-[.12em] text-muted-foreground">{name}</p>
                  <p className="mt-3 font-display text-4xl">{formatLakhs(value)}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">annual total CTC</p>
                </div>
              ))}
            </div>
              <div data-testid="result-salary-reality" className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4"><p className="text-[10px] text-muted-foreground">Target band</p><p className="mt-2 font-data text-lg">{targetLabel}</p></div>
              <div className="rounded-xl border border-border p-4"><p className="text-[10px] text-muted-foreground">Target annual CTC ÷ 12 (gross)</p><p className="mt-2 font-data text-lg">{target === null ? "Unavailable" : formatRupees(target / 12)}</p></div>
              <div className="rounded-xl border border-border p-4"><p className="text-[10px] text-muted-foreground">Observed spread (P75 − P25)</p><p className="mt-2 font-data text-lg">{formatLakhs(bandSpread)}</p></div>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <div>
                <p className="text-[12px] font-bold">{role} · {city} · {experience}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{benchmark.source} · {benchmark.sampleSize} reported snapshots · {validatedSourceUrl(benchmark.sourceUrl) ? <a href={validatedSourceUrl(benchmark.sourceUrl) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-bold underline">source citation</a> : "citation unavailable"}</p>
              </div>
              <FreshnessBadge label={`${provenanceStatusLabel(benchmark.provenance.status)} · source retrieved ${formatDate(benchmark.provenance.retrievedDate)}`} confidence={benchmark.confidence} />
            </div>
          </>
        )}
      </div>
     <ToolEvidence meta={benchmarksQuery.data?.meta} isPending={benchmarksQuery.isPending} isError={benchmarksQuery.isError} onRetry={() => void benchmarksQuery.refetch()} label="salary evidence" />
     {benchmark && <EvidenceDetails provenance={benchmark.provenance} sourceUrl={benchmark.sourceUrl} />}
      <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[18px] border border-border bg-secondary/35 p-6">
          <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Read the band</p>
          <p className="mt-3 text-[13px] leading-[1.7]">{target !== null && benchmark ? `Your target falls ${targetLabel.toLowerCase()} in the observed range. ` : ""}{targetRead}</p>
          <p className="mt-3 text-[11px] leading-[1.7] text-muted-foreground">
            {!benchmark || targetDelta === null
              ? "No comparison is produced until an eligible benchmark and valid target input are available."
              : targetDelta >= 0
              ? "The number is above the observed median, but the premium still needs to be explained by scope, scarce skills, company context, or variable-pay design."
              : "The number is below the observed median, so ask what responsibility, evidence, or compensation component would close the gap."}
            {" "}This is a comparison aid, not a percentile claim: sample mix, equity, variable pay, company stage, and interview leverage can move an offer substantially.
          </p>
        </div>
        <div className="rounded-[18px] border border-border bg-card p-6">
          <p className="font-display text-2xl">Have an offer?</p>
          <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">See what reaches your bank account after tax, PF, gratuity, and variable pay.</p>
          <Link href="/salary-calculator" onClick={() => trackNextAction("ctc-calculator")} className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold text-primary" data-testid="link-salary-reality-decoder">Decode this offer <ArrowUpRight size={14} /></Link>
          <Link href="/guides/read-the-offer-beyond-ctc/" className="mt-3 block text-[10px] leading-[1.6] text-muted-foreground underline underline-offset-2" data-testid="link-ctc-offer-guide">Read what CTC includes—and what may not reach monthly cash</Link>
          {benchmark && <div className="mt-5 border-t border-border pt-4">
            <p className="text-[11px] font-bold">Keep this benchmark</p>
            <div className="mt-3"><SaveDecisionButton slug={`salary-${slugify(role)}-${slugify(city)}`} title={`${role} salary reality in ${city}`} kind="salary" eventName="workspace_decision_created" summary={`${role} in ${city}, ${experience}: ${formatLakhs(benchmark.median)} median CTC.`} signal={`${formatLakhs(benchmark.p25)}–${formatLakhs(benchmark.p75)} market range from ${benchmark.sampleSize} reported snapshots.`} /></div>
          </div>}
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2"><div className="rounded-[18px] border border-border bg-card p-6"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Responsibility lens</p><h2 className="mt-3 font-display text-2xl">{role} · {experienceProfile.label}</h2><p className="mt-3 text-[12px] leading-[1.7]">{roleProfile.responsibility}</p><div className="mt-5 border-t border-border pt-4"><p className="text-[10px] font-bold text-muted-foreground">At this level, look for</p><p className="mt-2 text-[11px] leading-[1.7]">{experienceProfile.detail} For this role, that should become ownership of {roleProfile.ownership.toLowerCase()}</p></div></div><div className="rounded-[18px] border border-border bg-secondary/35 p-6"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">What changes the number</p><p className="mt-3 text-[13px] leading-[1.7]">{roleProfile.levers}</p><p className="mt-5 text-[10px] font-bold text-muted-foreground">Questions before you compare offers</p><ul className="mt-2 space-y-2 text-[11px] leading-[1.65] text-muted-foreground">{roleProfile.questions.map((question) => <li key={question}>• {question}</li>)}</ul></div></div>
  </PublicPage>;
}

export function CompaniesPage() {
  const [query, setQuery] = useState("");
  const companiesQuery = useListPublicCompanySignals({ query: query || undefined });
  const companies = companiesQuery.isError ? [] : usableCompanySignals(companiesQuery.data?.data);
  return <PublicPage eyebrow="Desk / company intelligence" title="Know the company behind the offer." intro="No company stability or hiring score is published without source evidence and a reviewed method. Before accepting an offer, confirm team scope, manager expectations, and headcount approval directly.">
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3"><Search size={16} className="text-muted-foreground" /><input aria-label="Search companies or sectors" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a company or sector" className="h-12 w-full bg-transparent text-sm outline-none" /></div>
      {companiesQuery.isPending ? <div className="mt-5 rounded-[18px] border border-border p-12 text-center"><p className="font-display text-3xl">Checking eligible company evidence…</p><p className="mt-2 text-[12px] text-muted-foreground">Only current records with traceable provenance are considered.</p></div> : companiesQuery.isError ? <div className="mt-5 rounded-[18px] border border-destructive/25 bg-destructive/5 p-12 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-4 font-display text-3xl">Company evidence is unavailable.</p><p className="mt-2 text-[12px] text-muted-foreground">No stale company rows are being shown as current.</p><button type="button" onClick={() => void companiesQuery.refetch()} className="mt-5 text-[11px] font-bold text-primary">Retry</button></div> : companies.length === 0 ? <div className="mt-5 rounded-[18px] border border-border p-12 text-center"><p className="font-display text-3xl">No company profile is ready to publish.</p><p className="mt-2 text-[12px] text-muted-foreground">Numeric stability and hiring-momentum assessments remain withheld pending a reviewed, versioned method. No company outcome is inferred from missing evidence.</p><Link href="/contact" className="mt-5 inline-flex text-[11px] font-bold text-primary">Request a company review <ArrowUpRight size={14} /></Link></div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{companies.map((company) => { const sourceUrl = validatedSourceUrl(company.sourceUrl); return <Link key={company.id} href={`/companies/${company.slug}`} className="group rounded-[18px] border border-border bg-card p-5 transition-transform hover:-translate-y-1 hover:border-primary/60"><div className="flex items-start justify-between"><div><p className="font-display text-2xl">{company.name}</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-muted-foreground">{company.sector}</p></div><ArrowUpRight size={16} className="text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><p className="mt-5 text-[12px] leading-[1.6] text-muted-foreground">{company.signal}</p><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="font-data text-[9px] text-muted-foreground">Source retrieved {formatDate(company.provenance.retrievedDate)}</span><span className="text-[10px] font-bold text-primary">{companyConfidenceLabel(company)}</span></div><p className="mt-2 text-[10px] text-muted-foreground">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="font-bold text-primary">Open source citation <ArrowUpRight className="inline" size={12} /></a> : "Source citation unavailable · directional / unverified"}</p></Link>; })}</div>}
          {!companiesQuery.isPending && !companiesQuery.isError && companiesQuery.data && <><div data-testid="summary-companies" className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] text-muted-foreground">Source-backed companies returned</p><p className="mt-2 font-data text-2xl">{companies.length}</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] text-muted-foreground">Score methodology</p><p className="mt-2 text-[12px] font-bold">Human review pending</p></div></div><ToolEvidence meta={companyEvidenceMeta(companiesQuery.data.meta, companies.length > 0 && companies.every((item) => Boolean(validatedSourceUrl(item.sourceUrl))))} /><div className="mt-5"><FreshnessBadge label={companies.length > 0 && companiesQuery.data.meta?.refreshedAt ? `Latest source retrieved ${formatDate(companiesQuery.data.meta.refreshedAt)}` : "No publishable company signal"} confidence={companies.length > 0 ? (companiesQuery.data.meta?.confidence ?? "Mixed") : "Low"} /></div></>}
  </PublicPage>;
}

export function CompanyDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const redirect = routeRegistry.redirects.find(
    (entry) => entry.from.replace(/\/+$/, "") === `/companies/${slug}`,
  );
  if (redirect) return <Redirect to={redirect.to} />;
  const legacyReplacement = getLegacyCompanyReplacement(slug);
  const companyQuery = useGetPublicCompanySignal(slug, {
    query: {
      queryKey: [`/api/public/companies/${slug}`],
      enabled: !legacyReplacement,
    },
  });
  const company = companyQuery.isError
    ? undefined
    : companyQuery.data?.data && usableCompanySignals([companyQuery.data.data])[0];
  useEffect(() => {
    if (company) {
      trackEvent("company_viewed", {
        route: "/companies/:slug",
      });
    }
  }, [company, slug]);
  if (legacyReplacement) {
    return <LegacyCompanyPage />;
  }
  if (companyQuery.isPending) {
    return <PublicPage seo={{ noIndex: true }} eyebrow="Company read / intelligence" title="Checking source review for this company…" intro="A current company read appears only after its source evidence and scoring method are approved."><div /></PublicPage>;
  }
  if (companyQuery.isError || !company) {
    return <PublicPage seo={{ noIndex: true }} eyebrow="Company read / intelligence" title="This company signal is unavailable." intro="No company score is shown unless its evidence and scoring method are approved. The requested signal may be missing, withheld, or temporarily unavailable."><div className="flex flex-wrap gap-3"><button type="button" onClick={() => void companyQuery.refetch()} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground">Retry source <ArrowUpRight size={14} /></button><Link href="/companies" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-[11px] font-bold">Back to companies <ArrowUpRight size={14} /></Link></div></PublicPage>;
  }
   const sourceUrl = validatedSourceUrl(company.sourceUrl);
    return (
      <PublicPage seo={{ title: `${company.name} Company Signal | CareerReality`, description: company.signal, noIndex: true, breadcrumbs: [{ name: "Home", path: "/" }, { name: company.name, path: `/companies/${company.slug}` }] }} eyebrow="Company read / intelligence" title={company.name} intro={`${company.sector} · a dated source record to inspect, not an assessment of job security, stability, or hiring outlook.`}>
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <ResultPanel>
            <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Assessment status</p>
            <p className="mt-3 font-display text-4xl">Score withheld</p>
            <p className="mt-4 text-[12px] leading-[1.7] text-muted-foreground">No stability, hiring-momentum, or future job-security assessment is shown. A reviewed, versioned method is not available.</p>
            <div className="mt-7 border-t border-border pt-5"><p className="text-[11px] font-bold">What this record can show</p><p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">The cited event, observation date, source evidence, and stated limitations—where those fields are present and verified.</p></div>
          </ResultPanel>
          <div className="rounded-[20px] border border-border bg-card p-6 sm:p-8">
            <FreshnessBadge label={`Observed ${formatDate(company.observedAt)} · source retrieved ${formatDate(company.provenance.retrievedDate)}`} confidence={company.confidence} />
            <h2 className="mt-8 font-display text-4xl">Latest signal</h2>
            <p className="mt-4 text-[15px] leading-[1.75]">{company.signal}</p>
            <p className="mt-4 text-[11px] text-muted-foreground">Source: {company.source}</p>
            <p className="mt-2 text-[11px]">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary">Open source citation <ArrowUpRight className="inline" size={13} /></a> : <span className="text-muted-foreground">Source citation unavailable · directional / unverified</span>}</p>
            <EvidenceDetails provenance={company.provenance} sourceUrl={company.sourceUrl} />
            <div className="mt-8 border-t border-border pt-5"><p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">Next verification checklist</p><ul className="mt-3 space-y-3 text-[12px] leading-[1.6] text-muted-foreground"><li>Ask which team owns the role and whether it is a backfill.</li><li>Confirm review cycle and headcount approval in writing.</li><li>Compare the offer with the current market band.</li><li>Recheck the signal after the next source review.</li></ul></div>
            <div className="mt-8 border-t border-border pt-5"><p className="mb-3 text-[11px] font-bold">Keep watching this company</p><WatchlistButton company={company.name} signal={company.signal} note="Track this company while deciding whether to pursue or accept an offer." /></div>
          </div>
        </div>
        <ToolEvidence meta={companyEvidenceMeta(companyQuery.data?.meta, Boolean(sourceUrl))} isError={companyQuery.isError} onRetry={() => void companyQuery.refetch()} label="company evidence" />
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/offer-comparison" onClick={() => trackNextAction("offer-comparison")} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground">Compare offers <ArrowUpRight size={14} /></Link>
          <Link href="/layoff-runway/" onClick={() => trackNextAction("layoff-runway")} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-[11px] font-bold">Estimate a job-loss cash runway</Link>
        </div>
      </PublicPage>
    );
}

export function SalaryDropPage() {
  const [currentCtc, setCurrentCtc] = useState("2400000");
  const [newCtc, setNewCtc] = useState("2100000");
  const [variablePay, setVariablePay] = useState("10");
  const [monthlyCost, setMonthlyCost] = useState("80000");
  const [bufferMonths, setBufferMonths] = useState("6");
  const result = calculateSalaryDrop({
    currentCtc,
    newCtc,
    variablePayPercent: variablePay,
    monthlyCostBaseline: monthlyCost,
    bufferMonths,
  });
  const reset = () => {
    setCurrentCtc("2400000");
    setNewCtc("2100000");
    setVariablePay("10");
    setMonthlyCost("80000");
    setBufferMonths("6");
  };
  return <PublicPage eyebrow="Tool / compensation trade-off" title="Compare a lower package without a false verdict." intro="Compare estimated monthly take-home using the same variable-pay share for both annual CTC amounts. The estimate uses the shared Tax Year 2026–27 new-regime model and shows 0%, 50%, and 100% variable-pay realization.">
    <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
      <div className="rounded-[20px] border border-border bg-card p-6 sm:p-8">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Your assumptions</p>
        <h2 className="mt-2 font-display text-3xl">Change the numbers.</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Field label="Current annual CTC (₹)">
            <Input name="current-ctc" value={currentCtc} onChange={setCurrentCtc} type="number" min="1" max="100000000" required />
          </Field>
          <Field label="New annual CTC (₹)">
            <Input name="new-ctc" value={newCtc} onChange={setNewCtc} type="number" min="1" max="100000000" required />
          </Field>
          <Field label="Assumed variable-pay share (%)" hint="Uses the same target share for both packages; results show three realization scenarios.">
            <Input name="variable-pay" value={variablePay} onChange={setVariablePay} type="number" min="0" max="100" step="0.1" required />
          </Field>
          <Field label="Monthly cost baseline (₹)" hint="Used only to show the cash difference as a share of this amount.">
            <Input name="monthly-cost" value={monthlyCost} onChange={setMonthlyCost} type="number" min="1" max="10000000" required />
          </Field>
          <Field label="Comparison buffer (months)" hint="An assumption you choose, not a recommended emergency-fund size.">
            <Input name="buffer-months" value={bufferMonths} onChange={setBufferMonths} type="number" min="0" max="24" step="1" required />
          </Field>
        </div>
        <button type="button" onClick={reset} className="mt-6 h-11 rounded-xl border border-border px-5 text-xs font-bold">Reset assumptions</button>
        <p data-testid="salary-drop-private-note" className="mt-5 border-t border-border pt-4 text-[10px] leading-[1.7] text-muted-foreground">The calculator runs in this browser. It does not send a contribution, save these inputs, write them to the URL, or include them in analytics.</p>
      </div>
      <div className="rounded-[20px] border border-border bg-secondary/40 p-6 sm:p-8">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Comparison</p>
        <h2 className="mt-2 font-display text-3xl">What changes?</h2>
        {!result.ok ? (
          <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[12px] leading-[1.6] text-destructive">{result.error} Results are withheld until every input is valid.</p>
        ) : (
          <div role="status" aria-live="polite" data-testid="result-salary-drop" className="mt-6">
            <p className="text-[10px] text-muted-foreground">Monthly estimated take-home change · 0% variable realized</p>
            <p className="mt-2 font-display text-4xl tracking-[-.04em]">{result.calculation.monthlyCashDelta < 0 ? "−" : result.calculation.monthlyCashDelta > 0 ? "+" : ""}{formatRupees(Math.abs(result.calculation.monthlyCashDelta))}</p>
            <dl className="mt-6 space-y-4 border-t border-border pt-5 text-[11px]">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Annual estimated take-home change · 0% variable</dt><dd className="font-bold">{result.calculation.annualCashDelta < 0 ? "−" : result.calculation.annualCashDelta > 0 ? "+" : ""}{formatRupees(Math.abs(result.calculation.annualCashDelta))}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Current fixed salary / year · assumed</dt><dd className="font-bold">{formatRupees(result.calculation.currentAssumedFixedCash)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">New fixed salary / year · assumed</dt><dd className="font-bold">{formatRupees(result.calculation.newAssumedFixedCash)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Estimated annual take-home · current → new, 0% variable</dt><dd className="font-bold">{formatRupees(result.calculation.currentNetTakeHomeAtZeroVariable)} → {formatRupees(result.calculation.newNetTakeHomeAtZeroVariable)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{result.calculation.bufferMonths}-month cash difference</dt><dd className="font-bold">{formatRupees(result.calculation.selectedBufferAmount)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Monthly difference vs. your baseline</dt><dd className="font-bold">{result.calculation.monthlyCostChangePercent > 0 ? "+" : ""}{result.calculation.monthlyCostChangePercent.toFixed(1)}%</dd></div>
            </dl>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-[10px] font-bold">Monthly take-home change by variable-pay realization</p>
              <ul className="mt-3 space-y-2 text-[10px]">
                {result.calculation.takeHomeScenarios.map((scenario) => <li key={scenario.realizationPercent} className="flex justify-between gap-3"><span className="text-muted-foreground">{scenario.realizationPercent}% realized</span><span className="font-bold">{scenario.monthlyTakeHomeDelta < 0 ? "−" : scenario.monthlyTakeHomeDelta > 0 ? "+" : ""}{formatRupees(Math.abs(scenario.monthlyTakeHomeDelta))} / month</span></li>)}
              </ul>
            </div>
            <p className="mt-5 border-t border-border pt-4 text-[10px] leading-[1.7] text-muted-foreground">Directional estimate from the shared Tax Year 2026–27 new-regime model. It assumes all CTC is salary split into fixed and variable pay, and excludes employee/employer PF, professional tax, benefits, special deductions, and payment timing. Actual payroll can differ. The buffer uses the 0%-variable take-home change and is not a savings recommendation. For a full pay breakdown, use the <Link href="/salary-calculator/" className="font-bold text-primary underline">salary calculator</Link>.</p>
          </div>
        )}
      </div>
    </div>
  </PublicPage>;
}

export function EscapePlanPage() {
  const [goal, setGoal] = useState<EscapePlanGoal>(escapePlanGoals[0]);
  const [weeks, setWeeks] = useState<string>(escapePlanWeeks[1]);
  const [weeklyHours, setWeeklyHours] = useState("4");
  const [checked, setChecked] = useState<string[]>([]);
  const tasks = getEscapePlanTasks(goal);
  const progress = Math.round(checked.length / tasks.length * 100);
  const nextTaskIndex = tasks.findIndex((task) => !checked.includes(task));
  const hoursResult = calculateEscapePlanHours(weeklyHours, weeks);
  const completionTrackedRef = useRef(false);
  useEffect(() => {
    if (checked.length < tasks.length) {
      completionTrackedRef.current = false;
      return;
    }
    if (!completionTrackedRef.current) {
      trackEvent("escape_plan_completed", {
        tool: "escape_plan",
        route: "/escape-plan",
      });
      completionTrackedRef.current = true;
    }
  }, [checked.length, tasks.length]);
  const reset = () => {
    setGoal(escapePlanGoals[0]);
    setWeeks(escapePlanWeeks[1]);
    setWeeklyHours("4");
    setChecked([]);
    completionTrackedRef.current = false;
  };
  return <PublicPage eyebrow="Tool / next move" title="Build a plan for the change you want to test." intro="Choose one direction and work through a goal-specific checklist. Completion counts are exact; they do not predict whether you should resign or whether a job search will succeed.">
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-[20px] border border-border bg-card p-6 sm:p-8">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Set the direction</p>
        <h2 className="mt-2 font-display text-3xl">What do you want to test?</h2>
        <div className="mt-7 grid gap-4">
          <Field label="Primary goal">
            <Select name="escape-goal" value={goal} onChange={(value) => { setGoal(value as EscapePlanGoal); setChecked([]); completionTrackedRef.current = false; }} options={escapePlanGoals} />
          </Field>
          <Field label="Planning window">
            <Select name="escape-weeks" value={weeks} onChange={setWeeks} options={escapePlanWeeks} />
          </Field>
          <Field label="Hours available per week">
            <Input name="weekly-hours" value={weeklyHours} onChange={setWeeklyHours} type="number" min="1" max="40" step="1" required />
          </Field>
        </div>
        {!hoursResult.ok && <p className="mt-4 text-[11px] text-destructive" role="alert"><CircleAlert className="mr-1 inline" size={14} /> {hoursResult.error}</p>}
        <div data-testid="summary-escape-plan" className="mt-8 rounded-xl bg-secondary/50 p-4">
          <p className="font-data text-[9px] uppercase tracking-[.13em] text-primary">Time budget</p>
          <p className="mt-2 text-[12px] leading-[1.6] text-muted-foreground">{hoursResult.ok ? `${hoursResult.totalHours} hours available across ${weeks}. This is an arithmetic time budget, not a completion promise or hiring prediction.` : "Enter 1 to 40 hours per week to calculate the selected planning window."}</p>
        </div>
        <button type="button" onClick={reset} className="mt-5 h-11 rounded-xl border border-border px-5 text-xs font-bold">Reset plan</button>
      </div>
      <div className="rounded-[20px] border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Your checklist</p><h2 className="mt-2 font-display text-3xl">{goal}</h2></div>
          <p data-testid="escape-plan-progress" className="font-data text-2xl text-primary">{checked.length} / {tasks.length}</p>
        </div>
        <div role="progressbar" aria-label="Checklist actions marked complete" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={checked.length} className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/[.05] p-4" data-testid="escape-plan-next-action" aria-live="polite">
          <p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">
            {nextTaskIndex >= 0 ? `Next action · ${nextTaskIndex + 1} of ${tasks.length}` : "Checklist complete"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6">
            {nextTaskIndex >= 0
              ? tasks[nextTaskIndex]
              : "Review which facts are confirmed and which questions remain open before choosing a next step."}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {nextTaskIndex >= 0
              ? "Work through one action at a time. The order is a planning aid, not a deadline or a promise."
              : "Completing the checklist does not establish that a move is right for you."}
          </p>
        </div>
        <div className="mt-7 space-y-3">
          {tasks.map((task, index) => {
            const isChecked = checked.includes(task);
            return <button type="button" key={task} data-testid={`button-task-${index}`} aria-pressed={isChecked} onClick={() => setChecked((current) => current.includes(task) ? current.filter((item) => item !== task) : [...current, task])} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-[12px] transition-colors ${isChecked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{isChecked && <Check size={14} />}</span>{task}</button>;
          })}
        </div>
        <div className="mt-7 border-t border-border pt-5">
          <p data-testid="escape-plan-readiness" aria-live="polite" className="text-[11px] font-bold">{checked.length} of {tasks.length} actions marked complete. This checklist does not assess readiness to resign or estimate job-search odds.</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Progress exists only in this page state. Refreshing clears it; the tool does not auto-save inputs or include goal and duration in analytics.</p>
        </div>
      </div>
    </div>
  </PublicPage>;
}

const indexResponseOptions = ["Not satisfied", "Somewhat satisfied", "Neutral", "Satisfied", "Super satisfied"] as const;
type IndexResponse = (typeof indexResponseOptions)[number];
type IndexSignal = "pay" | "stability" | "optionality" | "ai";

export function CareerRealityIndexPage() {
  const components = [
    { key: "pay", label: "Current pay", note: "How satisfied are you with your pay for the work and responsibility you carry?" },
    { key: "stability", label: "Company confidence", note: "How satisfied are you with your confidence in the company's stability?" },
    { key: "optionality", label: "Ability to move", note: "How satisfied are you with your ability to move if this role stops working?" },
    { key: "ai", label: "AI readiness", note: "How satisfied are you with your ability to stay valuable as AI changes your tasks?" },
  ] as const;
  const [inputs, setInputs] = useState<Partial<Record<IndexSignal, IndexResponse>>>({});
  const selectOptions = ["Choose a response", ...indexResponseOptions];
  const updateInput = (key: IndexSignal, value: string) => {
    if (value === "Choose a response") {
      setInputs((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }
    if (indexResponseOptions.includes(value as IndexResponse)) {
      setInputs((current) => ({ ...current, [key]: value as IndexResponse }));
    }
  };
  const labels = {
    pay: inputs.pay ?? "Not answered",
    stability: inputs.stability ?? "Not answered",
    optionality: inputs.optionality ?? "Not answered",
    ai: inputs.ai ?? "Not answered",
  };
  const answeredCount = components.filter((component) => Boolean(inputs[component.key])).length;
  const isComplete = answeredCount === components.length;
  const diagnosis = createCareerRealityIndexReflection({
    pay: labels.pay,
    stability: labels.stability,
    optionality: labels.optionality,
    ai: labels.ai,
  });
  const savedSignal = components.map((component) => {
    const key = component.key as IndexSignal;
    return `${component.label}: ${labels[key]}`;
  }).join(" · ");

  return <PublicPage eyebrow="Method / self-check" title="A career decision should end in a clearer question, not a prettier number." intro="Choose the response that feels most honest for each signal. Your answers shape which uncertainties and focused tools appear next; the check does not calculate a score or predict your future.">
    <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
      <div className="rounded-[20px] border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Personal profile</p><h2 className="mt-2 font-display text-3xl">Say how it feels right now.</h2></div>
          <div className="text-right"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Your inputs</p><p className="mt-1 whitespace-nowrap font-display text-2xl">{answeredCount} of {components.length}</p></div>
        </div>
        <p className="mt-5 text-[11px] leading-[1.7] text-muted-foreground">Choose a response based on recent evidence, not the answer you wish were true. Neutral is valid; it means the next useful step is to find out more.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/35 px-3 py-3">
          <span className="mr-1 font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">Response scale</span>
          {indexResponseOptions.map((option, index) => <span key={option} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${index === 0 ? "bg-accent/15 text-accent" : index === indexResponseOptions.length - 1 ? "bg-primary/15 text-primary" : "bg-background text-muted-foreground"}`}>{option}</span>)}
        </div>
        <div className="mt-7 grid gap-4">{components.map((component) => <Field key={component.key} label={component.label} hint={component.note}><Select name={`index-${component.key}`} value={inputs[component.key] ?? "Choose a response"} onChange={(value) => updateInput(component.key, value)} options={selectOptions} /></Field>)}</div>
        <div className="mt-7 rounded-xl border border-border bg-secondary/35 p-4">
          <p className="text-[11px] font-bold">How to answer honestly</p>
           <p className="mt-2 text-[11px] leading-[1.65] text-muted-foreground">Use written evidence and recent conversations where relevant. You are not being graded, and this page cannot verify your answers.</p>
        </div>
      </div>
      <div data-testid="result-career-index" className="signal-scan rounded-[20px] border border-primary/25 bg-primary/[.07] p-6 sm:p-8">
        <div className="relative z-[1]">
           <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Response-specific reflection · self-reported</p>
          <div data-testid="index-response-summary" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{components.map((component) => <div key={component.key} className="rounded-lg border border-border/80 bg-card/55 px-3 py-2.5"><p className="text-[9px] uppercase tracking-[.08em] text-muted-foreground">{component.label}</p><p className="mt-1 text-[11px] font-bold">{inputs[component.key] ?? "Not answered"}</p></div>)}</div>
           {!isComplete && <p role="status" className="mt-5 rounded-xl border border-border bg-card/65 p-4 text-[12px] leading-[1.7] text-muted-foreground">Answer all four signals to see a reflection prompt. No response is assumed for you.</p>}
          {isComplete && <>
          <h2 className="mt-5 max-w-[680px] font-display text-5xl leading-[.94] tracking-[-.045em] sm:text-6xl">{diagnosis.verdict}</h2>
           <p className="mt-4 rounded-xl border border-amber-800/20 bg-amber-900/[.05] p-4 text-[11px] leading-[1.7] text-amber-950">This is not a statement about your employer, salary market, job security, or AI exposure. It is not a recommendation to stay or leave.</p>
          <div className="mt-8 grid gap-4">
             <div className="rounded-xl border border-accent/35 bg-accent/[.09] p-4 sm:p-5"><p className="font-data text-[9px] uppercase tracking-[.15em] text-accent">What this check knows</p><p className="mt-3 text-[13px] leading-[1.7]">{diagnosis.truth}</p></div>
             <div className="rounded-xl border border-border bg-card/65 p-4 sm:p-5"><p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">Your responses</p><p className="mt-3 text-[12px] leading-[1.7] text-muted-foreground">{diagnosis.evidence}</p></div>
             <div className="rounded-xl border border-border bg-card/65 p-4 sm:p-5"><p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">One thing you could check</p><p className="mt-3 text-[12px] leading-[1.7]">{diagnosis.lever}</p></div>
          </div>
           <div className="mt-6 rounded-xl border border-primary/25 bg-card/70 p-4 sm:p-5"><p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">Possible next step</p><p className="mt-3 text-[12px] font-semibold leading-[1.7]">{diagnosis.next}</p><div className="mt-4 grid gap-2">{diagnosis.nextTools.map((tool) => <Link key={tool.href} href={tool.href} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-[11px] font-bold hover:border-primary/50">{tool.label}<ArrowUpRight size={14} /></Link>)}</div><div className="mt-5 border-t border-border pt-4"><p className="text-[11px] font-bold">Questions to consider</p><ul className="mt-3 grid gap-2">{diagnosis.questions.map((question) => <li key={question} className="flex gap-2 text-[11px] leading-[1.6] text-muted-foreground"><span className="text-primary">—</span><span>{question}</span></li>)}</ul></div></div>
          <div className="mt-6 border-t border-border pt-5"><p className="text-[11px] font-bold">Keep this decision</p><p className="mt-2 text-[10px] leading-[1.6] text-muted-foreground">Save this self-reported response pattern privately as a decision note. It does not create a verified score or a month-to-month comparison.</p><div className="mt-3"><SaveDecisionButton slug="career-reality-index" title={`Career Reality Check: ${diagnosis.verdict}`} kind="risk" eventName="career_index_saved" summary={`Self-reported career check. ${diagnosis.truth}`} signal={savedSignal} /></div></div>
          </>}
            <details className="mt-6 border-t border-border pt-5"><summary className="cursor-pointer text-[11px] font-bold">Methodology and uncertainty</summary><div className="mt-3 space-y-2 text-[10px] leading-[1.7] text-muted-foreground"><p>The reflection and suggested tools change based on answers marked Not satisfied, Somewhat satisfied, or Neutral. It does not rank or score the four self-reported responses. No prior reading or market dataset is used.</p><p>This check is not a confidence measure, trend, benchmark, or employment forecast. It cannot see private company plans, manager decisions, health, family obligations, or whether a change will make you happier. Verify important assumptions with documents, recent conversations, and qualified advice where appropriate.</p></div></details>
        </div>
      </div>
    </div>
  </PublicPage>;
}

export function AiPulsePage() {
  const tasks = [
    {
      role: "Software engineer",
      task: "Boilerplate implementation",
      response: "Ask which first-pass work is automated, who reviews it, and what remains the engineer's responsibility.",
      signal: "Check review ownership, system context, and the failure cases the team expects a person to catch.",
    },
    {
      role: "Product manager",
      task: "Synthesis and status reporting",
      response: "Ask what is automated and who remains accountable for prioritisation and stakeholder decisions.",
      signal: "Check whether summaries are traceable to source material and whether decision ownership is explicit.",
    },
    {
      role: "Designer",
      task: "Variant exploration",
      response: "Ask who sets constraints, selects a direction, and validates the result with users.",
      signal: "Check how generated alternatives are reviewed and what evidence supports the selected direction.",
    },
    {
      role: "Data analyst",
      task: "Recurring reporting",
      response: "Ask who defines the metric, checks the data, and owns the decision enabled by the report.",
      signal: "Check the metric definition, data quality, and review path before treating an automated report as evidence.",
    },
  ];
  const [selectedRole, setSelectedRole] = useState(tasks[0].role);
  const selectedTask = tasks.find((item) => item.role === selectedRole) ?? tasks[0];
  const [taskName, setTaskName] = useState(tasks[0].task);
  const [repeatability, setRepeatability] = useState("Repeatable");
  const [errorImpact, setErrorImpact] = useState("Moderate");
  const [humanReview, setHumanReview] = useState("Yes, always");
  const taskReadout = createAiTaskReadout({
    taskName,
    repeatability,
    errorImpact,
    humanReview,
  });
  return <PublicPage eyebrow="Desk / future of work" title="Start with the task, not a role-level AI score." intro="Use these prompts to examine where tools fit into a team's work. They are editorial questions, not measured exposure or a forecast.">
    <section data-testid="ai-pulse-selector" className="mb-5 rounded-[18px] border border-border bg-card p-5 sm:p-6" aria-labelledby="ai-sample-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">Step 1 / choose a starting point</p>
          <h2 id="ai-sample-title" className="mt-2 font-display text-2xl">Pick a sample task or describe your own.</h2>
        </div>
        <p className="max-w-sm text-[11px] leading-[1.6] text-muted-foreground"><strong>No role-level score is published.</strong> These examples are prompts, not measured exposure or a forecast.</p>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {tasks.map((item, index) => {
          const isSelected = item.role === selectedRole;
          return (
            <button
              key={item.role}
              type="button"
              aria-pressed={isSelected}
              data-testid={`ai-sample-role-${index}`}
              onClick={() => { setSelectedRole(item.role); setTaskName(item.task); }}
              className={`min-h-24 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? "border-primary bg-primary/[.07]" : "border-border hover:border-primary/50"}`}
            >
              <span className="block text-[10px] font-bold text-muted-foreground">{item.role}</span>
              <span className="mt-2 block text-sm font-semibold leading-5">{item.task}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-secondary/45 p-4">
          <p className="font-data text-[9px] uppercase tracking-[.13em] text-primary">Question to take into the team</p>
          <p className="mt-2 text-[11px] leading-[1.6]">{selectedTask.response}</p>
        </div>
        <div className="rounded-xl bg-secondary/45 p-4">
          <p className="font-data text-[9px] uppercase tracking-[.13em] text-primary">Evidence to check</p>
          <p className="mt-2 text-[11px] leading-[1.6]">{selectedTask.signal}</p>
        </div>
      </div>
    </section>
    <div className="mb-5 rounded-xl border border-border bg-muted/35 px-4 py-3 text-[11px] leading-[1.6] text-muted-foreground">
      Your task description and answers stay in this page state. They are not sent to the API, saved, or added to analytics.
    </div>
    <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
      <div className="rounded-[20px] border border-border bg-card p-6 sm:p-8">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Step 2 / describe the work</p>
        <h2 className="mt-2 font-display text-3xl">Describe the work, not your job title.</h2>
        <div className="mt-6 grid gap-4">
          <Field label="Task to examine" hint="Be specific about the work, such as reviewing a payment or preparing a weekly report.">
            <Input name="ai-task-name" value={taskName} onChange={setTaskName} maxLength={180} placeholder="Describe one recurring or important task" />
            <span data-testid="ai-task-length" className="mt-1 block text-right text-[10px] text-muted-foreground">{taskName.length} / 180 characters</span>
          </Field>
          <Field label="How repeatable is it?"><Select name="ai-repeatability" value={repeatability} onChange={setRepeatability} options={["Repeatable", "Mixed", "Context-heavy"]} /></Field>
          <Field label="Impact if the output is wrong"><Select name="ai-error-impact" value={errorImpact} onChange={setErrorImpact} options={["Low", "Moderate", "High"]} /></Field>
          <Field label="Does a person review the result?"><Select name="ai-human-review" value={humanReview} onChange={setHumanReview} options={["Yes, always", "Sometimes", "No"]} /></Field>
        </div>
      </div>
      <div data-testid="ai-task-readout" className="rounded-[20px] bg-[#263138] p-6 text-[#f2eadc] sm:p-8">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-[#83c9b4]">Step 3 / review the questions · self-reported</p>
        { "error" in taskReadout ? <p role="alert" className="mt-4 text-[12px]">{taskReadout.error}</p> : <>
          <p className="mt-3 font-display text-3xl leading-tight">{taskReadout.label}</p>
          <p className="mt-4 text-[12px] leading-[1.7] text-[#c7d0c9]">{taskReadout.detail}</p>
          <h3 className="mt-7 border-t border-[#46545a] pt-5 text-[11px] font-bold">What to verify for “{taskReadout.taskName}”</h3>
          <ul className="mt-3 space-y-3 text-[11px] leading-[1.6] text-[#afbbb5]">{taskReadout.checks.map((check) => <li key={check} className="flex gap-2"><span className="text-[#83c9b4]">—</span><span>{check}</span></li>)}</ul>
        </>}
      </div>
    </div>
    <p className="mt-5 text-[11px] leading-[1.6] text-muted-foreground">Use the readout as a starting point for a bounded check with your team. It does not measure AI exposure, time saved, role change, or job security.</p>
  </PublicPage>;
}
