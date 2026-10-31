# Search and experience release checklist

Use this after an approved publish. Local build results and production delivery are separate checks; do not interpret missing Search Console rows as zero traffic.

## Before publishing

- Run `pnpm --filter @workspace/career-reality run build`.
- Confirm the generated XML sitemap contains only registered indexable routes and `robots.txt` points to that sitemap.
- Run `pnpm --filter @workspace/career-reality run verify:published-seo` only when the live-site comparison is expected to match the current local route set.
- Review the generated snapshots for canonical, robots, Open Graph, Organization, BreadcrumbList, Article and FAQPage data. Structured data must match visible page copy.
- Capture mobile Lighthouse results for `/`, `/tools/`, `/salary-calculator/`, `/offer-comparison/`, `/layoff-runway/`, and one guide. Treat these as lab observations, not field Core Web Vitals.

## After publishing

- In Search Console, inspect the correct Domain property, sitemap processing, Page indexing, manual actions, security issues, and the URL Inspection result for each changed route.
- Export page and query tables for matched 28-day windows before and after release. Record property, date range, country and device filters. Keep India-filtered pages and queries separate from global and country-aggregate reports.
- Check current canonical selection, HTTP status, robots directive, sitemap membership, and internal links for changed URLs. A local route or absent sitemap row does not prove Google has removed or indexed a URL.
- Review field Core Web Vitals separately from Lighthouse. Record LCP, INP and CLS availability and status; use “unverified” when no field report exists. The 28 October 2026 route check is recorded in `docs/seo/MEASUREMENT.md`; PSI requests were quota-limited and no field percentiles were available.
- Annotate title, description, content, canonical, robots, sitemap, and performance changes so later comparisons remain interpretable.

## Privacy-safe interaction events

| Interaction | Event | Properties |
| --- | --- | --- |
| Valid decision-tool result | `decision_tool_completed` | Fixed tool ID and platform only |
| Result share action | `decision_result_shared` | Fixed tool ID and share method only |
| Alert request accepted for confirmation | `layoff_alert_signup_requested` | Page path only; never email, city, sector, or message content |

Replit injects the analytics tracker only after it is enabled in Publishing settings and the app is published. Development previews are not an analytics test. Do not add a tracker script or send calculator inputs, email addresses, optional preferences, or free-form text to analytics.

## Current access limits

Search Console and field Core Web Vitals are not connected to this workspace. Do not claim that a live submission, indexing change, manual-action review, or field-vitals result has been completed without a current export or production inspection.
