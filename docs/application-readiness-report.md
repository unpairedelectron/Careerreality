# CareerReality application-readiness report

**Assessment date:** 2026-10-09  
**Scope:** remediation branch and local staging preview only  
**Decision:** **Do not publish.** No production deployment, production-data change, article publication, indexing request, or advertising change was made.

## Executive summary

The readiness register covers 11 applications with 12 weighted dimensions per scorecard and a 90/100 release target. All 11 scores are below the target, so no application is marked ready. Hard blockers remain visible regardless of score.

| Application | Weighted score | Current status |
|---|---:|---|
| CTC / in-hand calculator | 71.90 | Blocked by human input |
| Salary Reality | 72.20 | Not ready |
| Career Compass | 79.90 | Not ready |
| Layoff Radar | 68.20 | Not ready |
| Resignation Risk checklist | 79.95 | Not ready |
| Company Intelligence | 60.10 | Blocked by human input |
| AI / Career AI prompts | 75.30 | Not ready |
| Career Reality Index | 75.40 | Not ready |
| Salary Drop planner | 79.05 | Not ready |
| Escape Plan | 78.25 | Not ready |
| CareerReality Mobile | 69.70 | Blocked by human input |

There are four recorded hard blockers across the register: qualified tax review, layoff-event classification, a human-reviewed company-scoring method, and authorized native release-device QA. The first, third, and fourth are explicitly labeled **Blocked by human input**; Layoff Radar remains **Not ready** with its taxonomy blocker recorded.

## Work completed

- Added a sign-in-gated `/admin/application-readiness` register with weighted scorecards, status/search filters, per-application checks, tests, blockers, and recommendations. The route is noindex.
- Added the 90/100 threshold and hard-blocker precedence to the readiness model. Invalid scorecard values fail explicitly.
- Created 88 application-specific documents: eight documents in each of the 11 application folders under `docs/applications/`.
- Kept the Career Reality Index as a self-reported reflection prompt, not a score, diagnosis, employer assessment, or prediction.
- Kept compensation and personal circumstances in page state for the local calculators. Browser tests check that salary inputs do not appear in browser URLs, browser storage, request URLs/bodies, or analytics.
- Preserved separate evidence and freshness states for public market data; missing or ineligible evidence does not become a current result.
- Kept company scores withheld pending a reviewed, versioned methodology. Tax outputs remain estimates pending qualified review.
- Updated the application’s route metadata and sitemap exclusions for the assessed application routes. Local route snapshots passed verification.

## Verification

All checks below were local or fixture-based; they do not constitute production, human, or device approval.

| Check | Result |
|---|---|
| TypeScript typecheck | Passed |
| Application model and readiness tests | 15 passed |
| CTC/tax calculation tests | 13 passed |
| Indexed-route logic tests | 5 passed |
| Mobile static-path boundary tests | 4 passed |
| Focused Playwright browser suite | 20 passed |
| Local Vite build | Passed |
| Post-build route verification | 104 crawler-visible route snapshots and 12 app shells generated and verified |

The browser suite covered readiness-route sign-in and return navigation, the dashboard’s no-admin-role disclosure and blocker filter, public route hydration, calculator behavior, Salary Reality evidence/error states, and privacy-safe analytics. Salary Reality tests used deterministic fixtures with complete provenance; they do not verify the live dataset’s freshness or representativeness.

The public Career Reality Index route was visually checked in the local preview. The signed-in readiness view was exercised by browser tests using the project’s E2E sign-in fixture; it was not visually inspected through the screenshot browser, which is unauthenticated.

## Security findings

The required scans reported:

- **Dependency audit:** 1 critical, 12 high, and 10 moderate findings across the workspace dependency graph. The critical finding is `proxy-addr@2.0.7`, with `2.0.8` listed as the fix. High findings include `brace-expansion`, `braces`, `compression`, `js-yaml`, `node-forge`, `shell-quote`, `source-map-js`, and `uuid`; some findings do not have a fix listed, while `uuid` requires a major version change.
- **SAST:** two high path-traversal findings in the mobile static server’s file reads. The current code constrains paths with a resolver and canonical-root checks, and the four static-path boundary tests pass. The scanner findings remain open pending security review; they are not recorded as cleared.
- **HoundDog:** zero findings.

Dependency remediation and security review remain release blockers. No dependency upgrades were applied in this assessment.

The local build completed with source-map location warnings for shared UI components and a large JavaScript-chunk warning (about 1.76 MB minified, 472.78 kB gzip). These should remain visible in performance follow-up; they did not fail the build.

## Remaining review and release gaps

1. A qualified tax reviewer must approve the current tax-year rules and payroll assumptions before any tax or take-home figures are presented as more than estimates.
2. A human reviewer must approve and version the company-scoring methodology before numeric company assessments can be restored.
3. Layoff reporting needs an approved taxonomy that distinguishes confirmed announcements, independent reporting, unverified reports, restructuring, and hiring slowdowns.
4. Native authentication, market refresh, and signed-in decision flows still need authorized release-device QA, including accessibility review.
5. The dependency findings and two SAST alerts need security triage. The static-path tests do not substitute for review of the scanner alerts.
6. The readiness page requires sign-in but has **no role-level admin authorization**. It must not be treated as an admin-secure control plane.
7. Full assistive-technology review, physical-device review, and live market-data freshness/coverage checks remain incomplete for the affected applications.
8. A previous published-SEO check remains failed and was not rerun here. Its recorded result was three local failures and one published failure; the published sitemap contained 69 URLs versus 9 expected locally (60 unexpected). No indexing request was made. The successful local snapshot build does not resolve that published sitemap discrepancy.

## Release decision

Keep this work on the remediation branch and staging preview. Do not publish or request indexing until the human-review, security, authorization, and published-SEO gaps above are resolved and reverified.
