# Owner handover — CareerReality local release review

**Updated:** 26 October 2026
**Status:** Local work only. Nothing in this pass was published.

## Verified locally

- Build output contains 59 crawler-visible route snapshots and 11 app shells.
- The registered sitemap has 55 indexable routes; 10 additional routes are noindex and excluded.
- Registry comparison found no missing or extra sitemap routes. The redirect registry contains 98 redirects and generates 196 host/path rules; this does not establish that static hosting returns the requested HTTP status codes.
- The site has 18 authored guides and 10 dated Rules Library pages, with official-source checks.
- The entry JS and CSS total 174,532 bytes gzip and have a 200,000-byte build budget.
- Contrast sampling passed on 33 routes. Both mobile smoke tests passed in 31 seconds; this is focused coverage, not a complete WCAG audit.

## Do not represent as production verification

- No deployment or production data change was made. A read-only SEO comparison on 17 October observed 55 published sitemap URLs matching 55 locally; all 55 protected routes, registered redirects, and alternate-origin checks passed. The changes in this pass were not published.
- The dated Search Console exports in `attached_assets/` are historical snapshots, not current coverage. `published-seo-release-summary.json` reports route/canonical checks only; it contains no Search Console index or query metrics.
- Forty-four legacy article records remain archived and unpublished because author, date, source, and duplication evidence is incomplete.
- The 392 salary, company, and layoff rows have no source URLs and remain suppressed. No company score or market narrative is approved.
- The CTC calculator supports manually entered PF amounts and a source-based statutory estimate; the estimate is not an individualized tax or payroll determination. See `docs/work/CTC_CALCULATION_AUDIT.md` for the tax-period-specific employment-tax deduction and official source checks. No independent payroll sign-off was performed; this source audit is not individual payroll advice.
- Legal-entity, named-reviewer, privacy/retention, and monitored-contact claims are not established. Use only facts the owner can verify.

## Search Console evidence (owner-provided exports)

