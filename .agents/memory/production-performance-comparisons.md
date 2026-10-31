---
name: Production performance comparisons
description: Keep CareerReality local and live Lighthouse measurements comparable.
---

Do not call a local production build faster than live unless both audits load the same auth and third-party code. Deferred scripts can start after Lighthouse's quiet window; record requested runtime modules and use repeated runs because live scores vary.

**Why:** A local mobile Lighthouse run scored higher than live while making no Clerk requests; live runs made ten. The apparent score gain therefore did not establish an equivalent production improvement.

**How to apply:** Before comparing scores, confirm relevant network requests and auth behavior in both traces, use identical mobile throttling, run multiple captures, and report ranges for noisy live results.
