---
name: OpenAPI and Zod generation compatibility
description: Compatibility constraints between the workspace's Orval generator and shared Zod runtime.
---

While shared validators remain on Zod 3, use OpenAPI `number` rather than `integer`, and use an explicit regex `pattern` rather than `format: email` for generated API validators.

**Why:** The current Orval generator emits `zod.int()` for OpenAPI integers and `zod.email()` for email-formatted strings; those APIs are unavailable in Zod 3, so valid-looking contracts fail during shared library typecheck.

**How to apply:** When adding whole-number or email fields, prefer `number` and a narrow email regex until the shared Zod runtime is intentionally upgraded and the full generated-client/server surface is revalidated.