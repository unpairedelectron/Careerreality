---
name: Production performance comparisons
description: Keep CareerReality local and live Lighthouse measurements comparable.
---

Do not call a local production build faster than live unless both audits load the same auth and third-party code. Deferred scripts can start after Lighthouse's quiet window; record requested runtime modules and use repeated runs because live scores vary. If the candidate intentionally removes Clerk from public pages, use the same auth-required route (such as sign-in) as a matched Clerk control, and report homepage auth and asset differences separately.

**Why:** A local mobile Lighthouse run scored higher than live while making no Clerk requests; live runs made ten. The apparent score gain therefore did not establish an equivalent production improvement. A matched sign-in route can verify the shared Clerk runtime without pretending that the optimized homepage has identical third-party work.

**How to apply:** Before comparing scores, confirm relevant network requests and auth behavior in both traces, use identical mobile throttling, run multiple captures, and report ranges for noisy live results. Separate the public-home optimization result from any matched auth-route control.
