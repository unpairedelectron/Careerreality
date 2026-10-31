---
name: Replit-managed Clerk provider support
description: Social provider availability and implementation boundary for this product's managed Clerk tenant.
---

Replit-managed Clerk currently supports Google, GitHub, Apple, and X social sign-in, but not LinkedIn. LinkedIn cannot be made functional in app code alone; do not ship a LinkedIn button that starts a dead OAuth flow.

**Why:** A premium auth surface should not promise a provider the managed tenant cannot complete.

**How to apply:** Keep Google and supported providers in the product UI. If LinkedIn is requested again, explain the managed-Clerk limitation before considering an auth-provider migration.