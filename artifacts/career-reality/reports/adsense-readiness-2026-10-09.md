# CareerReality content quality and AdSense readiness audit

- Generated: 2026-10-09T08:41:49.612Z
- Readiness: **NOT READY**
- Reapplication: **Not allowed by this gate**
- Scope: Local source including the full quarantined archive, supplied indexed-URL export, and read-only production aggregate snapshot; this command does not crawl production or write production data.

## Inventory

| Measure | Result |
| --- | ---: |
| Public articles | 0 |
| Quarantined originals | 44 |
| Preserved original archive files | 44 |
| Article records audited | 44 |
| Categories | 5 |
| Static company records | 0 |
| Public tools | 1 |
| Verified individual authors | 0 |
| Verified editorial reviewers | 0 |
| Articles with verified publication dates | 0 |
| Articles with verified modified dates | 0 |
| Articles with verified review and fact-check dates | 0 |
| Articles with verified author and reviewer | 0 |
| Articles still requiring editorial review | 44 |
| Article word count (min / median / max) | 3342 / 4307 / 8263 |

## Content and evidence

- Raw exact paragraph duplicates in the quarantined corpus: 1179 repeated occurrences across 102 groups.
- Most copies of one paragraph inside an article: 18.
- Exact blocks shared across quarantined articles: 48; maximum distinct articles sharing one block: 6. Near-duplicates and legitimate shared boilerplate are not classified by this exact-match scan.
- Exact repeated paragraphs in assembled content: 0.
- Citation records: 90 total (27 marked claim sources; 63 context sources).
- Human-verified claim citations: 0/27; awaiting review: 27.
- Citation URL syntax failures: 0; section mapping gaps: 0.
- Citation claims count as human-verified only when a reviewer, review date, and VERIFIED status are present. URL syntax and section labels alone do not establish source credibility or prove claim support.

## Indexed URL export comparison

- File: attached_assets/Table_1789671366775.csv
- Export rows: 74; unique normalized paths: 61.
- Route-by-route matrix: `artifacts/career-reality/reports/adsense-indexed-url-matrix-2026-10-09.csv` (62 unique sitemap, Search Console, and company-detail paths; 0 export rows with invalid URLs).
- Current local build snapshots: 16 total, including 2 of 2 sitemap paths; local noindex routes in the inventory: 14; export-listed local noindex paths: 14.
- Latest Last crawled date in export: 2026-09-10.
- Search Console export is a dated snapshot, not a live index-status check. Compare each difference before changing URLs.

Local build routes with a noindex directive:

- `/about/`
- `/ai/`
- `/career-reality-index/`
- `/compass/`
- `/contact/`
- `/escape-plan/`
- `/layoff-radar/`
- `/privacy-policy/`
- `/resignation-risk/`
- `/salary-calculator/`
- `/salary-drop/`
- `/salary-reality/`
- `/sitemap/`
- `/terms/`

Export-listed paths that are noindex in the local build (this does not establish their current production state):

- `/about/`
- `/ai/`
- `/career-reality-index/`
- `/compass/`
- `/contact/`
- `/escape-plan/`
- `/layoff-radar/`
- `/privacy-policy/`
- `/resignation-risk/`
- `/salary-calculator/`
- `/salary-drop/`
- `/salary-reality/`
- `/sitemap/`
- `/terms/`

Paths in the export but outside the current local sitemap:

- `/about/`
- `/ai/`
- `/ai/gcc-ai-hiring-bar-system-design-july-2026/`
- `/ai/google-gemini-enterprise-india-gcc-july-2026/`
- `/article/10x-developer-myth-productivity-killing-careers/`
- `/article/broke-at-30-money-mistakes-nobody-warned/`
- `/article/cybersecurity-privacy-careers-beyond-tech-india-2026/`
- `/article/data-science-bubble-excel-work-reality/`
- `/article/devops-sre-reality-india-oncall/`
- `/article/freelancing-reality-india-freedom-myth/`
- `/article/gcc-gold-rush-india-captive-center-reality/`
- `/article/gcc-return-to-office-hybrid-reality-india-2026/`
- `/article/green-careers-esg-renewable-sustainability-india-2026/`
- `/article/home-loan-trap-dream-house-financial-prison/`
- `/article/hr-conversations-what-matters-india/`
- `/article/indian-education-trap-degree-career-mistake/`
- `/article/indian-it-layoff-cycle-2026/`
- `/article/job-hopping-stops-working-after-35/`
- `/article/joining-bonus-clawback-offer-letter-traps-2026/`
- `/article/junior-data-scientist-reality-india/`
- `/article/layoff-recovery-timeline-india/`
- `/article/manager-vs-ic-career-path-india/`
- `/article/mba-reality-india-worth-it-2026/`
- `/article/networking-reality-india-introverts/`
- `/article/passion-luxury-not-strategy-india/`
- `/article/performance-review-reality-ratings-india/`
- `/article/pm-prestige-trap-escape-from-engineering/`
- `/article/portfolio-first-hiring-gig-economy-careers-india-2026/`
- `/article/relieving-letter-hostage-notice-period-india-2026/`
- `/article/self-learning-trap-online-courses-expensive-entertainment/`
- `/article/senior-developer-salary-ceiling-india/`
- `/article/side-hustle-myth-india-reality/`
- `/article/staff-engineer-promotion-freeze-india-2026/`
- `/article/startup-equity-esop-reality-india/`
- `/article/tech-lead-trap-responsibility-authority/`
- `/article/ux-salary-myth-design-careers-plateau/`
- `/article/what-20-lpa-actually-feels-like-india-purchasing-power/`
- `/article/why-upskilling-stops-working-career-trap/`
- `/article/work-life-balance-myth-high-performers/`
- `/articles/`
- `/career-reality-index/`
- `/category/career-reality-checks/`
- `/category/career-strategy/`
- `/category/money-reality/`
- `/category/software-engineering/`
- `/companies/`
- `/companies/groww/`
- `/companies/postman/`
- `/compass/`
- `/contact/`
- `/escape-plan/`
- `/layoff-radar/`
- `/privacy-policy/`
- `/resignation-risk/`
- `/salary-calculator/`
- `/salary-drop/`
- `/salary-reality/`
- `/sitemap/`
- `/terms/`
- `/topic-clusters/`

