# Search measurement plan

## Baseline and attribution

- No reliable post-remediation Search Console query/page baseline is available.
- The attached indexed-URL export has 74 rows for 61 normalized paths; its latest recorded crawl is 2026-09-10. It records URL/crawl metadata, not a current coverage guarantee or post-release performance window.
- A captured read-only published-SEO check failed and disagrees with the initial baseline. See `docs/work/INDEXATION.md`; do not use it as proof of a successful local release.
- Local implementation, production delivery, and search outcomes are separate states:
  1. **Implemented locally:** yes; final local sitemap has two URLs.
  2. **Delivered and verified on production:** no.
  3. **Search outcome observed after delivery:** no.

## Collection after a separately approved release

1. Save a Search Console page/query export for the correct property covering the 28 days before release and the first 28 days after release; then repeat at 56 and 84 days. Record property, date range, country and device filters.
2. For `/`, `/guides/read-the-offer-beyond-ctc/`, `/salary-calculator/`, and `/tools/`, report clicks, impressions, CTR and average position by page and query. Keep brand and non-brand groups separate.
3. Verify each route’s current production indexability before interpreting its Search Console data. The ₹20L article remains a draft/noindex review hold in local code; do not remove that hold without editorial approval. The CTC calculator has a separate route policy and must not inherit the article’s hold.
4. For every removed URL class, compare the full published sitemap and a route-status/canonical/robots crawl. Check Search Console indexing separately; a local 404 or absent sitemap entry does not establish deindexing.
5. Keep an issue log for changes in page content, title, canonical, robots and sitemap so time-window comparisons are interpretable.

## Reporting limits

- Do not promise ranking, traffic or AdSense approval.
- The 2026-10-09 web-search samples in `QUERY_MAP.md` do not provide rank positions, search volume, device-specific SERPs or a verified India location.
- Do not fabricate click/impression/CTR/position figures. A missing export is a blocker, not zero traffic.
- A valid CTC estimate after the user edits inputs records the existing `decision_tool_completed` event with only fixed `tool_id` and `platform` fields. It records once per page view; entered amounts are not sent. This measures qualified calculator completions, not ad attribution.
- This is the first CTC-specific completion signal; it cannot reconstruct pre-release completions. Start its baseline after publication and keep the event window aligned with Search Console's date range.
- India-filtered Search Console clicks and CTR must be compared with calculator completion counts over matched date windows. Until the India-filtered page × query data is available, report that comparison as unavailable rather than infer it from country aggregates or global query rows.

## Latest matched-data check (2026-10-26)

- The newly uploaded Search Console bundle is dated 2026-10-26 and covers 2026-09-27 through 2026-10-24. Its Filters file records `Web (text-based)` and `Last 28 days`, but no country or device filter. The chart is global (11 clicks, 1,736 impressions); the separate Countries row reports India at 11 clicks, 1,498 impressions, 0.73% CTR, position 8.29. That country aggregate does not filter the Page or Query tables. No connected Search Console integration is available in this workspace.
- The bundle's global Pages table has a visible row for `/salary-calculator/` at 1 click / 13 impressions / 7.69% CTR / position 10.77 and a `www` variant at 0 / 20 / 0% / 8.05. The legacy `/article/what-20-lpa-actually-feels-like-india-purchasing-power/` row is 1 / 878 / 0.11% / 8.42. The current CTC guide is absent from the visible Page rows; absence is not a zero result. The global Queries table includes “20 lpa means” at 0 / 212 and “is 20 lpa good salary in india” at 0 / 50; query rows are not linked to specific Page rows.
- Replit project analytics was queried for `decision_tool_completed` events for `tool_id=ctc-calculator`. No such events were recorded in the 2026-09-26 through 2026-10-26 UTC window, and none appeared in the all-time event query. The guide and calculator paths together have 11 recorded pageviews from 2026-09-05 20:14 UTC through 2026-10-06 14:16 UTC. Event absence is not proof of zero completions; analytics coverage and whether the instrumented release was published remain relevant.
- The release date was not provided, and there is no India-filtered Search Console Page or Query export or observed CTC completion-event baseline. No post-release India click/CTR-to-completion comparison can be reported. Request Page and Query exports with Country set to India in the Filters metadata, plus the instrumented release date; compare only after qualified completion events are observable. Keep global rows and the India property aggregate separate.

## Speed, field vitals, and return visits (2026-10-26)

### Published-route Lighthouse baseline

Single Lighthouse 12.8.2 runs were captured against the public canonical host on 26 October 2026, 18:01–18:03 UTC. These are **mobile lab results** using Lighthouse's simulated throttling, not field Core Web Vitals. Scores and timings can vary between runs.

