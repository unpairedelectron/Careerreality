# High-severity dependency and SAST triage

## Dependency scan

Latest triage baseline: **0 critical, 6 high, 13 moderate, 4 low**. The 6 high entries are 3 workspace findings plus 3 intentionally vulnerable dependency-lock fixtures.

### Compatible fixes applied

| Package | Before → after | Classification | Change |
|---|---|---|---|
| `body-parser` | 2.3.0 → 2.4.0 | API runtime transitive | Patched compatible release pinned in workspace overrides. |
| `brace-expansion` | 5.0.9 → 5.0.12 | Build/tooling transitive | Updated existing workspace pin; fixes the audited v5 advisories. |
| `compression` | 1.8.1 → 1.8.2 | Expo development/build tooling | Patched compatible release pinned. |
| `js-yaml` | 4.3.1 → 4.3.2 | API-spec development tooling | Updated existing workspace pin. |
| `markdown-it` | 14.3.0 → 14.3.3 | Workspace transitive | Patched compatible release pinned. |
| `multer` | 2.3.0 → 2.5.0 | API runtime, shared upload path | Updated the API server's direct dependency; kept its upload contract and limits. |
| `shell-quote` | 1.10.0 → 1.11.0 | Build/tooling transitive | Patched compatible release pinned. |
| `source-map-js` | 1.2.1 → 1.2.2 | Build/tooling transitive | Patched compatible release pinned. |
| `vite` | 7.3.6 → 7.3.7 | Development/build tooling | Updated the shared Vite catalog within major version 7. |

### Remaining high findings

| Package | Classification | Decision |
|---|---|---|
| `node-forge` 1.4.0 | Build-only: pulled by Expo code-signing tooling, not application request handling. | No fixed release was reported by the dependency audit; retained and documented rather than replacing an Expo signing dependency without a supported version. |
| `uuid` 7.0.3 | Build-only: nested under the Expo/iOS `xcode` tooling dependency. | The reported fix is 11.1.1, outside the parent's declared `^7` range. A forced override was tested against lock validation and rejected; no major override was retained. |
| `zod` 3.25.76 | Shipped runtime: shared API/database validators. | The scanner reports only 4.6.6 as fixed, a major-version migration. Kept Zod 3 to avoid an unreviewed cross-workspace migration; track a bounded Zod 4 migration separately. |
| `brace-expansion` 5.0.9 (2 findings) | Fixture-only: `scripts/fixtures/dependency-lock/pnpm-lock.yaml`. | These entries deliberately model a stale lockfile for the dependency-lock validator. They are not installed or shipped. |
| `js-yaml` 4.3.1 (1 finding) | Fixture-only: `scripts/fixtures/dependency-lock/pnpm-lock.yaml`. | Deliberately vulnerable stale-lock fixture; not installed or shipped. |

The high list above accounts for all six remaining high scanner entries. The fixture file was not changed because doing so would invalidate the stale-lock regression case.

## Static-analysis and privacy scans

- SAST: **2 high alerts remain**, both `javascript.express.file.fs-express.fs-express` in `artifacts/career-reality-mobile/server/serve.js`.
  - The manifest read uses a fixed iOS/Android path allowlist, resolves the existing file through `realpath`, and checks containment inside the static root.
  - Static asset reads first reject lexical traversal, then resolve symlinks and require the real path to remain under the static root before opening it.
  - Tests cover allowlisted manifests, encoded and literal traversal, malformed encoding, null bytes, backslashes, and symlinks escaping the root. A live local static-file request returned 200.
  - These are assessed as **non-applicable path-traversal alerts**, not suppressed; the scanner does not infer the custom path-validation helper.
- HoundDog: **0 findings**.

## Regression checks

- Dependency-lock fixture validation and lock consistency passed after removing the experimental `uuid` override; the lock validator would not accept that forced major resolution.
- API server typecheck passed.
- Resume/compensation tests passed **16/16**, including upload limits, auth/consent behavior, transient parsing, and log redaction. The log-redaction test fixture now supplies its required test identity and consent header.
- Mobile static-path tests passed **6/6**; a local static-file serving smoke request returned 200.
- The Job Posting Reality Check component, route, and upload behavior were not changed.
