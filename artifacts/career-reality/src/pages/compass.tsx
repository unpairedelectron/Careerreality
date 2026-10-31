import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  FileText,
  Gauge,
  LockKeyhole,
  MoveRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Link } from "wouter";
import {
  useCreateCareerCatalogSuggestion,
  useListPublicCareerCatalog,
  useListLayoffSignals,
  useListPublicCompanySignals,
  useListSalaryBenchmarks,
} from "@workspace/api-client-react";
import { AppNav } from "@/components/shared/app-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { SaveDecisionButton } from "@/components/shared/public-actions";
import { trackEvent, trackNextAction } from "@/lib/analytics";
import { getRouteSeo, useSeo } from "@/lib/seo";
import { createCompassDecisionReadouts, type CompassDecisionKey } from "@/lib/application-models";
import {
  evidenceAgeLabel,
  provenanceStatusLabel,
  usableCompanySignals,
  usableDecisionLayoffSignals,
  usableDecisionSalaryBenchmarks,
  validatedSourceUrl,
} from "@/lib/public-evidence";
import "./compass.css";

type DecisionKey = CompassDecisionKey;

const roleProfiles = {
  "Software engineer": {
    lens: "Look for ownership of systems, incident learning, and a credible path beyond ticket delivery.",
    question: "Which system or customer outcome will this role own after six months?",
  },
  "Product manager": {
    lens: "Separate roadmap ownership from coordination work. Customer access and decision rights matter as much as title.",
    question: "Which product decision can this role make without waiting for three approvals?",
  },
  "Data analyst": {
    lens: "Check whether the role changes decisions or only produces recurring reports. Data access is part of the offer.",
    question: "Who will act on the analysis, and how will you know it changed a decision?",
  },
  "Data scientist": {
    lens: "Ask how much of the work is experimentation, production ownership, and data cleaning before comparing model-heavy titles.",
    question: "What makes a model useful here: deployment, adoption, revenue, or an internal demonstration?",
  },
  "UX designer": {
    lens: "A strong design role has user access and influence before build decisions are locked, not only polished screens at the end.",
    question: "When research conflicts with a roadmap commitment, who decides what ships?",
  },
  "UI designer": {
    lens: "Check whether visual craft is connected to a design system and product outcomes or treated as production throughput.",
    question: "How much authority does this role have over the system it is expected to maintain?",
  },
  "DevOps / SRE": {
    lens: "The real compensation includes on-call load, incident authority, and whether reliability work is funded between incidents.",
    question: "What is the on-call rotation, and which reliability decisions can the team make directly?",
  },
  "QA / Test engineer": {
    lens: "Test roles compound when quality is designed into delivery. Count automation ownership and release authority, not only test volume.",
    question: "Can this role block an unsafe release, or only report the risk after the deadline is set?",
  },
  "Cybersecurity analyst": {
    lens: "Security careers grow around access to systems, executive backing, and clear escalation paths when teams resist controls.",
    question: "Who owns the risk when a business team does not accept the security recommendation?",
  },
  "Business analyst": {
    lens: "The useful distinction is between documenting requirements and changing the operating decision those requirements support.",
    question: "Which business outcome will this role be able to move, not just describe?",
  },
  "Project manager": {
    lens: "A project title is safer when authority, dependency escalation, and a funded outcome travel with the plan.",
    question: "What can this role change when a dependency misses its commitment?",
  },
  "Sales / Business development": {
    lens: "Compare territory, quota quality, ramp time, and lead ownership—not just the headline variable pay.",
    question: "How much of the first-year target is backed by existing demand rather than self-generated pipeline?",
  },
  Marketing: {
    lens: "Marketing scope compounds when the role owns a measurable funnel or audience, not only campaigns and requests.",
    question: "Which metric and budget can this role change without waiting for a new planning cycle?",
  },
  "Finance / Accounting": {
    lens: "The career signal is whether the role gains decision context and systems ownership, not only more close cycles.",
    question: "Which decision will your analysis or control change for the business?",
  },
  "HR / People operations": {
    lens: "People work has leverage when it can change manager behavior and operating systems, not just process employee requests.",
    question: "What authority exists when a senior manager does not follow the people process?",
  },
  "Customer success": {
    lens: "Separate relationship coverage from durable customer outcomes. Portfolio size, renewal ownership, and product access set the risk.",
    question: "What can this role change when a customer outcome is blocked by the product?",
  },
  "Operations manager": {
    lens: "Operations roles compound through decision rights, process ownership, and the ability to fix recurring constraints.",
    question: "Which operating metric and team can this role change directly?",
  },
  "Content / Copywriter": {
    lens: "A sustainable content role has audience feedback and distribution ownership, not only a high volume of briefs.",
    question: "Who owns distribution and performance after the copy is delivered?",
  },
} as const;

