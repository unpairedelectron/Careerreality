# Before / after evidence

**As of:** 2026-10-09  
**Important:** “After” means the verified local build only. No deployment was made.

## Content and route changes

| Area | Production snapshot before local remediation | Local build after remediation |
| --- | --- | --- |
| Articles | Prior production crawls returned 44 article URLs as 200/noindex; an earlier captured workflow sampled two as index/follow. The 2026-10-09 08:14Z recheck found all 80 reviewed URLs, including the article paths, still 200/noindex. | All 44 originals retained in `archive/articles/` and exactly matched by slug/title/description/body to `docs/work/articles.json`. No original article body is rendered in local article routes, internal discovery, sitemap or structured data. |
| URL decisions | 80 legacy article/editorial/company/category URLs were reviewed. Latest live read: all 80 return 200/noindex, with no redirects; three canonicals point elsewhere. | All 80 intended removal decisions are recorded. The build contains no matching route snapshot, sitemap entry or internal link. This is not an HTTP 404/410 result; no deployment was made. |
| Company data | The read-only production baseline showed 26 company rows suppressed, but API metadata still exposed an unapproved scoring-method description. | Unapproved scoring formula/narrative removed from local public surfaces; 26 company and all other market rows remain suppressed. Production API changes are not verified. |
| Market records | 360 salary, 26 company and 6 layoff rows (392 total); all have empty source URLs and empty structured provenance. | Same 392 records retained and classified BLOCKED/LEGACY for publication: 0 VERIFIED, 0 DERIVED, 0 ESTIMATED. No production database changes. |
| Sitemap-listed routes | Earlier captures disagree: a three-URL sitemap and a later 69-URL result. Latest live sitemap has 3 entries across all tested hosts; `/sitemap/` is index-follow and self-canonical. | Local sitemap has 2 entries: `/` and `/tools/`, both self-canonical and index-follow. The local `/sitemap/` snapshot is noindex and excluded from XML, unlike production. `/sitemap/` is not in the 80 retired decisions; the 69-versus-3 and sitemap-page policy discrepancies remain unresolved. |
| Featured CTC page | 702 server-rendered visible words; older calculator made unsupported PF assumptions. | 728 server-rendered visible words (+26); uses manually entered PF amounts, new-regime-only tax logic, a shared calculation model and explicit source/limit language. It remains noindex. |

## Local server-rendered word counts

Counts were measured from the final build's HTML after removing scripts/styles and tags. These counts are not a quality score and do not imply indexability.

| Route | Baseline words | Final local words | Final local robots |
| --- | ---: | ---: | --- |
| `/salary-calculator/` | 702 | 728 | noindex, follow |
| `/compass/` | 94 | 118 | noindex, follow |
| `/salary-reality/` | 102 | 194 | noindex, follow |
| `/layoff-radar/` | 98 | 185 | noindex, follow |
| `/resignation-risk/` | Not recorded | 191 | noindex, follow |
| `/salary-drop/` | Not recorded | 182 | noindex, follow |
| `/escape-plan/` | Not recorded | 214 | noindex, follow |
| `/career-reality-index/` | Not recorded | 213 | noindex, follow |
| `/tools/` | Not recorded | 518 | index, follow |

The first four baseline counts come from the fresh production baseline. Final local counts come from the built snapshots after removing scripts, styles and tags and splitting visible text on whitespace. Matching excerpt/lead pairs now appear once; other routes were not present in the production baseline table.

The separate assembled-content audit counted 1,179 repeated exact-paragraph occurrences across 102 within-article groups; 48 exact blocks were shared across articles, with a maximum of six distinct articles sharing one block. The original-source Appendix audit found 30/44 with within-article repeats at the ≥25-word threshold and 26/44 sharing such blocks across articles; the highest repeated-word share in that archived corpus was 82.7%. These describe the quarantined source corpus, not local public pages. The earlier production-rendered crawl recorded 81.8% as its maximum; the two observations are kept separate.

A review-only 5-word-shingle scan at Jaccard ≥0.80 and 25+ words now produces `NEAR_DUPLICATE_CANDIDATES.csv`: 278 paragraph pairs (212 cross-article across six article pairs, 66 within-article), with exact normalized matches excluded. An earlier unsaved scan reported 412 candidates (315 cross-article, 97 within-article) but could not be reproduced exactly. Neither count is a semantic duplicate finding. No near-candidate has been classified as legitimate shared boilerplate or as a duplicate; human review is still required.

## Visual and interaction review

- Saved local static-build captures at `docs/work/screenshots/`: home, tools hub and CTC calculator at 1280, 768 and 360 px with JavaScript enabled and disabled. All articles remain quarantined, so there is no article page to capture.
- The homepage keeps the offer question as its first useful action. At mobile width, the supporting offer card stacks below the text.
- The CTC page places offer inputs and cash readout side by side on desktop and stacks inputs on mobile. Assumptions, source notes and limits remain in the page content.
- The no-JavaScript pass found identical metadata-description and lead paragraphs on home and `/tools/`. The snapshot generator now emits the lead once, and the route verifier fails if a snapshot repeats identical excerpt and lead copy.
- A focused accessibility smoke test passed for 19 public routes at 320 px after the latest route-loading change: one main heading, named controls, image alt attributes and no horizontal overflow. This is not a full WCAG/axe audit.
- The local homepage preview rendered at desktop size after the change. The latest build produced 23 crawler-visible snapshots and 12 app shells; the 80 reviewed retired paths are absent from snapshots, sitemap and generated internal links.
- Route pages are lazy-loaded into separate chunks, but the shared entry chunk remains 601.62 kB minified (180.96 kB gzip) and triggers Vite's 500 kB warning. This is recorded as a performance follow-up; no bundle-size improvement is claimed without a comparable baseline.
- No AdSense script, publisher ID or ad-network marker was found in source/public assets. The compiled JavaScript scan's only match was React's `onDoubleClick` event identifier.

## Skeptical-reader review

- A user could mistake the CTC example outputs for payroll advice. The page labels them as illustrations, exposes the inputs and warns that results are not payslips or filing figures; independent qualified review remains required.
- A user cannot verify the site's owner or contact a named accountable person from the supplied records. Trust pages do not invent one and remain noindex.
- An indexed article/company URL may still exist in production despite the local removals. The later read-only production observation makes this a release blocker, not a cosmetic SEO discrepancy.
- A numeric company/data claim would be misleading without row-level provenance. All 392 rows and score narratives remain withheld.
- The latest production crawl still returned all 80 reviewed legacy URLs as HTTP 200/noindex. The local static build has no route snapshots, but no serving-layer 404/410 response was tested.
- No deployment, database write, AdSense submission, ad enablement, or indexing request occurred.
