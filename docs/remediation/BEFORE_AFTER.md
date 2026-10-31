# Before/after evidence

## Baseline — read-only production crawl, 2026-10-08

| Measure | Before |
| --- | ---: |
| Sitemap URLs | 69 |
| URLs crawled after following internal links | 95 |
| HTTP 200 responses | 95/95 |
| Fetch/render failures | 0 |
| Canonicals present | 95/95 |
| Self-referential canonicals | 94/95 |
| Noindex routes | 26 |
| Average server-rendered words | 2,592 |
| Average rendered words | 2,948 |
| Tool-page server-rendered words | 131–193 |
| Live articles exported | 44 |
| Live article word count | 235,598 |
| Production market records | 392: 360 salary, 26 company, 6 layoff |
| Rows with a source label | 392/392 |
| Rows with a source URL | 0/392 |

Live and local-source duplicate audits are stored separately. The live article export recorded 74 within-article and 51 cross-article duplicate groups (at the audit threshold); the repository-source audit recorded 1,179 repeated occurrences in 102 within-article groups and 48 cross-article groups. These numbers use different inputs and must not be combined.

## After — staging branch, 2026-10-08

| Measure | After |
| --- | ---: |
| Production build and route-snapshot verification | Pass; 103 crawler-visible route snapshots generated and all snapshot checks passed; 12 app shells generated |
| Staging sitemap URLs | 10 |
| Baseline crawl URLs with a recorded disposition | 95/95 |
| Staging noindex snapshots among those URLs | 85/95 |
| Staging sitemap/noindex alignment gate | Pass; no noindex route appears in the sitemap |
| Article routes retained with HTTP 200 + noindex | 44/44 |
| Article word count in current assembled source | 3,342 minimum / 4,307 median / 8,263 maximum |
| Repeated exact paragraphs in assembled articles | 1,179 occurrences; strict gate blocked |
| Article named authors / verified reviewers / verified publication dates | 0 / 0 / 0 of 44 |
| Claim sources human-verified | 0 of 26 |
| Production market rows with source URLs | 0 of 392; all remain unverified/legacy |
| Public market API evidence gate | Salary/layoff records require a valid source URL and complete reviewed provenance; company signals also require an approved methodology version |
| Content-audit unit tests | 2 passed, 0 failed |
| Shared CTC model tests | 13 passed, 0 failed, including Section 202 surcharge-cap and one-rupee threshold cases |
| Focused browser checks | 9 passed, 0 failed: homepage handoff, shared example output, invalid/shortfall states, calculator-local state, and privacy |
| CareerReality app typecheck | Pass |
| Independent CTC tax review | Not obtained; no reviewer or signed review outcome was provided in this task context. Estimate-only wording and approval hold remain in place. |
| Rendered preview review | Homepage and calculator reviewed at desktop and mobile sizes; no browser runtime errors (development Clerk-key warning only) |
| Initial broad browser sweep | 14/30 passed before in-scope assertion fixes; failures also included unrelated Compass/company flows and a Career Reality Index visual snapshot. Only the focused in-scope subset was rerun after corrections. |
| Strict content audit | NOT READY; expected fail while editorial/evidence gates remain open |
| Published SEO verifier | Blocked: 3 local build checks and 1 published check fail. The live sitemap has 69 URLs versus 9 in the local canonical route set (0 missing, 60 unexpected); known-good comparison shows no route-observation changes. Do not deploy. |
| Ads / production writes / deployment | No AdSense code added; no production writes; no deployment |

The live-site crawl figures above are baseline-only. The published SEO verifier's production check was not used to change production. JavaScript-off, browser-network ad absence, and final human review remain open gates.

## Search Console evidence update — 2026-10-26

Reviewed the supplied Web (text-based), Last 28 days exports for 2026-09-27–2026-10-24. The property name and country/device filters are not recorded; page rows contain both apex and `www` hosts. The Chart reports 11 clicks / 1,736 impressions; the visible Page rows sum to 11 / 1,796, and the visible Query rows to 1 / 633. These dimension totals are not interchangeable. A separate Countries table reports India as 11 clicks / 1,498 impressions, but does not make the Queries or Pages tables country-specific.

The route-keyed evidence supplement maps 61 page rows to 50 of 87 paths in the October 8 URL matrix; 37 paths have no row in the visible export and are not treated as zero. Page performance supports preserving the URL for individual review but cannot settle indexability. No route disposition changed; final URL decisions remain open. Details and limitations: [Search Console indexability evidence](SEARCH_CONSOLE_INDEXABILITY_EVIDENCE_2026-10-26.md) and `artifacts/career-reality/reports/adsense-indexed-url-search-console-evidence-2026-10-26.csv`.
