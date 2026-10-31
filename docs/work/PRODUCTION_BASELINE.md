# Production baseline

**Checked:** 2026-10-09  
**Deployment:** public, active autoscale deployment; successful current build  
**Primary URL returned by deployment metadata:** `https://www.careerreality.in`

This is a fresh, read-only check. Detailed article-level observations are in `production-articles-audit.csv`; hub, category, legacy, and company route observations are in `production-nonarticle-routes.csv`; the raw article export and Appendix A output are in `articles.json` and `dupe_report.csv`.

## Differences from the master prompt's recorded starting state

| Check | Fresh production result |
| --- | --- |
| Article index | `/articles/` links to 44 articles, as expected. Its HTML contains 0 instances of the stated “A concise editorial brief” blurb. The index itself is `noindex, follow`. |
| Article route status and indexability | All 44 fetched article routes return HTTP 200 and `noindex, follow`; every page shows a review-hold banner. The routes remain linked from `/articles/`. |
| Article duplicates | Appendix A flags 30/44 articles for within-page duplicate paragraphs of at least 25 words; 26/44 share at least one such paragraph with another article. The junior-data-scientist article has an 81.8% repeated-word share. A separate exact-paragraph check with no minimum length finds within-page and cross-article duplicates in all 44. |
| Prior duplicate count | The Oct 8 remediation notes say 42/44 articles were affected at the Appendix threshold. The fresh export and same Appendix script return 30/44; the any-length hard-gate check returns 44/44. Use the fresh export as the current baseline and retain the discrepancy. |
| Titles and bylines/dates | 44/44 page titles differ from their H1s. The export and page metadata contain no published date, updated date, or author for 44/44. Do not reuse the older snapshot's July–September dates as current verified metadata. |
| Company information | `/companies/` displays no company records and says 26 rows were omitted. The public API returns zero rows, but its `methodology` field still states an unapproved stability-average and momentum-order formula. All 27 distinct company detail/legacy URLs checked return HTTP 200 with `noindex, follow`; no numeric score appeared in the sampled pages. |
| Other editorial routes | `/articles/`, `/topic-clusters/`, all 5 category archives, and the legacy seven-year-plateau handoff return HTTP 200 with `noindex, follow`. `/search/` also returns 200 with `noindex, follow` and is not currently needed for the remaining public tool set. |
| Market data | Production PostgreSQL contains 360 salary, 26 company, and 6 layoff rows. All 392 have an empty `source_url`; none can be treated as VERIFIED, DERIVED, or ESTIMATED from the currently recorded evidence. |
| Tools | All sampled tools are `noindex, follow`. Server-rendered visible text is 94 words for `/compass/`, 102 for `/salary-reality/`, 98 for `/layoff-radar/`, and 702 for `/salary-calculator/`. The three short pages do not contain the claimed shared “Method and assumptions” paragraph; the calculator is a materially longer server-rendered page. |
| Sitemap | The raw `/sitemap.xml` contains exactly 3 URLs: home, `/tools/`, and `/sitemap/`. Articles and tools other than the hub are not listed. The `/sitemap/` page is HTTP 200, `index, follow`, and self-canonical. |
| Unknown path behavior | An unknown article path returns HTTP 404. The web artifact is served as static files; Replit documentation does not describe per-path 301/410 configuration for this serve mode. |
| Host handling | The active deployment metadata returns the `www` URL. Both `www` and apex answer HTTP 200; page canonicals and sitemap locations use the apex host. The canonical is consistent with the sitemap, but there is no observed `www`-to-apex HTTP redirect. |

## Public API checks

- `GET /api/public/companies`: HTTP 200, zero records, 26 rejected rows; the unapproved formula remains in the response metadata.
- `GET /api/public/companies/infosys`: HTTP 404.
- `GET /api/public/salary-benchmarks`: HTTP 200, zero eligible records; 100 rows are reported omitted in that response because the endpoint's query limit is 100.
- `GET /api/public/layoff-signals`: HTTP 200, zero eligible records; all 6 production rows are rejected.
- No database rows were changed. Source URLs are absent from all three production tables.

## Current decision basis

- All 44 articles fail the no-duplicate hard gate in the live representation. The absence of author/date metadata and claim-level verification independently prevents publication.
- All company rows remain suppressed. Remove the unapproved formula from API metadata and keep company routes out of the public route set.
- Keep the CTC calculator available while rebuilding and verifying it. Unlink and noindex the short data-dependent tools until they pass the Tool Gate.
- For removed static routes, use the static host's 404 behavior rather than leaving review-held 200 pages reachable. This is safer than `noindex` alone, but does not satisfy the prompt's exact 410/301 status preference; record the limitation rather than claim a 410.

## Conflicting sitemap capture and latest read-only recheck

An earlier captured `published-seo` result reported 69 live sitemap URLs, 66 beyond that run's three-URL local set, and sampled two article routes as HTTP 200 with `index, follow`. Its generated release-summary JSON carries a 04:48Z timestamp while the captured workflow-log wrapper is dated 06:28Z; the exact live request time and served build identity were not established. The workflow reported three local build-check failures and one published sitemap-check failure.

The later read-only recheck captured at 2026-10-09 08:14:50.812Z found all 80 URLs in `URL_DECISIONS.csv` returning HTTP 200 with `noindex, follow`, no redirects, and three non-self canonical paths. The sitemap was subsequently fetched from `www`, apex, and the Replit deployment host; all returned the same three URLs and body hash. Route headers reported `Last-Modified` at 04:57:57Z and sitemap headers at 04:57:56Z.

The current host/query probes do not reproduce a host-specific or query-cache variant, but they do not explain why the earlier capture reported 69 URLs or why it sampled `index, follow`. The later 04:57Z `Last-Modified` values are consistent with a different served artifact than the earlier report, but do not prove a deployment or identify its source. No build ID, ETag, or deployment audit record was available to correlate the captures. **The 69-versus-3 discrepancy remains unresolved.** See `PRODUCTION_INDEXATION_RECONCILIATION.md` and `URL_VALIDATION.csv`.

No local remediation in this workspace was deployed. The latest observations are not post-remediation production verification.

The current live sitemap also includes `/sitemap/` as an indexable page, whereas the local built page is noindex and absent from the two-URL local sitemap. This page is not one of the 80 retired-path decisions; its intended indexability requires owner review.

## Read-only recheck — 2026-10-10

At 2026-10-10 12:29:22.874Z, `https://www.careerreality.in/sitemap.xml` returned HTTP 200 (3,651 bytes) and contained **48 `<loc>` URLs**. The URLs use the apex host. They include the home page, tool routes, 17 guide routes, three rules routes, and trust pages; no `/article/` URL appeared. `Last-Modified` was absent. The robots file returned HTTP 200 at 12:29:23.532Z and allowed `/`, disallowing only `/workspace`, `/sign-in`, and `/sign-up`; it names the apex sitemap.

Three representative guide URLs were fetched read-only at 12:29:23Z: the guides hub, `/guides/read-the-offer-beyond-ctc/`, and `/guides/runway-debt-and-big-decisions/` each returned HTTP 200 with `index, follow` and a self-canonical on the apex host. There was no redirect. No sitemap URL was classified as an `/article/` route, so these guide pages are the representative editorial pages checked.

This fresh result does **not** reconcile the prior three-URL capture: production now exposes 48 URLs while the current local sitemap still contains two. It also differs from both the earlier three-URL baseline and the captured 69-URL run. No deployment was performed in this task, and no served build identity was available; the 48-versus-3/69 history remains unresolved. Preserve the release block and do not treat this recheck as approval to publish.
