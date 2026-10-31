# CareerReality continuous remediation backlog

**Updated:** 23 October 2026  
**Status:** Inventory and remediation in progress. Local work only; no production writes or deployment.  
**Rule:** Do not mark an issue resolved without a regression check and evidence. A blocked data item stays blocked; never fabricate evidence or weaken publication guards.

## Inventory snapshot

- The route registry contains 65 routes and 98 redirects. It covers public tools, 18 guides, 10 rules pages, trust pages, account/admin routes, and utilities. Sitemap and snapshot totals are recorded in `docs/work/OWNER_HANDOVER.md`.
- The API has nine route modules; database schemas cover career data, public signals, workspace data, contact messages, and report throttling. API tests cover those areas, including seed, provenance, resume processing, job feeds, and company publication.
- The project has web, mobile, API, launch-video, and component-preview artifacts. This backlog is the working index; existing evidence remains in the named `docs/work/` records rather than being copied here.
- This is a first inventory pass, not a claim that every interaction or production record has already been inspected. Append discoveries here and keep unverified surfaces open.

## Issues

### CR-001 — Keep calculator period labels consistent with the selected tax period

- **Severity / status:** P1 / Resolved locally
- **Affected:** `/salary-calculator`, `/offer-comparison`; `ctc-calculator.ts`, `salary-calculator-page.tsx`, `tool-suite-page.tsx`, SEO metadata, result CSV.
- **Reproduction:** Open either calculator; compare the selected period with the scope note, calculated result, and CSV.
- **Actual:** The main calculator defaulted to a current tax-year calculation while descriptions and the offer tool described only AY 2026–27.
- **Expected:** The selected legal period is explicit, applied by the calculation engine, and reflected in page metadata, result summaries, and exports.
- **Root cause:** Stale period copy and no shared period selector on the offer-comparison surface.
- **Change:** Added explicit Tax Year 2026–27 / Assessment Year 2026–27 selection and shared period-aware calculations; updated result/export copy and salary route metadata.
- **Dependencies:** None for the two currently supported default/new-regime periods.
- **Regression checks:** CTC/tax unit tests; salary and offer browser tests; TypeScript check; production build and visual preview.
- **Verification:** 20 CTC/tax tests and 7 browser tests passed; typecheck and build passed; both pages inspected in the restarted preview.
- **Blocker:** None for the covered default/new-regime model. This does not verify the separate old-vs-new regime tool.

### CR-002 — Verify the separate tax-regime comparison period and legal basis

- **Severity / status:** P1 / Resolved locally
- **Affected:** `/tax-regime-comparison`, `artifacts/career-reality/src/pages/tool-suite-page.tsx`, tax calculation libraries and tests.
- **Reproduction:** Open the comparison tool and inspect its AY 2026–27 input label, old-regime calculation, new-regime calculation, notes, and any output.
- **Actual:** The tool is intentionally limited to AY 2026–27, but the shared new-regime CTC engine had changed its default to Tax Year 2026–27. Its numeric schedule currently matches AY 2026–27, but the calculation metadata did not match the tool's stated period.
- **Expected:** Both old- and new-regime estimates use the same verified AY 2026–27 basis; the tool does not imply support for Tax Year 2026–27.
- **Root cause:** The page's new-regime call omitted the period argument and inherited the shared engine's current-tax-year default.
- **Change:** Passed `assessment-year-2026-27` explicitly at the tax-comparison call site. Unit tests now use the explicit AY for the new-regime amount and verify AY-scoped summary copy.
- **Dependencies:** Official rule verification; no owner action expected for the local calculation audit.
- **Regression checks:** Official Income Tax Department AY 2026–27 rate table and deductions table; existing independent tax boundary tests; browser calculation/result summary.
- **Verification:** Official sources reviewed: `https://www.incometaxindia.gov.in/w/tax-rates%E2%80%8B` and `https://www.incometaxindia.gov.in/w/deductions-allowable-to-tax-payer`. Typecheck passed; all 20 CTC/tax unit tests passed; all 3 tool-analytics browser tests passed, including the ₹20L AY result of ₹1,92,400.
- **Blocker:** None for the stated AY-only comparison. This does not establish all old-regime circumstances beyond the tool's displayed limits.

### CR-003 — Exercise offer comparison across realistic compensation and cost cases

