---
name: Mobile grouped-route E2E auth
description: Reliable signed-in browser fixtures for Expo Router tab-group root routes.
---

Expo Router’s grouped tab root can redirect to the app root and drop query parameters. A browser fixture that relies only on `?e2e-auth=signed-in` may therefore render the unauthenticated branch even though the initial URL contained the marker.

**Why:** This caused a Home profile-recovery test to skip its authenticated brief request while equivalent nested tab routes preserved the query.

**How to apply:** Keep the query marker for nested routes, but also set `career-reality-e2e-auth=signed-in` in localStorage during development-only browser fixtures. Read either marker only inside `__DEV__` code paths.