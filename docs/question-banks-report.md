# CareerReality interview question banks — pilot report

**As of:** 2026-11-04
**Scope:** framework, pilot items across roles, and in-progress content sets. This report is not a completion claim; no bank is ready for public integration.

The Complete Interview Guide request is in progress. The schema migration plan is in `docs/question-bank-guide-migration-plan.md`; the writing and depth rubric is in `docs/question-bank-style-guide.md`. Additive per-item guide fields are migrated and validated. No public guide route or feature was enabled.

## Phase 0 — framework

- **PASS:** structured JSON item contract created at `content/questions/schema.json`; required field shapes and enum values are defined.
- **PASS:** build-time validator added and wired into the CareerReality build.
- **PASS:** per-role content file, topic map, and manifest created.
- **PASS:** per-item manifest status is checked against item verification fields.
- **PASS:** production build completed, including 85 generated route snapshots and 57 app shells. Existing Vite sourcemap and large-chunk warnings remain unrelated to the question-bank validator.
- **REVIEW REQUIRED:** no indexed site routes, interactive practice experience, or static route snapshots are implemented.
- **PASS (2026-11-04):** automated reachability check covered all unique item and topic-map source URLs. HTTP reachability does not independently verify claim support.
- **PASS:** additive guide metadata migration and schema validation cover all 88 existing records. Core defaults to false, audience-specific answers remain null pending deliberate authorship, and time values are estimates.
- **REVIEW REQUIRED:** Complete Interview Guide feature flag remains disabled; no guide modules, role pages, local study features, or required user-facing gates have been completed.

## Bank 1 — Data Engineer

- Items: 76; minimum: 150; target: 240. **Shortfall: 74 to minimum; 164 to target. The separate user-requested 50-item floor is met.**
- Coverage: SQL aggregates, set operations, subqueries, joins, windows, indexes, plan reading, transaction isolation, and CTE optimization; Kafka delivery semantics, replay, batching, consumer parallelism, transactions, durability, compaction, tombstones, and offset commits; PostgreSQL logical-decoding replay and slot retention; Airflow branching, retries, XCom, dynamic mapping, sensors, pools, task dependencies, DAG status, catchup, and data intervals; Spark watermarks, joins, windows, source recovery, file delivery and processing-mode limits; Parquet row groups, pages, indexes, encodings, compression, and nested data; Iceberg schema/partition evolution, snapshots, metadata cleanup, and maintenance. Required Data Engineer scope remains incomplete.
- Sources: PostgreSQL 18, Kafka 4.4, Airflow 3.3.2, current Spark Structured Streaming guide, Apache Parquet format overview, and current Iceberg evolution/maintenance guides; retrieved 2026-11-03–2026-11-04.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this current set **PASS**; expert review **REVIEW REQUIRED**.
- No code sample was presented as executed. All 76 Data Engineer items include a structured text visual aid; these aids are not yet rendered by a public UI.

## Bank 2 — Data Scientist

- Items: 3; minimum: 150; target: 240. **Shortfall: 147 to minimum; 237 to target.**
- Coverage: cross-validation and probability calibration methods; required scope remains incomplete.
- Sources: scikit-learn 1.9.1 cross-validation and calibration documentation, retrieved 2026-11-03–2026-11-04.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; numerical/code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Bank 3 — AI/ML Engineer

- Items: 3; minimum: 140; target: 220. **Shortfall: 137 to minimum; 217 to target.**
- Coverage: deterministic execution, training checkpoints, and best-state snapshot handling; required scope remains incomplete.
- Sources: PyTorch 2.15.0 reproducibility and checkpoint documentation, retrieved 2026-11-03–2026-11-04.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Bank 4 — Generative AI Engineer

- Items: 3; minimum: 140; target: 220. **Shortfall: 137 to minimum; 217 to target.**
- Coverage: retrieval/grounding, component-level evaluation, and faithfulness metric boundaries; required scope remains incomplete.
- Sources: Lewis et al., arXiv:2005.11401v4, and Es et al., arXiv:2309.15217v2, retrieved 2026-11-03–2026-11-04. No current vendor model, API, price, limit, or benchmark claim is made.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Bank 5 — Agentic AI Engineer

