---
name: Public API route ordering
description: Express route composition constraint for public and authenticated API endpoints
---

Mount unauthenticated public routes before every router with broad authentication middleware, not only the workspace router.

**Why:** Auth-scoped career and workspace routers can intercept unrelated public paths with a signed-out 401 before later routers match.

**How to apply:** Keep public endpoints near the top of the route aggregator, before career, jobs, catalog, and workspace routers; test an unauthenticated request to confirm it reaches the intended handler.