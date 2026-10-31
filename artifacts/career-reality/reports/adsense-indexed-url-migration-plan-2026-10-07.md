# Indexed-URL review and migration plan

**Status:** Assessment only. No URL, redirect, robots, sitemap, production-data, or publishing change is authorized by this document.

## Evidence reviewed

- Search Console export: `attached_assets/Table_1789671366775.csv`, captured for this audit.
- Local sitemap: 69 unique normalized paths.
- Search Console export: 74 rows representing 61 unique normalized paths; latest recorded crawl is 2026-09-10.
- The route matrix is `adsense-indexed-url-matrix-2026-10-07.csv`. It joins the sitemap, export, and all 26 company-detail records, then records the local built snapshot, robots directive, and canonical path where available.
- The Search Console export is a dated crawl/index snapshot, not a live URL Inspection result. A row in the export does not establish that a URL is currently indexed or indexable.

## Differences that need individual review

### Export paths outside the local sitemap

The export contains four unique paths not listed in the current local sitemap:

- `/ai/gcc-ai-hiring-bar-system-design-july-2026/`
- `/ai/google-gemini-enterprise-india-gcc-july-2026/`
- `/companies/groww/`
- `/companies/postman/`

Do not add these to the sitemap solely because they appear in the export. Inspect each path's current production response, canonical, robots directive, redirect destination, and Search Console URL Inspection state. The local build may intentionally retain old paths as noindex handoffs; that local behavior does not prove the deployed behavior.

### Sitemap paths absent from the export

The export does not contain these 12 paths:

- `/article/ai-job-market-2026-india-show-your-working/`
- `/article/ai-upskilling-trap-india-api-wrapper-reality/`
- `/article/american-dream-indian-engineers/`
- `/article/career-switch-illusion-changing-jobs-not-career/`
- `/article/culture-fit-trap-hiring-reality/`
- `/article/engineering-career-ceiling-peak-at-35/`
- `/article/humour-in-workplace-culture-2026-joke-is-on-promotion/`
- `/article/remote-work-salary-trap-india/`
- `/article/salary-transparency-india-2026-number-in-room/`
- `/category/engineering/`
- `/editorial/`
- `/tools/`

Absence from this export is not evidence of a removal, deindexing, or crawl failure. Check each URL in Search Console and compare its response, canonical, robots directive, sitemap membership, and useful page content.

### Company-detail records

The local route inventory contains 26 company-detail pages. Source URLs are missing from the corresponding production signal rows, so the local snapshot generator currently withholds numerical scores and marks unsupported company-detail snapshots noindex. This is a local-code observation only; verify production separately. Two of these paths, Groww and Postman, also appear in the Search Console export.

## Route-by-route procedure

Use the CSV as the checklist; do not make a site-wide decision from aggregate counts.

1. For each route, record the current production HTTP status, redirect chain, canonical, robots directive, sitemap membership, and Search Console URL Inspection result.
2. For articles, separately record editorial usefulness, evidence quality, source support, originality, and whether any claim needs correction. Do not infer an author, reviewer, publication date, or review date.
3. Choose one documented action per route: preserve as-is, improve the page while preserving its URL, retain as a deliberate noindex handoff, or propose a redirect/deletion for separate approval.
4. Before any approved change, test the exact old and destination URLs for status, canonical, robots, content relevance, and redirect behavior. Avoid chains, loops, unrelated destinations, and noindex URLs in the sitemap.
5. After a separately approved release, recheck the deployed host and custom domain, then monitor Search Console after recrawl. The development preview and local snapshots are not substitutes for this production check.

## Current recommendation and open decision

- Preserve every existing URL for now. No redirect, deletion, mass noindex, or sitemap change is proposed.
- Keep the 44 article URLs unchanged while their evidence and editorial records are reviewed. Improve them at their current URLs when corrections are supported.
- The local build's route directives and canonical values are included for impact analysis only; they are not a request to change production.
- No decision has been made about whether all 44 articles should remain indexable during manual review or whether individually selected articles should be noindexed until they meet agreed evidence and review gates. Make that decision only after reviewing the route matrix and per-article findings.

## Release boundary

This plan does not authorize publishing, AdSense resubmission, URL migration, changes to production data, or broad indexability changes. AdSense resubmission remains blocked until the readiness gates pass.
