---
name: Dependency security compatibility
description: Non-obvious compatibility and scan boundaries for security dependency upgrades.
---

Verify the immediate parent's actual import and runtime API when replacing a transitive dependency across major versions, rather than relying only on a clean audit.

**Why:** A patched URI decoder became ESM-only while its old CommonJS parent expected a callable require result. Upgrading the parent avoided introducing a runtime failure. Form resolver adapters also need to match the Zod major, including invalid-input behavior.

**How to apply:** Test valid and rejected inputs, module loading, and the relevant production bundles whenever security fixes cross these boundaries. Do not revert to Zod 3 to accommodate an older adapter.

Keep checked-in lockfile test fixtures on patched package versions.

**Why:** The security scanner discovers fixture lockfiles as well as the root lockfile. An obsolete fixture can keep findings visible even when the installed application dependency graph is clean.

**How to apply:** Generate stale-version negative cases in temporary test directories rather than storing vulnerable resolved versions in fixture lockfiles.
