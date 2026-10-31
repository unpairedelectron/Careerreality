# CareerReality remediation release-candidate report

**Date:** 2026-10-09  
**Branch:** `remediation/adsense-low-value-content-2026-10-08`  
**Decision:** **Local remediation verified; not ready for a production release, indexing request, or AdSense reapplication.**

This report closes the requested local remediation and evidence review. It does not authorize or perform a publish. No production database row was changed, no ad was enabled, no AdSense application was submitted, and no indexing request was made.

## What is complete locally

- All 44 article originals remain in `archive/articles/`. The build gate confirms each JSON file has a non-empty body and matches `docs/work/articles.json` by slug, title, description, and exact body.
- The active public article catalogue remains empty. The generated build contains no archived article title/body markers, article snapshots, internal links to the 80 reviewed legacy routes, or retired sitemap entries.
- `URL_DECISIONS.csv` retains 80 reviewed route decisions. `URL_VALIDATION.csv` records the latest production observations beside local snapshot, sitemap, and internal-link checks.
- The generated local sitemap contains `/` and `/tools/`. The build generated 23 crawler-visible snapshots and 12 app shells. The local `/sitemap/` HTML page remains `noindex, follow` and is excluded from XML.
- Salary, company, and layoff records remain suppressed. The 392 production rows are classified BLOCKED/LEGACY for publication; they are not reclassified or modified.
- The CTC calculator retains manual PF inputs and noindex status. The official EPFO FAQ was retrieved on 2026-10-09 (SHA-256 `47c22e56faaf6735bb8bd0b70db502e2f86efd4adb654cc4593ff85be6eb1052`). Its ceiling and examples do not resolve every individual wage-base, membership, or voluntary-contribution case; qualified review is still required.
- Route-level lazy loading is in place. The homepage preview rendered after the change, and the focused 320px accessibility smoke test passed on 19 public routes.
- The generated 2026-10-09 content audit reports **NOT READY** and blocks AdSense reapplication. Its Markdown/JSON report, indexed-URL matrix, migration plan, and read-only production snapshot are in `artifacts/career-reality/reports/`. It records 44 quarantined originals, zero public articles, zero human-verified claim citations, and 392 market rows with incomplete publication provenance.

## Content review findings

The exact-copy audit against the archived original corpus found:

- 30/44 originals contain repeated paragraphs of at least 25 words within the article.
- 26/44 share at least one such block with another article.
- The highest repeated-word share in the archived source report is 82.7% (`networking-reality-india-introverts`). The earlier production-rendered crawl recorded 81.8% as its maximum; the observations are not conflated.
- The repeated long blocks are substantive article copy, not approved boilerplate. Article-by-article publication decisions, source review, authorship, and dates remain human gates.

The new reproducible 5-word-shingle scan produced `NEAR_DUPLICATE_CANDIDATES.csv` with 278 review candidates at Jaccard ≥0.80 and 25+ words, excluding normalized exact matches: 212 cross-article candidates across six article pairs and 66 within-article candidates. No semantic duplicate or legitimate-boilerplate verdict was assigned. An earlier unsaved scan reported 412 candidates (315 cross-article and 97 within-article) at the stated thresholds but could not be reproduced exactly. The method/count discrepancy is recorded rather than hidden.

## Current production state — read only

The latest 80-route production snapshot, captured 2026-10-09 08:14:50.812 UTC, found all 80 reviewed legacy routes still returning HTTP 200 with `noindex, follow`, with zero redirects in that crawl. Three routes have a non-self canonical. A separate cross-host audit queried all 80 paths on apex, `www`, and the Replit deployment host: all 240 requests returned HTTP 200, with zero 404/410 responses.

The production sitemap remains three URLs on all three hosts, versus two in the local build. The extra `/sitemap/` page is HTTP 200, `index, follow`, and canonical to `https://careerreality.in/sitemap/`; locally it is `noindex, follow` and excluded from XML. This route is not in the 80 retired decisions and needs an owner decision. An earlier captured `published-seo` result reported 69 sitemap URLs and sampled article pages as `index, follow`; neither discrepancy has a verified build identity or complete explanation. See `PRODUCTION_INDEXATION_RECONCILIATION.md`.

