# CareerReality tool suite audit

## Scope and verification

This audit covers the 14 current tool routes listed below. `/job-posting-reality-check` was excluded from changes and this report's route smoke test; its URL and behavior were left untouched.

Verification completed:

- All 14 production routes returned HTTP 200.
- The published SEO workflow passed: 77/77 protected indexable routes, 77 sitemap routes, and redirect checks for apex, www, and Replit origins.
- Search Console indexing status is **unverified**; no authorized Search Console evidence was available.
- The 14-route mobile smoke test passed at 360px for page heading, named controls, and horizontal overflow.
- Targeted mobile tool journeys passed: 9 tool-suite tests; 16 salary, employer-check, runway, and analytics tests; and 4 relevant Compass, Escape Plan, Career Reality Check, and AI browser tests. Two other tests in that filtered run were skipped by existing test conditions.
- Career tool and tax calculation tests passed: 38 tests. Earlier task verification also passed 12 application-model tests.
- `pnpm --filter @workspace/career-reality run typecheck` passed.
- The complete browser suite passed on 2026-10-29 in four serial Playwright shards: **108 passed, 11 skipped, 0 failed** across all 119 discovered tests. Each shard used two workers and completed in under one minute.

### Repeating the complete browser run

Keep the API Server workflow running on port 8080, then run these commands one at a time. They use fixed Playwright shards and two workers; do not overlap browser batches on this runner.

```sh
pnpm --filter @workspace/career-reality run test:e2e:batch -- 1
pnpm --filter @workspace/career-reality run test:e2e:batch -- 2
pnpm --filter @workspace/career-reality run test:e2e:batch -- 3
pnpm --filter @workspace/career-reality run test:e2e:batch -- 4
```

The batches cover the same full test inventory as `playwright test`. The 14-tool phone-width audit, validation and reset journeys, mobile layouts, keyboard/accessibility checks, analytics privacy checks, and save/watch flows remain included.

### Skips and prerequisites

The 11 skipped cases are intentional and remain enabled:

- **Three Compass save/watch cases** are marked `fixme` until an owner-approved signed-in QA session and owner-reviewed company evidence are available. The company-change case also requires owner-reviewed layoff evidence; synthetic `example.test` rows must not become publishable. The failed-action case additionally needs a real authorization check because the E2E auth shim cannot prove production permissions.
- **Four Compass metadata cases** run only against a production build, where indexability can be checked rather than the development preview’s intentional `noindex` state.
- **Two production SEO cases** require generated production snapshots for canonical-origin and snapshot/hydration parity checks.
- **One crawler-rendering case** requires the generated production snapshots.
- **One archived-article status case** runs against the published custom origin after the approved release.

The production and published-origin cases were not run as part of this local browser pass; no release or production data was changed.

Status key: **PASS** means targeted checks passed; **LIMITED** means the output is intentionally an estimate, checklist, or user-supplied reflection rather than a verified fact or recommendation; **OPEN** means a human or external-data review remains; **UNVERIFIED** means evidence was unavailable.

## Per-tool scorecards

