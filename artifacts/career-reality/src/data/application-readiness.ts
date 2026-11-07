export type ApplicationReadinessStatus =
  | "READY"
  | "READY WITH WARNINGS"
  | "NOT READY"
  | "BLOCKED BY HUMAN INPUT";

export type ReadinessCheckStatus =
  | "pass"
  | "warning"
  | "blocked"
  | "not-tested";

export type ApplicationReadinessCheck = {
  label: string;
  status: ReadinessCheckStatus;
  detail: string;
};

export type ApplicationReadinessTest = {
  name: string;
  status: "passed" | "partial" | "not-run" | "blocked";
  detail: string;
};

export type ApplicationScorecard = {
  productClarity: number;
  accuracy: number;
  provenance: number;
  methodology: number;
  userValue: number;
  ux: number;
  accessibility: number;
  mobile: number;
  performance: number;
  errorResilience: number;
  privacySecurity: number;
  contentTrust: number;
};

export type ApplicationReadinessEntry = {
  id: string;
  name: string;
  route: string;
  status: ApplicationReadinessStatus;
  scorecard: ApplicationScorecard;
  hardBlockers: string[];
  checks: ApplicationReadinessCheck[];
  tests: ApplicationReadinessTest[];
  recommendation: string;
};

export const applicationScoreWeights: Record<keyof ApplicationScorecard, number> = {
  productClarity: 10,
  accuracy: 15,
  provenance: 15,
  methodology: 10,
  userValue: 10,
  ux: 10,
  accessibility: 5,
  mobile: 5,
  performance: 5,
  errorResilience: 5,
  privacySecurity: 5,
  contentTrust: 5,
};

