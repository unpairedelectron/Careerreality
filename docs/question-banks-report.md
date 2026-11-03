# CareerReality interview question banks — pilot report

**As of:** 2026-11-04
**Scope:** framework, pilot items across roles, and an in-progress Data Engineer content set. This report is not a completion claim; no bank is ready for public integration.

## Phase 0 — framework

- **PASS:** structured JSON item contract created at `content/questions/schema.json`; required field shapes and enum values are defined.
- **PASS:** build-time validator added and wired into the CareerReality build.
- **PASS:** per-role content file, topic map, and manifest created.
- **PASS:** per-item manifest status is checked against item verification fields.
- **PASS:** production build completed, including 85 generated route snapshots and 57 app shells. Existing Vite sourcemap and large-chunk warnings remain unrelated to the question-bank validator.
- **REVIEW REQUIRED:** no indexed site routes, interactive practice experience, or static route snapshots are implemented.
- **REVIEW REQUIRED:** external source links were retrieved and checked for the specific pilot claims; automated live link checking is not implemented.

## Bank 1 — Data Engineer

- Items: 50; minimum: 150; target: 240. **Shortfall: 100 to minimum; 190 to target. The separate user-requested 50-item floor is met.**
- Coverage: SQL aggregates, set operations, subqueries, joins, windows, indexes and plan reading; Kafka delivery semantics, replay, batching, consumer parallelism, transactions, and durability; Airflow retry safety and data intervals; Spark watermarks, joins, windows, source recovery, file delivery and processing-mode limits; Parquet columnar/nested data and compression; Iceberg schema/partition evolution, snapshots, metadata cleanup, and maintenance. Required Data Engineer scope remains incomplete.
- Sources: PostgreSQL 18, Kafka 4.4, Airflow 3.3.2, current Spark Structured Streaming guide, Apache Parquet format overview, and current Iceberg evolution/maintenance guides; all retrieved 2026-11-03.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this current set **PASS**; expert review **REVIEW REQUIRED**.
- No code sample was presented as executed. All 50 Data Engineer items include a structured text diagram or comparison table; these aids are not yet rendered by a public UI.

## Bank 2 — Data Scientist

- Items: 1; minimum: 150; target: 240. **Shortfall: 149 to minimum; 239 to target.**
- Coverage: one model evaluation concept only; required scope is otherwise uncovered.
- Pilot source: scikit-learn 1.9.1 cross-validation documentation, retrieved 2026-11-03.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; numerical/code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Bank 3 — AI/ML Engineer

- Items: 1; minimum: 140; target: 220. **Shortfall: 139 to minimum; 219 to target.**
- Coverage: one reproducibility debugging concept only; required scope is otherwise uncovered.
- Pilot source: PyTorch 2.15.0 reproducibility documentation, retrieved 2026-11-03.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Bank 4 — Generative AI Engineer

- Items: 1; minimum: 140; target: 220. **Shortfall: 139 to minimum; 219 to target.**
- Coverage: one RAG retrieval/grounding scenario only; required scope is otherwise uncovered.
- Pilot source: Lewis et al., arXiv:2005.11401v4, retrieved 2026-11-03. No current vendor model, API, price, limit, or benchmark claim is made.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Bank 5 — Agentic AI Engineer

- Items: 1; minimum: 110; target: 180. **Shortfall: 109 to minimum; 179 to target.**
- Coverage: one workflow-versus-agent trade-off only; required scope is otherwise uncovered.
- Pilot source: Anthropic Engineering article retrieved 2026-11-03. The item notes the article's warning that tooling descriptions have changed since publication.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.

## Consolidated gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Every included item matches schema | PASS | `pnpm --filter @workspace/career-reality run validate:question-banks` |
| Every included item has a cited source and retrieval date | PASS | 54 item records across five role maps |
| Independent re-derivation recorded for each included item | PASS | `verification.rederivation_agreement` on all 54 |
| Every executable code sample executed or visibly marked | PASS | No current item contains code; `code: null` and `code_executed: n.a.` |
| No pair exceeds documented similarity threshold | PASS | Validator checks normalized question text at Jaccard threshold 0.82; 16-item current set |
| Link checker clean | REVIEW REQUIRED | URLs were fetched for research; no automated full-register link check exists |
| Structured data valid | REVIEW REQUIRED | No public pages or structured data were added |
| axe, keyboard, zoom, Lighthouse gates | REVIEW REQUIRED | No interview-bank UI exists to test |
| Privacy policy matches local-only progress storage | REVIEW REQUIRED | No progress storage implemented; no network/storage capture |
| All banks meet minimum counts | FAIL | Each role has one pilot item; see shortfalls above |
| Expert review | REVIEW REQUIRED | No human reviewer recorded |
| No invented publication or expert-review facts | PASS | Status text explicitly leaves expert review pending |

## Verification statistics

- Current items: 54 (50 Data Engineer and one for each other role).
- Source records retrieved: 54; each includes publisher, version/context, and retrieval date.
- Independent re-derivation: 54 agreements; no retained core-answer disagreements. The Data Engineer passes item-specific limitations, including partition-level ordering, watermark state trade-offs, streaming-state bounds, and snapshot expiration versus orphan-file cleanup.
- Code examples: 0; executed 0; not applicable 54.
- Dropped items: 0.
- Human expert reviews: 0.
- Near-duplicate threshold: 0.82 Jaccard similarity over normalized question terms; the current set is still too small to establish future coverage.

## Sources register summary

The current set uses PostgreSQL 18, Apache Kafka 4.4, Apache Airflow 3.3.2, the current Apache Spark Structured Streaming guide, Apache Parquet format documentation, Apache Iceberg evolution/maintenance guides, scikit-learn 1.9.1, PyTorch 2.15.0, the RAG paper arXiv:2005.11401v4, and Anthropic's 2024 agent-design article. These sources support only the included claims and do not establish complete topic coverage.

## `docs/needs-sme-review.md`

Not created. No disputed item was retained; all 16 entries still require independent expert review before public use. The entire question-bank set remains unsuitable for publication due to count and coverage shortfalls.

## Assumptions

- The attached brief's request applies to the existing CareerReality artifact because the content is for that product.
- “Independent re-derivation” is recorded as a separate verification pass against the cited primary material; it is not a human review.
- A question with no code sample records `code: null` and `code_executed: n.a.` rather than implying execution.
- Public routes are deferred rather than created with one-item thin topic clusters.

## Files changed and diff summary

- Added the shared structured question schema, one content file, five manifests, five topic maps, and the validation gate in earlier work; the Data Engineer file now contains 50 source-checked records.
- Added this report and `content/questions/PROGRESS.md`; both distinguish content readiness from public-product implementation.
- No existing tool logic, homepage styles, design tokens, shared navigation/footer, privacy policy, route registry, sitemap, or deployment settings were changed.
