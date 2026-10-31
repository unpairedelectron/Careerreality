# Production indexation reconciliation

**Latest route crawl captured:** 2026-10-09 08:14:50.812 UTC.  
**Method:** read-only HTTP GETs; no deployment, indexing request, or production change.  
**Route-level detail:** `URL_VALIDATION.csv`.

## Current published observations

| Observation | Result |
|---|---|
| Reviewed URL decisions crawled | 80 of 80 returned HTTP 200. |
| Robots directive on those responses | 80 of 80 returned `noindex, follow`. |
| Redirects | 0 of 80; each final URL matched its requested URL. |
| Canonicals | Present on all 80. Three paths canonicalize elsewhere; see below. |
| Last-Modified | All 80 route responses reported `Fri, 09 Oct 2026 04:57:57 GMT`. |
| Sitemap URLs | 3, identical when fetched from `www.careerreality.in`, `careerreality.in`, and the Replit deployment host. |

The three observed non-self canonical paths are:

| Requested route | Canonical path | Observed HTTP behavior |
|---|---|---|
| `/article/the-7-year-career-plateau-nobody-warns-you-about/` | `/article/engineering-career-ceiling-peak-at-35/` | 200, no redirect, noindex |
| `/companies/groww/` | `/companies/` | 200, no redirect, noindex |
| `/companies/postman/` | `/companies/` | 200, no redirect, noindex |

These canonicals do not establish that the destinations are equivalent or that a redirect is appropriate. The local decisions remain removal decisions; no redirect is inferred.

## Sitemap and robots probes

The `sitemap.xml` body was 274 bytes with SHA-256 `a6349c6f04f68d551cb9c4956855f65d338a28031c371470e45d46d9e0826261`. All three tested hosts returned the same body and the same `Last-Modified: Fri, 09 Oct 2026 04:57:56 GMT`, `Cache-Control: private`, `Via: 1.1 google`, and `Server: Google Frontend` headers. No ETag was present. A query-string cache probe returned the same body and hash.

The three sitemap locations are:

- `https://careerreality.in/`
- `https://careerreality.in/tools/`
- `https://careerreality.in/sitemap/`

The live `/sitemap/` page itself returns HTTP 200 with `index, follow` and canonical `https://careerreality.in/sitemap/` from the apex, `www`, and Replit deployment hosts. The local build instead marks its `/sitemap/` snapshot `noindex, follow` and omits it from the XML sitemap. `/sitemap/` is not one of the 80 retired-path decisions. Whether this page should remain indexable is an additional unresolved owner decision; do not silently classify it as retired or re-add it to the local sitemap.

The sitemap-index and gzip sitemap probes returned 404. The `www` and apex `robots.txt` responses allow general crawling, disallow workspace and sign-in/sign-up paths, and point to the apex sitemap. The Replit deployment host's `robots.txt` disallows general crawling; social preview bots have separate allow rules. These are distinct host policies and are not evidence of a production route-status change.

## Reconciliation of the conflicting sitemap captures

An earlier captured `published-seo` result reported 69 live sitemap URLs, 66 beyond that run's three-URL local set, and sampled two article routes as `index, follow`. Its generated report contains a 04:48Z timestamp while the captured workflow-log wrapper is dated 06:28Z; the exact live request time and served build identity were not established.

The latest recheck returns three sitemap URLs across all tested hosts, and all 80 reviewed routes return `200` with `noindex, follow`. The current host and query probes therefore do not reproduce a host-specific or query-cache variant, but they do not explain the earlier 69-URL result. The current sitemap's 04:57:56Z `Last-Modified` is later than the earlier report timestamp, which is consistent with a different served artifact but does not prove a deployment or identify its source. No build ID, ETag, or deployment audit record was available to correlate the captures. **The 69-versus-3 discrepancy remains unresolved.**

Do not treat the earlier or latest output as proof that this local branch was deployed. No remediation deployment was made during this work.

The route-set audit also queried all 80 `URL_DECISIONS.csv` paths on the apex, `www`, and Replit deployment host. All 240 requests returned HTTP 200; zero returned an accepted 404/410. None of the retired paths was in the live sitemap. The three sitemap pages returned HTTP 200 with primary-host canonicals and explicit `index, follow`. The production sitemap has one extra indexable page (`/sitemap/`) compared with the local two-URL set.

## Local build and status-code boundary

The latest local build contains 23 crawler-visible snapshots and 12 app shells. All 80 reviewed retired routes are absent from generated snapshots, the local sitemap, and generated internal links. The build-time verifier checks these conditions and confirms that the 44 original article JSON files still match the source records exactly.

Those are static-output findings, not HTTP status results. The live routes remain `200 noindex` until a future, separately approved publish is verified. Replit's documented static-deployment configuration describes a custom 404 page, but not per-path 410 responses. If a genuine 410 is required, an origin/request-time handler must explicitly return 410 for the reviewed paths; otherwise a real 404 response must be verified from the serving layer after publishing. A missing local snapshot must not be reported as a 404 or 410, and no 301 should be used without an actually equivalent destination.

## Required post-release checks

Only after the owner separately authorizes a publish:

1. Re-crawl every row in `URL_VALIDATION.csv` on the canonical host and confirm the intended status, redirect chain, robots directive, and canonical.
2. Compare the served sitemap body and host variants with the approved sitemap, record the served build identity if available, and investigate any new divergence.
3. Verify the actual unknown and retired-route HTTP responses at the serving layer. Do not infer response codes from the generated file tree.
4. Confirm the production page does not render quarantined content or internal links and that no ad marker was introduced.
5. Do not request indexing until the human publication gates in `HUMAN_INPUT_REQUIRED.md` are satisfied and a separate decision authorizes it.

