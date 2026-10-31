# CareerReality content quality and AdSense readiness audit

- Generated: 2026-10-07T16:56:48.817Z
- Readiness: **NOT READY**
- Reapplication: **Not allowed by this gate**
- Scope: Local source, supplied indexed-URL export, and read-only production aggregate snapshot; this command does not crawl production or write production data.

## Inventory

| Measure | Result |
| --- | ---: |
| Articles | 44 |
| Categories | 5 |
| Static company records | 26 |
| Public tools | 6 |
| Verified individual authors | 0 |
| Verified editorial reviewers | 0 |
| Articles with verified publication dates | 0 |
| Articles with verified modified dates | 0 |
| Article word count (min / median / max) | 1041 / 1650 / 4080 |

## Content and evidence

- Raw exact paragraph duplicates inside articles: 1179 repeated occurrences across 102 groups.
- Most copies of one paragraph inside an article: 18.
- Exact blocks shared across articles: 48; maximum distinct articles sharing one block: 6.
- Exact repeated paragraphs after content assembly: 0.
- Citation records: 89 total (26 marked claim sources; 63 context sources).
- Citation URL syntax failures: 0; section mapping gaps: 0.
- URL syntax and section labels do not establish source credibility or prove that a cited source supports a claim.

## Indexed URL export comparison

- File: attached_assets/Table_1789671366775.csv
- Export rows: 74; unique normalized paths: 61.
- Route-by-route matrix: `artifacts/career-reality/reports/adsense-indexed-url-matrix-2026-10-07.csv` (98 unique sitemap, Search Console, and company-detail paths; 0 export rows with invalid URLs).
- Current local build snapshots: 98 total, including 69 of 69 sitemap paths; local noindex routes in the inventory: 29; export-listed local noindex paths: 4.
- Latest Last crawled date in export: 2026-09-10.
- Search Console export is a dated snapshot, not a live index-status check. Compare each difference before changing URLs.

Local build routes with a noindex directive:

- `/ai/gcc-ai-hiring-bar-system-design-july-2026/`
- `/ai/google-gemini-enterprise-india-gcc-july-2026/`
- `/companies/amazon-india/`
- `/companies/ather-energy/`
- `/companies/cred/`
- `/companies/flipkart/`
- `/companies/freshworks/`
- `/companies/google-india/`
- `/companies/groww/`
- `/companies/hcltech/`
- `/companies/infosys/`
- `/companies/ltimindtree/`
- `/companies/meesho/`
- `/companies/microsoft-india/`
- `/companies/mphasis/`
- `/companies/ola-electric/`
- `/companies/paytm/`
- `/companies/persistent-systems/`
- `/companies/phonepe/`
- `/companies/policybazaar/`
- `/companies/postman/`
- `/companies/razorpay/`
- `/companies/reliance-jio/`
- `/companies/swiggy/`
- `/companies/tata-consultancy-services/`
- `/companies/tech-mahindra/`
- `/companies/wipro/`
- `/companies/zoho/`
- `/companies/zomato/`

Export-listed paths that are noindex in the local build (this does not establish their current production state):

- `/ai/gcc-ai-hiring-bar-system-design-july-2026/`
- `/ai/google-gemini-enterprise-india-gcc-july-2026/`
- `/companies/groww/`
- `/companies/postman/`

Paths in the export but outside the current local sitemap:

- `/ai/gcc-ai-hiring-bar-system-design-july-2026/`
- `/ai/google-gemini-enterprise-india-gcc-july-2026/`
- `/companies/groww/`
- `/companies/postman/`

Paths in the current local sitemap but absent from the export:

- `/article/ai-job-market-2026-india-show-your-working/`
- `/article/ai-upskilling-trap-india-api-wrapper-reality/`
- `/article/american-dream-indian-engineers/`
- `/article/career-switch-illusion-changing-jobs-not-career/`
- `/article/culture-fit-trap-hiring-reality/`
- `/article/engineering-career-ceiling-peak-at-35/`
- `/article/humour-in-workplace-culture-2026-joke-is-on-promotion/`
- `/article/remote-work-salary-trap-india/`
- `/article/salary-transparency-india-2026-number-in-room/`
- `/category/engineering/`
- `/editorial/`
- `/tools/`

## Production market data snapshot

- Captured: 2026-10-07; source: Replit production PostgreSQL read-only replica; aggregate SELECT only.
- Query: `adsense-production-data-snapshot-2026-10-07.sql`; the 30-day value is a comparison window in the audit, not an approved freshness policy.

| Dataset | Rows | Missing source URL | Malformed URL | Older than 30 days | Latest refresh |
| --- | ---: | ---: | ---: | ---: | --- |
| company_signals | 26 | 26 | 0 | 26 | 2026-09-05T19:32:23.696346Z |
| layoff_signals | 6 | 6 | 0 | 6 | 2026-09-04T19:35:42.267045Z |
| salary_benchmarks | 360 | 360 | 0 | 360 | 2026-09-05T19:32:23.698381Z |

## Readiness gates

| Status | Gate | Count | Finding |
| --- | --- | ---: | --- |
| BLOCKED | named-authors-and-reviewers | 0 | No verified individual author or reviewer identities are recorded; do not invent profiles or bylines. |
| BLOCKED | verified-publication-and-review-dates | 44 | Publication and review dates are absent for every article until tied to editorial records. |
| REVIEW | claim-to-source-review | 26 | Claim-source URLs and section mapping are present, but source credibility and claim support require human review. |
| BLOCKED | company-score-methodology | 26 | Company scores remain withheld until a versioned methodology and per-signal evidence are approved. |
| BLOCKED | production-market-data-provenance | 392 | The 2026-10-07 read-only production snapshot found missing source URLs in 392 rows; 392 rows were older than 30 days. |
| PASS | duplicate-canonical-paths | 0 | No duplicate normalized paths were found in the local sitemap. |
| PASS | sitemap-snapshot-coverage | 69 | The local build has 69 snapshots for 69 sitemap paths. A missing build is not evidence of a production 404. |
| PASS | sitemap-robots-alignment | 0 | No built route listed in the local sitemap has a noindex directive or mismatched canonical. |
| PASS | post-assembly-duplicate-paragraphs | 0 | Repeated exact paragraphs are removed within each article at content assembly; semantic similarity still needs editorial review. |
| PASS | placeholder-text | 0 | No configured placeholder patterns were found in article text. |
| REVIEW | live-production-crawl | — | Run the published SEO verifier separately; this local audit does not assert current production HTTP, canonical, or robots status. |

## Safe next steps

1. Confirm real author and reviewer identities and document the actual human/AI review workflow.
2. Review source credibility and claim-to-source support; URL syntax alone is not evidence validation.
3. Approve or retire the company scoring methodology before publishing numerical company scores.
4. Review every sitemap/index-export difference against Search Console and keep URLs unchanged until a route-by-route migration decision exists.
5. Run the published SEO verifier against production; do not treat this local report as a live crawl.
6. Do not resubmit to AdSense until the blocked and review gates have an owner and pass criteria.
