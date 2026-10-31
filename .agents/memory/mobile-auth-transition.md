---
name: Mobile auth transition
description: Native Clerk completion should wait for confirmed session and local hydration before routing.
---

After native Clerk sign-in or sign-up finalization, route only after `isSignedIn` and app-local hydration are both settled; avoid sending the user through an intermediate root redirect.

**Why:** On slower physical devices, finalization and auth/context state updates can land in different frames, causing a visible blank/sign-in loop and duplicate-submit races.

**How to apply:** Keep completion in a stable loading state, catch both returned Clerk errors and thrown transport errors, then navigate directly to onboarding or the authenticated tab shell.