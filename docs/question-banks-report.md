# CareerReality interview question banks — pilot report

**As of:** 2026-11-03  
**Scope:** framework and one source-checked sample item per requested role. This report is not a completion claim; no bank is ready for public integration.

## Phase 0 — framework

- **PASS:** structured JSON item contract created at `content/questions/schema.json`; required field shapes and enum values are defined.
- **PASS:** build-time validator added and wired into the CareerReality build.
- **PASS:** per-role content file, topic map, and manifest created.
- **PASS:** per-item manifest status is checked against item verification fields.
- **PASS:** production build completed, including 85 generated route snapshots and 57 app shells. Existing Vite sourcemap and large-chunk warnings remain unrelated to the question-bank validator.
- **REVIEW REQUIRED:** no indexed site routes, interactive practice experience, or static route snapshots are implemented.
- **REVIEW REQUIRED:** external source links were retrieved and checked for the specific pilot claims; automated live link checking is not implemented.

## Bank 1 — Data Engineer

- Items: 1; minimum: 150; target: 240. **Shortfall: 149 to minimum; 239 to target.**
- Coverage: one SQL window-function concept only; required scope is otherwise uncovered.
- Pilot source: PostgreSQL 18 documentation, retrieved 2026-11-03.
- Gates: schema **PASS**; cited source/retrieval date **PASS**; independent re-derivation **PASS**; code execution **N/A**; count/coverage **FAIL**; near-duplicate check across this pilot **PASS**; expert review **REVIEW REQUIRED**.
- No SQL sample was presented as executed.

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
| Every included item has a cited source and retrieval date | PASS | Five item records and five role topic maps |
| Independent re-derivation recorded for each included item | PASS | `verification.rederivation_agreement` on all five |
| Every executable code sample executed or visibly marked | PASS | No pilot item contains code; `code: null` and `code_executed: n.a.` |
| No pair exceeds documented similarity threshold | PASS | Validator checks normalized question text at Jaccard threshold 0.82; five-question pilot |
| Link checker clean | REVIEW REQUIRED | URLs were fetched for research; no automated full-register link check exists |
| Structured data valid | REVIEW REQUIRED | No public pages or structured data were added |
| axe, keyboard, zoom, Lighthouse gates | REVIEW REQUIRED | No interview-bank UI exists to test |
| Privacy policy matches local-only progress storage | REVIEW REQUIRED | No progress storage implemented; no network/storage capture |
| All banks meet minimum counts | FAIL | Each role has one pilot item; see shortfalls above |
| Expert review | REVIEW REQUIRED | No human reviewer recorded |
| No invented publication or expert-review facts | PASS | Status text explicitly leaves expert review pending |

## Verification statistics

- Pilot items: 5.
- Source records retrieved: 5; each includes publisher, version/context, and retrieval date.
- Independent re-derivation: 5 agreements; no core-answer disagreements; the separate pass added a material nuance to each record and narrowed GenAI confidence to medium because the cited paper supports its architecture rather than the production troubleshooting recommendations.
- Code examples: 0; executed 0; not applicable 5.
- Dropped items: 0.
- Human expert reviews: 0.
- Near-duplicate threshold: 0.82 Jaccard similarity over normalized question terms; this small pilot is not evidence about future batches.

## Sources register summary

The pilot uses PostgreSQL 18 documentation, scikit-learn 1.9.1 documentation, PyTorch 2.15.0 documentation, the RAG paper arXiv:2005.11401v4, and Anthropic's 2024 agent-design article. These sources support only the scoped pilot claims and do not establish complete topic coverage.

## `docs/needs-sme-review.md`

Not created. No low-confidence or disputed item was retained; all five entries still require independent expert review before public use. The entire pilot bank set remains unsuitable for publication due to count and coverage shortfalls.

## Assumptions

- The attached brief's request applies to the existing CareerReality artifact because the content is for that product.
- “Independent re-derivation” is recorded as a separate verification pass against the cited primary material; it is not a human review.
- A question with no code sample records `code: null` and `code_executed: n.a.` rather than implying execution.
- Public routes are deferred rather than created with one-item thin topic clusters.

## Files changed and diff summary

- Added five structured pilot item files, five manifests, five topic maps, and a shared JSON Schema.
- Added a validator and wired it into the CareerReality prebuild.
- Added this report and `content/questions/PROGRESS.md`.
- No existing tool logic, homepage styles, design tokens, shared navigation/footer, privacy policy, route registry, sitemap, or deployment settings were changed.
