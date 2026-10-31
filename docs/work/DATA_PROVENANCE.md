# Market-data provenance inventory

**Snapshot date:** 2026-10-09  
**Source:** read-only market-table counts and source-URL checks recorded in `PRODUCTION_BASELINE.md`.  
**Database writes:** none. The existing rows are retained unchanged.

## Classification

| Classification | Rows | Public eligibility |
|---|---:|---|
| VERIFIED | 0 | None |
| DERIVED | 0 | None |
| ESTIMATED | 0 | None |
| UNVERIFIED | 0 | None |
| LEGACY | 392 | Withheld |
| **Total** | **392** | **0 public rows** |

## Table counts

| Table | Rows | Source URL present | Classification | Public treatment |
|---|---:|---:|---|---|
| Salary benchmarks | 360 | 0 | LEGACY | Suppressed until a working source URL, source date, and row-level provenance can be verified |
| Company signals | 26 | 0 | LEGACY | Suppressed; no company score, momentum label, or narrative is published |
| Layoff signals | 6 | 0 | LEGACY | Suppressed until each event and its classification can be traced to dated evidence |
| **Total** | **392** | **0** | **LEGACY** | **No market rows qualify for public rendering** |

The legacy label is conservative: a row without a working source URL cannot be classified as VERIFIED; no stored formula or estimate method was demonstrated in the read-only inventory to qualify it as DERIVED or ESTIMATED. This classification does not alter or delete database records.

The public company API already rejects rows that fail its evidence policy. Its response metadata now describes only the publication gate and does not disclose an unapproved score formula. Public company pages and links have been removed from the web artifact. The market-data tables remain unchanged.
