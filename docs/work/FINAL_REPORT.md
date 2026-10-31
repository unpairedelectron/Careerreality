# CareerReality remediation report

**Date:** 2026-10-09  
**Scope:** Completed local execution of `artifacts/career-reality/MASTER_PROMPT.md` through section 12.  
**Release:** No deployment was made.

## Decision

**AdSense verdict: NO — not ready to apply.** No AdSense scripts, publisher IDs, ad-network markers, ad placements or AdSense submission were added. The product remains a local remediation build, not a production-ready AdSense application.

## What changed locally

- Archived all 44 exported article originals and removed their original content from the local article routes, navigation, sitemap and structured data. The Appendix A audit found 30/44 articles with ≥25-word duplicate paragraphs, 26/44 with cross-article shared paragraphs, and any-length duplicates in all 44. No article passed the hard evidence gate. Public duplicate share after local quarantine is **not applicable** because there are zero published article pages.
- Recorded 80 editorial URL decisions. The requested 410 is a decision, not an observed response: current static output relies on a 404 fallback. No local or production 410/301 is claimed.
- Removed the unapproved company score formula from local public metadata and route data. All 392 salary/company/layoff records remain unchanged and suppressed because every row lacks a source URL.
- Featured only the CTC calculator. Its local implementation uses new-regime tax-year 2026–27 rules, a shared model, boundary tests, worked examples, entered professional tax, manual PF inputs and explicit limitations. Income-tax Act 2025 Sections 202, 19 and 156 and the Finance Bill 2026 memorandum were checked; the PIB release verifies a ₹25,000 EPFO ceiling, but the EPFO contribution-rate reference and statutory wage definition remain unverified. The calculator stays noindex pending qualified review.
- Kept the other decision tools unlinked and noindex. Added factual trust pages that state what remains unknown rather than inventing an owner, author, contact process or privacy practice.
- Generated and verified 27 crawler-visible snapshots and 12 app shells. The snapshot generator emits matching metadata/lead copy once, with a regression check. The local sitemap has two self-canonical indexable URLs: `/` and `/tools/`. Four old AI paths remain as generic noindex handoffs canonicalized to `/ai/`; they do not contain the quarantined article bodies.
- Completed a dated query map, measurement plan, indexation record, claim register, blocker list, human-input list and before/after evidence.
- Saved 18 current-build screenshots under `docs/work/screenshots/`: home, tools hub and CTC calculator at 1280, 768 and 360 px, with JavaScript enabled and disabled.

## Measured before and after

| Measure | Before / production evidence | After / local evidence |
| --- | --- | --- |
| Article duplicate share | 30/44 (68.2%) met the Appendix ≥25-word duplicate threshold; 26/44 shared a qualifying paragraph across articles; any-length duplicate check flagged 44/44. | 0 article pages published locally; duplicate share is n/a, not 0%. All 44 source records remain archived. |
| Sitemap URL count | Initial production baseline: 3 URLs, including a noindex sitemap page. A later captured read-only check reported 69 live URLs, 66 outside its then-local set. | 2 local URLs, both index-follow: home and tools hub. Production after these changes is unverified. |
| CTC server-rendered words | 702 words in the initial production baseline. | 728 local built words (+26); calculator remains noindex. |
| Other tool page words | Compass 94, salary reality 102 and layoff radar 98 in the initial baseline. | Compass 118, salary reality 194, layoff radar 185, resignation risk 191, salary drop 182, escape plan 214 and Career Reality Index 213. All remain noindex. |
| Tools hub words | Not recorded in the production baseline. | 518 local visible words; the duplicate lead was removed. The route remains index-follow. |
| Market/company records | 392 production rows had empty source URLs: 360 salary, 26 company and 6 layoff. | Same 392 records remain unchanged and suppressed locally; no company score is public. |

The assembled-content audit separately counted 1,179 repeated exact-paragraph occurrences across 102 within-article groups and 48 exact blocks shared across articles (maximum six articles per block). The supplied Search Console export has 74 rows for 61 normalized paths; its latest recorded crawl is 2026-09-10 and it is not post-change performance data.

The published sitemap evidence conflicts: the initial baseline says 3 URLs and all 44 article pages noindex; a later captured published-SEO output reported 69 URLs and sampled two article routes as `index, follow`. That later check failed (three local build checks and one live sitemap check). No local remediation was deployed, so **there is no successful post-remediation production verification** and the live change cannot be attributed to this work.

## Verification performed

- Local production build: passed; generated and verified 27 crawler-visible snapshots and 12 app shells.
- Web typecheck: passed.
- CTC tax tests: 14/14 passed.
- Content-audit tests: 2/2 passed; company-publication test: 1/1 passed.
- Indexed-route unit tests: 5/5 passed; published-SEO report unit tests: 31/31 passed.
- Focused Playwright checks: 9/9 passed; the current CTC calculator spec passed 4/4 after source-link changes. Privacy/analytics checks: 4/4 passed. Accessibility smoke: 1/1 passed across 19 public routes at 320 px. These are focused checks, not a complete accessibility certification or full end-to-end pass.
- Content audit report: **NOT READY**. A broad 78-test Playwright invocation timed out with legacy route failures; it is not reported as a pass.
- Ad code scan: no AdSense/ad-network markers in source or public assets. The only bundled scan match was the unrelated `onDoubleClick` identifier.
- The captured published-SEO check was read-only and failed. It was not rerun, and no deployment was attempted. All local changes were committed to the remediation branch; nothing was published.

## Remaining blockers and top rejection risks

1. Production article and sitemap state is unresolved and may still expose indexable article routes.
2. No article has verified author/date metadata and source-backed, human-reviewed claims; all 44 remain quarantined.
3. No source URL exists for any of the 392 market rows; company and market data remain suppressed.
4. No qualified tax/payroll reviewer is assigned. The official PIB release verifies the ₹25,000 EPFO ceiling announcement, but the contribution-rate source, statutory wage definition and basic-pay mapping were not retrieved or confirmed. The CTC calculator remains noindex and manual-PF.
5. The owner/entity, responsible people, monitored contact route, legal/privacy practices and correction history are unverified; trust pages remain noindex.
6. Static-host 404 behavior does not satisfy the requested 410/301 response; production route status after changes is unknown.
7. Lighthouse was not run. The build warns that the minified JavaScript entry is 1.72 MB (466.64 KB gzip). Accessibility checks were structural smoke tests only.
8. Search Console post-change query/page data is absent. The observed web-search samples do not establish rank, volume, localized intent or device-specific SERPs.

The owner must provide the items listed in `docs/work/HUMAN_INPUT_REQUIRED.md` before production publication or indexing. Search visibility is not guaranteed, and no ranking or AdSense approval is promised.