- Before summarizing a new export bundle, run `pnpm --filter @workspace/career-reality run audit:search-console-exports` (or pass a directory path). The check requires `Filters` metadata first, reports search type/date/country/device scope and source filename date, flags exact duplicate bundles, and keeps Chart totals separate from Page/Query row sums. Run its tests with `pnpm --filter @workspace/career-reality run test:search-console-exports`.
- Reviewed the attached Search Console exports. All performance `Filters` files say `Search type: Web`; the date selections are `Last 16 months` and `Last 3 months`. No country filter is recorded. The Countries tab is a country aggregate; it does not make the Pages or Queries tables country-filtered.
- The export check identifies two exact duplicate pairs: the unprefixed 16-month set and `0_Chart_1790603336091.csv` set; and the two three-month sets beginning `0_Chart_1790603398205.csv` and `0_Chart_1790603995002.csv`. Their filename timestamps identify 28 September 2026 as the source-file date. Keep only one bundle from each pair in any analysis.
- The 16-month chart covers **2025-12-22 through 2026-09-25**: **96 clicks, 12,322 impressions, 0.78% CTR**. The three-month chart covers **2026-06-26 through 2026-09-25**: **21 clicks, 4,137 impressions, 0.51% CTR**. India’s separate Countries row for the three-month period is 17 clicks and 3,116 impressions; it is not an India-filtered Queries or Pages export.
- The query table contains only reported queries, not the property total. For the 16-month export its rows sum to 20 clicks and 1,632 impressions; for the three-month export they sum to 2 clicks and 885 impressions. Search Console omits some queries, so do not use these row sums as total search performance. Duplicate three-month export sets are byte-identical.
- No supplied export contains both Page and Query dimensions filtered to India. The revised task's ₹20 LPA article and CTC calculator page totals are global, and the India row is a separate property-level aggregate. Do not choose India-specific target queries or report India page CTR until India-filtered rows are provided.
- Page-table sums also exceed the chart in these exports: 12,821 versus 12,322 impressions over 16 months, and 4,347 versus 4,137 over three months. Keep chart totals as the property baseline; page rows can split URL variants and must not be summed as a site-wide denominator.
- Highest-click visible query rows over 16 months were “career reality check” (9 clicks / 44 impressions), “career reality” (5 / 57), “salary reality check” (2 / 56), and “salary reality checker” (2 / 30). In the three-month table, “job reality” had 1 / 26. “Is 20 lpa good salary in india” had 107 impressions and no clicks; “ctc calculator” had 90 impressions and no clicks (average position 45.53). These are worldwide Web-query rows under the export’s recorded filters, not country-specific demand.
- In the three-month Pages table, the homepage had 8 clicks / 257 impressions; `/salary-calculator/` had 1 / 703 (average position 34.04); `/companies/` had 0 / 98 (average position 19.01). The legacy article `/article/what-20-lpa-actually-feels-like-india-purchasing-power/` had 3 / 1,381 and `/article/manager-vs-ic-career-path-india/` had 3 / 114; both now redirect to guides. `/offer-comparison/` and the current `/guides/` routes have no row in the dated Valid/page exports. Absence from these older tables is not a current zero-impression result.
- Representative route follow-through:

  | Current route group | Dated Search Console evidence | Interpretation |
  |---|---|---|
  | `/offer-comparison/` | Not present in the 18 September Valid URL table or the three-month Pages table. | Current indexing is unknown; inspect this URL in Search Console. |
  | `/salary-calculator/` | Present in the Valid table; 1 click / 703 impressions over the three-month page export. | Reported valid in the September snapshot, but visibility was low (average position 34.04). |
  | `/salary-drop/` | Present in the Valid table; its no-slash variant appears in the Page with redirect drilldown. | The variant redirect is expected; check the slash-canonical URL if current status matters. |
  | `/guides/` and its 18 detail routes | None appear in the 18 September Valid table. Two older `/article/` pages with clicks now redirect to `/guides/read-the-offer-beyond-ctc/` and `/guides/performance-reviews-and-career-choices/`. | Recheck the current guide URLs; the historical article clicks do not prove the replacement guides are indexed. |
  | `/companies/` | Present in the Valid table; 0 clicks / 98 impressions over three months. `/companies/groww/` and `/companies/postman/` also appear in older data but now redirect to `/companies/`. | The checklist route was reported valid; old detail URLs should resolve to the current checklist rather than be treated as separate current pages. |
- The `Coverage-Valid` export dated 5 September has 37 URL rows and a latest chart point of 37 on 28 August. The export dated 18 September has 74 rows and a latest chart point of 74 on 14 September; after normalizing host and trailing-slash variants it contains 61 distinct paths. Only 12 of today’s 55 indexable sitemap paths appear in that dated Valid list; 43 do not. The listed snapshot includes `/salary-calculator/`, `/salary-drop/`, and `/companies/`. None of the 19 current `/guides/` hub/detail paths appear. This is a dated comparison, not proof of today’s index state or a complete set of excluded pages; use fresh URL Inspection and Page indexing data before making decisions.
- The 18 September `Page with redirect` drilldown charts 9 affected pages at its latest point (14 September) and lists 9 URLs, including legacy article URLs, a salary-drop URL variant, host/protocol variants of `/`, and two legacy AI URLs. Such URLs may be expected redirects rather than broken canonical pages; the separate live route audit passed the registered redirect checks.
- An additional 32-row CSV has 30 `Pending` and 2 `Failed` statuses, but it contains no issue/report label. The failed rows are the legacy `/article/gcc-gold-rush-india-captive-center-reality/` URL and `/escape-plan` without its canonical slash. Do not attribute these statuses to a specific validation or indexing issue until the originating Search Console report is identified.
- The supplied performance data ends 22 September days before this 17 October review, and the coverage exports are older still. Request a fresh export for current indexing and query performance.
- Rechecked on 26 October for the India CTC comparison: a newly supplied Search Console bundle covers 27 September–24 October, but its Filters file records no country filter. Its global chart has 11 clicks and 1,736 impressions; the separate India Countries row has 11 clicks and 1,498 impressions (0.73% CTR, position 8.29) and does not filter Page or Query rows. The current CTC guide is absent from the visible global Page rows; the legacy article URL has 1 click / 878 impressions, and `/salary-calculator/` has 1 / 13 with a separate `www` variant at 0 / 20. The global Query rows are not joined to pages. The release date was not supplied.
- A read-only Replit analytics query found no `decision_tool_completed` events for `tool_id=ctc-calculator`, either in 26 September–26 October or all time. It found 11 pageviews on the guide/calculator paths from 5 September 20:14 UTC through 6 October 14:16 UTC. Do not interpret missing completion events as zero completions. No matched India-filtered comparison is available until India is selected in the Page/Query export filters, the release date is known, and qualified completion events are observable.
- A 26 October read-only speed/retention baseline is recorded in `docs/seo/MEASUREMENT.md`. It includes six mobile Lighthouse lab runs, no verified Search Console or Replit field Core Web Vitals samples, within-month repeat-visit counts, and the privacy-safe tool-completion gap. The safe completion event exists in local source but is absent from the published bundle; historical `calculator_completed` events include form-property keys and are excluded.

