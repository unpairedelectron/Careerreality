# CareerReality: 90-Day Roadmap for the 15 Tools

**Status:** Working roadmap  
**Horizon:** Next 90 days  
**Audience:** The product owner and the agent implementing the product  
**Decision supported:** Which customer-value improvements to prioritize and in what order  
**Planning confidence:** Directional. No customer analytics, research findings, or delivery capacity were supplied.

## Executive direction

Do not treat “polish” as a coat of paint. Each tool should help someone answer a consequential question, understand what the result means, see what remains unknown, and take a useful next step.

The 90-day goal is to make all 15 tools easier to find and use, while bringing the highest-risk calculations and evidence-based tools through explicit quality gates. Do not promote a tool simply because its page exists. Some calculations depend on tax, payroll, employment-policy, or official-record assumptions that need qualified review; those tools must retain clear limits until that review happens.

### Product north star

Use the existing product north star: **the percentage of active users who take a meaningful career action each week because of CareerReality**. A page view or calculator completion is a supporting measure, not the outcome.

Examples of meaningful actions:

- Compare two written offers and identify a question to resolve.
- Verify a specific employer or offer detail from an official source.
- Update a resume or work sample based on evidence.
- Set a cash threshold or weekly career action.
- Decide not to make a move until a named unknown is resolved.

### What the codebase says today

- The route registry contains 15 indexable tool routes.
- The tools directory can list those routes, but the public search catalogue currently contains only the CTC calculator. Discovery and readiness need to be treated separately: expose a route only with an honest availability label.
- The readiness inventory does not map one-to-one to all 15 current tool IDs. It contains older or adjacent entries and leaves gaps for current routes.
- The shared completion-event allowlist names 9 of the 15 tool IDs. Audit other event paths before assuming the remaining six are unmeasured.
- The current product intentionally avoids unsupported company scores, career risk scores, guaranteed outcomes, and automated legal or financial advice. Preserve those boundaries.
- The workspace does not provide customer analytics or delivery capacity in this request. Do not calculate a fake RICE score or promise a fixed release date.

## Roadmap principles

1. **Start from the customer’s question.** Put “what you can learn” before feature names.
2. **Show the useful result early.** Give a safe example or preview before asking for a long form.
3. **Make assumptions inspectable.** Label user-entered assumptions, dated rules, source evidence, and estimates separately.
4. **Give one next action.** A result without a next move is an unfinished tool.
5. **Make uncertainty visible.** Missing data is not proof; an estimate is not a verdict; a checklist is not a prediction.
6. **Protect sensitive inputs.** Never put compensation, household finances, resume text, or other personal inputs into URLs or analytics. Keep user text local unless an explicitly reviewed flow says otherwise.
7. **Benchmark patterns, not claims.** The external examples below are public product/research references, not a verified market-share ranking. Use their strongest observable patterns; do not copy unsupported claims or scoring.
8. **Release by gate, not by calendar.** Tax, payroll, legal, employer-verification, and resume-data gates can block promotion even when a page is visually complete.

## Prioritization model

Use three questions until real reach and effort data exist:

- **Customer urgency:** Is this tied to an immediate decision such as an offer, job loss, or final pay?
- **Trust risk:** Could a wrong or overconfident result cause financial, legal, privacy, or employment harm?
- **Leverage:** Will a shared improvement help several tools?

This produces the following order:

| Priority | Work | Why it comes first |
| --- | --- | --- |
| P0 | Readiness map, discovery, privacy-safe measurement, reusable result pattern | Prevents polishing or promoting the wrong thing and supports all 15 routes. |
| P1 | Offer and money decisions: CTC, offer comparison, tax comparison, salary change | High-intent user questions; assumptions and exactness need the strongest review. |
| P1 | Job posting evidence and employer checks | Important hiring decisions; privacy and provenance are essential differentiators. |
| P2 | Job-loss and exit planning: runway, final pay, gratuity, resign-or-stay, Escape Plan | High stakes, but several outputs depend on employer policy or individual circumstances. |
| P2 | Career Compass, home-loan stress test | Important decisions that benefit from scenario comparison and explicit unknowns. |
| P3 | Career Reality Check and AI at Work | Useful reflection and exploration tools; keep their scope honest and avoid manufactured scores. |

## 90-day sequence

These are Now / Next / Later work windows, not contractual ship dates. “Done” means the quality gate is met, not merely that code was merged.

### Days 1–14 — Make the portfolio understandable and measurable

**Deliverables**