Paths in the current local sitemap but absent from the export:

- `/tools/`

## Production market data snapshot

- Captured: 2026-10-08 (date of read-only export); source: Read-only production SELECT; no production writes.
- Query: `docs/PHASE_2_PROVENANCE_ROWS.csv`; the 30-day value is a comparison window in the audit, not an approved freshness policy.

| Dataset | Rows | Missing URL | Missing source type | Missing publication / retrieval dates | Missing transformation / methodology fields | Incomplete | Unverified | Audit-only SUPPRESS | >30 days* | Latest database refresh |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| company_signals | 26 | 26 | 26 | 26 / 26 | 26 / 104 | 26 | 26 | 26 | 26 | 2026-09-05 19:32:23.696346+00 |
| layoff_signals | 6 | 6 | 6 | 6 / 6 | 6 / 24 | 6 | 6 | 6 | 6 | 2026-09-04 19:35:42.267045+00 |
| salary_benchmarks | 360 | 360 | 360 | 360 / 360 | 360 / 1440 | 360 | 360 | 360 | 360 | 2026-09-05 19:32:23.698381+00 |

SUPPRESS is an audit-only classification in the export; it is not stored in or written to production.

*30-day values compare database refresh timestamps only. They are not source retrieval dates and do not define an approved freshness policy.

## Readiness gates

| Status | Gate | Count | Finding |
| --- | --- | ---: | --- |
| BLOCKED | named-authors-and-reviewers | 44 | 0 verified named authors and 0 verified reviewers are recorded. Incomplete records require editorial review; do not invent profiles or bylines. |
| BLOCKED | verified-publication-and-review-dates | 44 | 0/44 publication dates, 0/44 modified dates, and 0/44 verified review+fact-check date pairs are complete. Dates only count when they match a verified editorial record and are not in the future. |
| BLOCKED | claim-to-source-review | 27 | 0/27 claim citations have a reviewer, review date, and VERIFIED status. Remaining citations require human claim-to-source review. |
| BLOCKED | company-score-methodology | 0 | Company scores remain withheld until a versioned methodology and per-signal evidence are approved. |
| BLOCKED | production-market-data-provenance | 392 | The 2026-10-08 (date of read-only export) read-only production snapshot found 392 of 392 rows with incomplete publication provenance. 392 are unverified; 392 are classified SUPPRESS in this audit export only, not stored or written in production. 392 database refresh timestamps are older than 30 days for comparison only; this is not an approved freshness policy. |
| PASS | duplicate-canonical-paths | 0 | No duplicate normalized paths were found in the local sitemap. |
| PASS | sitemap-snapshot-coverage | 2 | The local build has 2 snapshots for 2 sitemap paths. A missing build is not evidence of a production 404. |
| PASS | sitemap-robots-alignment | 0 | No built route listed in the local sitemap has a noindex directive or mismatched canonical. |
| PASS | post-assembly-duplicate-paragraphs | 0 | 0 active public articles were checked after assembly. Repeated exact paragraphs block publication until manually reviewed and corrected. |
| PASS | original-archive-retention | 44 | archive/articles contains 44 valid original JSON exports across 44 slugs; the files must match all 44 quarantined source slugs. Invalid files: 0; missing slugs: 0; extra slugs: 0. |
| BLOCKED | archived-article-duplicate-review | 1179 | 44 quarantined originals were checked separately from public content. Exact repeated paragraphs are counted; near-duplication and legitimate shared boilerplate require a human review and are not inferred by this exact-match gate. |
| BLOCKED | quarantined-article-restoration-review | 44 | Archived originals remain unavailable publicly until evidence, originality, authorship, dates, usefulness, and human-approved route disposition are reviewed. |
| PASS | placeholder-text | 0 | No configured placeholder patterns were found in article text. |
| REVIEW | live-production-crawl | — | Run the published SEO verifier separately; this local audit does not assert current production HTTP, canonical, or robots status. |

## Safe next steps

1. Confirm real author and reviewer identities and document the actual human/AI review workflow.
2. Review source credibility and claim-to-source support; URL syntax alone is not evidence validation.
3. Approve or retire the company scoring methodology before publishing numerical company scores.
4. Review every sitemap/index-export difference against Search Console and keep URLs unchanged until a route-by-route migration decision exists.
5. Run the published SEO verifier against production; do not treat this local report as a live crawl.
6. Do not resubmit to AdSense until the blocked and review gates have an owner and pass criteria.
