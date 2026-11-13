- 2026-11-12 deploy: NOT published. Local gate passed at cc4bff7. Replit built cc4bff7 OK but its copy has an extra unbuilt commit b7eebe8 (reports under artifacts/career-reality/reports/, not on origin). Could not confirm built == deployed, so stopped.

# Operations log

Newest first. One entry per session or scheduled run.

## 2026-11-13 — Ops cycle: audit

- **Health:** `/`, `/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico` 200; `www` 301 to `https://careerreality.in/`; `http` still 301 to `https://careerreality.in:443/`. All 88 sitemap URLs 200. Guide byline present (Shiv Shakti Mishra, read-the-offer-beyond-ctc).
- **Watching:** `/article/pf-withdrawal/` still 404 (redirects wait on a publish; the 12 Nov deploy stopped). `ops/LAST-DEPLOY` is still `c1e70fa`; main has several unpublished commits (ledger, direct answers, redirects).
- **Primary sources:** incometaxindia.gov.in 302, epfindia.gov.in 301, labour.gov.in 302 (not followed; not read). Date-sensitive figure check not run.
- **Trends (1 search, secondary sources):** labour codes one year on (retrenchment compensation, 50% wage rule, PF/gratuity take-home), no layoff headline found.
- Wrote `ops/PLAN.md`. No code changes.

## 2026-11-12 — Payslip ledger and guide direct answers (owner approved: "complete end to end")

- Branch `claude/ledger-direct-answer`. CTC calculator: the flat "Annual estimate at target" list is now a payslip-style ledger (`src/components/shared/payslip-ledger.tsx`): earnings, deductions, take-home, fixed-pay vs full-target columns, semantic table. Remaining detail rows (basic, employment-tax deduction, PF wage base/EPS/EPF schedule, effective rate) stay below it. No calculation changed.
- Guides: every guide (29) opens with a question and a 20–90 word direct answer (`src/data/guide-direct-answers.ts`), in the React page and the crawler snapshot (replaces the old snapshot-only "The direct answer" section that repeated the opening paragraph). Answers restate only what each guide already says; `tests/guide-direct-answers.test.ts` blocks any figure not already in the guide. The verifier now requires the box on every guide.
- Checks on the owner PC: TypeScript passes; unit tests guide-direct-answers 4/4, on-page-seo 6/6, ctc-tax 27/27; pillar-guide-metadata 2/3 (pre-existing: Form 130 guide now has a modified date). Snapshots regenerated from an older dist template and the unmodified `verify-route-snapshots.ts` passed (92 snapshots, 13 shells). Rendered the real ledger component with the default example: rows reconcile, light and dark AA contrast pass (lowest 4.92:1), no horizontal scroll at 375px. Not run: `vite build` (Windows) and Playwright e2e (new assertions added to `salary-calculator.spec.ts` and `tool-analytics.spec.ts`).

## 2026-11-11 — Issue #2: sitemap drift monitor (legacy /article/ redirects)

- Alert lists 40 `/article/<slug>/` URLs answering 200 on production instead of the expected 301. Cause: the 44 article redirects (`d06a696`, merged 8 Nov) landed after the last publish (`c1e70fa`, 0 article redirects in its registry), and the monitor checks production against `main`. Not a code bug.
- Production server `scripts/serve-published.mjs` reads `registry.redirects` from `route-registry.json` (not `_redirects`) and checks them before anything else. Ran it locally on `main` (owner PC, PowerShell): all 88 URLs (44 slugs, with and without trailing slash) return 301 to the right guide; first target guide 200.
- No code change. Fix goes live with the 12 Nov deploy (main has article/registry changes since `ops/LAST-DEPLOY`); the next green monitor run closes the issue. Deploy day check: curl two `/article/` URLs for 301.
- Gotcha: in Git Bash, `BASE_PATH=/` is rewritten to a Windows path and the local server 404s everything; run it from PowerShell or set `MSYS_NO_PATHCONV=1`.
- Update 12 Nov: the 12 Nov deploy stopped (Replit has extra commit `b7eebe8` not on origin), so the redirects are still not live and the issue stays open until the next publish.

## 2026-11-11 — Ops cycle: test

- No `claude/cycle-*` branch from the build phase, so no build or tests run. Nothing merged. (An unrelated `claude/seo-snapshot-parity-5e050c` branch exists on origin; not touched.)

## 2026-11-10 — Ops cycle: build