- Create one source-of-truth inventory for all 15 routes: customer job, intended user, inputs, output, assumptions, evidence freshness, privacy behavior, next action, readiness owner, and launch status.
- Reconcile readiness records to the current route/tool IDs. Mark each tool **Ready**, **Limited**, **Needs review**, or **Hidden**. Show that status in the directory and search instead of silently omitting tools or implying equal confidence.
- Review the 15-tool directory as a customer journey. Group by situation: “I have an offer,” “I may leave,” “I need to verify something,” and “I am exploring a change.”
- Audit event coverage and consent behavior. Add or align only privacy-safe events: tool opened, core result produced, next action selected, and optional save/export completed. Values typed into tools must never be event properties.
- Run short usability sessions across the four customer situations. Ask users to complete a real task and explain what they learned, what they still do not know, and what they would do next.
- Establish a route-level baseline for accessibility, mobile interaction, errors, calculation tests, source freshness, and privacy.

**Exit criteria**

- All 15 route IDs map to a current readiness entry.
- Every directory card describes a customer question and an expected result.
- Every route has an explicit readiness state and owner.
- Analytics review confirms no tool inputs, resume contents, company search text, or financial values are collected.

### Days 15–35 — Build the shared tool experience; pilot it on three routes

Build a reusable experience instead of restyling 15 pages independently:

- A short “Use this when…” statement and expected result.
- A visible input example and a way to start with a small scenario.
- Grouped inputs with plain-language units, assumptions, and optional-field explanations.
- A result summary followed by the calculation/evidence breakdown.
- Separate labels for user-entered values, sourced facts, estimates, and unknowns.
- An explicit limitation and one practical next step.
- Consistent loading, invalid-input, missing-data, unavailable-source, and reset states.
- Keyboard operation, visible focus, screen-reader labels, zoom support, and phone-width checks.

Pilot the shared pattern on:

1. **Offer Comparison** — validates reusable multi-scenario and result-table patterns.
2. **Job Posting Reality Check** — validates evidence excerpts, review states, and privacy-safe local processing.
3. **Escape Plan** — validates a non-numeric planning output and next-step flow.

Do not use the pilot to loosen existing privacy, legal, tax, or evidence safeguards.

**Exit criteria**

- At least 4 of 5 usability participants in each pilot can explain the result and identify a next step without coaching. Treat this as an initial usability target, not a market claim.
- No critical keyboard, screen-reader, or phone interaction blocker remains in the pilot.
- Users can tell a calculated estimate from a confirmed fact.

### Days 36–60 — Upgrade the money and transition tools

Apply the shared experience to CTC Calculator, Tax Regime Comparison, Gratuity Worksheet, Final Pay, Salary Change, Layoff Runway, and Home Loan Stress Test.

**Shared work**

- Add worked examples for common scenarios and show which inputs materially change the answer.
- Make low/base/high or current/stress cases visible where appropriate.
- Show assumptions alongside results; do not make users hunt for method notes.
- Add calculation regression fixtures for boundary values, zero values, optional fields, and dated rule changes.
- Complete qualified tax/payroll review before describing any result as exact or restoring blocked indexability.
- Keep income, debt, savings, and cost inputs in page state; verify they do not leak into requests, URLs, storage, or analytics.

**Exit criteria**

- Every money result can be reconstructed from the inputs and displayed formula.
- Rules and assumptions have an owner, source, and review date.
- The result states what it excludes and what the user should verify with payroll, an employer, lender, or qualified professional.

### Days 61–90 — Upgrade career decisions, trust, and discovery

Apply the shared patterns to Resign or Stay, Career Compass, Employer Due Diligence, Career Reality Check, and AI at Work. Finish Job Posting Reality Check and Escape Plan integrations that were not part of the pilot.

**Shared work**

- Use decision options, evidence, constraints, unanswered questions, and next actions—not a composite “best choice” score.
- Make unavailable or stale live evidence visible. Never replace a failed live request with stale data presented as current.
- Keep company scores suppressed unless a human-approved, versioned methodology exists.
- Keep resume and job-link inputs within the approved privacy boundary. Do not add uploads or URL fetching without approved consent, retention/access, and SSRF controls.
- Add route-level browser coverage for core completion, reset, error, keyboard, and narrow-screen states.
- Revisit directory/search visibility after each tool passes its readiness gate.

**Exit criteria**

- Each of the 15 tools has a customer job, a clearly stated output, a limitation, one next action, a privacy note, and a passing release checklist.
- The directory highlights only tools that have passed their declared gates; limited tools remain findable with an honest label.
- The team can compare starts, useful completions, and next-action selections without collecting sensitive input values.

