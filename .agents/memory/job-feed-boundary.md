---
name: Job feed boundary
description: Production Jobs sourcing must use official ATS feeds or an approved provider; major boards remain outbound-only unless an approved API exists.
---

The Jobs experience should never scrape LinkedIn, Naukri, Wellfound, Monster, or similar sites. Official Greenhouse, Lever, and Ashby feeds are safe adapters, while broader coverage requires an explicitly approved provider connection. Keep source URLs, verification time, provider health, and application lifecycle visible so users can distinguish a live recommendation from an outbound search.

Until recommendations are genuinely scoped to a user's saved career profile, the mobile Jobs surface should remain a coming-soon promise instead of exposing generic or weakly matched listings.

**Why:** Job boards change markup and terms frequently, and silently presenting scraped or stale listings would undermine CareerReality’s evidence and trust model.

**How to apply:** Extend the normalized feed boundary in the API server, configure feeds through the workspace environment, and keep the mobile queue explicit when no feeds are configured or a provider is unavailable. Re-enable the queue only when match evidence and application assistance are user-specific enough to justify it.