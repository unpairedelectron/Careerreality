# Market data restoration plan

**Status:** blocked; no production data was changed.  
**Read-only inspection date:** 2026-10-09.  
**Tables:** `salary_benchmarks`, `company_signals`, and `layoff_signals`.

## Publication classification

| Classification | Rows | Meaning |
|---|---:|---|
| VERIFIED | 0 | No row has a working source URL and complete, human-checked provenance. |
| DERIVED | 0 | No row has verified inputs and a reproducible, documented formula. |
| ESTIMATED | 0 | No row has a documented, reviewed estimation method and disclosure. |
| BLOCKED / LEGACY | 392 | Retained in production, but ineligible for public rendering until evidence is restored. |
| **Total** | **392** | **0 rows currently qualify for public use.** |

“BLOCKED / LEGACY” is this audit’s conservative publication status, not a database value and not a deletion instruction. Stored confidence labels do not establish evidence quality.

## Production cohorts

| Table / source cohort | Rows and coverage | Sample size | Observation dates recorded | Refresh metadata | Current evidence and confidence |
|---|---|---|---|---|---|
| Salary benchmarks — `CareerReality salary reports + public compensation signals` | 360 rows; 18 roles × 5 cities × 4 experience bands. Each role has 20 rows (one row for each city/band pair); each experience band has 90 rows. The roles are Business analyst, Content / Copywriter, Customer success, Cybersecurity analyst, Data analyst, Data scientist, DevOps / SRE, Finance / Accounting, HR / People operations, Marketing, Operations manager, Product manager, Project manager, QA / Test engineer, Sales / Business development, Software engineer, UI designer, and UX designer. Bengaluru, Delhi NCR, Hyderabad, Mumbai, and Pune each have 72 rows. The schema has no industry field. | Each row has a stored `sample_size`; min 173, median 197.5, max 225. The underlying samples and counting method are not verifiable from the stored evidence. | All 360 rows: 2026-08-18. | Stored `refreshed_at` values range from 2026-09-04 to 2026-09-05. This is a database timestamp, not a verified source retrieval date or proof of refreshability. | 360/360 source URLs are empty; 360/360 structured provenance values are empty. Stored confidence is Medium for all rows; it is not independently supported. |
| Company signals — public reporting / public filings plus role-availability samples | 26 rows across 8 sectors: IT services 8, fintech 6, e-commerce 3, automotive 2, SaaS 2, consumer internet 2, software 2, and telecom 1. | No sample-size field or documented denominator. | 2026-07-22 to 2026-08-18. | Stored `refreshed_at` values range from 2026-09-04 to 2026-09-05; this does not establish source refresh. | 26/26 source URLs are empty and structured provenance is empty. Stored confidence is High for 12, Medium for 12, and Low for 2. Source labels are `Public filings + role availability sample` (10 rows) and `Public reporting + role availability sample` (16 rows). No score methodology has been approved. |
| Layoff signals — five stored source labels: Community signal (2), Employee reports + public filings (1), Job board movement (1), Public role sample (1), Role availability pattern (1) | 6 rows across 4 signal types: layoff, hiring signal, hiring freeze, and restructure. The table has no region or industry field. | No sample-size field. | 2026-07-04 to 2026-08-16. | All six stored `refreshed_at` values are 2026-09-04; this does not establish source refresh. | 6/6 source URLs are empty and structured provenance is empty. Stored confidence is High for 1, Medium for 3, and Low for 2. |
| **Total** | **392** |  |  |  | **392/392 lack a source URL; no row is eligible for publication.** |

The `source`, `observed_at`, `refreshed_at`, and `confidence` columns are not substitutes for a retrievable source, a dated observation record, or a reviewed methodology. None of these rows has been reclassified as derived or estimated.

## Restoration requirements by cohort

### Salary benchmarks

For each of the 360 role/city/experience-band records, retrieve and retain an authorized source that supports the displayed statistic. Record the publisher, working source URL, publication and retrieval dates, precise geography and role definition, experience-band boundaries, currency and pay period, sample size, population and collection method, percentile calculation, methodology version, confidence rationale, and reviewer. The five existing city groupings and stored sample sizes do not prove that the underlying samples were representative or collected as described.

Before any salary result is public, show its source and observation period beside the value; state the geographic, role, experience, sample, and compensation-component limits; and distinguish source-reported data from any calculation. Do not call a row “derived” until every input is verified and the formula is repeatable. Do not call it “estimated” without a documented, reviewed estimation method and a clear estimate label.

### Company signals

For each of the 26 companies, obtain dated primary evidence for each individual signal and preserve the exact evidence-to-claim mapping. Define the observation window, geography, role-availability sample, denominator, and inclusion rules. A composite stability score, momentum label, ranking, or narrative requires a separately approved, versioned methodology and validation against the underlying evidence. Until then, publish neither the scores nor interpretations.

### Layoff signals

For each of the six records, verify the event or hiring signal against a dated source, and capture the affected population, geography, observation period, classification rule, and any count’s basis. Keep community reports separate from confirmed employer or regulator statements. Do not turn job-board movement or role availability into a confirmed layoff claim without additional evidence and explicit qualification.

## Refreshability and public-use gates

1. Identify the actual source/provider, permissions, retrieval endpoint, data owner, and expected refresh cadence for each source cohort. A `refreshed_at` timestamp alone does not show that new source data was fetched.
2. Obtain source records and preserve the original evidence before changing any row or adding a new row. Do not infer missing values from current market conditions.
3. Have a qualified human reviewer verify source-to-row support, geography, time period, sample, calculation, confidence, and disclosures. Record the reviewer and review date.
4. Keep each cohort suppressed until all its rows meet the relevant evidence gate. A partially sourced cohort must not be presented as a complete market dataset.
5. Re-run API, route, freshness, and rendered-disclosure tests after any future approved change. Production data restoration requires separate authorization; no update or migration is part of this plan.

## Read-only basis

The 392-row classification is supported by the 2026-10-08 row export in `docs/PHASE_2_PROVENANCE_ROWS.csv` and a 2026-10-09 read-only production query of the three tables. The export and aggregate query agree on table counts and empty source URLs. No `INSERT`, `UPDATE`, or `DELETE` was issued.