- **Plan item 1 (http → https:443 redirect):** confirmed still live, but the repo has no source for it (not in `_redirects`, the registry or the scripts). It is host config; owner/hosting side only. No change.
- **Plan item 2 (Form 121 vs 15G/15H):** searched the repo; no page mentions 15G, 15H or Form 121, so there is no wording to fix. Not adding the topic without a primary source.
- **Plan item 3 (draft guide):** not started. Primary sources are unreachable from this environment (`www.incometaxindia.gov.in` 403, `www.epfindia.gov.in` connection failed, `labour.gov.in` 302 not followed), and the runbook bars figures from secondary blogs. Still blocked on the network-allowlist item in OWNER-ACTIONS.
- No code changes, no branch, no build. The test phase should find nothing to do.

## 2026-11-09 — Ops cycle: audit

- **Health (production reachable now):** `/`, `/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico` 200. `www` 301 to `https://careerreality.in/`. All 88 sitemap URLs return 200. A guide (`/guides/read-the-offer-beyond-ctc/`) shows the Shiv Shakti Mishra byline and Article JSON-LD author. Archived `/article/pf-withdrawal/` returns 404 (no matching redirect in my sample; the 44 redirects were not individually checked).
- **Watching:** `http://careerreality.in/` 301s to `https://careerreality.in:443/` (explicit :443). Works, but untidy; on the plan.
- **Deploy drift:** `ops/LAST-DEPLOY` = `c1e70fa`; main has since added the article redirects (`d06a696`), so the 12 Nov deploy will publish them. Not checked live.
- **Primary-source check:** not run (incometax/epfindia not tested this run).
- **Trends (2 searches, secondary sources only):** labour codes take-home vs PF/gratuity one year on; Form 121 replacing 15G/15H for EPF withdrawal TDS from tax year 2026-27; EPFO 3.0 / UPI withdrawal and tax on early withdrawals; Budget 2027 expectations (nothing found). Layoff news search returned nothing specific.
- Wrote `ops/PLAN.md`. No code changes.

## 2026-11-08 — Archived article redirects (owner approved)

- Search Console: 28 clicks in 3 months, mostly to /article/ pages that served a noindex shell with no route to the replacement guides.
- Added 44 single-hop 301s from /article/<slug>/ to the owning guide (18 guides receive them), from pillar-guide-sources.json. Build, verifier and test guards updated; archived text stays unpublished.
- Checks: TypeScript and prebuild generators pass; node tests same as before (54 pass, the same 2 fail). Full build not run on the owner PC; the 12 Nov deploy gates on it. Playwright specs not run.

## 2026-11-08 — Publish verified; deploy path tested

- Publish status `success`. Live: GA4 tag (realtime showed 4 active users), Form 130 guide with byline and 15 June 2027 date, Finance Bill 2026 note on `/rules/income-tax-new-regime`, GA4 text on `/privacy-policy`, all 88 sitemap URLs 200.
- Hands-off test: Replit Agent merged `origin/main` and pushed by prompt alone (`87d68d0`, only empty publish commits added). `ask_question` returned the hash directly. `publish_app` could not be tried because a publish was already running; first real use is the 12 Nov deploy.
- `ops/LAST-DEPLOY` set to `c1e70fa`, the last site change published.

## 2026-11-08 — Form 130 guide and tax-year wording (owner approved)

- Checked the cloud draft against official sources from the owner PC. Read directly: Form No. 130 page and Rule 215 on incometaxindia.gov.in. PDFs (Form 130 FAQs, transition FAQs, Finance Bill 2026 memorandum) were only seen through search-engine extracts of the official files, because the site blocks direct download; re-read them if a claim is disputed.
- Corrected the draft: 15 June due dates (Form 130 first due 15 June 2027), Parts A/B/C, TRACES generation, duplicates, Part C option for two employers, Form 168 from tax year 2026–27. Removed the claim that the certificate shows the regime used, which could not be confirmed.
- Rules pages now name Form 130 beside Form 16; new-regime and old-regime scope sections and the regime guide separate AY 2026–27 from tax year 2026–27. Rate tables unchanged.
- Merged as `c1e70fa`. TypeScript and prebuild generators pass locally (29 guides, 88 sitemap URLs). Full build not run: needs Replit.

## 2026-11-08 — Ops cycle (second scheduled run)

