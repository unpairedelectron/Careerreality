---
name: Search Console export scope
description: Interpreting Search Console CSV exports when date and country filters differ across dimensions.
---

Read the Filters export before interpreting any dimension table. A Countries table provides country aggregates for its selected period; it does not make unfiltered Queries or Pages data country-specific. A global daily chart cannot be combined with an aggregate country row to reconstruct that country's Q1 totals.

Query tables can omit anonymized and lower-priority searches, so their row sums are not property totals. Page rows can split hosts or duplicate paths, and their impression sums may exceed the property chart. Normalize host and path when reviewing duplicates; do not use the page-row sum as the site-wide denominator.

**Why:** Search Console exports contain separate dimensions, not a complete query × country × date cube. Treating the tabs as if they shared unreported filters can create unsupported market-specific trends.

**How to apply:** Record each export's exact date range and filters. Use the daily Chart for period totals, Countries for country aggregates, and Query/Page tables only at their actual filter scope. Request matching country-filtered exports when a market-specific query or period comparison is needed.