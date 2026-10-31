---
name: Expo API preview origins
description: Managed Expo web previews use a separate origin from the shared API development domain.
---

The API development CORS allowlist must include the managed Expo preview origin as well as the shared Replit development origin.

**Why:** Expo web previews use an `.expo.sisko.replit.dev` host while API requests use the sibling `.sisko.replit.dev` host, so an API allowlist containing only the shared dev domain makes live public-data reads fail in the preview.

**How to apply:** Keep `REPLIT_EXPO_DEV_DOMAIN` in the API’s development CORS origins and verify an authenticated/public read from the Expo preview after restarting the API.