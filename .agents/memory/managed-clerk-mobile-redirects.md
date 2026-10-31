---
name: Managed Clerk mobile redirects
description: Replit-managed Clerk behavior for Expo OAuth callback registration across release environments.
---

Replit-managed Clerk automatically configures Expo Google OAuth callback handling for its isolated Development and Production environments. The app must still keep one explicit native scheme and callback route, and release hardware testing is the only way to prove the browser handoff returns on iOS and Android.

**Why:** Managed Clerk dashboard access may be unavailable in the workspace, while the platform's official behavior guarantees environment setup; source validation can prove the app contract but not a physical browser handoff.

**How to apply:** Verify the Expo scheme, callback route registration, and identical redirect options in every mobile auth entry point. Treat real-device iOS/Android testing as a release check rather than inventing dashboard configuration in code.