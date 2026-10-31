---
name: Built mobile auth checks
description: How to validate Expo release bundles when email auth behavior is deterministic but mailbox-free.
---

Inspect both platform bundles for the shared auth selector factory, concrete code selector, field labels, action labels, and Clerk method names; do not expect label-derived input IDs to appear as literal strings after minification.

**Why:** Expo’s minifier preserves the runtime selector factory and computes field IDs from labels, while invalid-code responses are produced by Clerk at runtime rather than embedded in the app bundle.

**How to apply:** Pair the bundle marker check with a deterministic Clerk-shaped fixture that exercises invalid code, resend, verification, password update, and reset transitions, and verify each platform manifest points to the checked bundle.