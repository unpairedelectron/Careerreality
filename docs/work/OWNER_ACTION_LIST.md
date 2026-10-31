# Owner actions required to close external evidence gaps

These items remain external dependencies. Do not supply credentials in chat, fabricate records, or treat a skipped/auth-shim test as passed.

## 1. Approve public market and company evidence

- **Missing:** Reviewed source records and methodology for the public salary, company, and layoff datasets. Current production aggregates contain 360 salary, 26 company, and 6 layoff records; the backlog audit reports all 392 lack complete source URLs and reviewed provenance. Company scoring also lacks an approved methodology/version.
- **Why it matters:** The API and Compass correctly withhold these rows. Publishing them or using them as valid company options would misrepresent unverified claims.
- **Obtain from:** The data/editorial owner: source documents or public URLs, publication and retrieval dates, reviewer, metric/definition, transformation, methodology/version, limitations, and explicit publication eligibility. Provide an approved company-scoring methodology separately.
- **Dependent checks:** Seed/publishability gates, public API response expectations, Compass company selection and source-independence scenarios, and any company/market claim on a public page.
- **Safe work already completed:** Evidence filters remain fail-closed; fixture rows with `example.test` are not accepted as proof.

## 2. Authorize real signed-in QA

- **Missing:** An owner-approved Clerk test account/session in a non-production QA environment, with authorization to test save/watch and account-data flows. No password, token, or secret should be sent in chat.
- **Why it matters:** `TestAppAuthProvider` and the `career-reality-e2e-auth` local-storage marker can exercise UI states but do not establish a real Clerk session or server-side authorization.
- **Obtain from:** The account/product owner, using the approved Replit-managed Clerk test setup and test environment. Confirm the allowed test identities and account-isolation test scope.
- **Dependent checks:** Signed-in and expired-session paths; saved-decision/watchlist writes; unauthorized and cross-account isolation; resume deletion and profile/account switching; sign-in recovery/device checks.
- **Separate device evidence still missing:** Current-build Google sign-in PASS records on physical iOS and Android devices for both development and published production builds. The release-readiness script currently reports all four as NOT RUN.
- **Safe work already completed:** Signed-out redirects and unauthenticated public-data states are testable; authenticated save/watch tests remain explicitly blocked.

## 3. Confirm backup, retention, and deletion behavior

- **Missing:** Confirmation of this workspace's plan, actual backup settings, deletion propagation, and residual copies after account-data deletion. Official Replit documentation describes daily scheduled production backups, a 7-day default point-in-time restore window, and up to 28 days for Pro and Enterprise; the workspace's plan/settings and the treatment of deleted rows in backup history have not been verified.
- **Why it matters:** Code-level deletion of resume-derived fields does not prove backup expiry or deletion from logs, backups, replicas, exports, or user devices.
- **Obtain from:** The workspace owner and current Replit database Settings, plus plan/configuration evidence and applicable official documentation. Confirm actual settings rather than relying on the documented default; verify residual-copy behavior explicitly.
- **Platform references:** [Replit data recovery](https://docs.replit.com/features/data-and-storage/data-recovery) and [Replit SQL database](https://docs.replit.com/features/data-and-storage/sql-database). Documentation describes scheduled daily backups and plan-dependent recovery windows; it does not prove this workspace's current setting or application-level deletion behavior.
- **Dependent checks:** Privacy/retention claims, resume-data deletion guarantees, backup/residual-copy behavior, and any promise about complete erasure.
- **Safe work already completed:** The DELETE route is user-scoped and idempotent in code; unauthenticated deletion returns 401. No production deletion was performed.

## 4. Review and disposition quarantined articles

- **Missing:** Editorial decisions for all 44 archived records, including verified authors/reviewers, dates, claim sources, and whether repeated paragraphs are intended boilerplate or content defects. The generated duplicate review identifies normalized exact repeats in 30 records with section/paragraph locations and excerpts.
- **Why it matters:** Automated matching can identify exact repetition and its assembly pattern, but cannot authorize a rewrite, claim support, byline, date, or publication.
- **Obtain from:** The editorial owner/reviewer. Review `docs/work/ARCHIVED_ARTICLE_DUPLICATION_REVIEW.md` and the original archived sources; record a per-record disposition and approvals.
- **Dependent checks:** Archive duplicate-review gate, content/readiness audit, restoration/publication review, structured article metadata, and any repair of repeated copy.
- **Safe work already completed:** All 44 records remain quarantined; no automatic rewrite, deletion, or publication occurred.
