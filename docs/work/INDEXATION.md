# Indexation and route status

**Updated:** 2026-11-07
**Release state:** local-only; no deployment

## Local build

- The earlier 2026-10-09 local snapshot contained two sitemap URLs (`/` and `/tools/`). On 2026-11-06, the owner authorized local indexability for `/salary-calculator/`; it is now registered as indexable and included in the generated sitemap. Regenerate the sitemap during the next build to verify the current complete route set.
- `/salary-calculator/` is locally indexable and included in the generated sitemap by owner direction on 2026-11-06, while independent professional payroll review remains incomplete. Keep estimate-only and manual-PF disclosures. Other decision-tool routes retain their individual registry settings.
- Editorial, source, privacy, terms, about, contact, corrections and methodology pages are present locally, but remain `noindex, follow` until required human facts and review are supplied.
- The build generated and verified 27 crawler-visible snapshots and 12 app shells. It contains no original article snapshots for the 44 archived article records and no company-detail snapshots.
- Four `/ai/:slug` legacy paths render generic `noindex, follow` handoffs canonicalized to `/ai/`; they contain no original article body and are not in the sitemap.
- Missing local static paths are expected to use the static host's 404 fallback. The 410 values in `URL_DECISIONS.csv` are editorial decisions, not observed HTTP statuses.

## Production evidence and conflict

The initial production baseline recorded three sitemap entries (home, `/tools/`, and a noindex `/sitemap/` page), 44 linked article routes marked noindex, and a 200 response for the sampled pages. The supplied Search Console indexed-URL export contains 74 rows for 61 normalized paths and has a latest recorded crawl date of 2026-09-10; it is not a live index-state or query-performance report.

A later captured read-only published-SEO output on 2026-10-09 reported 69 live sitemap URLs, 66 unexpected relative to that run's three-URL local build. It also sampled `/article/indian-it-layoff-cycle-2026/` and `/article/ai-upskilling-trap-india-api-wrapper-reality/` as HTTP 200, `index, follow`, and reported an article URL in the live sitemap. The check failed overall: three local checks and one published sitemap check failed. The release-summary JSON timestamp and workflow-log wrapper timestamp differ; the exact run time is not relied on.

This later live observation conflicts with the earlier baseline. It cannot be attributed to the current local source because no deployment occurred. The final local build has two sitemap URLs, not the three URLs used by the captured comparison. There is no successful post-remediation production verification.

## Search Console and visibility

The existing indexed-URL export is a dated URL snapshot, not a current index-state guarantee or post-release performance report. No post-remediation query/page export is available. Do not claim that removed routes have deindexed, that submitted URLs are gone, or that any remaining page will rank.

For the next approved release, separately crawl every URL in the published sitemap, check canonical/robots/status on every path decision, and reconcile the result with Search Console. Do not use the failing captured run as a clean release gate.

## Read-only production recheck — 2026-10-10 12:29Z

The current published sitemap returned HTTP 200 and 48 URLs, not the two in the current local build or three in the earlier production baseline. It contains no `/article/` paths and includes `/guides/` routes. Robots.txt returned HTTP 200, allowed `/`, disallowed `/workspace`, `/sign-in`, and `/sign-up`, and referenced the apex sitemap. The guides hub and two representative guide pages returned HTTP 200, `index, follow`, and self-canonicals; no redirects were observed.

This adds a new observation but does not explain the earlier 3-versus-69 discrepancy or identify the artifact being served. No production change was made. Keep release blocked until the served sitemap and local release candidate are reconciled and the remaining route-level checks are complete.
