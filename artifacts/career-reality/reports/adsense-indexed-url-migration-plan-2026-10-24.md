# Indexed-URL review and migration plan

**Generated:** 2026-10-24T10:33:55.198Z

**Status:** Assessment only. No URL, redirect, robots, sitemap, production-data, or publishing change is authorized by this document.

## Evidence reviewed

- Search Console export: `attached_assets/Table_1789671366775.csv`.
- Local sitemap: 55 unique normalized paths.
- Search Console export: 74 rows representing 61 unique normalized paths; latest recorded crawl is 2026-09-10.
- Route matrix: `artifacts/career-reality/reports/adsense-indexed-url-matrix-2026-10-24.csv`. It joins the sitemap, export, and 0 company-detail records, then records local snapshot presence, robots directives, and canonical paths.
- Production data snapshot: `docs/PHASE_2_PROVENANCE_ROWS.csv`. It is a read-only aggregate snapshot. 392 of 392 legacy market rows lack complete publication provenance; the audit-only SUPPRESS label is not stored or written in production.
- The Search Console export is a dated crawl/index snapshot, not a live URL Inspection result. A row in the export does not establish that a URL is currently indexed or indexable.

## Differences that need individual review

### Export paths outside the local sitemap

- `/ai/gcc-ai-hiring-bar-system-design-july-2026/`
- `/ai/google-gemini-enterprise-india-gcc-july-2026/`
- `/article/10x-developer-myth-productivity-killing-careers/`
- `/article/broke-at-30-money-mistakes-nobody-warned/`
- `/article/cybersecurity-privacy-careers-beyond-tech-india-2026/`
- `/article/data-science-bubble-excel-work-reality/`
- `/article/devops-sre-reality-india-oncall/`
- `/article/freelancing-reality-india-freedom-myth/`
- `/article/gcc-gold-rush-india-captive-center-reality/`
- `/article/gcc-return-to-office-hybrid-reality-india-2026/`
- `/article/green-careers-esg-renewable-sustainability-india-2026/`
- `/article/home-loan-trap-dream-house-financial-prison/`
- `/article/hr-conversations-what-matters-india/`
- `/article/indian-education-trap-degree-career-mistake/`
- `/article/indian-it-layoff-cycle-2026/`
- `/article/job-hopping-stops-working-after-35/`
- `/article/joining-bonus-clawback-offer-letter-traps-2026/`
- `/article/junior-data-scientist-reality-india/`
- `/article/layoff-recovery-timeline-india/`
- `/article/manager-vs-ic-career-path-india/`
- `/article/mba-reality-india-worth-it-2026/`
- `/article/networking-reality-india-introverts/`
- `/article/passion-luxury-not-strategy-india/`
- `/article/performance-review-reality-ratings-india/`
- `/article/pm-prestige-trap-escape-from-engineering/`
- `/article/portfolio-first-hiring-gig-economy-careers-india-2026/`
- `/article/relieving-letter-hostage-notice-period-india-2026/`
- `/article/self-learning-trap-online-courses-expensive-entertainment/`
- `/article/senior-developer-salary-ceiling-india/`
- `/article/side-hustle-myth-india-reality/`
- `/article/staff-engineer-promotion-freeze-india-2026/`
- `/article/startup-equity-esop-reality-india/`
- `/article/tech-lead-trap-responsibility-authority/`
- `/article/ux-salary-myth-design-careers-plateau/`
- `/article/what-20-lpa-actually-feels-like-india-purchasing-power/`
- `/article/why-upskilling-stops-working-career-trap/`
- `/article/work-life-balance-myth-high-performers/`
- `/articles/`
- `/category/career-reality-checks/`
- `/category/career-strategy/`
- `/category/money-reality/`
- `/category/software-engineering/`
- `/companies/groww/`
- `/companies/postman/`
- `/layoff-radar/`
- `/resignation-risk/`
- `/salary-reality/`
- `/sitemap/`
- `/topic-clusters/`

Do not add these paths to the sitemap solely because they appear in the export. Inspect each path's current production response, canonical, robots directive, redirect destination, and Search Console URL Inspection state. The local build may retain old paths as noindex handoffs; that local behavior does not prove the deployed behavior.