export const applicationReadiness: ApplicationReadinessEntry[] = [
  {
    id: "ctc-calculator",
    name: "CTC / in-hand calculator",
    route: "/salary-calculator",
    status: "NOT READY",
    scorecard: {
      productClarity: 88, accuracy: 60, provenance: 65, methodology: 68,
      userValue: 86, ux: 78, accessibility: 66, mobile: 78,
      performance: 78, errorResilience: 70, privacySecurity: 76, contentTrust: 55,
    },
    hardBlockers: [],
    checks: [
      { label: "Purpose", status: "pass", detail: "Explains the difference between annual CTC and estimated monthly in-hand pay." },
      { label: "Calculation", status: "warning", detail: "Tax, PF, and payroll assumptions need qualified review before any exactness claim." },
      { label: "Provenance", status: "warning", detail: "Tax-law source references exist in the calculator; professional review and freshness sign-off are not recorded." },
      { label: "Methodology", status: "warning", detail: "Keep tax-year slabs, deductions, and payroll assumptions estimate-only. Independent professional review is not formally completed." },
      { label: "Internal QA", status: "pass", detail: "Owner QA record dated 7 November 2026 reports tax/PF tests, September PF transition tests, the build, and four SEO checks as passed; supporting logs were not attached." },
      { label: "Independent review", status: "warning", detail: "NOT FORMALLY COMPLETED / NOT DOCUMENTED. This limits professional claims and does not block unrelated engineering, testing, or local SEO work." },
      { label: "SSR", status: "pass", detail: "The route has explanatory content in the static route snapshot." },
      { label: "Accessibility", status: "not-tested", detail: "Automated and assistive-technology review for this route is incomplete." },
      { label: "Mobile", status: "warning", detail: "Responsive UI exists; device-specific calculator verification remains incomplete." },
      { label: "Privacy", status: "warning", detail: "Personal salary inputs are calculated in the browser and must not be added to URLs or analytics." },
      { label: "Security", status: "blocked", detail: "The workspace dependency audit reports 1 critical, 12 high, and 10 moderate findings. HoundDog returned zero findings; dependency remediation remains open." },
      { label: "Indexability", status: "warning", detail: "The owner authorized indexing on 6 November 2026 while qualified tax/payroll review remains incomplete; keep estimate-only and manual-PF disclosures." },
    ],
    tests: [
      { name: "Tax/PF calculation tests", status: "passed", detail: "PASS REPORTED in the owner QA record dated 7 November 2026; test IDs and logs were not attached. Not an independent professional review." },
      { name: "September PF ceiling transition tests", status: "passed", detail: "PASS REPORTED in the owner QA record dated 7 November 2026; supporting case details were not attached." },
      { name: "Build and four focused SEO checks", status: "passed", detail: "PASS REPORTED in the owner QA record dated 7 November 2026; build output and named SEO check results were not attached." },
      { name: "Route/browser verification", status: "partial", detail: "Three calculator UI scenarios and the public route hydration check passed; signed-in, assistive-technology, and device interaction review remains incomplete." },
    ],
    recommendation: "Continue unrelated engineering, testing, and local SEO work. Retain estimate-only language and manual PF inputs; independent professional review remains NOT FORMALLY COMPLETED / NOT DOCUMENTED, so do not make professional approval claims. This status does not authorize publication.",
  },
  {
    id: "salary-reality",
    name: "Salary Reality",
    route: "/salary-reality",
    status: "NOT READY",
    scorecard: {
      productClarity: 82, accuracy: 68, provenance: 67, methodology: 64,
      userValue: 78, ux: 75, accessibility: 66, mobile: 76,
      performance: 77, errorResilience: 78, privacySecurity: 79, contentTrust: 65,
    },
    hardBlockers: [],
    checks: [
      { label: "Purpose", status: "pass", detail: "Compares a user-entered annual CTC with a role, city, and experience benchmark." },
      { label: "Calculation", status: "warning", detail: "A band comparison is not a percentile guarantee, take-home estimate, or offer recommendation." },
      { label: "Provenance", status: "warning", detail: "Eligible records are filtered for usable evidence; a current sample-representativeness review is not recorded here." },
      { label: "Methodology", status: "warning", detail: "The interface exposes source method and limitations; the benchmark construction needs continued human review." },
      { label: "SSR", status: "pass", detail: "Static route content explains the tool and its evidence requirements." },
      { label: "Accessibility", status: "not-tested", detail: "Keyboard and screen-reader verification for all result/error states is incomplete." },
      { label: "Mobile", status: "warning", detail: "Responsive layout is present; narrow-screen interaction testing remains." },
      { label: "Privacy", status: "pass", detail: "Target CTC stays in page state; role/city/experience are sent only to retrieve the requested first-party aggregate benchmark." },
      { label: "Indexability", status: "blocked", detail: "Keep noindex while current evidence and sample coverage are not independently confirmed." },
    ],
    tests: [
      { name: "Benchmark validation tests", status: "partial", detail: "Client-side eligibility checks exist; live dataset freshness and representativeness need separate verification." },
      { name: "Browser interaction tests", status: "passed", detail: "Four deterministic Playwright scenarios passed for role/experience changes, invalid CTC, partial evidence, and keeping selectors out of the browser URL. Live dataset freshness and sample coverage remain unverified." },
    ],
    recommendation: "NOT READY — keep the target CTC out of URLs and telemetry, retain the missing-data state, and complete live evidence and sample coverage review before indexing.",
  },
  {
    id: "career-compass",
    name: "Career Compass",
    route: "/compass",
    status: "NOT READY",
    scorecard: {
      productClarity: 86, accuracy: 82, provenance: 76, methodology: 83,
      userValue: 83, ux: 78, accessibility: 70, mobile: 75,
      performance: 76, errorResilience: 81, privacySecurity: 80, contentTrust: 82,
    },
    hardBlockers: [],
    checks: [
      { label: "Purpose", status: "pass", detail: "Frames offer, move, and stay as separate comparison prompts rather than a winner." },
      { label: "Calculation", status: "pass", detail: "The only CTC arithmetic is offer annual CTC minus current annual CTC; invalid values are withheld." },
      { label: "Provenance", status: "warning", detail: "Salary, company, and layoff records keep separate provenance and freshness states; sources can be unavailable." },
      { label: "Methodology", status: "pass", detail: "No composite score, employment forecast, or accept/reject recommendation is produced." },
      { label: "SSR", status: "pass", detail: "The route snapshot contains explanatory content and the comparison's limitations." },
      { label: "Accessibility", status: "warning", detail: "Keyboard tabs and labels are present; full assistive-technology review is incomplete." },
      { label: "Mobile", status: "warning", detail: "Responsive layout and compact signal rows are implemented; physical-device review remains." },
      { label: "Privacy", status: "pass", detail: "Salary inputs stay in browser state unless the user explicitly saves a snapshot to the signed-in workspace; analytics receives route-only events." },
      { label: "Indexability", status: "warning", detail: "Keep noindex while the live-data quality and browser release checks remain open." },
    ],
    tests: [
      { name: "Annual CTC comparison/readout unit tests", status: "passed", detail: "Covers valid difference, invalid input, independent evidence, and absence of invented scores." },
      { name: "Browser and device tests", status: "partial", detail: "The public Compass route hydrated and its comparison/model checks passed; signed-in, assistive-technology, and physical-device interaction review remains." },
    ],
    recommendation: "NOT READY — its current score is below the 90-point target and browser QA remains open. Keep it noindex; do not present separate signals as a prediction or recommendation.",
  },
  {
    id: "layoff-radar",
    name: "Layoff Radar",
    route: "/layoff-radar",
    status: "NOT READY",
    scorecard: {
      productClarity: 78, accuracy: 60, provenance: 67, methodology: 60,
      userValue: 76, ux: 73, accessibility: 65, mobile: 72,
      performance: 76, errorResilience: 71, privacySecurity: 64, contentTrust: 61,
    },
    hardBlockers: [
      "The visible signal taxonomy does not reliably separate announced layoffs, reported layoffs, rumours, restructuring, and hiring slowdowns. Do not upgrade a source label into a confirmed event.",
    ],
    checks: [
      { label: "Purpose", status: "pass", detail: "Lets users inspect dated company signals and submit a report for review." },
      { label: "Classification", status: "blocked", detail: "Current categories do not establish whether a claim is officially announced, independently reported, or unverified." },
      { label: "Provenance", status: "warning", detail: "Source fields and evidence checks exist; each record still needs current source review." },
      { label: "Methodology", status: "blocked", detail: "A consistent event-classification and confidence method is not documented as approved." },
      { label: "SSR", status: "pass", detail: "The route snapshot explains the tool and source limitations." },
      { label: "Accessibility", status: "not-tested", detail: "The filter, report form, and result list need full keyboard and screen-reader testing." },
      { label: "Privacy", status: "warning", detail: "Submitting a report sends its review fields to the first-party API; retention and request metadata are not fully documented." },
      { label: "Indexability", status: "blocked", detail: "Keep noindex until the event taxonomy and source-review process are complete." },
    ],
    tests: [
      { name: "Report submission tests", status: "partial", detail: "The local browser flow queued a report and emitted only categorical analytics; server-side redaction, moderation, and publication provenance still need verification." },
      { name: "Event-classification tests", status: "not-run", detail: "No test suite currently proves the required announced/reported/rumour distinctions." },
    ],
    recommendation: "NOT READY — preserve explicit source labels, prevent unreviewed reports from becoming public, and complete event taxonomy, moderation, and privacy review.",
  },
  {
    id: "resignation-risk",
    name: "Resignation Risk checklist",
    route: "/resignation-risk",
    status: "NOT READY",
    scorecard: {
      productClarity: 83, accuracy: 84, provenance: 76, methodology: 86,
      userValue: 80, ux: 76, accessibility: 70, mobile: 75,
      performance: 78, errorResilience: 84, privacySecurity: 80, contentTrust: 82,
    },
    hardBlockers: [],
    checks: [
      { label: "Purpose", status: "pass", detail: "Turns notice, offer status, repayment clause, and runway into a checklist rather than a risk score." },
      { label: "Calculation", status: "pass", detail: "Validates runway bounds and reports entered facts without estimating a probability." },
      { label: "Methodology", status: "pass", detail: "The output is a conditional planning checklist; contractual questions direct users to a qualified professional." },
      { label: "Provenance", status: "warning", detail: "This tool uses user inputs, not external evidence about a specific employer or contract." },
      { label: "Privacy", status: "pass", detail: "Inputs remain local until a user explicitly saves the resulting decision note." },
      { label: "Accessibility", status: "not-tested", detail: "Full form and result-state keyboard/screen-reader checks remain." },
      { label: "Indexability", status: "warning", detail: "Do not describe this checklist as a measured risk calculator in metadata or search snippets." },
    ],
    tests: [
      { name: "Resignation planner unit tests", status: "passed", detail: "Covers required inputs, runway bounds, next-step wording, and absence of risk bands." },
      { name: "Browser form/error tests", status: "not-run", detail: "Route-level keyboard and validation review remains." },
    ],
    recommendation: "NOT READY — its current score is below the 90-point target and browser accessibility checks remain open. Keep it as a planning checklist, not a resignation probability or legal review.",
  },
  {
    id: "company-intelligence",
    name: "Company Intelligence",
    route: "/companies",
    status: "BLOCKED BY HUMAN INPUT",
    scorecard: {
      productClarity: 78, accuracy: 45, provenance: 65, methodology: 35,
      userValue: 60, ux: 68, accessibility: 65, mobile: 70,
      performance: 75, errorResilience: 68, privacySecurity: 72, contentTrust: 40,
    },
    hardBlockers: [
      "A human-reviewed, versioned scoring methodology is not available. Stability and hiring-momentum scores are withheld; no company outcome may be inferred from their absence.",
    ],
    checks: [
      { label: "Purpose", status: "warning", detail: "Can show a dated source record, but a complete, decision-grade company profile is not available." },
      { label: "Unsupported claims", status: "pass", detail: "The web list and detail view no longer render numeric stability or hiring-momentum scores." },
      { label: "Provenance", status: "warning", detail: "A citation and retrieval dates are shown when valid; unsupported or source-less rows are not treated as verified." },
      { label: "Methodology", status: "blocked", detail: "Company scoring remains disabled until the method is versioned and reviewed by a qualified human." },
      { label: "Privacy", status: "warning", detail: "Company search is sent to the first-party data API; a user-initiated watchlist saves the selected company and signal." },
      { label: "Indexability", status: "blocked", detail: "Keep the directory and company details noindex until source review and methodology approval are complete." },
    ],
    tests: [
      { name: "Score suppression review", status: "partial", detail: "Code review confirms numeric scores are not rendered; no dedicated regression suite or current live-record audit was run." },
      { name: "Source fallback tests", status: "partial", detail: "Unavailable and missing-source states exist; every live record has not been reviewed in this pass." },
    ],
    recommendation: "BLOCKED BY HUMAN INPUT — keep numeric assessments suppressed and require a human-approved, versioned method before any company score is restored.",
  },
  {
    id: "ai-career-tools",
    name: "AI / Career AI prompts",
    route: "/ai",
    status: "NOT READY",
    scorecard: {
      productClarity: 82, accuracy: 78, provenance: 67, methodology: 78,
      userValue: 74, ux: 73, accessibility: 69, mobile: 74,
      performance: 80, errorResilience: 79, privacySecurity: 84, contentTrust: 71,
    },
    hardBlockers: [],
    checks: [
      { label: "Purpose", status: "pass", detail: "Uses a user-described task and its repeatability, error impact, and review conditions to suggest verification steps; it does not claim quantified AI exposure." },
      { label: "Data", status: "pass", detail: "Task text and criteria stay in page state and are not sent to an AI provider or analytics." },
      { label: "Methodology", status: "warning", detail: "The readout is a planning heuristic, not calibrated task research, an exposure estimate, or a forecast." },
      { label: "SSR", status: "pass", detail: "The prompt framework is present in the route's static explanatory content." },
      { label: "Accessibility", status: "not-tested", detail: "Task input, selectors, validation, and conditional readout need full assistive-technology verification." },
      { label: "Indexability", status: "warning", detail: "Only the unquantified prompt page is eligible for review; legacy AI routes must remain truthful redirects." },
    ],
    tests: [
      { name: "No-score and task readout model tests", status: "passed", detail: "The helper changes its guidance with task context and never produces an exposure score." },
      { name: "Browser interaction tests", status: "partial", detail: "Task inputs and high-impact review guidance are covered; legacy route behavior and responsive QA remain." },
    ],
    recommendation: "NOT READY — its current score is below the 90-point target and route interaction review remains open. Keep it as a user-entered task review; do not add quantified role exposure without dated, reviewed evidence.",
  },
  {
    id: "career-reality-index",
    name: "Career Reality Index",
    route: "/career-reality-index",
    status: "NOT READY",
    scorecard: {
      productClarity: 80, accuracy: 75, provenance: 70, methodology: 75,
      userValue: 77, ux: 75, accessibility: 70, mobile: 76,
      performance: 78, errorResilience: 77, privacySecurity: 83, contentTrust: 75,
    },
    hardBlockers: [],
    checks: [
      { label: "Purpose", status: "pass", detail: "Uses four self-ratings to select a response-specific reflection and relevant evidence tools, not an employment or financial score." },
      { label: "Methodology", status: "pass", detail: "Inputs are not added or weighted; answer bands only select topics and links. No market data or prior history is used." },
      { label: "Accuracy", status: "warning", detail: "The reflection is heuristic and self-reported; it must not be read as a statement of employer facts or future outcomes." },
      { label: "Privacy", status: "pass", detail: "Answers remain in page state; only a deliberate Save action sends a summary to the signed-in workspace. Response values are not analytics fields." },
      { label: "Accessibility", status: "not-tested", detail: "Four selectors and the conditional result need keyboard and screen-reader coverage." },
      { label: "Indexability", status: "warning", detail: "Keep noindex until the result language and route snapshots pass review." },
    ],
    tests: [
      { name: "Response-specific reflection tests", status: "passed", detail: "Model and browser tests confirm lower-satisfaction and neutral answers receive relevant evidence checks without a score or stay/leave recommendation." },
      { name: "Privacy event review", status: "partial", detail: "Response fields were removed from analytics; explicit workspace saves remain user-initiated, and route-level privacy checks remain." },
    ],
    recommendation: "NOT READY — its current score is below the 90-point target and route-level QA remains open. Keep it as a self-reflection prompt, not an objective assessment.",
  },
  {
    id: "salary-drop",
    name: "Salary Drop planner",
    route: "/salary-drop",
    status: "NOT READY",
    scorecard: {
      productClarity: 81, accuracy: 84, provenance: 76, methodology: 83,
      userValue: 79, ux: 74, accessibility: 68, mobile: 73,
      performance: 80, errorResilience: 84, privacySecurity: 84, contentTrust: 78,
    },
    hardBlockers: [],
    checks: [
      { label: "Calculation", status: "pass", detail: "Uses the shared Tax Year 2026–27 new-regime model for 0%, 50%, and 100% variable-pay realization under explicit salary-only assumptions." },
      { label: "Methodology", status: "warning", detail: "The CTC split is user-assumed; PF, professional tax, benefits, employer costs, special deductions, and payment timing are excluded." },
      { label: "Validation", status: "pass", detail: "Blank, malformed, non-finite, and out-of-range values withhold the result." },
      { label: "Privacy", status: "pass", detail: "Compensation and cost inputs remain in page state; they are not included in analytics or URL parameters." },
      { label: "Accessibility", status: "not-tested", detail: "All calculator inputs and feedback need route-level accessibility review." },
      { label: "Indexability", status: "warning", detail: "Search copy must identify this as an assumption-based planning calculation, not financial advice." },
    ],
    tests: [
      { name: "Salary-change model tests", status: "passed", detail: "Covers the shared tax model, variable-pay scenarios, buffer arithmetic, and invalid-input withholding." },
      { name: "Browser and mobile tests", status: "partial", detail: "The browser privacy test confirmed salary-drop inputs stay out of URLs, storage, requests, and analytics; field-level error announcements and narrow-screen interaction remain to be checked." },
    ],
    recommendation: "NOT READY — its current score is below the 90-point target and route-level accessibility checks remain open. Keep assumptions visible; do not present arithmetic as a recommendation to resign.",
  },
  {
    id: "escape-plan",
    name: "Escape Plan",
    route: "/escape-plan",
    status: "NOT READY",
    scorecard: {
      productClarity: 82, accuracy: 82, provenance: 70, methodology: 80,
      userValue: 79, ux: 77, accessibility: 72, mobile: 75,
      performance: 79, errorResilience: 81, privacySecurity: 86, contentTrust: 80,
    },
    hardBlockers: [],
    checks: [
      { label: "Purpose", status: "pass", detail: "Offers a goal-specific checklist and exact time budget; it does not estimate job-search odds or readiness to resign." },
      { label: "Methodology", status: "pass", detail: "Tasks are editorial planning prompts; total hours are entered hours per week multiplied by selected weeks." },
      { label: "Validation", status: "pass", detail: "Hours outside the supported range do not produce a time budget." },
      { label: "Privacy", status: "pass", detail: "Goal, duration, and checklist progress are local page state and are not sent to analytics." },
      { label: "Accessibility", status: "warning", detail: "Checklist controls expose pressed state and progress; full keyboard/screen-reader testing remains." },
      { label: "Indexability", status: "warning", detail: "Do not describe a completed checklist as proof that a move is safe or complete." },
    ],
    tests: [
      { name: "Escape-plan model tests", status: "passed", detail: "Covers goal-specific tasks and exact time-budget arithmetic." },
      { name: "Browser interaction tests", status: "not-run", detail: "Progress, reset, validation, and responsive states need end-to-end coverage." },
    ],
    recommendation: "NOT READY — its current score is below the 90-point target and route-level accessibility checks remain open. Keep progress session-only unless persistence is separately disclosed and designed.",
  },
  {
    id: "careerreality-mobile",
    name: "CareerReality Mobile",
    route: "/mobile-app",
    status: "BLOCKED BY HUMAN INPUT",
    scorecard: {
      productClarity: 76, accuracy: 65, provenance: 66, methodology: 65,
      userValue: 81, ux: 73, accessibility: 65, mobile: 78,
      performance: 69, errorResilience: 70, privacySecurity: 62, contentTrust: 67,
    },
    hardBlockers: [
      "Release-device verification of native authentication, live market refresh, and the signed-in decision flows requires an authorized physical test device; no such result is recorded.",
    ],
    checks: [
      { label: "Purpose", status: "pass", detail: "Provides signed-in market, planning, jobs, and decision-workspace screens." },
      { label: "Provenance", status: "warning", detail: "Market/job screens carry freshness and source state; upstream provider access can fail and must not be described as current." },
      { label: "Methodology", status: "warning", detail: "Personalized brief interpretation depends on profile and evidence quality; unknown context must remain insufficient, not promotion advice." },
      { label: "Authentication", status: "warning", detail: "Clerk session and callback code has automated contract coverage; real release-device sign-in is not verified." },
      { label: "Privacy", status: "warning", detail: "Authenticated profile and decision data can be synchronized to first-party APIs; users must be told what is saved and how to remove it." },
      { label: "Security", status: "blocked", detail: "The workspace dependency audit reports 1 critical, 12 high, and 10 moderate findings. SAST also reported two high path-traversal findings in the static server; path-boundary tests passed, but security review and dependency remediation remain open." },
      { label: "Accessibility", status: "not-tested", detail: "Native screen-reader, keyboard, and dynamic text checks remain." },
      { label: "Performance", status: "not-tested", detail: "A release build and device-level startup/network audit are not available in this assessment." },
      { label: "Indexability", status: "pass", detail: "Native screens are not search pages; the public mobile landing route remains separately noindex." },
    ],
    tests: [
      { name: "Expo static-path tests", status: "passed", detail: "Existing route handler tests cover known and unknown static paths." },
      { name: "Auth callback/build contract tests", status: "partial", detail: "Automated bundle markers and callback fixtures exist; a real release-device flow remains blocked." },
    ],
    recommendation: "BLOCKED BY HUMAN INPUT — keep this as a staging assessment until authorized native-device sign-in, refresh, privacy, and accessibility QA is recorded.",
  },
];

export function calculateApplicationScore(scorecard: ApplicationScorecard): number {
  const weightedTotal = (Object.keys(applicationScoreWeights) as Array<keyof ApplicationScorecard>)
    .reduce((total, dimension) => {
      const value = scorecard[dimension];
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error(`Invalid application score for ${dimension}`);
      }
      return total + value * applicationScoreWeights[dimension];
    }, 0) / 100;
  return Math.round(weightedTotal * 100) / 100;
}

export function effectiveReadinessStatus(
  entry: Pick<ApplicationReadinessEntry, "status" | "hardBlockers" | "scorecard">,
): ApplicationReadinessStatus {
  if (
    entry.hardBlockers.length > 0 &&
    (entry.status === "READY" || entry.status === "READY WITH WARNINGS")
  ) {
    return "NOT READY";
  }
  if (
    calculateApplicationScore(entry.scorecard) < 90 &&
    (entry.status === "READY" || entry.status === "READY WITH WARNINGS")
  ) {
    return "NOT READY";
  }
  return entry.status;
}