type BuiltInRoleName = keyof typeof roleProfiles;
const roleOptions = Object.keys(roleProfiles) as BuiltInRoleName[];
const genericRoleProfile = {
  lens: "Treat the title as a starting point. Confirm ownership, decision rights, and the outcomes this role is expected to change.",
  question: "What will this role own, and which decision can it change without waiting for approval?",
};
const sectorOptions = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Government",
  "Retail & Consumer",
  "Manufacturing",
  "Other",
] as const;
const functionOptions = [
  "Engineering",
  "Data & Analytics",
  "Product",
  "Design",
  "Sales & Business Development",
  "Marketing",
  "Operations",
  "Finance & Accounting",
  "People & HR",
  "Customer Success",
  "Other",
] as const;

function formatLakhs(value?: number): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `₹${(value / 100000).toFixed(1)}L`
    : "Unavailable";
}

export default function CareerRealityCompassPage() {
  const seo = getRouteSeo("/compass");
  useSeo({
    title: seo.title!,
    description: seo.description!,
    path: "/compass",
    noIndex: seo.noIndex,
  });
  const [selected, setSelected] = useState<DecisionKey>("offer");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [noticePeriod, setNoticePeriod] = useState(48);
  const [role, setRole] = useState("Software engineer");
  const [city, setCity] = useState("Bengaluru");
  const [experienceBand, setExperienceBand] = useState("5–8 years");
  const [currentCtc, setCurrentCtc] = useState("2200000");
  const [offerCtc, setOfferCtc] = useState("2800000");
  const [companySlug, setCompanySlug] = useState("");
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [suggestedCompany, setSuggestedCompany] = useState("");
  const [suggestedPosition, setSuggestedPosition] = useState("");
  const [suggestedSector, setSuggestedSector] = useState<(typeof sectorOptions)[number]>("Technology");
  const [suggestedFunction, setSuggestedFunction] = useState<(typeof functionOptions)[number]>("Engineering");

  useEffect(() => {
    trackEvent("compass_opened", { route: "/compass" });
  }, []);

  const salaryQuery = useListSalaryBenchmarks({
    role,
    city,
    experienceBand,
  });
  const companyQuery = useListPublicCompanySignals();
  const layoffQuery = useListLayoffSignals();
  const catalogPositionQuery = useListPublicCareerCatalog({ entityType: "position" });
  const catalogCompanyQuery = useListPublicCareerCatalog({ entityType: "company" });
  const catalogSuggestionMutation = useCreateCareerCatalogSuggestion();

  async function submitCatalogSuggestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestedCompany.trim() && !suggestedPosition.trim()) return;
    await catalogSuggestionMutation.mutateAsync({
      data: {
        companyName: suggestedCompany.trim() || undefined,
        positionTitle: suggestedPosition.trim() || undefined,
        sector: suggestedSector,
        jobFunction: suggestedFunction,
      },
    });
    setSuggestedCompany("");
    setSuggestedPosition("");
  }

  // Do not render retained query data as current after a refetch fails.
  const salary = salaryQuery.isError
    ? undefined
    : usableDecisionSalaryBenchmarks(salaryQuery.data?.data)[0];
  const companies = companyQuery.isError
    ? []
    : usableCompanySignals(companyQuery.data?.data);
  const catalogPositions = catalogPositionQuery.isError
    ? []
    : catalogPositionQuery.data?.data ?? [];
  const catalogCompanies = catalogCompanyQuery.isError
    ? []
    : catalogCompanyQuery.data?.data ?? [];
  const availableRoles = [
    ...roleOptions,
    ...catalogPositions
      .map((item) => item.name)
      .filter((name) => !roleOptions.includes(name as BuiltInRoleName)),
  ];
  const company = companies.find((item) => item.slug === companySlug);
  const catalogCompany = catalogCompanies.find((item) => `catalog-${item.id}` === companySlug);
  const selectedCompanyName = company?.name ?? catalogCompany?.name;
  const layoff = company
    ? layoffQuery.isError
      ? undefined
       : usableDecisionLayoffSignals(layoffQuery.data?.data).find(
        (item) => item.company.toLowerCase() === company.name.toLowerCase(),
      )
    : undefined;
  const roleProfile = roleProfiles[role as BuiltInRoleName] ?? genericRoleProfile;
  const loading = salaryQuery.isPending || companyQuery.isPending || layoffQuery.isPending;
  const failedSources = [
    { key: "salary", label: "Salary benchmark", failed: salaryQuery.isError, retry: salaryQuery.refetch },
    { key: "company", label: "Company signal", failed: companyQuery.isError, retry: companyQuery.refetch },
    { key: "layoff", label: "Layoff radar", failed: layoffQuery.isError, retry: layoffQuery.refetch },
  ].filter((source) => source.failed);
  const respondedSources = [
    { label: "Salary benchmark", meta: salaryQuery.data?.meta, record: salary, available: Boolean(salary), failed: salaryQuery.isError },
    { label: "Company signal", meta: companyQuery.data?.meta, record: company, available: Boolean(company), failed: companyQuery.isError },
    { label: "Layoff radar", meta: layoffQuery.data?.meta, record: layoff, available: Boolean(layoff), failed: layoffQuery.isError },
  ];
  const salaryEvidence = salary
    ? `${formatLakhs(salary.p25)}–${formatLakhs(salary.p75)} reported annual CTC; ${salary.sampleSize} snapshots; ${salary.confidence.toLowerCase()} confidence.`
    : salaryQuery.isPending
      ? "Loading; no current benchmark is shown yet."
      : "DATA CURRENTLY UNAVAILABLE: no eligible source-backed benchmark is available.";
  const companyEvidence =
    company?.signal ??
    (catalogCompany
      ? "Catalog entry only; no reviewed company evidence is attached."
      : companyQuery.isError
        ? "DATA CURRENTLY UNAVAILABLE: the company evidence request failed."
        : "No employer selected; no company-specific evidence is attached.");
  const layoffEvidence =
    layoff?.signal ??
    (layoffQuery.isError
      ? "DATA CURRENTLY UNAVAILABLE: the layoff evidence request failed."
      : selectedCompanyName
        ? "No matched public report. Absence is not evidence of safety."
        : "No employer selected; no company-specific search was run.");
  const decisions = createCompassDecisionReadouts({
    role,
    city,
    currentCtc,
    offerCtc,
    noticePeriodDays: noticePeriod,
    salaryEvidence,
    companyEvidence,
    layoffEvidence,
  });
  const decision = decisions[selected];
  const hasMarketEvidence = Boolean(salary || company || layoff);
  const showEvidenceWarning =
    failedSources.length > 0 || (!loading && !hasMarketEvidence);
  const evidenceStatus = loading
    ? "CHECKING SOURCES"
    : failedSources.length > 0
      ? "PARTIAL SOURCE DATA"
      : hasMarketEvidence
        ? "REFERENCE DATA"
        : "USER INPUTS ONLY";
  const evidence = [
    {
      icon: BarChart3,
      title: salary ? `${role} money has a range` : salaryQuery.isError ? "Salary benchmark unavailable" : "Reading the market band",
      text: salary ? `${formatLakhs(salary.p25)}–${formatLakhs(salary.p75)} for ${city} and ${experienceBand} across ${salary.sampleSize} reported snapshots.` : salaryQuery.isError ? "The salary source did not respond. Retry to restore this signal; no stale benchmark is being shown." : "Connecting to the current salary benchmark.",
      meta: salary ? `salary reports · ${salary.confidence.toLowerCase()} confidence` : salaryQuery.isError ? "salary reports · unavailable" : "salary reports · loading",
      sourceKey: "salary",
    },
    {
      icon: Gauge,
       title: company ? `${company.name} evidence available` : catalogCompany ? `${catalogCompany.name} is in the catalog` : companyQuery.isError ? "Company evidence unavailable" : "Choose a company to inspect",
       text: company?.signal ?? (catalogCompany ? "This catalog entry has no reviewed company evidence attached, so no company assessment is produced." : companyQuery.isError ? "The company source did not respond. Retry before treating employer evidence as known." : "The first company in the database should never stand in for the one you are considering."),
       meta: company ? "company evidence · provenance shown below" : catalogCompany ? "catalog context · no evidence" : companyQuery.isError ? "company evidence · unavailable" : "company evidence · choose a company",
      sourceKey: "company",
    },
    {
      icon: TrendingUp,
       title: layoff ? `${selectedCompanyName} has a live signal` : layoffQuery.isError ? "Layoff radar unavailable" : selectedCompanyName ? `${selectedCompanyName} has no matched radar signal` : "Choose a company for the radar",
       text: layoff?.signal ?? (layoffQuery.isError ? "The layoff source did not respond. Retry before treating this employer-specific risk as known." : selectedCompanyName ? "No matching public layoff signal is available for this company; that is not proof of safety." : "The radar is company-specific, so a generic layoff headline should not be attached to every employer."),
       meta: layoff ? `layoff radar · ${layoff.confidence.toLowerCase()} confidence` : layoffQuery.isError ? "layoff radar · unavailable" : "layoff radar · company-specific",
      sourceKey: "layoff",
    },
    {
      icon: Sparkles,
      title: `${role} lens`,
      text: roleProfile.lens,
      meta: `${city} · ${experienceBand} · role context`,
      sourceKey: "role",
    },
  ];

  const snapshotSummary = `CareerReality Compass comparison for a ${role} in ${city}${selectedCompanyName ? ` at ${selectedCompanyName}` : ""}: no combined score or recommendation; ${noticePeriod}-day notice period entered.`;
  const sourceMethodNotes = respondedSources.flatMap((source) => {
    const provenance = source.record?.provenance;
    if (!provenance) return [];
    return [
      `${source.label}: ${provenanceStatusLabel(provenance.status)}; ${provenance.methodologyName} v${provenance.methodologyVersion}; ${provenance.methodologyCalculation}; inputs: ${provenance.methodologyInputs.join(", ")}; published ${provenance.publicationDate}, retrieved ${provenance.retrievedDate}, reviewed ${provenance.reviewedAt}; limitations: ${provenance.limitations.join(" ")}`,
    ];
  }).join(" | ");
  const breakdown = `No composite score, job-security prediction, or accept-or-reject recommendation is calculated. When both CTC inputs are valid, the package difference is offer annual CTC minus current annual CTC; it is not take-home pay. Salary, company, and layoff evidence are shown separately and do not produce a combined outcome. Source methods and limitations: ${sourceMethodNotes || "No eligible market evidence was returned."} Your ${role.toLowerCase()} lens is: ${roleProfile.lens} Compare this with the other choices: review the offer terms, verify the move constraints, or set a date to reassess staying.`;

  return (
    <div className="compass-page">
      <AppNav />
      <div className="compass-shell">
        <aside className="compass-rail" aria-label="Career desk navigation">
          <div className="compass-mark" aria-label="CareerReality">R</div>
          <nav className="compass-rail-nav" aria-label="Decision room sections">
            <Link className="compass-rail-button is-active" href="/compass" aria-label="Decision room" title="Decision room"><Compass size={19} strokeWidth={1.8} /></Link>
            <Link className="compass-rail-button" href="/workspace" aria-label="Saved snapshots" title="Saved snapshots"><FileText size={18} strokeWidth={1.8} /></Link>
            <Link className="compass-rail-button" href="/salary-calculator" aria-label="CTC calculator" title="CTC calculator"><WalletCards size={18} strokeWidth={1.8} /></Link>
          </nav>
          <span className="compass-rail-label">Career desk / India</span>
        </aside>

        <main className="compass-main">
          <header className="compass-topbar">
            <div className="compass-breadcrumb">
              <span className="compass-eyebrow">Your decision room</span>
              <span className="compass-breadcrumb-separator">/</span>
              <span className="compass-muted">A private working read</span>
            </div>
            <div className="compass-top-actions">
              <SaveDecisionButton
                slug={`compass-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                title="CareerReality Compass snapshot"
                kind="salary"
                eventName="snapshot_saved"
                summary={snapshotSummary}
                signal={decision.read}
                confidenceBand={salary?.confidence ?? company?.confidence ?? "unavailable"}
                idleLabel="Save snapshot"
                savedLabel="Snapshot saved"
                nextLabel="Open workspace"
                className="compass-save-button"
              />
               <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
                 <Dialog.Trigger asChild>
                   <button className="compass-help" aria-label="How the Compass works"><CircleHelp size={15} /></button>
                 </Dialog.Trigger>
                 <Dialog.Portal>
                   <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
                   <Dialog.Content aria-labelledby="compass-help-title" className="fixed left-1/2 top-24 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-background p-6 shadow-2xl">
                     <div className="flex items-start justify-between gap-4">
                       <div><p className="compass-eyebrow">Compass method</p><Dialog.Title id="compass-help-title" className="mt-2 font-display text-3xl">How this read works</Dialog.Title></div>
                       <Dialog.Close type="button" aria-label="Close Compass help" className="text-sm font-bold text-muted-foreground">Close</Dialog.Close>
                     </div>
                     <Dialog.Description className="mt-5 text-sm leading-7 text-muted-foreground">The Compass combines the live salary, company, and layoff signals that respond, then shows the trade-off instead of hiding uncertainty. Your role, city, experience, and CTC inputs stay in this browser session unless you choose to save a snapshot.</Dialog.Description>
                   </Dialog.Content>
                 </Dialog.Portal>
               </Dialog.Root>
              <span className="compass-avatar" aria-label="Private workspace">CR</span>
            </div>
          </header>

          <section className="compass-body">
            <div className="compass-hero">
               <div className="compass-eyebrow">One question at a time · 04 personal signals</div>
              <div className="compass-title-row">
                <h1 className="compass-display">Make the next move<br /><em>make sense.</em></h1>
                <div className="compass-orbit" aria-hidden="true"><span /><span /><span /></div>
              </div>
              <p className="compass-hero-copy">A calmer way to work through a high-stakes career decision. Choose the question you actually have; we will put the useful evidence around it.</p>

              <div className="compass-context-grid" aria-label="Personalize your Compass read">
                 <label><span>Role</span><select data-testid="compass-role" value={role} onChange={(event) => setRole(event.target.value)}>{availableRoles.map((option) => <option key={option}>{option}</option>)}</select></label>
                 <label className="compass-context-company"><span>Company</span><select data-testid="compass-company" value={companySlug} onChange={(event) => setCompanySlug(event.target.value)}><option value="">Choose a company</option>{companies.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}{catalogCompanies.length > 0 && <optgroup label="Approved catalog · context only">{catalogCompanies.map((option) => <option key={option.id} value={`catalog-${option.id}`}>{option.name}</option>)}</optgroup>}</select></label>
                <label><span>City</span><select data-testid="compass-city" value={city} onChange={(event) => setCity(event.target.value)}><option>Bengaluru</option><option>Mumbai</option><option>Delhi NCR</option><option>Hyderabad</option><option>Pune</option></select></label>
                <label><span>Experience</span><select data-testid="compass-experience" value={experienceBand} onChange={(event) => setExperienceBand(event.target.value)}><option>0–2 years</option><option>3–5 years</option><option>5–8 years</option><option>9+ years</option></select></label>
                <label><span>Current CTC</span><input data-testid="compass-current-ctc" type="number" min="0" value={currentCtc} onChange={(event) => setCurrentCtc(event.target.value)} /></label>
                <label><span>Offer CTC</span><input data-testid="compass-offer-ctc" type="number" min="0" value={offerCtc} onChange={(event) => setOfferCtc(event.target.value)} /></label>
              </div>
              <div className="compass-catalog-prompt">
                <div>
                  <strong><BriefcaseBusiness size={13} /> Missing a company or role?</strong>
                  <span>Suggest it for the shared catalog. New entries are reviewed before they become selectable evidence.</span>
                </div>
                <Dialog.Root
                  open={catalogDialogOpen}
                  onOpenChange={(open) => {
                    setCatalogDialogOpen(open);
                    if (!open) catalogSuggestionMutation.reset();
                  }}
                >
                  <Dialog.Trigger asChild>
                    <button type="button" className="compass-catalog-link">Suggest an entry <ArrowRight size={13} /></button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
                    <Dialog.Content
                      aria-labelledby="catalog-suggestion-title"
                      className="fixed left-1/2 top-16 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-background p-6 shadow-2xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="compass-eyebrow">Grow the catalog</p>
                          <Dialog.Title id="catalog-suggestion-title" className="mt-2 font-display text-3xl">Add what is missing</Dialog.Title>
                          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                            Suggest a company, a position, or both. We keep it pending until it is reviewed, so an unverified name never becomes market evidence by accident.
                          </Dialog.Description>
                        </div>
                        <Dialog.Close type="button" aria-label="Close catalog suggestion" className="text-sm font-bold text-muted-foreground">Close</Dialog.Close>
                      </div>
                      {catalogSuggestionMutation.isSuccess ? (
                        <div className="compass-catalog-success" role="status">
                          <Check size={17} />
                          <div>
                            <strong>Queued for review.</strong>
                            <span>Your suggestion will be available to everyone after it passes the catalog review.</span>
                          </div>
                        </div>
                      ) : (
                        <form className="compass-catalog-form" onSubmit={(event) => void submitCatalogSuggestion(event)}>
                          <label>
                            <span>Company name <em>optional</em></span>
                            <input
                              value={suggestedCompany}
                              onChange={(event) => setSuggestedCompany(event.target.value)}
                              placeholder="e.g. Zepto"
                              maxLength={120}
                            />
                          </label>
                          <label>
                            <span>Position title <em>optional</em></span>
                            <input
                              value={suggestedPosition}
                              onChange={(event) => setSuggestedPosition(event.target.value)}
                              placeholder="e.g. Revenue Operations Lead"
                              maxLength={160}
                            />
                          </label>
                          <div className="compass-catalog-form-grid">
                            <label>
                              <span>Sector</span>
                              <select value={suggestedSector} onChange={(event) => setSuggestedSector(event.target.value as (typeof sectorOptions)[number])}>
                                {sectorOptions.map((option) => <option key={option}>{option}</option>)}
                              </select>
                            </label>
                            <label>
                              <span>Job function</span>
                              <select value={suggestedFunction} onChange={(event) => setSuggestedFunction(event.target.value as (typeof functionOptions)[number])}>
                                {functionOptions.map((option) => <option key={option}>{option}</option>)}
                              </select>
                            </label>
                          </div>
                          {catalogSuggestionMutation.isError && (
                            <p className="compass-catalog-error" role="alert">
                              We could not queue that suggestion. Please check the names and try again.
                            </p>
                          )}
                          <button
                            type="submit"
                            className="compass-catalog-submit"
                            disabled={catalogSuggestionMutation.isPending || (!suggestedCompany.trim() && !suggestedPosition.trim())}
                          >
                            {catalogSuggestionMutation.isPending ? "Queueing…" : "Queue for review"}
                          </button>
                        </form>
                      )}
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>

              <div className="compass-decision-strip" role="tablist" aria-label="Choose a career decision">
                 {(Object.entries(decisions) as Array<[DecisionKey, typeof decisions.offer]>).map(([key, item], index) => (
                  <button key={key} id={`compass-tab-${key}`} className={`compass-choice ${selected === key ? "is-selected" : ""}`} onKeyDown={(event) => { const keys = Object.keys(decisions) as DecisionKey[]; const currentIndex = keys.indexOf(key); const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % keys.length : event.key === "ArrowLeft" ? (currentIndex - 1 + keys.length) % keys.length : event.key === "Home" ? 0 : event.key === "End" ? keys.length - 1 : -1; if (nextIndex >= 0) { event.preventDefault(); setSelected(keys[nextIndex]); document.getElementById(`compass-tab-${keys[nextIndex]}`)?.focus(); } }} onClick={() => { setSelected(key); setDetailsOpen(false); trackEvent("decision_tab_selected", { route: "/compass" }); }} role="tab" aria-selected={selected === key} aria-controls={`compass-panel-${key}`} tabIndex={selected === key ? 0 : -1}>
                    <span className="compass-choice-number">0{index + 1}</span>
                    <span className="compass-choice-title">{item.title}</span>
                    <span className="compass-choice-detail">{item.detail}</span>
                  </button>
                ))}
              </div>

              {showEvidenceWarning && (
                <div className="compass-partial-banner" role="status">
                  <div><strong>{failedSources.length ? "Partial evidence." : "Market evidence unavailable."}</strong> {failedSources.length ? "One or more source requests failed. Retry the affected source; no stale result is shown." : "No eligible market record is available. Your own inputs remain a local comparison, not market evidence."}</div>
                  <div className="compass-partial-actions">
                    {failedSources.map((source) => (
                      <button key={source.key} type="button" onClick={() => void source.retry()}>{source.label} · Retry</button>
                    ))}
                  </div>
                </div>
              )}

               <section id={`compass-panel-${selected}`} role="tabpanel" aria-labelledby={`compass-tab-${selected}`} className={`compass-readout ${loading ? "is-loading" : ""}`} aria-live="polite" tabIndex={-1}>
                <div className="compass-score-column">
                  <div>
                    <div className="compass-score-label">Compass output</div>
                    <div className="compass-score-copy">Compare</div>
                    <div className="compass-score-denom">Facts and sources, not a verdict</div>
                  </div>
                  <div className="compass-score-status"><ShieldCheck size={12} /> no combined score</div>
                </div>
                <div className="compass-readout-main">
                    <div className="compass-readout-head"><h2 className="compass-readout-title">{decision.title}</h2><span className="compass-updated">{evidenceStatus}</span></div>
                  <p className="compass-decision-read">{decision.read}</p>
                  <div className="compass-readout-line" />
                  {decision.signals.map((signal) => <div className="compass-signal" key={signal.label}><span className="compass-signal-name">{signal.label}</span><span className="compass-signal-value">{signal.value}</span></div>)}
                  <div className="compass-readout-footer"><span><strong>Read the trade-off.</strong> Compare each fact separately; none predicts job security or the best choice for you.</span><button className="compass-breakdown-button" aria-expanded={detailsOpen} aria-controls="compass-breakdown-panel" onClick={() => { const nextOpen = !detailsOpen; setDetailsOpen(nextOpen); if (nextOpen) trackEvent("breakdown_opened", { route: "/compass" }); }}>{detailsOpen ? "Hide breakdown" : "Show breakdown"} <ChevronDown size={13} className={detailsOpen ? "is-rotated" : ""} /></button></div>
                  <div id="compass-breakdown-panel" aria-hidden={!detailsOpen} inert={!detailsOpen} className={`compass-detail-panel ${detailsOpen ? "is-open" : ""}`}><div className="compass-detail-inner"><div className="compass-detail-content">{breakdown}</div></div></div>
                </div>
              </section>

            </div>

            <aside className="compass-aside">
              <div className="compass-aside-card">
                <div className="compass-aside-head"><div><div className="compass-eyebrow">The evidence wall</div><h2 className="compass-aside-title">What changed<br />the read?</h2></div><span className="compass-aside-count">Evidence items · {evidence.length}</span></div>
                 <div className="compass-evidence">{evidence.map((item) => { const Icon = item.icon; return <article className="compass-evidence-item" key={item.title}><span className="compass-evidence-icon"><Icon size={14} /></span><div><div className="compass-evidence-title">{item.title}</div><p className="compass-evidence-text">{item.text}</p><div className="compass-evidence-meta"><span /> {item.meta}</div></div></article>; })}</div>
                 <div className="compass-source-trail" data-testid="compass-source-trail"><p className="compass-eyebrow">Source trail</p>{respondedSources.map((source) => { const provenance = source.record?.provenance; const citation = validatedSourceUrl(source.record?.sourceUrl); return <div key={source.label} className="compass-source-row"><span>{source.label}</span><strong>{source.failed ? "Unavailable" : source.available ? "Matched" : "No match"}</strong><small>{source.meta ? `${source.meta.source} · ${source.meta.confidence} · ${evidenceAgeLabel(source.meta)}` : "Source retrieval date unavailable"}</small>{provenance && <><small>{provenanceStatusLabel(provenance.status)} · {provenance.methodologyName} v{provenance.methodologyVersion}</small><details><summary>Method limits</summary><small>{provenance.methodologyCalculation} Inputs: {provenance.methodologyInputs.join(", ")}. Limitations: {provenance.limitations.join(" ")}</small></details></>}{citation && <a href={citation} target="_blank" rel="noopener noreferrer">Open citation</a>}</div>; })}</div>
                <div className="compass-aside-cta">
                  <div><strong>Compare the offer next</strong><span>Open the active CTC estimate and review its assumptions.</span></div>
                  <Link href="/salary-calculator" aria-label="Open the CTC calculator" onClick={() => trackNextAction("ctc-calculator")}><ArrowRight size={15} /></Link>
                </div>
              </div>
            </aside>
          </section>

           <section className="compass-lower" aria-label="Next steps">
             <div className="compass-lower-card is-warm"><div className="compass-lower-top"><span>Next useful move</span><MoveRight size={15} /></div><div className="compass-lower-title">{company ? `Ask ${company.name} what changed in the last planning cycle.` : roleProfile.question}</div><p className="compass-next-step-note">A prompt to verify—not a readiness score.</p></div>
             <div className="compass-lower-card"><div className="compass-lower-top"><span>Make it yours</span><WalletCards size={15} /></div><div className="compass-range-wrap"><div className="compass-range-label"><span>Notice period in days</span><strong>{noticePeriod}</strong></div><input className="compass-range" type="range" min="15" max="90" value={noticePeriod} onChange={(event) => { const nextValue = Number(event.target.value); setNoticePeriod(nextValue); trackEvent("notice_period_changed", { route: "/compass" }); }} style={{ background: `linear-gradient(90deg, var(--compass-teal) 0 ${((noticePeriod - 15) / 75) * 100}%, #cfc7ba ${((noticePeriod - 15) / 75) * 100}%)` }} aria-label="Notice period in days" /><div className="compass-range-scale"><span>15</span><span>90 days</span></div></div><div className="compass-saved-note"><ShieldCheck size={13} /> Personal inputs stay in your workspace</div></div>
          </section>
        </main>
      </div>
      <PublicFooter />
    </div>
  );
}