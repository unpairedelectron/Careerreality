---
name: Static route boundaries
description: The CareerReality static host must distinguish generated valid routes from unknown URLs.
---

The production static artifact should not use a catch-all SPA rewrite when crawler and HTTP 404 behavior matter. Generate snapshots for public routes and app shells for valid private/auth aliases; let missing files return the host's real 404.

**Why:** A catch-all rewrite makes every typo and removed URL return the homepage with HTTP 200, while removing it without app shells breaks direct navigation to valid workspace, auth, and tool-alias routes.

**How to apply:** When adding a top-level route, classify it as public snapshot, private/auth app shell, or intentionally invalid. Update both route generation and snapshot verification together.