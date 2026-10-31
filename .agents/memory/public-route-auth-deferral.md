---
name: Public-route auth deferral
description: Keep Clerk work off public routes without weakening protected-route auth.
---

Public pages should use the lightweight public auth context and must not import Clerk on a timer. Load Clerk when navigation reaches a sign-in, sign-up, or protected route; keep the runtime active afterward so authenticated navigation continues to work.

**Why:** The user chose on-demand auth to keep Clerk work off public-page visits, accepting that signed-in state is discovered when they enter an auth or protected route.

**How to apply:** Keep auth-required routes immediate and fail-closed if Clerk fails. Test that public pages stay auth-free beyond the old timer and that in-app navigation to protected pages loads auth.
