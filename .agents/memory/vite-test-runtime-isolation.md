---
name: Vite test-runtime isolation
description: Keep deterministic auth test providers out of production bundles.
---

When a browser test needs a deterministic replacement for a runtime dependency, resolve the runtime import through a Vite alias configured only for the test server instead of keeping both modules behind a conditional dynamic import in application code.

**Why:** Vite's production build retained the alternate auth runtime as a separate chunk even when its environment condition was false.

**How to apply:** Keep production imports mapped to the real Clerk runtime, set the replacement alias only from the dedicated Playwright server environment, and verify the test-only chunk is absent after a production build.
