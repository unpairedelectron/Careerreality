# AdSense low-value-content remediation — staging review package

**Status: NOT READY.** This branch is a review and staging package, not approval to publish.

## Scope and safety

- Work is isolated on `remediation/adsense-low-value-content-2026-10-08`, with baseline tag `adsense-recovery-baseline-2026-10-08`.
- Production was inspected read-only. No production rows, schema, or settings were changed.
- No deployment, ad enablement, AdSense script addition, or AdSense submission is authorized or performed.
- Routes under review remain present; indexability changes are recorded in `URL_DECISIONS.csv`. No URL was silently deleted or redirected.

## Evidence files

- `baseline/` contains read-only production crawl, article exports, duplicate audits, metrics, and market-data exports.
- `CONTENT_GATE.md` records the supplied hard requirements, score rubric, decision rules, and current blockers.
- `CONTENT_TRIAGE.csv` contains provisional scores, reader-value hypotheses, actions, and per-article hard-gate statuses. Scores are not human editorial approval and cannot override a hard-gate failure.
- `URL_DECISIONS.csv` records the baseline and staging action for all 95 crawled URLs, including each article URL.
- `MARKET_DATA_CLASSIFICATION.csv` records all exported production market rows.
- `CLAIM_REGISTER.csv` is a claim-level review queue. A source list is not treated as proof for every claim.
- `BEFORE_AFTER.md`, `DEVIATIONS.md`, `HUMAN_INPUT_REQUIRED.md`, `SEVEN_DAY_PLAN.md`, `GATE_CHECKLIST.md`, and `ADS_PLAN.md` record the baseline, blockers, and sign-off requirements.
- `DESIGN_SYSTEM.md`, `TOOL_PAGE_SPEC.md`, `CALCULATOR_VERIFICATION.md`, and `TOOL_QUERY_MAP.md` document the homepage foundation, calculator contract, source checks, and input/privacy boundaries.

## Current gates

1. Article routes and trust pages are noindex in this branch.
2. Company, salary-benchmark, and layoff data are withheld unless the existing API provenance validators accept complete records.
3. The live production export contains 392 market rows with source labels but no source URLs; all are classified `UNVERIFIED / LEGACY`.
4. Official salary-tax provisions for the Tax Year 2026–27 estimate have been source-checked, but no independent tax-qualified approval was provided or recorded; the estimate remains unapproved until a qualified reviewer signs off.
5. The operating identity, authors/reviewers, contact route, actual editorial/AI workflow, privacy details, and company-score method require owner input.
6. No article passes the supplied hard content gate yet. Every retained candidate needs independent hard-gate review; 0/1 scores cannot be live or indexable at resubmission, and scores of 2+ are only eligible for human review.
7. Human review is required for every retained article and for the final search-indexing decisions.
8. The rebuilt staging sitemap contains 10 routes; the other reviewed routes remain accessible but noindex. The staging route snapshots and sitemap alignment checks pass.

## Safe rollback

No production migration or content deletion was made. Reverting the staging code changes is a normal source-control revert or checkout of the recorded baseline tag. Do not use a database rollback; there was no production database write.
