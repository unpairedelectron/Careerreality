import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  Check,
  ChevronDown,
  CircleHelp,
  FileCheck2,
  LockKeyhole,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  getGetReadinessDeskDataQueryKey,
  useGetReadinessDeskData,
} from "@workspace/api-client-react";
import {
  applicationScoreWeights,
  calculateApplicationScore,
  effectiveReadinessStatus,
  type ApplicationReadinessEntry,
  type ApplicationReadinessStatus,
  type ApplicationScorecard,
  type ReadinessCheckStatus,
} from "@/data/application-readiness-model";
import { getToolDirectoryCategoryLabel, toolDirectoryItems, type ToolDirectoryReadiness } from "@/data/tool-directory";
import { useSeo } from "@/lib/seo";

const statuses: ApplicationReadinessStatus[] = [
  "READY",
  "READY WITH WARNINGS",
  "NOT READY",
  "BLOCKED BY HUMAN INPUT",
];

const dimensionLabels: Record<keyof ApplicationScorecard, string> = {
  productClarity: "Product clarity",
  accuracy: "Accuracy",
  provenance: "Provenance",
  methodology: "Methodology",
  userValue: "User value",
  ux: "User experience",
  accessibility: "Accessibility",
  mobile: "Mobile",
  performance: "Performance",
  errorResilience: "Error resilience",
  privacySecurity: "Privacy & security",
  contentTrust: "Content trust",
};

const checkStatusLabels: Record<ReadinessCheckStatus, string> = {
  pass: "Pass",
  warning: "Warning",
  blocked: "Blocked",
  "not-tested": "Not tested",
};

const statusStyles: Record<ApplicationReadinessStatus, string> = {
  READY: "border-emerald-800/20 bg-emerald-900/[0.07] text-emerald-900",
  "READY WITH WARNINGS": "border-amber-800/20 bg-amber-900/[0.07] text-amber-900",
  "NOT READY": "border-rose-800/20 bg-rose-900/[0.07] text-rose-900",
  "BLOCKED BY HUMAN INPUT": "border-slate-700/20 bg-slate-800/[0.07] text-slate-800",
};

const checkStyles: Record<ReadinessCheckStatus, string> = {
  pass: "text-emerald-800",
  warning: "text-amber-800",
  blocked: "text-rose-800",
  "not-tested": "text-slate-600",
};

const portfolioReadinessStyles: Record<ToolDirectoryReadiness, string> = {
  READY: "border-emerald-800/20 bg-emerald-900/[0.07] text-emerald-900",
  "READY WITH WARNINGS": "border-amber-800/20 bg-amber-900/[0.07] text-amber-900",
  "NOT READY": "border-rose-800/20 bg-rose-900/[0.07] text-rose-900",
  "BLOCKED BY HUMAN INPUT": "border-slate-700/20 bg-slate-800/[0.07] text-slate-800",
  "NEEDS REVIEW": "border-border bg-secondary text-muted-foreground",
};

function StatusPill({ status }: { status: ApplicationReadinessStatus }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 font-data text-[10px] font-semibold leading-4 tracking-[0.08em] ${statusStyles[status]}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {status}
    </span>
  );
}

function CheckMark({ status }: { status: ReadinessCheckStatus }) {
  if (status === "pass") return <Check aria-hidden="true" className="h-3.5 w-3.5" />;
  if (status === "warning") return <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />;
  if (status === "blocked") return <X aria-hidden="true" className="h-3.5 w-3.5" />;
  return <CircleHelp aria-hidden="true" className="h-3.5 w-3.5" />;
}

function TestIcon({ status }: { status: ApplicationReadinessEntry["tests"][number]["status"] }) {
  if (status === "passed") return <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-800" />;
  if (status === "partial") return <Activity aria-hidden="true" className="h-3.5 w-3.5 text-amber-800" />;
  if (status === "blocked") return <X aria-hidden="true" className="h-3.5 w-3.5 text-rose-800" />;
  return <CircleHelp aria-hidden="true" className="h-3.5 w-3.5 text-slate-600" />;
}

function weightedPoints(score: number, weight: number) {
  return (score * weight) / 100;
}