### Sitemap paths absent from the export

- `/corrections/`
- `/editorial/`
- `/final-pay-estimator/`
- `/gratuity-estimator/`
- `/guides/`
- `/guides/ai-at-work-questions-to-ask/`
- `/guides/career-switches-and-education/`
- `/guides/cross-border-and-remote-pay/`
- `/guides/culture-fit-and-product-management/`
- `/guides/cybersecurity-and-green-work/`
- `/guides/data-science-career-claims/`
- `/guides/engineering-careers-without-the-title-trap/`
- `/guides/getting-hired-through-evidence-and-conversations/`
- `/guides/how-to-read-salary-and-hiring-claims/`
- `/guides/independent-work-without-romanticising-it/`
- `/guides/layoff-recovery-and-employment-documents/`
- `/guides/notice-period-and-return-to-office/`
- `/guides/performance-reviews-and-career-choices/`
- `/guides/read-the-offer-beyond-ctc/`
- `/guides/runway-debt-and-big-decisions/`
- `/guides/senior-engineering-and-operations-work/`
- `/guides/skills-passion-and-career-constraints/`
- `/guides/workplace-culture-and-boundaries/`
- `/home-loan-stress-test/`
- `/layoff-runway/`
- `/methodology/`
- `/offer-comparison/`
- `/resign-or-stay/`
- `/rules/`
- `/rules/ctc-components/`
- `/rules/employee-pf/`
- `/rules/gratuity-wages/`
- `/rules/hra-rent-exemption/`
- `/rules/income-tax-new-regime/`
- `/rules/income-tax-old-regime/`
- `/rules/leave-encashment/`
- `/rules/professional-tax-states/`
- `/rules/salary-benefits-tax/`
- `/rules/salary-standard-deduction-cess/`
- `/sources/`
- `/tax-regime-comparison/`
- `/team/`
- `/tools/`

Absence from this export is not evidence of a removal, deindexing, or crawl failure. Check each URL in Search Console and compare its response, canonical, robots directive, sitemap membership, and useful page content.

### Company-detail records and editorial review

- The local route inventory contains 0 company-detail pages. Numerical company scores remain withheld until a versioned methodology and source-level evidence are approved.
- 44 article records still require editorial review. The active public catalogue has 0 articles and the quarantined archive has 44. Verified authors, reviewers, publication and modification dates, review/fact-check dates, and claim support remain human-required gates.
- Local route directives and canonical values are for impact analysis only; they do not establish current production behavior.

## Route-by-route procedure

Use the CSV as the checklist; do not make a site-wide decision from aggregate counts.

1. For each route, record the current production HTTP status, redirect chain, canonical, robots directive, sitemap membership, and Search Console URL Inspection result.
2. For articles, separately record editorial usefulness, evidence quality, source support, originality, and whether any claim needs correction. Do not infer an author, reviewer, publication date, or review date.
3. Choose one documented action per route: preserve as-is, improve the page while preserving its URL, retain as a deliberate noindex handoff, or propose a redirect/deletion for separate approval.
4. Before any approved change, test the exact old and destination URLs for status, canonical, robots, content relevance, and redirect behavior. Avoid chains, loops, unrelated destinations, and noindex URLs in the sitemap.
5. After a separately approved release, recheck the deployed host and custom domain, then monitor Search Console after recrawl. The development preview and local snapshots are not substitutes for this production check.

## Current recommendation and open decision

- Preserve every existing URL for now. No redirect, deletion, mass noindex, or sitemap change is proposed.
- Keep all indexed article URL decisions in the route matrix until evidence and editorial records are reviewed. Improve individual pages only at their current URLs when corrections are supported and an owner approves restoration.
- The route matrix lists each URL with the current local snapshot; it is not a request to change production.
- Do not decide whether articles should remain indexable or be individually noindexed until the route matrix, article evidence, and review gates have been examined. No unapproved production indexing change is authorized.

## Release boundary

This plan does not authorize publishing, AdSense resubmission, URL migration, changes to production data, or broad indexability changes. AdSense resubmission remains blocked until the readiness gates pass.