## Rechecked trust and editorial findings

- A production-database **read-only aggregate query** found 360 salary benchmarks, 26 company signals, and 6 layoff signals. All 392 lack both `source_url` and provenance; 0 are verified, derived, or publishable. The development database and static seeds return the same counts with `pnpm --filter @workspace/api-server run audit:public-data-provenance`.
- The public data guards now validate provenance and the record values themselves. Company-score publication remains disabled until a reviewed methodology version exists. Invalid or unsupported rows stay out of API and personalized decision paths.
- The local API starts, but its public-signal seed does not complete and readiness remains degraded while no records qualify for publication. Keep this warning visible; do not seed unsupported rows or report readiness as healthy until the operator accepts the empty-data state or supplies reviewed evidence.
- `pnpm --filter @workspace/career-reality run audit:editorial-metadata` audits the 18 generated guides. All 18 lack verified original publication and substantive modification dates; 0 contain invalid date values. The generator and JSON-LD omit those dates. Two external source links still need human verification; the audit prints their exact URLs and missing review fields. Fifteen routes have no attached source links; review the generated report for the affected routes and add sources only where the page makes material factual claims.
- Verified author/reviewer identities are not attached to the generated guides or emitted as article-schema claims. Do not add a byline, credentials, or review dates without actual records.
- The available records do not verify named authors, contributors, or reviewer identities. `/about` and `/team` now omit those attributions; no biography or credentials are claimed.
- No owner-approved author biography, source records for original publication or substantive update dates, or records of actual reviewer activity were supplied for this pass. Public bylines and reviewer claims remain absent; date fields remain omitted. To restore any attribution or date, supply the contemporaneous source record and owner approval described in the evidence table below.
- `/layoff-radar` is a registered redirect to `/layoff-runway/`; the draft company-detail component now labels its related action as a cash-runway estimate. The old radar/report form remains unreachable and is not presented as a public reporting feature.

## Exact owner/editorial evidence required

| Records | Missing field or evidence | Why / evidence needed | Effect |
|---|---|---|---|
| The 18 guide routes below | Original publication date; substantive update date; source links for material factual claims | Provide dated editorial records or contemporaneous publication evidence; provide the actual changed/reviewed date and primary source for each claim. A build or crawl date is not acceptable. | Dates remain omitted. Existing routes are not automatically noindexed; unsourced claims must remain qualified or be removed. |
| `/guides/read-the-offer-beyond-ctc/` | Human verification status, reviewer identity, and review date for `https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf` and `https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf` | Confirm each source supports its cited claim, record its source date, and record the reviewer and actual review date only if a human review occurs. | The links are present but must not be represented as reviewed. |
| `/about` and `/team` | Confirm that the displayed name and lead-author role are accurate; supply a public author-profile URL only if one exists | Owner confirmation of identity and role; do not add credentials or a biography without evidence. | Attribution remains owner-verification dependent; no new byline or structured author claim is added. |
| The 44 archived article IDs below | Named author and profile URL; reviewer and profile URL; original publication date; substantive update and fact-check dates; claim-level source/date evidence; duplication/intent disposition | Supply authoritative records for each item. A name alone or a guessed date is insufficient. | Keep archived and unpublished until editorial and duplication review is complete. |

Guide routes audited:

