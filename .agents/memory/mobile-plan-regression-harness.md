---
name: Mobile Plan regression harness
description: The Expo web preview can run deterministic Plan lifecycle coverage through the web artifact's Playwright dependency.
---

Use a development-only signed-in query override and route-level API fixtures for mobile web-preview regression tests; keep those E2E files outside the Expo typecheck and run them through the existing web Playwright dependency with system Chromium.

**Why:** The mobile artifact does not carry its own Playwright dependency or a live Clerk session, while Plan lifecycle regressions need real rendered UI assertions rather than API-only checks.

**How to apply:** For future mobile web-preview tests, reuse the mobile Playwright config and package script pattern, mock the career brief/action endpoints, and assert visible states and section counts.