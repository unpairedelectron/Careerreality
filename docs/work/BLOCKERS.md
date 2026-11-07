# Blockers and release risks

**Updated:** 2026-10-09  
**Scope:** Local remediation through section 12 of `artifacts/career-reality/MASTER_PROMPT.md`. No deployment was made.

## Release-blocking

1. **Production does not match the local remediation, and the live evidence conflicts.** The earlier baseline recorded three sitemap entries and 44 article URLs as `noindex`. A later captured read-only published-SEO output recorded 69 sitemap entries, 66 outside that run's three-URL local set, and sampled two article routes as `index, follow`. Its gate failed (three local checks and one published check). No local changes were deployed, and the discrepancy is unresolved. Do not claim production quarantine or post-remediation verification.
2. **Article trust evidence is absent.** All 44 archived article records fail the hard duplicate/evidence gate. The supplied export has no verified byline, publication date or update date for any of them. They remain unpublished locally.
3. **Market/company provenance is missing.** All 392 production rows have empty source URLs; 360 salary, 26 company and 6 layoff rows remain unchanged and suppressed. No company formula, score or narrative is approved.
4. **Independent payroll review remains incomplete.** The owner QA record reports internal tax/PF tests, September PF transition tests, the build, and four focused SEO checks as passed, but supporting logs were not attached. No completed independent professional review is documented; do not claim CA approval or certification. This is not a gate for unrelated engineering, testing, or local SEO work. Keep payroll outputs estimate-only and PF manual. The calculator's local indexability is owner-authorized; publication remains separate and unauthorized.
5. **Trust and compliance facts need a human owner.** Legal entity, responsible people, reviewed privacy/retention practices, terms, correction history and a monitored public contact channel are not established. Trust pages accurately state these unknowns and remain noindex.
6. **Current static hosting does not implement the requested 410/301 responses.** The 80 URL decisions are editorial actions. Local static output relies on missing-path 404 behavior; no production status after the local change is verified.

## Verification limits

- Lighthouse was not run. The local Vite build reports a 1.72 MB minified JavaScript entry bundle (466 KB gzip), plus source-map warnings in shared UI files. No Lighthouse score or Core Web Vitals result is claimed.
- Accessibility verification is a focused structural/mobile smoke test, not a complete WCAG/axe audit. One Playwright test passed for 19 public routes at 320 px, checking main heading, named controls, image alt text and horizontal overflow. Local screenshots cover the home, tools hub and CTC page at 1280, 768 and 360 px with JavaScript enabled and disabled; no article page remains eligible to capture.
- Focused Playwright checks passed (9/9), the privacy/analytics spec passed (4/4), the accessibility smoke passed (1/1), and the current CTC calculator spec passed (4/4). A broad 78-test invocation timed out with legacy route failures. It is not a full-suite pass.
- The successful local build, typecheck, calculator tests, content-audit tests, route/report unit tests and company-publication test do not establish production behavior.
- Search Console query/page performance after remediation is unavailable. Web-search results are only directional samples, not rank, volume, device- or location-verified Google SERPs.

## Safe defaults already applied locally

- Keep all 44 articles out of local navigation, sitemap, structured data and article snapshots; preserve originals in `archive/articles/`.
- Keep unsupported company narratives and all source-URL-missing market rows suppressed. Do not alter the production database.
- Keep the estimate-only and manual-PF disclosures on the CTC calculator; its local indexability is owner-authorized. Do not treat missing external review as a blocker for unrelated engineering, testing, or local SEO work.
- Keep legal/editorial trust pages noindex until the missing human facts are confirmed.
- Do not add or enable ads, AdSense scripts or an AdSense submission.
- Do not deploy. A successful local build is not approval to publish.

## 2026-10-10 read-only checks

- Production sitemap recheck: HTTP 200, 48 URLs at 12:29:22.874Z; current local sitemap: two URLs. Earlier captures recorded three and 69. Three representative guide pages were HTTP 200, `index, follow`, self-canonical; robots.txt was HTTP 200 and allowed `/`. No deployment or production mutation occurred. The served-build mismatch and historical discrepancy remain unresolved and release-blocking.
- Search Console exports are still separate top-query and top-page dimensions. The dated export filter files say Web / Last 3 months, but there is no page-filtered query report or connected Search Console source. Query-to-page attribution is unavailable; do not use site-wide phrases as an intent matrix for individual tools.
- Mobile performance diagnosis: cold-cache Vite development preview at 390×844, 4× CPU slowdown, 1.6 Mbps, and 150 ms latency reached DOMContentLoaded in 18.49 s; the same preview without throttling reached it in 673 ms. Its waterfall included development-only module responses of 1,029,003 bytes (`lucide-react.js`) and 902,398 bytes (shared optimized chunk), plus 234,502 bytes of CSS. The repeatable ~18.5-second result is therefore dominated by the unbundled development preview under the imposed throttling, not a production-field measurement.
- The just-built static production preview under the same simulated mobile conditions reached DOMContentLoaded in 1,482 ms, load in 1,484 ms, and observed LCP in 908 ms; the main JS transferred 144,606 bytes (478,545 decoded) and CSS 29,676 bytes. Without throttling, DOMContentLoaded was 127 ms. These are local lab results only, not published-site or field Core Web Vitals.
- The fresh local web build emitted 1,067,992 bytes of JavaScript across its chunks; the main shared chunk is 478,545 bytes raw / 144,310 bytes gzip. These are built-asset sizes, not transfer timings. Do not attribute the 19-second lab result to a specific asset until a throttled browser trace and CPU profile isolate it.
- The published-SEO workflow also failed its live route check: `/gratuity-estimator/` returned `index, follow` where the local release contract expects `noindex, follow`; the aggregate report records two published check failures. This is a direct release blocker, not a reason to change production during this task.