- **Access.** GitHub push now works (first run's 403 is fixed). `careerreality.in`, `www.careerreality.in`, `incometax.gov.in` and `cleartax.in` are still blocked by the network policy (curl: proxy `connect_rejected`; WebFetch: DNS failure).
- **Health: not run.** The `/`, ads.txt, robots.txt, sitemap.xml, favicon.ico, www/http redirect and byline checks could not reach production. `pnpm run verify:indexed-routes` ran and failed only with "fetch failed" on every URL (network), not with content errors. Local sitemap on `main`: 87 URLs, unchanged.
- **Deploy drift: not checked live.** `main` was `292bc43` (ops files only) at the start of the run, then `108f5c8` (build tooling). Neither changes page output.
- **Build.** `pnpm install` + `SITE_URL=https://careerreality.in pnpm run build` failed at postbuild with `tsx: not found`. Shipped `108f5c8`: added `tsx` (^4.23.15, the version already in the lockfile) to career-reality devDependencies. Build then passed: 91 route snapshots and 57 app shells verified. The lockfile also re-resolved orval's TypeScript peer in `lib/api-spec` from 5.9.3 to 6.0.3 (pnpm peer dedupe; site build unaffected).
- **Guide draft.** Branch `claude/guide-form-130-salary-tds-certificate` (`6ab8888`): new Form 130 guide plus a link from the old-vs-new regime guide. Build passes (1,369 words; 92 snapshots; sitemap 88). Facts come from consistent secondary reporting (taxguru, Business Today, ClearTax, SCC Online), not a primary source; dates left null for the owner to verify.
- **Trends** (web search, 8 Nov):
  1. Form 130 replacing Form 16 under the Income-tax Act, 2025: employees are making tax year 2026–27 declarations now. Maps to the new draft and to `/rules` salary pages.
  2. First anniversary of the Labour Codes (in force 21 Nov 2025): the 50% wage rule and its effect on take-home, PF and gratuity; state rules still rolling out. Maps to `/guides/labour-codes-and-layoffs-india`, `/rules/gratuity-wages`, `/salary-calculator`.
  3. IT layoffs and net-zero hiring: reports of TCS, Cognizant and Oracle India cuts, while top IT firms added almost no net staff in FY26. Maps to the layoffs hub and `/guides/first-24-hours-after-layoff`.
  4. Budget 2027 (Feb 2027) expectations: old-regime future, health-insurance deduction in new regime. Maps to `/guides/old-vs-new-tax-regime-salaried-india`; worth a pre-budget refresh in January.
  5. EPFO 3.0 (faster withdrawals planned for 2026). Maps to `/guides/pf-withdrawal-after-job-loss`; verify on epfindia.gov.in before writing anything.
- **Date-sensitive figures.** The rules library still names Form 16 as the annual salary statement (12 mentions in `rules-library-content.ts`, 1 in `rules-library.json`), and the old-vs-new guide is scoped to AY 2026–27. Both are still right for FY 2025–26 income; listed as an Ask-first decision. The CTC calculator already offers Tax Year 2026–27. No figure was changed.
- **IndexNow:** not run (no URL-changing release went live).
- Notification: sent via PushNotification.

## 2026-11-08 — First ops cycle (test run)

- Run `cse_01XeDgQRMpDaXs48u6xRxHPS`. Push notification was accepted ("Mobile push requested"). Its commits and branches were lost: every push got 403 (Claude GitHub App lacks write access).
- No production checks ran: `careerreality.in` is blocked by the cloud environment's network policy.
- Findings to redo after access is fixed: `tsx` is missing from career-reality devDependencies, so `pnpm run build` fails outside Replit; Form 130 (replaces Form 16) guide draft; tax rules pages and old-vs-new regime guide still scoped to AY 2026–27 (Ask-first).
- Search Console key saved locally and signs in; no property shared with the service account yet.

## 2026-11-08 — Handover

- Owner handed day-to-day operation to Claude; rules in `ops/RUNBOOK.md`.
- Shipped since the audit: `2c70593` post-audit SEO fixes (shared page schemas, sitemap, robots, ads.txt); `1c008b7` verifier allows the founder byline; `8e93cb8` favicon.ico. Owner merged `claude/seo-title-description-copy` and `claude/seo-trailing-slash-links`.
- Live check after republish at `10a653c`: favicon.ico 200, ads.txt/robots.txt/sitemap.xml 200, all 87 sitemap URLs 200, guide byline and Article author schema present.
- Set up weekly cloud routine `trig_011FfvPEJ5QKG2S96bPebGGd` (Mondays 09:00 IST, first run 2026-11-09). Replit connector confirmed it can read Repl `IndigoBowedMegabyte` publish status.
- Open: Search Console / GA4 access not connected; Replit publish via connector unproven; items in `OWNER-INPUTS-REQUIRED.md`.