- Items: 3; minimum: 110; target: 180. **Shortfall: 107 to minimum; 177 to target.**
- Coverage: workflow-versus-agent choice, sensitive-action approval, and routing to specialized handlers; required scope remains incomplete.
- Sources: Anthropic Engineering article and current OpenAI guardrails/human-review guide, retrieved 2026-11-03–2026-11-04.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Consolidated gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Every included item matches schema | PASS | `pnpm --filter @workspace/career-reality run validate:question-banks` |
| Every included item has a cited source and retrieval date | PASS | 88 item records across five role maps |
| Independent re-derivation recorded for each included item | PASS | `verification.rederivation_agreement` on all 88 |
| Every executable code sample executed or visibly marked | PASS | No current item contains code; `code: null` and `code_executed: n.a.` |
| No pair exceeds documented similarity threshold | PASS | Validator checks normalized question text at Jaccard threshold 0.82; 88-item current set |
| Source URL reachability | PASS (point-in-time) | All 48 unique item and topic-map URLs returned 2xx/3xx on 2026-11-04; the check does not verify claim support |
| Structured data valid | REVIEW REQUIRED | No guide pages or guide structured data were added |
| axe, keyboard, zoom, Lighthouse gates | REVIEW REQUIRED | No interview-bank UI exists to test |
| Privacy policy matches local-only progress storage | REVIEW REQUIRED | No guide progress storage implemented; no guide network/storage capture |
| All banks meet minimum counts | FAIL | 88 items total; see role-specific shortfalls above |
| Expert review | REVIEW REQUIRED | `docs/needs-sme-review.md` lists all 88 draft items; no human reviewer recorded |
| No invented publication or expert-review facts | PASS | Status text explicitly leaves expert review pending |
| Additive guide metadata migration | PASS | `pnpm --filter @workspace/career-reality run migrate:question-bank-guide-fields`; validator covers all 88 migrated records |
| Core breadth/priority curation | REVIEW REQUIRED | All existing items default non-Core; public criteria are documented, but no role set has been curated |
| 16-module role pages and browser-only learning tools | REVIEW REQUIRED | Not implemented; feature flag remains disabled |
| Privacy and network capture for guide state | REVIEW REQUIRED | No guide state storage implemented |

## Verification statistics

- Current items: 88 (76 Data Engineer and three for each other role).
- Source records retrieved: 88; each includes publisher, version/context, and retrieval date.
- Independent re-derivation: 88 agreements; no retained core-answer disagreements. The Data Engineer set includes item-specific limitations for SQL concurrency, CTE folding/materialization, streaming replay and slot retention, watermark state trade-offs, offset/tombstone behavior, orchestration, Parquet, and Iceberg.
- Code examples: 0; executed 0; not applicable 88.
- Dropped items: 0.
- Human expert reviews: 0.
- Near-duplicate threshold: 0.82 Jaccard similarity over normalized question terms; the current set is still too small to establish future coverage.

## Sources register summary

The current set uses PostgreSQL 18, Apache Kafka 4.4, Apache Airflow 3.3.2, the current Apache Spark Structured Streaming guide, Apache Parquet format documentation, Apache Iceberg evolution/maintenance guides, scikit-learn 1.9.1, PyTorch 2.15.0, RAG papers arXiv:2005.11401v4 and arXiv:2309.15217v2, Anthropic's 2024 agent-design article, and OpenAI's current human-review guidance. These sources support only the included claims and do not establish complete topic coverage.

## Required guide modules

No role has a public guide page yet. The following modules are absent for **each of the five roles**; they are not represented by placeholder pages:

| # | Module | Status for all five roles | Why |
| ---: | --- | --- | --- |
| 1 | Role overview and skills map | Missing | Role-specific sourced editorial content not authored |
| 2 | How to use the guide | Missing | No guide interface |
| 3 | General interview-stage outline | Missing | No guide interface or reviewed copy |
| 4 | Browser-only readiness check | Missing | No diagnostic logic or UI |
| 5 | 1-, 7-, 14-, and 30-day study plans | Missing | No planner |
| 6 | Filterable question bank and answer-depth tiers | Missing | Only research JSON exists; answer tiers are intentionally unset |
| 7 | Scenario and design practice walkthroughs | Missing | No walkthrough content/interface |
| 8 | Executed coding/SQL set with expected outputs | Missing | No code-bearing items in current set |
| 9 | Sourced quick-reference sheets | Missing | Not authored |
| 10 | Browser-only mock interview | Missing | No mock mode |
| 11 | Flashcards and spaced revision | Missing | No scheduler |
| 12 | Printable rapid-revision pack | Missing | No pack or print layout |
| 13 | Behavioural and communication preparation | Missing | Not authored |
| 14 | Aggregated mistakes and weak-answer patterns | Missing | Not generated in a guide UI |
| 15 | Links from preparation to existing tools | Missing | No guide pages |
| 16 | Sources, dates, change log, review status | Missing | No guide pages |

## Per-role counts and coverage status