| Route | Performance | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 75 | 2.7 s | 5.2 s | 120 ms | 0.000 | 3.6 s |
| `/tools/` | 69 | 4.5 s | 5.3 s | 80 ms | 0.000 | 4.5 s |
| `/offer-comparison/` | 62 | 4.6 s | 6.8 s | 170 ms | 0.000 | 5.3 s |
| `/salary-calculator/` | 60 | 4.7 s | 7.0 s | 190 ms | 0.000 | 5.4 s |
| `/guides/read-the-offer-beyond-ctc/` | 64 | 4.7 s | 6.9 s | 60 ms | 0.0003 | 5.4 s |
| `/rules/` | 73 | 2.7 s | 5.4 s | 180 ms | 0.000 | 3.1 s |

PageSpeed Insights returned HTTP 429 because its daily query quota was exhausted. No PSI score or PSI CrUX value is inferred from that failure. The Lighthouse results above are the fallback lab baseline.

### Field Core Web Vitals availability

- No Search Console Core Web Vitals export was supplied, and no connected Search Console integration is available in this workspace. The supplied 26 October Search Console bundle contains search-performance tables, not field-vitals data; current GSC CWV status is therefore **unverified**, not zero or passing.
- The privacy-safe Replit analytics query for performance events (`event_type = 5`) returned no samples for these six routes in the 90 days through 26 October. No field LCP, INP, or CLS baseline can be reported from that source either.

### Published-route field check (2026-10-28)

The public PageSpeed Insights API was queried for each route below on 28 October 2026. Every request returned HTTP 429 (`Queries per day` quota exceeded), so it returned no CrUX field record. The latest supplied Search Console export covers 27 September–24 October 2026 and contains search-performance tables only; no Search Console Core Web Vitals export or connected Search Console property is available. Replit analytics' performance-event query through 26 October also had no samples for the target routes; it is not a substitute for CrUX field vitals.

CrUX uses a rolling 28-day aggregation and reports LCP, INP and CLS percentiles (PSI displays the 75th percentile). For this check, no usable date window, device group, sample sufficiency result, percentile, or field status was returned. The missing record does **not** establish that traffic was below the CrUX threshold: this check cannot distinguish insufficient field volume from the PSI quota failure and unavailable Search Console report. Do not infer zero, passing, or failing values. The mobile Lighthouse results above remain lab data only.

| Canonical route | Field source checked | Date range | Device scope | LCP / INP / CLS p75 |
|---|---|---|---|---|
| `/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |
| `/layoffs/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |
| `/offer-comparison/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |
| `/tax-regime-comparison/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |
| `/gratuity-estimator/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |
| `/final-pay-estimator/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |
| `/layoff-runway/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |
| `/home-loan-stress-test/` | PSI API; HTTP 429, no CrUX record | Not returned; queried 2026-10-28 | Mobile requested; no record returned | Unavailable |

### Completion and return-visit baseline

Replit analytics was queried read-only for the 90 days through 26 October. Analytics coverage in the recorded data begins 5 September. `session_id` is an approximate visitor identifier that rotates monthly, so repeat visits are reported within each calendar month and are not cross-month person-level retention.

| Month | Monthly visitors | Visits | Visitors with 2+ visits that month | Within-month return rate |
|---|---:|---:|---:|---:|
| September 2026 (coverage starts 5 Sep) | 405 | 438 | 15 | 3.7% |
| October 2026 (through 26 Oct UTC) | 142 | 146 | 2 | 1.4% |

- The privacy-safe `decision_tool_completed` event had **0 observed events** in the 90-day window. The current source wrapper emits only an allowlisted `tool_id` and the fixed `platform` value; salary amounts, offer terms, and form values are not passed. See `artifacts/career-reality/src/lib/analytics.ts`.
- The historical `calculator_completed` event had 14 occurrences across 8 sessions from 5 September through 6 October. Its stored property keys include `role_category`, `city`, and `confidence_band`; it is excluded from the privacy-safe completion baseline, and no property values were inspected or reproduced here.
- The current published JavaScript bundle contains neither `calculator_completed` nor `decision_tool_completed`. Thus, the safe event is present in local source but has not been observed in the published analytics baseline. Do not treat 0 events as 0 completed tools; collect a new baseline only after the instrumented source is published and events are observed.
- Route pageviews in the same period were: `/salary-calculator/` 17, `/tools/` 2, `/offer-comparison/` 1, the selected guide 2, and `/rules/` 0. These are collected pageviews, not completion counts or evidence of full analytics coverage.