function EntryDetail({ entry }: { entry: ApplicationReadinessEntry }) {
  const dimensions = (Object.keys(applicationScoreWeights) as Array<keyof ApplicationScorecard>);
  return (
    <div className="border-t border-border/80 bg-[hsl(var(--secondary)/.24)] px-4 py-5 sm:px-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr_.9fr]">
        <section aria-labelledby={`dimensions-${entry.id}`}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="font-data text-[9px] uppercase tracking-[.18em] text-muted-foreground">Weighted scorecard</p>
              <h3 id={`dimensions-${entry.id}`} className="mt-1 text-sm font-bold">Dimension contribution</h3>
            </div>
            <span className="font-data text-[10px] text-muted-foreground">Weight allocation · 100 pts</span>
          </div>
          <div className="space-y-2.5">
            {dimensions.map((key) => {
              const weight = applicationScoreWeights[key];
              const value = entry.scorecard[key];
              const points = weightedPoints(value, weight);
              return (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_5.4rem] items-center gap-x-3 gap-y-1">
                  <div className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-foreground/85">{dimensionLabels[key]}</span>
                    <span className="shrink-0 font-data text-[10px] text-muted-foreground">{weight} wt</span>
                  </div>
                  <div className="text-right font-data text-[10px] tabular-nums text-foreground">
                    {value} <span className="text-muted-foreground">· {points.toFixed(2)} pts</span>
                  </div>
                  <div className="col-span-2 h-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 border-l-2 border-accent/60 pl-2.5 text-[11px] leading-relaxed text-muted-foreground">
            The internal release target is 90/100. Scores below target are not ready, and any hard blocker overrides any score.
          </p>
        </section>

        <section aria-labelledby={`evidence-${entry.id}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-data text-[9px] uppercase tracking-[.18em] text-muted-foreground">Evidence review</p>
              <h3 id={`evidence-${entry.id}`} className="mt-1 text-sm font-bold">Checks supplied for this app</h3>
            </div>
            <span className="font-data text-[10px] text-muted-foreground">{entry.checks.length} checks</span>
          </div>
          {entry.checks.length ? (
            <ul className="divide-y divide-border/70 rounded-lg border border-border/75 bg-card/70">
              {entry.checks.map((check, index) => (
                <li key={`${check.label}-${index}`} className="grid grid-cols-[minmax(7rem,.72fr)_auto_minmax(0,1.35fr)] items-start gap-2 px-3 py-2.5 text-xs">
                  <span className="font-medium text-foreground">{check.label}</span>
                  <span className={`inline-flex items-center gap-1 font-data text-[9px] uppercase tracking-[.1em] ${checkStyles[check.status]}`}>
                    <CheckMark status={check.status} />{checkStatusLabels[check.status]}
                  </span>
                  <span className="leading-relaxed text-muted-foreground">{check.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-5 text-xs text-muted-foreground">No evidence checks supplied.</p>
          )}
        </section>

        <div className="space-y-5">
          <section aria-labelledby={`tests-${entry.id}`}>
            <div className="mb-3 flex items-center gap-2">
              <FileCheck2 aria-hidden="true" className="h-4 w-4 text-primary" />
              <h3 id={`tests-${entry.id}`} className="text-sm font-bold">Test record</h3>
            </div>
            {entry.tests.length ? (
              <ul className="space-y-2">
                {entry.tests.map((test, index) => (
                  <li key={`${test.name}-${index}`} className="flex items-start gap-2.5 rounded-md border border-border/70 bg-card/60 px-3 py-2.5">
                    <span className="mt-0.5"><TestIcon status={test.status} /></span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{test.name}</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{test.detail}</span>
                      <span className="mt-1 block font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">{test.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">No tests supplied.</p>}
          </section>
          <section aria-labelledby={`recommendation-${entry.id}`} className="rounded-lg border border-primary/20 bg-primary/[0.055] p-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />
              <h3 id={`recommendation-${entry.id}`} className="font-data text-[9px] font-semibold uppercase tracking-[.16em] text-primary">Final recommendation</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{entry.recommendation}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ReadinessRow({ entry, index }: { entry: ApplicationReadinessEntry; index: number }) {
  const blockers = entry.hardBlockers.length;
  const score = calculateApplicationScore(entry.scorecard);
  const status = effectiveReadinessStatus(entry);
  return (
    <details className="group overflow-hidden rounded-xl border border-border/85 bg-card/90 shadow-[0_8px_24px_hsl(var(--foreground)/.035)] transition-colors open:border-primary/30" data-testid={`readiness-entry-${entry.id}`}>
      <summary className="grid cursor-pointer list-none items-center gap-x-4 gap-y-3 px-4 py-4 outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto_auto_1.5rem] sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary font-data text-[10px] text-muted-foreground sm:flex">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold tracking-[-.02em] text-foreground">{entry.name}</span>
            <span className="mt-1 block truncate font-data text-[10px] text-muted-foreground">{entry.route}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <StatusPill status={status} />
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-data text-[10px] ${blockers ? "bg-rose-900/[.07] text-rose-900" : "bg-emerald-900/[.06] text-emerald-900"}`}>
            {blockers ? <LockKeyhole aria-hidden="true" className="h-3 w-3" /> : <Check aria-hidden="true" className="h-3 w-3" />}
            {blockers} blocker{blockers === 1 ? "" : "s"}
          </span>
        </div>
        <span className="flex items-center justify-between border-t border-border/70 pt-2 sm:block sm:border-0 sm:pt-0">
          <span className="font-data text-[9px] uppercase tracking-[.14em] text-muted-foreground sm:hidden">Total score</span>
          <span className="flex items-baseline gap-1 font-data text-2xl font-medium leading-none tracking-[-.08em] text-foreground tabular-nums">
            {score.toFixed(2)}<span className="text-[11px] tracking-normal text-muted-foreground">/100</span>
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 sm:block" />
      </summary>

      <div className="mx-4 mb-4 grid gap-3 sm:mx-5 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,.75fr)]">
        <section aria-label={`Hard blockers for ${entry.name}`} className={`rounded-lg border p-3.5 ${blockers ? "border-rose-900/20 bg-rose-900/[.045]" : "border-emerald-900/15 bg-emerald-900/[.035]"}`}>
          <div className="flex items-center gap-2">
            {blockers ? <LockKeyhole aria-hidden="true" className="h-4 w-4 text-rose-900" /> : <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-900" />}
            <h3 className="font-data text-[9px] font-semibold uppercase tracking-[.16em] text-foreground">Hard blockers · decision gate</h3>
          </div>
          {blockers ? (
            <ul className="mt-2.5 space-y-1.5">
              {entry.hardBlockers.map((blocker, blockerIndex) => (
                <li key={`${blocker}-${blockerIndex}`} className="flex gap-2 text-xs leading-relaxed text-rose-950">
                  <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-800" />{blocker}
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-xs leading-relaxed text-emerald-950">No hard blockers supplied.</p>}
        </section>
        <div className="flex items-center gap-3 rounded-lg border border-border/75 bg-secondary/35 px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary"><Activity aria-hidden="true" className="h-4 w-4" /></span>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Gate before score.</strong> A high weighted total cannot override a hard blocker.
          </p>
        </div>
      </div>
      <EntryDetail entry={entry} />
    </details>
  );
}

export default function ApplicationReadinessDashboard() {
  const readinessQuery = useGetReadinessDeskData({
    query: {
      queryKey: getGetReadinessDeskDataQueryKey(),
      retry: false,
    },
  });
  const parsedRecords = useMemo((): { entries: ApplicationReadinessEntry[]; error: string | null } => {
    if (!readinessQuery.data) return { entries: [], error: null };
    try {
      const value: unknown = JSON.parse(readinessQuery.data.records);
      if (!Array.isArray(value)) throw new Error("Readiness records must be an array.");
      return { entries: value as ApplicationReadinessEntry[], error: null };
    } catch {
      return { entries: [], error: "The readiness records could not be read." };
    }
  }, [readinessQuery.data]);
  const entries = parsedRecords.entries;
  const portfolioItems = useMemo(
    () => toolDirectoryItems.map((item) => {
      const assessment = entries.find((entry) => entry.route === item.route.path) ?? null;
      return {
        ...item,
        assessment,
        readiness: assessment ? effectiveReadinessStatus(assessment) : "NEEDS REVIEW" as const,
        score: assessment ? calculateApplicationScore(assessment.scorecard) : null,
      };
    }),
    [entries],
  );
  useSeo({
    title: "Application Readiness | CareerReality",
    description: "Internal staging register for application evidence, tests, blockers, and weighted scorecards.",
    path: "/admin/application-readiness",
    noIndex: true,
  });
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationReadinessStatus | "ALL">("ALL");
  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      const matchesStatus = selectedStatus === "ALL" || effectiveReadinessStatus(entry) === selectedStatus;
      const matchesQuery = !needle || `${entry.name} ${entry.route} ${entry.id}`.toLocaleLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [entries, query, selectedStatus]);

  const matchedAssessmentCount = portfolioItems.filter((item) => item.assessment).length;
  const currentBlockerCount = portfolioItems.filter((item) => item.readiness === "BLOCKED BY HUMAN INPUT").length;

  if (readinessQuery.isLoading) {
    return <main className="p-8 text-sm text-muted-foreground" role="status">Loading reviewer records…</main>;
  }
  if (readinessQuery.isError || parsedRecords.error) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl">Readiness records unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {parsedRecords.error ?? "Reviewer records could not be loaded. No local copy was used."}
        </p>
        <button className="mt-5 rounded-md border border-border px-3 py-2 text-sm" onClick={() => void readinessQuery.refetch()}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] px-4 pb-16 pt-7 text-foreground sm:px-7 sm:pt-10 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/75 px-5 py-6 shadow-[0_18px_44px_hsl(var(--foreground)/.045)] sm:px-8 sm:py-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full border border-primary/15 shadow-[0_0_0_2.5rem_hsl(var(--primary)/.025),0_0_0_5rem_hsl(var(--primary)/.02)]" />
          <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[.06] px-2.5 py-1 font-data text-[9px] uppercase tracking-[.16em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Internal quality desk
              </div>
              <p className="font-data text-[10px] uppercase tracking-[.19em] text-muted-foreground">CareerReality / release assurance</p>
              <h1 className="mt-2 max-w-[16ch] font-display text-[2.6rem] leading-[.94] tracking-[-.045em] sm:text-5xl">Application readiness</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Review evidence, blockers and test coverage before a career decision tool is published.
              </p>
              <p className="mt-3 max-w-2xl rounded-lg border border-amber-800/20 bg-amber-900/[.05] px-3 py-2 text-[11px] leading-relaxed text-amber-950">
                Access is checked server-side against the approved catalog-editor and admin roles. This register contains product-readiness notes only; do not add credentials or private user data.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[19rem]">
              <div className="rounded-lg border border-border/80 bg-background/65 px-3.5 py-3">
                <p className="font-data text-[9px] uppercase tracking-[.15em] text-muted-foreground">Current tool routes</p>
                <p className="mt-1.5 font-data text-2xl tabular-nums">{toolDirectoryItems.length}</p>
              </div>
              <div className="rounded-lg border border-border/80 bg-background/65 px-3.5 py-3">
                <p className="font-data text-[9px] uppercase tracking-[.15em] text-muted-foreground">Human-review blocks</p>
                <p className={`mt-1.5 font-data text-2xl tabular-nums ${currentBlockerCount ? "text-rose-900" : "text-primary"}`}>{currentBlockerCount}</p>
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-lg bg-primary px-3.5 py-2.5 text-primary-foreground">
                <span className="font-data text-[9px] uppercase tracking-[.16em]">Route-matched assessments recorded</span>
                <span className="font-data text-lg tabular-nums">{matchedAssessmentCount}<span className="ml-1 text-[10px] opacity-75">/ {toolDirectoryItems.length}</span></span>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-7 overflow-hidden rounded-xl border border-border/80 bg-card/75" aria-labelledby="tool-coverage-heading" data-testid="tool-readiness-coverage">
          <div className="border-b border-border/80 px-4 py-4 sm:px-5">
            <p className="font-data text-[9px] uppercase tracking-[.18em] text-primary">Current route coverage</p>
            <h2 id="tool-coverage-heading" className="mt-1 text-lg font-bold tracking-[-.025em]">All 15 tools, matched to current routes</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              A score appears only when an existing assessment matches the current route exactly. Older or missing records are marked Needs review; no score is inferred from a similar tool.
            </p>
          </div>
          <ol className="divide-y divide-border/70">
            {portfolioItems.map((item) => (
              <li key={item.toolId} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5" data-testid={`tool-readiness-row-${item.toolId}`}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{String(item.priority).padStart(2, "0")} · {item.route.title}</p>
                  <p className="mt-1 truncate font-data text-[10px] text-muted-foreground">{item.route.path} · {getToolDirectoryCategoryLabel(item.category)}</p>
                  {item.legacyAssessment && (
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-900">{item.legacyAssessment.note}</p>
                  )}
                  {!item.assessment && item.technicalReview && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Evidence reviewed:</strong> {item.technicalReview.evidence}{" "}
                      <strong className="text-foreground">Still open:</strong> {item.technicalReview.remainingGate}
                    </p>
                  )}
                  {!item.assessment && !item.legacyAssessment && (
                    <p className="mt-1 text-[11px] text-muted-foreground">No current route-matched readiness assessment has been recorded.</p>
                  )}
                </div>
                <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 font-data text-[9px] font-semibold leading-4 tracking-[.06em] ${portfolioReadinessStyles[item.readiness]}`}>
                  {item.readiness}
                </span>
                <span className="font-data text-xs tabular-nums text-muted-foreground">
                  {item.score === null ? "Not scored" : `${item.score.toFixed(2)} / 100`}
                </span>
              </li>
            ))}
          </ol>
          <p className="border-t border-border/80 px-4 py-3 font-data text-[9px] uppercase tracking-[.1em] text-muted-foreground sm:px-5">
            Legacy assessment records remain below for audit history. They do not override a current route-matched assessment.
          </p>
        </section>

        <section className="mt-7" aria-labelledby="register-heading">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-data text-[9px] uppercase tracking-[.18em] text-muted-foreground">Assessment register</p>
              <h2 id="register-heading" className="mt-1 text-lg font-bold tracking-[-.025em]">Release decisions</h2>
            </div>
            <p className="font-data text-[10px] text-muted-foreground" aria-live="polite">
              Showing {filteredEntries.length} of {entries.length}
            </p>
          </div>
          <div className="mb-4 grid gap-3 rounded-xl border border-border/80 bg-card/75 p-3 sm:grid-cols-[minmax(13rem,1fr)_auto] sm:items-center sm:p-3.5">
            <label className="relative block">
              <span className="sr-only">Search application name, route or identifier</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a tool or route…"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-testid="input-readiness-search"
              />
            </label>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by recommendation status">
              <span className="mr-1 flex items-center gap-1.5 font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">
                <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" /> Status
              </span>
              <button type="button" onClick={() => setSelectedStatus("ALL")} aria-pressed={selectedStatus === "ALL"} className={`rounded-md border px-2.5 py-1.5 font-data text-[9px] uppercase tracking-[.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedStatus === "ALL" ? "border-primary/35 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-secondary"}`} data-testid="filter-status-all">
                All
              </button>
              {statuses.map((status) => (
                <button key={status} type="button" onClick={() => setSelectedStatus(status)} aria-pressed={selectedStatus === status} className={`rounded-md border px-2.5 py-1.5 font-data text-[9px] uppercase tracking-[.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedStatus === status ? statusStyles[status] : "border-border bg-background text-muted-foreground hover:bg-secondary"}`} data-testid={`filter-status-${status.toLowerCase().replaceAll(" ", "-")}`}>
                  {status}
                </button>
              ))}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-card/60 px-5 py-12 text-center sm:py-16">
              <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/[.06] text-primary">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <p className="mt-4 font-data text-[9px] uppercase tracking-[.18em] text-primary">Register awaiting evidence</p>
              <h3 className="mt-2 font-display text-2xl tracking-[-.035em]">No applications to review</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Readiness records will appear here when they are supplied to this desk. No release state is assumed in the meantime.
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-10 text-center">
              <p className="font-semibold">No matching applications</p>
              <p className="mt-1 text-sm text-muted-foreground">Adjust the search or selected status to widen the register.</p>
              <button type="button" onClick={() => { setQuery(""); setSelectedStatus("ALL"); }} className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="button-clear-readiness-filters">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredEntries.map((entry, index) => (
                <ReadinessRow key={entry.id} entry={entry} index={index} />
              ))}
            </div>
          )}
        </section>
        <footer className="mt-7 flex flex-col gap-2 border-t border-border/80 pt-4 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5"><ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5 text-primary" /> Expand a record to inspect its evidence and scorecard.</span>
          <span className="font-data uppercase tracking-[.12em]">Weighted score ≠ release clearance</span>
        </footer>
      </div>
    </main>
  );
}