| Role | Items | By level | By type | Core | Minimum | Coverage matrix |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Data Engineer | 76 | L1 8, L2 53, L3 15 | Concept 18, scenario 20, debugging 27, trade-off 11 | 0 | 150 | Five topics present; minimum/coverage shortfall remains |
| Data Scientist | 3 | L2 3 | Concept 1, trade-off 2 | 0 | 150 | Evaluation only; role scope incomplete |
| AI/ML Engineer | 3 | L2 3 | Debugging 3 | 0 | 140 | Training/reproducibility only; role scope incomplete |
| Generative AI Engineer | 3 | L2 3 | Concept 1, scenario 2 | 0 | 140 | RAG only; role scope incomplete |
| Agentic AI Engineer | 3 | L2 3 | Scenario 2, trade-off 1 | 0 | 110 | Agent architecture only; role scope incomplete |

No Core items are selected. The criteria are documented in `docs/question-bank-style-guide.md`; breadth matrices and curated priority paths have not been completed.

## Complete Interview Guide gates

| Gate | Result | Evidence/status |
| --- | --- | --- |
| Role pages have all modules or documented shortfalls | REVIEW REQUIRED | Missing modules and reasons listed above for each role |
| Readiness, plan generation, flashcards, and Core progress unit/E2E coverage | REVIEW REQUIRED | Features and tests do not exist |
| Core criteria and topic-map breadth | REVIEW REQUIRED | Criteria documented; no items curated |
| Unsupported claims scan and claims register | REVIEW REQUIRED | No guide copy published; no claims register or automated scan added |
| Counts derived from data | PASS for existing bank manifests; REVIEW REQUIRED for guide UI | Validator checks item/manifests; no guide UI exists |
| Print study pack and rapid-revision output | REVIEW REQUIRED | Not implemented |
| Mobile Lighthouse >= 0.85, accessibility 1.0, axe A/AA, keyboard completion | REVIEW REQUIRED | No guide pages to measure |
| Link and structured-data validation | REVIEW REQUIRED | Source link check passes point-in-time; no guide structured data |
| Cross-bank near duplicates | PASS | Current 88-item set passes the existing validator |
| Existing routes/tools/homepage visual style unchanged | PASS for this change | No routes, tools, styles, tokens, or navigation changed |
| Privacy-policy match and network/storage capture | REVIEW REQUIRED | No guide answers or progress are stored or transmitted; no capture performed |

## Competitive feature-gap audit

This feature-only audit is not yet performed against leading public resources. No competitor feature is asserted as a verified fact here.

| Feature area requested for comparison | CareerReality status | Competitive finding |
| --- | --- | --- |
| Role path and readiness check | Not built | Not assessed |
| Timed mock interview and self-rating | Not built | Not assessed |
| Spaced revision and flashcards | Not built | Not assessed |
| Print-ready study and rapid-revision packs | Not built | Not assessed |
| Full answer explanations and follow-up ladder | Data fields exist; guide UI absent | Not assessed |
| Local-only progress and export/import | Not built | Not assessed |

## Review queue and privacy

`docs/needs-sme-review.md` is generated from the item records and lists all 88 items. It does not record approval; every listed item remains pending independent human review.

The guide feature flag is disabled. No readiness answers, ratings, plans, flashcards, mock sessions, or other guide user inputs are currently stored or sent. The privacy policy was not changed; matching a future local-storage implementation requires review and network/storage capture before enabling the feature.

## Assumptions

- The attached brief's request applies to the existing CareerReality artifact because the content is for that product.
- “Independent re-derivation” is recorded as a separate verification pass against the cited primary material; it is not a human review.
- A question with no code sample records `code: null` and `code_executed: n.a.` rather than implying execution.
- Migrated time values are estimates from a documented default formula, not measured reading/practice durations. Existing Core flags default false and audience-specific answer tiers remain unset.
- Public routes are deferred rather than created with one-item thin topic clusters.

## Files changed and diff summary

- Added the shared structured question schema, five content files, five manifests, five topic maps, and the validation gate across prior and current work; the Data Engineer file contains 76 source-checked records.
- Added this report and `content/questions/PROGRESS.md`; both distinguish content readiness from public-product implementation.
- Added the Complete Interview Guide migration plan, writing/depth rubric, disabled feature configuration, and generated pending-review list. The report names all 16 missing guide modules and the gates not yet evidenced.
- No existing tool logic, homepage styles, design tokens, shared navigation/footer, privacy policy, route registry, sitemap, or deployment settings were changed.
- Added an additive question metadata migration, disabled guide feature configuration, and editorial migration/style documentation. The existing generated mockup sandbox file was already modified and was not changed as part of this work.