- **Severity / status:** P1 / Partially covered; browser path and calculation boundaries still open
- **Affected:** `/offer-comparison`, `compareCtcOffers`, CSV export, `tool-analytics.spec.ts`, `ctc-tax.test.ts`.
- **Reproduction:** Existing browser coverage enters one current and one offered CTC/fixed-pay pair, calculates, and downloads CSV.
- **Actual:** The core form path and independent calculation model are covered. Added unit boundaries confirm identical offers reconcile and one-time versus recurring costs are deducted separately. Arbitrary partial bonus attainment and the full invalid/large-value/export matrix remain unverified.
- **Expected:** Guaranteed pay, uncertain target bonus, PF, gratuity, first-year costs, recurring costs, and invalid inputs remain distinct and reconcile in UI and export.
- **Root cause:** Browser coverage does not yet exercise the complete input contract or high-value/identical/missing-data cases.
- **Required change:** Add realistic browser and independent calculation cases, including zero/partial/full target, employer PF inclusion, one-time and recurring costs, invalid component totals, identical offers, and large salaries.
- **Dependencies:** Tax period behavior in CR-001; no production service required.
- **Regression checks:** Unit/reference fixtures plus browser form and CSV checks.
- **Verification:** 22 CTC/tax unit tests pass, including zero/full-target outputs, identical packages, transition-cost separation, and invalid component totals. Tool-analytics browser tests pass; high/low/partial bonus and CSV edge cases remain open.
- **Blocker:** None identified.

### CR-004 — Make public-signal seed failure and data readiness accurately observable

- **Severity / status:** P1 / Partially addressed; combined dataset readiness still open
- **Affected:** API startup, `seed-public-data.ts`, `/readyz`, public dataset endpoints and readiness surfaces.
- **Reproduction:** Start the API with the current seed catalog; inspect startup logs, `/readyz`, and public salary/company/layoff responses.
- **Actual:** Seeding refuses the catalog before writes because records lack reviewed provenance. Public salary and layoff responses return no rows, `sampleSize: 0`, and quality notes. `/readyz` checks database connectivity only.
- **Expected:** Keep the provenance guard; report the exact cause without suggesting unsupported records were seeded. Distinguish API/database liveness from public-dataset readiness, and show empty/degraded dataset status from real checks.
- **Root cause:** All static seed rows lack source URLs/provenance; startup logging previously discarded the reason; `/readyz` did not name its limited scope.
- **Change:** The provenance refusal now has a typed error with safe per-dataset counts, and startup logging records those counts and the provenance reason. `/readyz` now explicitly says it covers API process and database connectivity only. Dataset responses continue to expose evidence-filtered quality metadata.
- **Required change:** Verify all dataset endpoints and decide whether a combined, independently computed public-data readiness response adds value beyond their existing per-dataset metadata.
- **Dependencies:** CR-005 evidence status; no permission to change production data.
- **Regression checks:** Seed refuses unverified data before writes; readiness returns correct statuses for database failure, empty eligible datasets, and publishable data; API responses remain provenance-filtered.
- **Verification:** Seed test and API typecheck passed. Read-only production aggregates: 360 salary, 26 company, and 6 layoff rows; every row lacks a source URL and is unpublishable/unreviewed. Local `/readyz` returned ready for its explicitly stated API/database scope; all three correct public endpoints returned zero rows and dataset-specific quality notes. Startup logs now include the safe refusal reason and counts.
- **Blocker:** No source-reviewed public records are available. Do not bypass the guard.

### CR-005 — Resolve missing provenance before publishing public market or company data

- **Severity / status:** P1 / Blocked on reviewed evidence
- **Affected:** Salary benchmarks, company signals/scores, layoff signals, publication gates, public-data APIs and data-bearing pages.
- **Reproduction:** Run `pnpm --filter @workspace/api-server run audit:public-data-provenance`; query each public dataset through its API.
- **Actual:** 392 records exist across development database and static seeds; all lack source URL/provenance and none are publishable. The public API filters them; archived static company/layoff rows are not active exports, and `/companies` is an input-only employer checklist rather than a scored directory.
- **Expected:** Every published claim has traceable source, dates, metric/method, limitations, reviewer, and eligibility; empty results remain honest and useful.
- **Root cause:** Existing seed and database rows have no reviewed provenance or approved company scoring methodology.
- **Required change:** Obtain and review actual evidence; quarantine unsupported records; publish only eligible data. Never create replacement facts.
- **Dependencies:** Owner/editorial review and source materials; production writes remain unauthorized.
- **Regression checks:** Public evidence and publication-gate tests; API payload checks for hidden/unverified rows; audit counts before/after any authorized development-only import.
- **Verification:** Development audit and current read-only production aggregate confirm 360 salary, 26 company, and 6 layoff rows, all missing source URLs and reviewed provenance. Public endpoints withhold unsupported rows; the active static catalogue arrays are empty and the public `/companies` page was visually checked.
- **Blocker:** Missing reviewed evidence and methodology approval.

