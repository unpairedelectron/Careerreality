# CareerReality interview question banks — pilot report

**As of:** 2026-11-04
**Scope:** framework, pilot items across roles, and in-progress content sets. This report is not a completion claim; no bank is ready for public integration.

## Phase 0 — framework

- **PASS:** structured JSON item contract created at `content/questions/schema.json`; required field shapes and enum values are defined.
- **PASS:** build-time validator added and wired into the CareerReality build.
- **PASS:** per-role content file, topic map, and manifest created.
- **PASS:** per-item manifest status is checked against item verification fields.
- **PASS:** production build completed, including 85 generated route snapshots and 57 app shells. Existing Vite sourcemap and large-chunk warnings remain unrelated to the question-bank validator.
- **REVIEW REQUIRED:** no indexed site routes, interactive practice experience, or static route snapshots are implemented.
- **PASS (2026-11-04):** automated reachability check covered all unique item and topic-map source URLs. HTTP reachability does not independently verify claim support.

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
| Structured data valid | REVIEW REQUIRED | No public pages or structured data were added |
| axe, keyboard, zoom, Lighthouse gates | REVIEW REQUIRED | No interview-bank UI exists to test |
| Privacy policy matches local-only progress storage | REVIEW REQUIRED | No progress storage implemented; no network/storage capture |
| All banks meet minimum counts | FAIL | 88 items total; see role-specific shortfalls above |
| Expert review | REVIEW REQUIRED | No human reviewer recorded |
| No invented publication or expert-review facts | PASS | Status text explicitly leaves expert review pending |

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

## `docs/needs-sme-review.md`

Not created. No disputed item was retained; all 88 entries still require independent expert review before public use. The entire question-bank set remains unsuitable for publication due to count and coverage shortfalls.

## Assumptions

- The attached brief's request applies to the existing CareerReality artifact because the content is for that product.
- “Independent re-derivation” is recorded as a separate verification pass against the cited primary material; it is not a human review.
- A question with no code sample records `code: null` and `code_executed: n.a.` rather than implying execution.
- Public routes are deferred rather than created with one-item thin topic clusters.

## Files changed and diff summary

- Added the shared structured question schema, five content files, five manifests, five topic maps, and the validation gate across prior and current work; the Data Engineer file contains 76 source-checked records.
- Added this report and `content/questions/PROGRESS.md`; both distinguish content readiness from public-product implementation.
- No existing tool logic, homepage styles, design tokens, shared navigation/footer, privacy policy, route registry, sitemap, or deployment settings were changed.