`/guides/read-the-offer-beyond-ctc/`, `/guides/runway-debt-and-big-decisions/`, `/guides/independent-work-without-romanticising-it/`, `/guides/career-switches-and-education/`, `/guides/getting-hired-through-evidence-and-conversations/`, `/guides/performance-reviews-and-career-choices/`, `/guides/engineering-careers-without-the-title-trap/`, `/guides/ai-at-work-questions-to-ask/`, `/guides/data-science-career-claims/`, `/guides/cybersecurity-and-green-work/`, `/guides/layoff-recovery-and-employment-documents/`, `/guides/notice-period-and-return-to-office/`, `/guides/cross-border-and-remote-pay/`, `/guides/senior-engineering-and-operations-work/`, `/guides/skills-passion-and-career-constraints/`, `/guides/culture-fit-and-product-management/`, `/guides/workplace-culture-and-boundaries/`, `/guides/how-to-read-salary-and-hiring-claims/`.

Archived article identifiers:

`portfolio-first-hiring-gig-economy-careers-india-2026`, `green-careers-esg-renewable-sustainability-india-2026`, `cybersecurity-privacy-careers-beyond-tech-india-2026`, `joining-bonus-clawback-offer-letter-traps-2026`, `staff-engineer-promotion-freeze-india-2026`, `gcc-return-to-office-hybrid-reality-india-2026`, `relieving-letter-hostage-notice-period-india-2026`, `ai-upskilling-trap-india-api-wrapper-reality`, `gcc-gold-rush-india-captive-center-reality`, `indian-it-layoff-cycle-2026`, `junior-data-scientist-reality-india`, `home-loan-trap-dream-house-financial-prison`, `ux-salary-myth-design-careers-plateau`, `pm-prestige-trap-escape-from-engineering`, `10x-developer-myth-productivity-killing-careers`, `data-science-bubble-excel-work-reality`, `career-switch-illusion-changing-jobs-not-career`, `engineering-career-ceiling-peak-at-35`, `self-learning-trap-online-courses-expensive-entertainment`, `broke-at-30-money-mistakes-nobody-warned`, `indian-education-trap-degree-career-mistake`, `work-life-balance-myth-high-performers`, `passion-luxury-not-strategy-india`, `hr-conversations-what-matters-india`, `culture-fit-trap-hiring-reality`, `job-hopping-stops-working-after-35`, `performance-review-reality-ratings-india`, `tech-lead-trap-responsibility-authority`, `devops-sre-reality-india-oncall`, `senior-developer-salary-ceiling-india`, `freelancing-reality-india-freedom-myth`, `networking-reality-india-introverts`, `layoff-recovery-timeline-india`, `manager-vs-ic-career-path-india`, `startup-equity-esop-reality-india`, `side-hustle-myth-india-reality`, `remote-work-salary-trap-india`, `mba-reality-india-worth-it-2026`, `american-dream-indian-engineers`, `what-20-lpa-actually-feels-like-india-purchasing-power`, `why-upskilling-stops-working-career-trap`, `salary-transparency-india-2026-number-in-room`, `ai-job-market-2026-india-show-your-working`, `humour-in-workplace-culture-2026-joke-is-on-promotion`.

## Owner decisions before any release

1. Review the published sitemap, sampled route index status, and redirect behavior against the local registry.
2. Supply and approve any legal, reviewer, privacy, and contact facts that the public pages should state.
3. Keep archived articles and unprovenanced market rows unpublished unless their evidence and review requirements are met.
4. If ready, publish through the Replit interface, then run a live smoke check. Do not claim the local changes are live before that check.

## Local verification commands

- `pnpm --filter @workspace/career-reality run typecheck`
- `pnpm --filter @workspace/career-reality run build`
- `pnpm --filter @workspace/career-reality run verify:aa-contrast`
- `pnpm --filter @workspace/career-reality run test:content-audit`
- `pnpm run verify:careerreality-local`
- `pnpm --filter @workspace/career-reality run audit:editorial-metadata`
- `pnpm --filter @workspace/api-server run audit:public-data-provenance`
- `pnpm --filter @workspace/career-reality run verify:published-seo` (read-only comparison)