### CR-006 — Verify resume and account data handling against actual behavior

- **Severity / status:** P1 / Partially addressed; signed-in end-to-end validation remains open
- **Affected:** Resume upload, processing, storage, generated outputs, account APIs, logs, deletion and `/privacy-policy`.
- **Reproduction:** Upload through the authenticated mobile career-resume flow, then select “Clear saved intelligence” from the profile screen and inspect the persisted profile.
- **Actual:** Upload bytes are processed in memory and the buffers are cleared. The authenticated `/career/resume` route persists extracted signals in `career_profiles.resume_data` for an existing profile, scoped by Clerk user ID. Career brief snapshots separately preserve generated history. Mobile profile, resume, compensation, scenario, network, relocation, and manager-risk keys were previously device-global.
- **Expected:** Private documents and extracted data are only accessible to the owning account, have explicit failure/deletion behavior, and are described accurately without unsupported guarantees.
- **Root cause:** The clear action reset local AsyncStorage/context state but did not clear the authenticated profile row. Local mobile state was also not partitioned by signed-in account. The original uploaded bytes are not written to a file/object store by these handlers.
- **Change:** Added an authenticated, idempotent `DELETE /career/resume` that clears only resume-derived profile fields and cache. The mobile clear action now calls it before clearing local state. Career brief history remains separate and is disclosed. Current mobile AsyncStorage keys are scoped by Clerk account; older unscoped keys are ignored, not deleted or migrated.
- **Required change:** Verify signed-in deletion and cross-account behavior with approved test sessions. Establish local-storage protection and backup/deletion behavior before making broader guarantees.
- **Dependencies:** Replit-managed storage/database configuration evidence and test-account authorization; do not request or expose secrets.
- **Regression checks:** Valid/invalid/oversized/malformed uploads, failed upload, duplicate submit, unauthorized and cross-account reads, expired session, deletion, and sensitive-data log scan.
- **Verification:** Root typecheck passed; 8 focused seed/profile-storage/resume tests passed. A same-origin unauthenticated DELETE returned 401. Code inspection confirms `requireUser` and user-ID-scoped profile operations; a pure test confirms account storage keys differ. Read-only production aggregate found 0 career profiles and 0 saved resume records. Signed-in and cross-account API behavior is not yet exercised.
- **Blocker:** Actual retention/backup configuration may require owner or platform evidence. Legacy unscoped local values may remain on devices. No production deletion or deployment is authorized.

### CR-007 — Complete primary-route and control behavior coverage

- **Severity / status:** P1 / Open
- **Affected:** Registered public, tool, trust, account, admin, and mobile routes; navigation, forms, search, filters, downloads, and error/empty states.
- **Reproduction:** The route registry has 65 routes and 98 redirects; current tests cover selected tools and smoke paths, not every advertised interaction.
- **Actual:** Route presence and build snapshots do not establish that every control works.
- **Expected:** Each primary journey and visible control has a truthful success, loading, empty, and error behavior across supported viewport/auth states.
- **Root cause:** No consolidated interaction matrix currently demonstrates coverage for all advertised paths.
- **Required change:** Build a route-to-interaction map from the registry and existing tests; exercise untested primary journeys without weakening auth or public-data filters.
- **Dependencies:** Data-bearing flows depend on CR-005 and CR-006.
- **Regression checks:** Route/link audit plus Playwright flows for homepage/navigation, company directory, tools, guides, search, contact, auth/account, downloads, and mobile navigation.
- **Change:** The standalone Vite route guard now passes `/api` requests through to the local API proxy. Hydration checks use current route headings instead of stale marketing copy, and responsive accessibility checks run independently per registered route.
- **Verification:** The browser runner is restricted to `*.spec.ts`; collecting `.test.ts` files caused a Node JSON-import failure unrelated to browser behavior. Latest full run: 87 passed, 1 failed, 6 skipped (94 total). Three Compass source-failure tests pass against current empty/provenance-filtered results. The archived guide handoff passes with the unchanged H1 contract and an evidence-based 15-second hydration allowance. The sole remaining browser failure is duplicate paragraphs in quarantined articles; see `docs/work/BROWSER_FAILURE_LEDGER_2026-10-23.md`. Authenticated flows remain unverified.
- **Blocker:** Authenticated UI verification requires a valid signed-in test session; no auth bypass is allowed.

