# Search Console evidence for staged URL decisions

**Reviewed:** 2026-10-26  
**Decision status:** Supplemental performance evidence only; final indexability decisions remain open.

## Export scope

The latest usable query and page tables were exported on 2026-10-26. The matching `Filters` table records:

| Scope item | Recorded value |
| --- | --- |
| Search type | Web (text-based) |
| Date filter | Last 28 days |
| Dates represented in the daily Chart | 2026-09-27 through 2026-10-24 |
| Country filter | None recorded |
| Device filter | None recorded |
| Search Console property | Not recorded in the supplied CSVs |

The exported page URLs use both `https://careerreality.in` and `https://www.careerreality.in`. The files do not establish whether the selected property was a Domain property or which URL-prefix property was selected. Keep the host variants separate; the evidence CSV does not merge their metrics.

Source tables: `attached_assets/2_Filters_1793031006275.csv`, `attached_assets/4_Chart_1793031006276.csv`, `attached_assets/5_Pages_1793031006277.csv`, `attached_assets/6_Queries_1793031006278.csv`, and `attached_assets/0_Countries_1793031006274.csv`. A second download batch contains byte-identical tables and is not counted as additional evidence.

## Observed evidence

| Table | Rows | Clicks | Impressions | Interpretation |
| --- | ---: | ---: | ---: | --- |
| Daily Chart | 28 days | 11 | 1,736 | The property-level total for the recorded 28-day scope. |
| Pages | 70 | 11 | 1,796 | Visible page-row sum only; it exceeds the Chart by 60 impressions, so it is not a property denominator. |
| Queries | 81 | 1 | 633 | Visible query-row sum only; anonymized and other omitted queries are not included. |
| Countries — India | Aggregate row | 11 | 1,498 | Country aggregate for the period, not a country filter on Pages or Queries. |

The query export includes site-wide rows such as “20 lpa means” (212 impressions), “gigtest” (98), and “is 20 lpa good salary in india” (50). These cannot be assigned to a particular URL because the query and page tables are separate dimensions and the export contains no page filter.

## Mapping to the October 8 route matrix

`artifacts/career-reality/reports/adsense-indexed-url-search-console-evidence-2026-10-26.csv` is a route-keyed companion to `adsense-indexed-url-matrix-2026-10-08.csv` and its JSON version. It records each matrix path, staged local robots/canonical state, the prior crawl-snapshot fields, and each matching exported page URL with its clicks, impressions, CTR, and average position. It preserves host variants as separate rows.

- 50 of the 87 matrix paths have at least one matching row in the visible 28-day Pages export (61 page rows, with some host variants).
- 37 matrix paths have no row in that visible export. “Not exported” is not zero performance, a deindexing result, or a reason to remove a URL.
- A matching Page row is evidence of reported search performance for that exported URL variant. It supports keeping the URL available for individual review; it does not establish the current production response, canonical, robots directive, sitemap state, or current indexability.
- No route disposition is changed by this evidence. Keep the matrix’s provisional “keep URL unchanged; review individually” action. Decide indexability only after the remaining route, editorial, and human-approval checks.

The earlier Last 3 months exports cover 2026-06-26 through 2026-09-25 and record Search type `Web`; the Last 28 days export uses `Web (text-based)` and a different window. These periods and search-type labels do not match, so they are not compared as a trend. The Last 16 months exports are also a separate, unfiltered window. No country-filtered query or page export, page-filtered query export, named-property metadata, or current URL Inspection/coverage result is available here. The route matrix’s earlier crawl dates remain a dated snapshot, not current URL Inspection evidence.

## Decision boundary

Keep all route-level indexability decisions open where their required evidence or approvals are missing. Do not infer query-to-page intent, India-specific page/query performance, or current index status from these exports. No production change, deployment, publication, ad enablement, or indexing request was made.
