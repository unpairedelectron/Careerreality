# Publication and AdSense readiness gates

All gates must pass before an owner can consider a separate deployment or AdSense submission.

| Gate | Current status | Evidence / blocker |
| --- | --- | --- |
| 44 article routes individually triaged | Provisional | `CONTENT_TRIAGE.csv`; human editor must approve scores and actions. |
| Independent hard requirements on every article | Fail / open | `CONTENT_TRIAGE.csv` records each hard check separately. A score cannot override any failed or open hard requirement. |
| No unexplained repeated article paragraphs | Fail / open | The ≥25-word baseline audit finds duplicate entries affecting 42/44 articles; the other two are open because shorter/shared text is not cleared. No shared-text allowlist is documented. |
| Claim-level source support | Fail / open | `CLAIM_REGISTER.csv` has article-level unresolved claim groups, not verified mappings for every material factual claim. |
| Title, description, body agreement | Open | Generic generated descriptions were removed; each final title and description still needs per-page human review against the body. |
| Truthful author and dates | Fail / open | Author/reviewer identities and true creation, publication, update, and review dates remain unverified. |
| Standalone and JavaScript-off usefulness | Open | Test the final editor-approved page with JavaScript disabled; crawler snapshots alone do not pass this gate. |
| Original Value Score and decision | Provisional | `CONTENT_TRIAGE.csv` contains 2 provisional zeroes, 41 ones, and 1 two; all after-scores are pending. Scores are triage, not approval. |
| Score-two and above-two human review | Open | Every retained score-two article needs review; review a representative sample of any articles later scored above two. All 44 currently need editorial decisions. |
| Shared salary/tax calculation | Source-text checked; no independent sign-off recorded | Salary-only method is documented in `CALCULATOR_VERIFICATION.md`; 13 model tests pass, including one-rupee rebate/surcharge boundaries and the Section 202 25% cap. No reviewer or signed review outcome was provided in this task context; keep the estimate and approval gate open. |
| Market data provenance | Fail / open | 0/392 production rows have source URLs. Incomplete rows must remain withheld. |
| Company-score method | Fail / open | No approved versioned method or reviewer. |
| Trust pages | Fail / open | Replaced with a noindex hold pending owner and legal/privacy facts. |
| Sitemap and canonical/index state | Staging snapshot pass; release blocked | Staging route-snapshot checks pass. Published SEO verification reports 3 local build checks and 1 published check failing; the published sitemap has 69 URLs versus 9 in the local canonical route set (0 missing, 60 unexpected). Known-good comparison shows no route-observation changes. Do not deploy. |
| Search Console evidence for URL decisions | Open | 2026-10-26 Web (text-based), Last 28 days (2026-09-27–2026-10-24) performance exports are mapped to the October 8 route matrix. Property and country/device filters are unrecorded; 50/87 matrix paths have visible Page rows and 37 do not. No current URL Inspection/coverage export or page-filtered Queries export. Performance does not decide indexability; see `SEARCH_CONSOLE_INDEXABILITY_EVIDENCE_2026-10-26.md` and the route-keyed evidence CSV. |
| Accessibility, mobile, and tool usefulness | Open | Verify all release candidates and error/empty states. |
| Ads absent | Must verify after final build | `ADS_PLAN.md`; source/build search plus browser network check required. |
| Human final review | Fail / open | Owner, editorial, tax, privacy/legal, and independent reviewer sign-off required. |
| Production and deployment safety | Pass for this work | Read-only inspection only; no deployment or production mutation. |

**Indexability rule:** An article may not be published or indexable at resubmission unless every hard requirement is `PASS`. A score of 2 or more does not waive a hard gate; a score of 0 or 1 cannot remain live or indexable at resubmission.

**Current verdict: NOT READY.** Automated success cannot close editorial, tax, legal, provenance, or owner-approval gates.

Search Console performance evidence does not close the URL-level indexability gate. Keep all route dispositions provisional until property scope, country-specific page/query evidence where relevant, current URL Inspection state, and editorial/release approvals are available.