## Tool-by-tool roadmap

“Best-in-class reference” means a useful public pattern to study, not a claim that the product is the universal market leader.

| # | Tool and customer job | Best-in-class reference / pattern | 90-day work and customer-value outcome |
| --- | --- | --- | --- |
| 1 | **CTC Calculator** `/salary-calculator` — “What may reach my bank account, and what assumptions drive it?” | [ClearTax calculators](https://cleartax.in/s/calculators) for a broad, organized India-calculator suite; [AmbitionBox salaries](https://www.ambitionbox.com/salaries) for role/company/experience context. | Make fixed, variable, employer PF, tax, and professional-tax treatment individually inspectable; show zero-variable and target-variable outcomes; label the tax year and PF basis; provide a worked example and source/review date. Keep estimate-only language and noindex until qualified tax/payroll review clears the current blocker. **Value test:** users can explain which assumptions changed their estimated monthly cash. |
| 2 | **Offer Comparison** `/offer-comparison` — “Which written offer changes my first-year and ongoing finances?” | [PayVerdict](https://payverdict.com/offer-verdict) for India-specific offer components; [Levels.fyi](https://www.levels.fyi/) for separating compensation components rather than treating one headline number as the whole offer. | Build a clear side-by-side for fixed pay, target/zero variable, employer contributions, benefits, and user-entered transition costs. Separate first-year from recurring outcomes; expose every assumption; add recruiter questions and a privacy-safe export. **Value test:** user can identify the largest real difference and one fact to verify before accepting. |
| 3 | **Tax Regime Comparison** `/tax-regime-comparison` — “Which tax regime produces a better estimate for my stated situation?” | [ClearTax income-tax tools](https://cleartax.in/s/calculators) and [Niveshkar](https://niveshkar.com/) for side-by-side India tax calculators and visible current-rate context. | Show tax year, eligible profile, deductions, rebate/surcharge boundaries, and source links adjacent to the result. Add boundary fixtures and an “outside this tool’s scope” state. Require qualified review before claiming accuracy or promoting the route. **Value test:** user can see what changed the comparison and what to verify with a tax professional. |
| 4 | **Gratuity Worksheet** `/gratuity-estimator` — “What does the limited formula illustration produce for these inputs?” | [ClearTax gratuity calculator](https://cleartax.in/s/gratuity-calculator) and [Niveshkar gratuity calculator](https://niveshkar.com/calculators/gratuity/). | Keep the existing limited-formula scope prominent. Separate arithmetic from eligibility; show wage base, service-period assumptions, exclusions, dated official sources, and special-case handoff. Add worked examples around service thresholds without implying entitlement. **Value test:** users distinguish an illustration from an employer/legal eligibility decision. |
| 5 | **Notice Period and Leave Pay** `/final-pay-estimator` — “What components should I reconcile in my final settlement?” | [EZHRM full-and-final calculator](https://ezhrm.in/tools/full-and-final-settlement-calculator) and [IndPayroll F&F calculator](https://www.indpayroll.com/free-tools/fnf-calculator) for component-based settlement thinking. | Show each entered component separately (salary, notice, leave, deductions) and make divisor, policy, and state-rule assumptions explicit. Include a reconciliation checklist for the final payslip and written employer policy. Do not say a component is legally owed without reviewed jurisdictional support. **Value test:** user leaves with an itemized question list, not an unsupported entitlement amount. |
| 6 | **Job Loss Runway** `/layoff-runway` — “How long can my confirmed cash cover essential costs?” | [NerdWallet emergency-fund calculator](https://www.nerdwallet.com/banking/learn/emergency-fund-calculator) for expense-based planning; adapt it to confirmed severance and continuing income rather than a generic savings target. | Separate liquid savings, severance confirmed in writing, continuing income, essential costs, and debt. Add a stress scenario and a clear “months of cash” calculation; do not predict time to a new job. Keep values session-only. **Value test:** user can identify a cash threshold and the next expense or income fact to confirm. |
| 7 | **Home Loan Stress Test** `/home-loan-stress-test` — “Would a rate increase still fit my household budget?” | [BankBazaar home-loan EMI calculator](https://www.bankbazaar.com/home-loan/emi-calculator.html) for principal/interest/tenure output; use the product’s two-rate stress comparison as the differentiator. | Show current vs stressed EMI, total interest change, remaining monthly cash after user-entered costs, and rate/term assumptions. Add a worked example and an explicit lender-offer verification step; do not infer approval or affordability. **Value test:** user can name the payment shock and remaining buffer. |
| 8 | **Resign or Stay** `/resign-or-stay` — “What conditions should I compare before changing my job?” | [Decision Lens’ quit-job map](https://www.decisionlensapp.com/decisions/quit-job) for branching options and practical next steps. | Give users a structured comparison of staying, renegotiating, and leaving using their stated priorities. Surface unknowns and possible triggers for revisiting; do not output a resignation probability or a winning score. **Value test:** user records one decision condition and a non-resignation next action if appropriate. |
| 9 | **Employer Due Diligence** `/companies` — “Is this the right legal entity, and what can I verify?” | [MCA Master Data Services](https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html) and [EPFO Establishment Search](https://unifiedportal-emp.epfindia.gov.in/publicPortal/no-auth/misReport/home/loadEstSearchHome) as primary-source benchmarks. | Organize company-name/entity matching, official-record links, retrieval dates, offer-document checks, and evidence notes. Show missing/unavailable data without converting it into a negative verdict. Keep scores suppressed until a human-approved, versioned method exists. **Value test:** user knows which entity to verify and can open the official source for each check. |
| 10 | **Career Compass** `/compass` — “How do staying, moving, and taking an offer differ under my constraints?” | [Decision Lens](https://www.decisionlensapp.com/) and [Careertics](https://careertics.com/) for comparing options and converting trade-offs into next steps. | Keep signals separate: salary, company, job evidence, constraints, and unknowns. Let users compare paths without a composite score or accept/reject verdict. Keep source freshness and unavailable states beside each signal. **Value test:** user can explain what the tool knows, what it cannot know, and the next evidence to gather. |
| 11 | **Salary Change Calculator** `/salary-drop` — “Can my household absorb this package change?” | [AmbitionBox salary comparison](https://www.ambitionbox.com/salaries) for contextual pay comparison; use an explicit assumption-led cash-impact worksheet rather than a market verdict. | Separate gross cash from take-home; label fixed/variable shares and monthly cost assumptions; add a break-even or buffer view only when based on entered values. Do not infer tax or employer policy. **Value test:** user can see the annual/monthly change and which assumption matters most. |
| 12 | **Escape Plan** `/escape-plan` — “What can I do each week toward a career move within my available time?” | [Teal career tools](https://www.tealhq.com/tools) as a career-workflow reference; no direct like-for-like outcome claim is assumed. | Make the plan goal-specific, realistically time-boxed, editable, and easy to reset. Distinguish planned hours from progress and progress from job-search success. Preserve session-only data unless persistence is separately designed and disclosed. **Value test:** user leaves with one realistic action for the coming week. |
| 13 | **Career Reality Check** `/career-reality-index` — “What should I verify before I make a move?” | [O*NET Interest Profiler](https://www.onetcenter.org/IP.html) for structured self-reflection leading to exploration; it is not equivalent to this fixed, non-diagnostic tool. | Keep the four self-reported answers and fixed reflection visibly separate from employer facts. Improve the handoff from reflection to one verifiable fact, conversation, or constraint. Do not add a score, diagnosis, or recommendation. **Value test:** user identifies a fact to verify instead of interpreting the reflection as an assessment. |
| 14 | **Job Posting Reality Check** `/job-posting-reality-check` — “What does my resume actually support for this role?” | [Teal Resume Job Description Match](https://www.tealhq.com/tool/resume-job-description-match) and [Jobscan Resume Scanner](https://www.jobscan.co/resume-scanner) for in-context comparison and visible match evidence. | Preserve CareerReality’s differentiator: exact excerpts, independent requirements, explicit gaps only when directly attributed, and missing evidence labeled “not documented.” Keep copied role text separate from candidate statements. Do not add a match score. Do not add uploads or URL fetching until consent, retention/access, and SSRF controls are approved. **Value test:** user can tell which text supports each status and what to improve or clarify. |
| 15 | **AI at Work** `/ai` — “Which parts of my work may change, and what should I test?” | [ILO task-level GenAI exposure research](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) for task-level analysis and methodological caution. | Organize prompts around tasks, inputs, output review, judgment, accountability, and customer impact. Add concrete “try this at work” experiments and a way to record what remains human-owned. Do not create role-level exposure scores or job-loss forecasts without dated, reviewed evidence. **Value test:** user identifies one task experiment and one accountability/privacy safeguard. |

## Shared quality gate for every tool

Before a tool is promoted as ready, verify every item below:

- **Customer promise:** one sentence says what decision or question it supports.
- **Input design:** every field explains its unit, example, and whether it is required.
- **Result quality:** result is understandable, traceable to inputs/evidence, and not more certain than its method.
- **Next action:** one useful, non-coercive next step is shown.
- **Limits:** exclusions, assumptions, source dates, and unsupported situations are visible before users over-rely on the result.
- **Failure states:** malformed input, missing data, stale source, unavailable source, and reset all have explicit behavior.
- **Accessibility:** keyboard, screen reader, 200% zoom, contrast, validation announcements, and phone layout are reviewed.
- **Privacy:** sensitive values stay out of URLs, analytics, logs, and unapproved storage or network requests.
- **Evidence and legal review:** tax, payroll, employment, employer, and AI claims have the right human review before stronger claims or indexing.
- **Release proof:** unit tests cover calculations/decision branches; route tests cover the customer journey and error states.

## Measure value without collecting sensitive inputs

### Core dashboard

Track only fixed, privacy-reviewed metadata:

- Tool ID and route.
- Start and completion counts.
- Whether a result was produced.
- Next-action category selected (not its user-entered detail).
- Save/export action where applicable.
- Error category (not field values).
- Device class and consent state if allowed by the analytics policy.

Never send salary, debt, savings, resume text, company search text, or user answers as analytics properties.

### Initial targets to validate

These are launch hypotheses, not existing baselines:

- At least 4/5 observed users can state what a tool result means and what it does not mean.
- At least 4/5 can complete a core task without facilitator help.
- Each result view provides one next action that users can identify.
- No open critical privacy, calculation, accessibility, or unsupported-claim blocker on a tool labeled Ready.
- Review drop-off and error reasons weekly; do not optimize completion by hiding warnings or removing necessary inputs.

## Competitive and reference scan

The references in the tool table are a first directional scan of public product pages and research sources. They were chosen by user job and observable behavior, not by a verified “best overall” ranking. Before positioning or copying features, test the relevant experience hands-on and compare the exact India-specific assumptions and audience fit.

| Reference | What it is useful for | What not to assume |
| --- | --- | --- |
| [ClearTax calculators](https://cleartax.in/s/calculators) | Calculator organization, India-specific tax/finance tool breadth. | A calculator’s presence does not validate CareerReality’s methodology or legal correctness. |
| [AmbitionBox salaries](https://www.ambitionbox.com/salaries) | Role/company/experience salary search and comparison. | Crowd-sourced salary samples are not a guaranteed offer or representative estimate for every user. |
| [Niveshkar](https://niveshkar.com/) | Explicit rate dates and multiple India finance calculators. | Its rates and assumptions must be checked for current applicability before reuse. |
| [Decision Lens](https://www.decisionlensapp.com/decisions/quit-job) | Branching alternatives, assumptions, and concrete next steps. | CareerReality should not copy confidence labels or recommendations without evidence. |
| [Teal matcher](https://www.tealhq.com/tool/resume-job-description-match) and [Jobscan](https://www.jobscan.co/resume-scanner) | In-context resume/job comparison and visible strengths/gaps. | Match scores can encourage keyword gaming; CareerReality’s no-score, exact-evidence approach is intentional. |
| [MCA Master Data](https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html) and [EPFO Establishment Search](https://unifiedportal-emp.epfindia.gov.in/publicPortal/no-auth/misReport/home/loadEstSearchHome) | Primary-source due-diligence workflows. | A search result is not a complete assessment of an employer or offer. |
| [ILO AI and jobs research](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) | Task-level method, expert input, and uncertainty. | An occupational exposure framework is not a person-specific forecast. |

## Explicit non-goals for these 90 days

- Do not add an AI “career score,” company stability score, resignation probability, or universal resume match score.
- Do not restore unsupported company or layoff claims just to make a dashboard feel fuller.
- Do not treat a task checklist as proof of readiness or a calculator result as legal/tax advice.
- Do not add resume uploads, employer scraping, or user job-URL fetching before privacy and security review.
- Do not promote routes to search or SEO solely to increase pageviews.
- Do not promise a success rate, interview rate, job-search duration, or salary outcome that the data cannot establish.

## Decisions still needed after the first two weeks

- Which customer segment is the first launch priority: job switchers with an offer, people facing job loss, people checking an employer, or people planning a career change?
- Which qualified reviewer can sign off on tax, payroll, gratuity, and final-pay assumptions?
- Which tools should remain **Limited** or **Needs review** until evidence or legal review is complete?
- What customer-research and analytics baseline should replace the provisional usability targets?
- What is the actual delivery capacity and who is the final approver for release gates?

