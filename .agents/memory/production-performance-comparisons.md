---
name: Production performance comparisons
description: Keep CareerReality local and live Lighthouse measurements comparable.
---

Do not call a local production build faster than live unless both audits load the same auth and third-party code. Deferred scripts can start after Lighthouse's quiet window; record requested runtime modules and use repeated runs because scores vary. Within one target, compare at least three runs with identical settings and use the median plus range; an earlier font request is not itself an LCP improvement. If the candidate intentionally removes Clerk from public pages, use the same auth-required route (such as sign-in) as a matched Clerk control, and report homepage auth and asset differences separately.

**Why:** A local mobile Lighthouse run scored higher than live while making no Clerk requests; live runs made ten. Repeated candidate runs also showed wide timing variance, and a Newsreader preload started earlier without improving LCP. These results show why network equivalence and repeated measurements matter more than a single score or resource start time.

**How to apply:** Before comparing scores, confirm relevant network requests and auth behavior in both traces, use identical mobile throttling, run multiple captures, and report ranges for noisy live results. Separate the public-home optimization result from any matched auth-route control.
