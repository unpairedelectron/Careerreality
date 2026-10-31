# Browser failure ledger — 23 October 2026

## Current full browser run

`pnpm --filter @workspace/career-reality exec playwright test` discovers only `*.spec.ts` browser tests; previously it also collected Node unit-test files and failed on a JSON module import. Latest result: **88 passed, 0 failed, 6 skipped (94 total)**.

No production data, deployment, or real account was used. Tests that force `TestAppAuthProvider` are component/test-shim coverage only, not evidence of Clerk authentication, authorization, or persistence.

## Skips and remaining release blockers

- Three Compass save/watch/context tests remain `fixme`: their evidence depends on unapproved company/layoff fixtures and the auth shim, not an owner-approved market source and real Clerk session. These are blocked, not passed.
- Three SEO tests intentionally run only in published/production modes: archived-route status after an approved release, sitemap/hydration parity, and production canonical-origin checks. They are not part of the default local browser run.
- No browser test currently fails. The archive review remains a **content release blocker**, not a browser-test failure: 1,179 repeated paragraph copies across 102 groups in 30/44 quarantined records. The audit now reports section/paragraph locations, excerpts, and 94 repeated-template candidates versus 8 repeated-editorial-content candidates; every group still requires human review.

## Resolved in the latest run

- **Archived route handoff heading timed out at five seconds.** The registered guide rendered correctly on direct preview. Retained the exact H1 expectation and increased only its wait allowance to 15 seconds for the multi-route dev-server run. The 44-route quarantine test and the latest full suite now pass this check.
- **Archived paragraph audit was not actionable and the SEO test applied a publishable-copy assertion to quarantined records.** The audit now records exact locations and cautious candidate classifications; the browser uniqueness assertion applies only to active public articles. The separate archived-review gate remains blocked and still reports all repeats. No archived text was rewritten or published.
- **Mobile Home keyboard-order test assumed adjacent tab stops.** It now verifies that Tab reaches all named actions in DOM order while allowing intervening controls, and checks each action's focusability, accessible name, and visibility. The targeted test and the full mobile browser suite pass.

## Previously reported seven failures and disposition

| Failure | Finding | Disposition |
|---|---|---|
| Preferred Compass save/watch loop | “Acme Corp” option comes from `example.test` fixtures without valid provenance; company rows are correctly withheld. The test also forces `TestAppAuthProvider`. | Marked `fixme` pending owner-reviewed company evidence and an approved signed-in QA session. |
| Compass company-change readout/watch payload | Same invalid Acme/Northstar fixtures; no eligible company rows or real auth. | Marked `fixme` for the same evidence and QA blockers. |
| Partial salary-source failure | Test expected obsolete “Partial read”; current UI says “Partial evidence” and retries without showing stale data. | Updated the assertions to the current contract; focused test passes. |
| Partial company-source failure | Test expected obsolete copy and an “Unavailable” score widget despite no eligible company record. | Updated it to check the current unavailable state and absence of an unverified score; focused test passes. |
| Failed save/watch context | A broad `role=status` locator matched both the app shell and the action status. The test also used the auth shim and invalid company fixture. | Scoped the locator; marked the auth/company-dependent loop `fixme`. |
| Partial layoff-source failure | Test expected obsolete “Partial read” and attempted to select a company that provenance filtering correctly removed. | Reframed it to verify the retry state and absence of unverified company/layoff rows; focused test passes. |
| Archived article paragraph uniqueness | Repeated authored paragraphs across quarantined records; exact report linked above. | Remains open for editorial review; no rewrite or publication. |

The three Compass source-failure checks pass as unauthenticated public-data tests. The three skipped Compass save/watch tests are not authenticated QA. The separate “return after authentication” flow also uses the test shim and does not prove real sign-in.

## Broader verification

- Web browser suite: 88 passed, 6 intentionally skipped, 0 failed.
- Mobile browser suite: 31 passed, 0 failed; mobile provenance and static-path unit suites: 8 passed.
- API unit suite: 65 passed; workspace typecheck and content/indexed-route unit suites passed.
- Published SEO verification passed for the three configured origins, 55 protected indexable routes, and 98 redirects. This checked the current production build; no new deployment occurred.
- Physical-device Google sign-in release readiness remains blocked: current-build PASS records are missing for iOS and Android development and production builds. The readiness script correctly reports these as NOT RUN.
