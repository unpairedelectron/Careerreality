---
name: Current-route readiness
description: How to reconcile readiness assessments when a tool has been renamed, redirected, or replaced.
---

Only an assessment that matches a current tool route may contribute a readiness status or numeric score to the current portfolio. A similar-purpose legacy record can be cited as historical context, but it must remain unscored for the current route until reviewed.

**Why:** The readiness inventory can contain renamed tools and redirected routes whose old scorecards do not establish the quality of the current experience.

**How to apply:** When the public route registry changes, reconcile its tool IDs against assessments by exact route; label missing or stale records as needing review rather than carrying scores forward.

The readiness desk must use the existing server-checked catalog-editor/admin roles; sign-in alone is not reviewer authorization.

**Why:** Readiness notes are internal quality records, and the app previously admitted any signed-in user.

**How to apply:** Keep the API authorization check ahead of the lazy dashboard load and preserve the current role allowlist when changing the desk route.