### CR-008 — Close editorial sourcing and date evidence gaps

- **Severity / status:** P2 / Open; publication facts may need owner input
- **Affected:** 18 guides, Rules Library, trust/about/team pages, 44 archived article records.
- **Reproduction:** Run the existing editorial metadata/content audits and inspect each flagged source/claim.
- **Actual:** `OWNER_HANDOVER.md` records 18 guides without verified original/substantive-update dates, 15 without attached source links, one external source needing human verification, and 44 archived records lacking author/date/source evidence.
- **Expected:** Distinguish verified facts, estimates, editorial synthesis, and assistance; only publish supported dates, attributions, and material claims.
- **Root cause:** Editorial records and claim-level sources are incomplete; dates and identities cannot be inferred from build time.
- **Required change:** Verify each factual claim/source; omit or qualify unsupported content; preserve archived drafts and routes until editorial/SEO impact is assessed.
- **Dependencies:** Human source and author/reviewer records for some claims.
- **Regression checks:** Existing metadata, duplicate-content, forbidden-copy, and built-snapshot audits; manual primary-source review.
- **Verification:** Current metadata audit found 18 guides and 0 complete editorial records; no invalid dates or source URLs were detected, but one official-source record still awaits human verification and publication/update dates remain missing. The deterministic exact-paragraph audit found 1,179 extra copies across 102 groups in 30 of 44 quarantined records: 94 repeated-template candidates and 8 repeated-editorial-content candidates, all still awaiting human review. Full article IDs, titles, sources, excerpts, and section/paragraph locations are in `docs/work/ARCHIVED_ARTICLE_DUPLICATION_REVIEW.md`. Preserve quarantine pending editorial review.
- **Blocker:** Missing human evidence for dates, attribution, and several source checks.

### CR-009 — Reconcile public SEO and actual host behavior

- **Severity / status:** P1 / Open
- **Affected:** Canonicals, robots, sitemap, redirects, static hosting and production routes.
- **Reproduction:** Compare current built snapshots and route registry with read-only checks against primary and alternate public origins.
- **Actual:** Local sitemap/route checks have passed in prior runs, but historical release documents contain inconsistent production counts/statuses; static output does not itself prove requested HTTP redirects/status codes.
- **Expected:** Actual published canonical/indexability/status behavior matches the current registry, and only useful indexable routes appear in the sitemap.
- **Root cause:** Deployment captures are from different revisions; host-level redirect behavior is not established by local route generation.
- **Required change:** Run read-only production verification only after identifying the current deploy; report differences without modifying production.
- **Dependencies:** Deployment metadata/current published revision; no deployment authorization.
- **Regression checks:** Current local SEO gate and live read-only route/sitemap checks.
- **Verification:** Current production build and published SEO gate passed for all 55 protected indexable routes, the registered redirects, and the checked primary/alternate origins. This does not authorize deployment or establish behavior on an untested revision.
- **Blocker:** Published revision and current host behavior need fresh evidence.

### CR-010 — Finish accessibility, mobile, and performance verification

- **Severity / status:** P2 / Open
- **Affected:** All public routes and mobile artifact.
- **Reproduction:** Run existing accessibility/mobile tests and measure built pages under documented lab settings; use field data only where available.
- **Actual:** Existing evidence is focused structural/mobile smoke and local lab measurements, not a complete WCAG audit or field Core Web Vitals sample.
- **Expected:** No material keyboard, focus, labeling, contrast, overflow, touch-target, screen-reader, or performance issues on primary journeys.
- **Root cause:** Verification scope is currently limited; production field data is not established.
- **Required change:** Exercise representative route groups and actual interactive states; repair material issues and document measurement limits.
- **Dependencies:** Authenticated flows require test credentials through approved test setup; never expose secrets.
- **Regression checks:** Keyboard/200%-zoom, axe or equivalent, mobile viewport, and built-page performance checks.
- **Verification:** Current AA contrast check passed on 33 routes. The selected browser run passed route hydration and keyboard/overflow/control-name checks at 320px and 360px; the wider suite still has failures and no complete WCAG or field-performance audit has been performed.
- **Blocker:** No current production field metrics supplied.

