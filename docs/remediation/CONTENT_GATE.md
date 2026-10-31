# Article content gate

This operationalizes the supplied content-gate requirements for the staging review package. It applies to each article independently. The score is a triage signal and cannot compensate for a failed or open hard requirement.

## 1. Hard requirements: pass/fail, independent of score

Before an article can be published or indexable at resubmission, every row below must be `PASS` for that article:

1. **No unexplained repeated paragraphs.** This includes repeats within an article and shared across articles. Any intentionally shared text must be explicitly allowlisted and documented.
2. **Claim-level evidence.** Every material factual claim must map to a source that actually supports it. Quantitative claims, dates, named events, company facts, research findings, quotations, and factual comparisons require claim-level provenance. Editorial analysis must be distinguishable from factual reporting.
3. **Title, meta description, and body agree.**
4. **Author and dates are truthful.**
5. **Standalone page works with JavaScript disabled.**

`CONTENT_TRIAGE.csv` records these checks separately for every article. Current status:

- The live-page duplicate audit uses a threshold of 25 or more words. It reports duplicate entries affecting 42 of 44 articles. The other two have no reported hit at this threshold; that is not clearance for shorter repeats or a complete human review.
- No intentional shared-text allowlist is documented.
- The 44 article rows in `CLAIM_REGISTER.csv` are unresolved article-level groups, not a verified inventory mapping each material claim to supporting sources.
- Page-by-page title/meta/body agreement and final JavaScript-off usefulness remain open for human review.
- Author/reviewer identities and true dates remain unverified.
- Every article is therefore blocked from publication/indexability and remains noindex in staging.

## 2. Original Value Score

Score the page as it would actually be published, answering in one sentence: **What does a reader get here that the cited sources do not already give them?**

The existing `original_value_score_before` values are provisional review triage, not final editorial ratings. Calibration anchors supplied with this gate are:

- Junior data scientist: 0–1
- Home-loan: 1
- IT-layoff: 0–1
- ₹20 LPA: 2, as published

All 44 `original_value_score_after` values remain pending because there is no editor-approved rewrite and re-score. The `unique_reader_value` entries are hypotheses to test, not claims that unique value has been demonstrated.

## 3. Decision rules

- **Score 0:** presumed weak; remove or merge unless verified, genuinely useful material lifts it to 2 or more. Rewording filler is not an uplift.
- **Score 1:** requires substantial improvement or consolidation. It may remain a draft or noindex, but may not remain live or indexable at resubmission.
- **Score 2+:** eligible for retention, never automatically approved. The page must independently pass originality, evidence, usefulness, differentiation, trust, search-intent, standalone-value, and every hard requirement.
- Traffic, backlinks, and existing URLs do not justify retaining weak content. If appropriate, a human-approved 301 can preserve legitimate link equity to the best relevant destination.
- When uncertain, prefer merge, noindex, or removal over retaining weak content.

For this remediation, no route deletion, redirect, or 410 is authorized without owner/editor approval. Existing routes remain available as noindex review drafts.

## 4. Per-article record and human review

`CONTENT_TRIAGE.csv` records the before/after score, score reason, unique-reader-value statement, provenance status, action, final indexability, per-article hard-gate statuses, and reviewer assignment. Current after-scores and reviewers are pending/unassigned.

Every article requires an editorial decision before release. Review every article retained at score 2 and a representative sample of any article later scored above 2. The current staging action is not a final retain decision.

**Current verdict: NOT READY.** No article has passed all hard requirements. Human review and owner-approved release decisions remain required.
