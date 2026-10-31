---
name: Market refresh profile upsert
description: Mobile market-only refreshes must establish the authenticated profile before reading the personalized brief.
---

A mobile user can have a complete local profile before the server has a career profile row. Market-only refresh must upsert the current profile before requesting the personalized brief.

**Why:** The authenticated brief endpoint is profile-backed; requesting it directly on a first-run device can return a missing-profile response even though the user has already completed local onboarding.

**How to apply:** Keep the profile sync and brief read in the same refresh flow, while preserving the previous intelligence until the brief succeeds.