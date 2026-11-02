---
name: Public API route ordering
description: Express route composition constraint for public and authenticated API endpoints
---

Mount unauthenticated public routes before every router with broad authentication middleware, not only the workspace router. This includes the resume-intelligence router, whose authentication guard can intercept unrelated paths mounted after it.

**Why:** Auth-scoped career and workspace routers can intercept unrelated public paths with a signed-out 401 before later routers match.

**How to apply:** Keep public endpoints immediately after health routes, before data, resume-intelligence, career, jobs, catalog, and workspace routers; test an unauthenticated request to confirm it reaches the intended handler.