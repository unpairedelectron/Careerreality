# Staging remediation changelog

## 2026-10-08

- Created branch `remediation/adsense-low-value-content-2026-10-08` and annotated baseline tag `adsense-recovery-baseline-2026-10-08`.
- Completed read-only production crawl and exports. No production writes or schema changes.
- Made article routes noindex in hydrated metadata and crawler snapshots; added a visible staging-review notice while preserving each route.
- Removed generic fallback dek generation and automatic meta-description truncation; missing dek/description now fails explicitly. Read time now uses the measured article word count without a 15-minute floor.
- Added explicit staging deks for the 23 articles that had been receiving generated fallback blurbs; the review banner and noindex state remain, and every dek still needs human approval.
- Removed silent repeated-paragraph stripping. The assembled draft now preserves the source text, and the strict gate blocks on the 1,179 repeated occurrences until editors resolve them.
- Added the supplied article content gate to the review package, including independent per-article hard-gate statuses, score/decision rules, and reviewer fields. Forty-two articles have duplicate-report entries at the ≥25-word threshold; the other two remain open for shorter repeats and human review.
- Replaced trust-page content in the staging UI with a noindex owner-review notice because the operator, contact, editorial, privacy, and legal facts are not verified.
- Withheld `/companies`, `/salary-reality`, `/layoff-radar`, article archives, topic archives, categories, and trust pages from the staging sitemap while their evidence/review gates remain open.
- Rebuilt the staging sitemap from 69 baseline URLs to 10 reviewed routes and recorded all 95 crawled URL dispositions without choosing a redirect or deletion.
- Removed salary-benchmark and layoff-radar entries from the shared public tool catalogue; the direct routes remain available for review but are noindex.
- Preserved market records unchanged. Existing server-side provenance validators remain the publication gate.
- Replaced the homepage CTC-entry form with a direct calculator link. Calculator values stay in page memory and are not put in URLs/history, browser storage, analytics, API requests, logs, or workspace save/share flows.
- Replaced the removed calculator module with one shared CTC/tax model for the interactive results, worked examples, article example, snapshots, and tests. The Salary Reality offer link now opens the calculator without query parameters.
- Made CTC reconciliation, fixed-pay versus target-variable cash, manual professional tax, unallocated CTC, and the partial-year PF ceiling limitation explicit in the calculator and static copy.
- Added direct official links for the amended Income-tax Act, Finance Act 2026 tax-year memorandum, Section 156, and EPFO transition references. Section 19 employment-tax deduction treatment and tax-year 2026–27 rate provisions were checked against those sources; independent tax-qualified approval remains open.
- Corrected the Section 202 surcharge cap above ₹5 crore to 25% in both regime options and added exact-threshold/one-rupee-over tests for rebate and surcharge behavior.
- Added a calculator design foundation, tool-page specification, query/privacy map, and calculation verification record. Search Console evidence and human approval remain outstanding.
- Ads remain off; no AdSense code or submission was added.

## Not done

- No article was approved for indexing.
- No production database mutation, migration, deployment, ad enablement, or AdSense submission.
- No author, reviewer, legal, tax, company-scoring, or contact fact was invented.
