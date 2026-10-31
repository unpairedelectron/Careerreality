---
name: API test runner
description: Run API TypeScript tests through the workspace scripts package rather than Node directly.
---

API tests use Node's test runner through the scripts workspace package: `pnpm --filter @workspace/scripts exec tsx --test ...`.

**Why:** Direct `node --test` cannot resolve this monorepo's extensionless TypeScript workspace imports, while the existing scripts package provides the supported TypeScript runtime.

**How to apply:** Use the scripts-package tsx command for focused API tests and keep production packages free of a test-only runtime dependency.