The final published-SEO run had zero local failures and six live failures: the sampled retired article still returns 200 on the apex, `www`, and Replit deployment host; the retired candidate article and Groww company route still return 200 on the apex; and the live sitemap has three URLs instead of the local two. The cross-host route audit separately found every one of the 80 retired paths returning HTTP 200 on each host. These are production-state findings, not reasons to bypass the release gate.

The local build has no snapshots, sitemap entries, or generated internal links for the 80 reviewed paths. This is static-output evidence only, not proof of a 404 or 410 response. The production routes remain 200/noindex until a separately approved publish is verified. If genuine 410 responses are required, a request-time handler must be configured and tested; do not infer redirects from canonical tags.

## Market data

Read-only production inspection found 360 salary rows, 26 company rows, and 6 layoff rows. All 392 have empty source URLs and empty structured provenance. Salary rows span 18 roles, five cities, and four experience bands, but the industry dimension is absent and the recorded samples cannot be verified. Company and layoff source labels, confidence values, observation timestamps, and database refresh timestamps do not replace row-level evidence.

Current publication tiers are 0 VERIFIED, 0 DERIVED, 0 ESTIMATED, and 392 BLOCKED/LEGACY. `MARKET_DATA_RESTORATION_PLAN.md` defines the evidence and retrieval steps required before any row can be restored.

## Validation evidence

| Check | Result |
|---|---|
| CareerReality TypeScript typecheck | Pass |
| Content-audit tests | 2/2 pass |
| CTC tax tests | 14/14 pass |
| Production build and route verifier | Pass; 23 crawler snapshots and 12 app shells generated |
| Archive integrity and leakage checks | Pass; all 44 originals match the forensic source records exactly |
| Retired route build checks | Pass; 80/80 absent from local snapshots, sitemap, and generated internal links |
| 320px public accessibility smoke test | Pass on 19 routes; one H1, named controls, image alt attributes, no horizontal overflow |
| Local desktop homepage preview | Rendered |
| Local public bundle | Entry chunk 601.62 kB minified / 180.96 kB gzip; Vite still reports the 500 kB chunk warning |
| SEO report and retired-route unit tests | 39/39 pass, run directly; includes route-contract cases and report validation |
| Final `published-seo` workflow | Local checks pass (0 local failures); published gate has 6 unresolved production failures |
| Cross-host retired-route audit | 240/240 responses are HTTP 200; 0/80 routes per host return 404/410; the live sitemap has one extra route (`/sitemap/`) |
| Latest `URL_VALIDATION.csv` | 80/80 primary-host routes are 200/noindex, 0 redirects, 0 local snapshots, 0 local sitemap entries, 0 local internal links; 3 non-self canonicals |

The accessibility smoke test is not a full WCAG/axe audit. The bundle warning is recorded; no performance improvement is claimed without a comparable pre-change build baseline.

## Remaining human and operational gates

1. Resolve the 69-versus-3 sitemap/build-identity discrepancy and decide whether `/sitemap/` should be indexable. Verify the exact production sitemap and all 80 route responses after a separately authorized release.
2. Confirm whether the serving layer must return 410 for the removed route set. Verify actual HTTP responses; static file absence is insufficient.
3. Review the 44 archived article dispositions, duplicate candidates, sources, authorship, dates, and any proposed publication changes.
4. Obtain qualified Indian tax/payroll review of the calculator and its PF input interpretation. Keep PF manual and the calculator noindex until then.
5. Supply verified site-owner, accountability, privacy, contact, and correction-history facts; do not invent names, policies, or response promises.
6. Restore market records only after source, method, licensing, confidence, and row-level disclosure gates are met.
7. Obtain a post-release Search Console baseline for the correct property before considering any indexing action.

The detailed checklist is `HUMAN_INPUT_REQUIRED.md`. Until these gates are satisfied, do not restore archived content, expose market/company claims, request indexing, enable advertisements, submit to AdSense, or treat the site as ready for reapplication.