| Tool | Function, calculation, and evidence | UX and accessibility | SEO | Test coverage | Release status |
|---|---|---|---|---|---|
| Salary calculator (`/salary-calculator`) | **PASS / LIMITED** — shared tax and PF estimate; assumptions are explicit and input-based. | **PASS** — mobile calculator flow and reset/invalid states covered; 360px named-control and overflow smoke passed. | **PASS** — production 200; included in published route/sitemap checks. | Focused salary browser tests passed; calculation and tax boundary suite passed. | **OPEN** — keep estimate-only pending qualified tax/payroll review; no publish was made in this task. |
| Offer comparison (`/offer-comparison`) | **PASS / LIMITED** — separates fixed pay, variable-pay outcomes, PF, and entered transition costs. | **PASS** — narrow-screen calculation, clear/reset, and 360px control checks passed. | **PASS** — production 200; included in published route/sitemap checks. | Mobile result and reset journey passed; shared CTC/tax boundary tests passed. | **OPEN** — estimate-only; qualified tax/payroll review remains outstanding. |
| Tax regime comparison (`/tax-regime-comparison`) | **PASS / LIMITED** — AY 2026–27 salary-only calculation with tested rebate, deduction, and surcharge boundaries. | **PASS** — mobile result, reset, and named-control checks passed. | **PASS** — production 200; included in published route/sitemap checks. | UI journey and tax boundary tests passed. | **OPEN** — requires qualified tax review; does not cover every taxpayer or income type. |
| Gratuity estimator (`/gratuity-estimator`) | **PASS / LIMITED** — tested service-rounding and special-category arithmetic; dated Ministry sources and exclusions are shown. | **PASS** — mobile result and reset checks passed; inputs are labeled. | **PASS** — production 200; included in published route/sitemap checks. | Browser boundary cases and calculation tests passed. | **OPEN** — not an entitlement determination; verify current law, wage base, and individual facts. |
| Final-pay estimator (`/final-pay-estimator`) | **PASS / LIMITED** — arithmetic follows the entered daily-rate divisor and days; no legal entitlement is determined. | **PASS** — mobile result, clear/reset, and 360px control checks passed. | **PASS** — production 200; included in published route/sitemap checks. | Browser reconciliation and calculation boundary tests passed. | **LIMITED** — retain as an estimate; state rules and employer terms need user verification. |
| Layoff runway (`/layoff-runway`) | **PASS / LIMITED** — reconciled 12-month cash-flow projection and first below-zero month from entered inputs. | **PASS** — narrow-screen result and cash-flow table tested; table scrolls within its region. | **PASS** — production 200; included in published route/sitemap checks. | Browser cash-flow and model tests passed. | **LIMITED** — planning scenario only; it does not predict re-employment time or benefit eligibility. |
| Home-loan stress test (`/home-loan-stress-test`) | **PASS / LIMITED** — current/stress EMI and amortization reconcile; fractional month terms are rejected. | **PASS** — 390px result/reset and 360px named-control/overflow checks passed. | **PASS** — production 200; included in published route/sitemap checks. | Browser scenario/reset and calculation tests passed. | **LIMITED** — lender fees, insurance, rate-reset timing, and prepayments are excluded. |
| Resign-or-stay worksheet (`/resign-or-stay`) | **PASS / LIMITED** — weighted values reflect user ratings; no outcome score or recommendation is produced. | **PASS** — 390px result/reset and 360px named-control/overflow checks passed. | **PASS** — production 200; included in published route/sitemap checks. | Browser calculation/reset and input-boundary checks passed. | **LIMITED** — values organize a decision; they do not choose for the user. |
| Employer due diligence (`/companies`) | **PASS / LIMITED** — private checklist directs users to verify the exact legal entity and written terms; no employer rating is generated. | **PASS** — labeled input and narrow-screen route checks passed. | **PASS** — production 200; included in published route/sitemap checks. | Employer-check browser test passed; it verifies no user input is stored or sent. | **LIMITED** — checklist, not a live company-health or workplace-quality assessment. |
| Career Compass (`/compass`) | **PASS / OPEN** — separate salary/company/layoff evidence and freshness states; no combined score or accept/reject recommendation. | **PASS / OPEN** — route smoke and focused save/watch flows passed; signed-in production authorization and assistive-technology review remain separate. | **PASS** — production 200; included in published route/sitemap checks. | Focused Compass snapshot, source-failure, and update journeys passed; some signed-in tests remain explicitly gated on approved QA/evidence. | **OPEN** — preserve source freshness and partial-failure labels; do not treat stale or missing evidence as current. |
| Salary change (`/salary-drop`) | **PASS / LIMITED** — shared new-regime estimate at 0%, 50%, and 100% variable realization; PF and payroll specifics are excluded. | **PASS** — narrow-screen route smoke passed; private inputs remain local. | **PASS** — production 200; included in published route/sitemap checks. | Model/privacy coverage passed; focused user-entered browser journey passed. | **LIMITED** — assumption-based planning only; no resignation recommendation. |
| Escape Plan (`/escape-plan`) | **PASS / LIMITED** — goal-based checklist and time budget; progress remains page-local and is not a readiness score. | **PASS** — accessible checklist completion journey and mobile route smoke passed. | **PASS** — production 200; included in published route/sitemap checks. | Checklist, session reset, and focused browser flow passed. | **LIMITED** — checklist completion does not establish that a job change is safe or complete. |
| Career Reality Check (`/career-reality-index`) | **PASS / LIMITED** — self-reported answers select relevant reflections and evidence tools; no score or stay/leave recommendation. | **PASS** — 360px labels/overflow and small-screen personalized result checks passed. | **PASS** — production 200; included in published route/sitemap checks. | Response-specific flow, privacy boundary, and focused mobile browser checks passed. | **LIMITED** — self-reported reflection only; not an employer, market, or future-outcome assessment. |
| AI at Work (`/ai`) | **PASS / LIMITED** — task-specific prompts use repeatability, impact, review, privacy, and accountability; no exposure score or forecast. | **PASS** — named controls and narrow-screen route smoke passed. | **PASS** — production 200; included in published route/sitemap checks. | Task-specific readout and no-score model checks passed; focused browser flow passed. | **LIMITED** — user-entered planning heuristic, not calibrated task research or job-loss forecast. |

## Remaining release risks

- None of the targeted checks is a substitute for qualified review of the tax, payroll, gratuity, or employment-law assumptions.
- Production route and sitemap checks do not prove that Google indexed or retained each URL; Search Console status remains unverified.
- The production routes were not changed by this task. Local test and copy changes were not published.
- The separate mobile artifact, signed-in production authorization, assistive-technology testing with screen readers, and physical-device testing were outside this 14-route web-tool pass.
