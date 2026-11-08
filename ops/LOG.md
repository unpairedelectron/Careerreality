# Operations log

Newest first. One entry per session or scheduled run.

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