### CR-011 — Investigate production-build source-map warnings

- **Severity / status:** P3 / Open
- **Affected:** `tooltip.tsx`, `label.tsx`, `select.tsx`, and `dropdown-menu.tsx` during Vite production builds.
- **Reproduction:** `pnpm --filter @workspace/career-reality run build`.
- **Actual:** Four non-fatal warnings say Vite cannot resolve original source locations while reporting sourcemap positions.
- **Expected:** Determine whether package/source-map composition is harmless or affects shipped output/debuggability; fix only if safe and relevant.
- **Root cause:** Not yet established.
- **Required change:** Trace sourcemap generation/import chain; avoid broad UI rewrites or suppressing warnings without evidence.
- **Dependencies:** None.
- **Regression checks:** Production build and bundle/source-map inspection.
- **Verification:** Build succeeds with warnings; production impact not yet assessed.
- **Blocker:** None identified.

### CR-012 — Confirm trust, privacy, and contact claims against owner evidence

- **Severity / status:** P1 / Blocked on owner confirmation
- **Affected:** `/about`, `/team`, `/privacy-policy`, `/terms`, `/contact`, trust metadata.
- **Reproduction:** Compare visible claims and structured data with verified legal entity, responsible people, privacy/retention operations, and monitored contact channel.
- **Actual:** Existing handover says legal entity, reviewer, retention practice, and monitored public contact are not established.
- **Expected:** Only verified claims are presented; unknowns remain explicit; forms and policy accurately describe actual implementation.
- **Root cause:** Owner-supplied records/configuration are absent or not verified.
- **Required change:** Keep unsupported claims out; align wording after the underlying facts and systems are confirmed.
- **Dependencies:** Owner confirmation and configuration evidence.
- **Regression checks:** Route content, structured-data, contact-form privacy, and accessibility tests.
- **Verification:** Prior copy is documented in `OWNER_HANDOVER.md`; actual retention/configuration review remains open.
- **Blocker:** Human owner evidence.

## Workstream status

| Workstream | Status | Backlog |
|---|---|---|
| A — Salary and tax calculators | PARTIAL | CR-001 and CR-002 resolved locally; CR-003 covers offer edge cases |
| B — Offer comparison | PARTIAL | CR-001 basic period behavior fixed; CR-003 still open |
| C — Public-signal/company pipelines | BLOCKED ON EVIDENCE | CR-004, CR-005 |
| D — Provenance, scores, readiness | BLOCKED ON EVIDENCE / PARTIAL | CR-004, CR-005 |
| E — Resume and personal data | PARTIAL; deletion and account partition added locally | CR-006 |
| F — Customer journeys | PARTIAL; 1 browser failure remains, authenticated flows unverified | CR-007 |
| G — Editorial quality and trust | PARTIAL / OWNER INPUT; archived duplicate copy needs review | CR-008, CR-012 |
| H — SEO and indexing | PARTIAL | CR-009 |
| I — Accessibility, performance, mobile | PARTIAL | CR-010 |
| J — Runtime, build, deployment reliability | PARTIAL | CR-004, CR-009, CR-011; no production deployment authorized |

## Next actions

1. Verify `/api/public/companies`, then finish CR-004's readiness contract without weakening evidence filters.
2. Validate signed-in resume removal and account switching for CR-006; resolve legacy local copies and verify retention controls without assuming backup deletion.
3. Review the 30 duplicate-bearing archived records using the generated location report; do not rewrite or unquarantine automatically.
4. Continue CR-003 edge cases and CR-007 primary journeys; keep real signed-in QA, source records, and owner evidence explicitly blocked until supplied.
5. Keep owner- and evidence-blocked items open; do not seed unsupported data, claim privacy guarantees, or publish.

## Owner dependencies

See `docs/work/OWNER_ACTION_LIST.md` for the exact source/methodology, authorized QA, retention/backup, and editorial evidence needed, why each is required, and which checks depend on it.
