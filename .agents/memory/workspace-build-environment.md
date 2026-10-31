---
name: Workspace build environment
description: Multi-artifact Vite builds need the existing PORT and BASE_PATH environment values.
---

Run workspace builds with `PORT` and `BASE_PATH` supplied; the launch-video and mockup Vite configs require both during build even though their managed workflows inject them at runtime. For published SEO verification, use the public site root as `BASE_PATH=/`; the managed web preview remains mounted at its artifact prefix.

**Why:** A dependency-only verification can falsely look broken when the root recursive build stops before compiling packages because those build-time variables are absent.

**Why:** The production domain serves route canonicals from `/`, while the dev preview is path-mounted. Building with the preview prefix creates false canonical and Open Graph mismatches in the published SEO gate.

**How to apply:** Use `PORT=<available-port> BASE_PATH=/` for published-root builds and SEO checks. Leave artifact preview path injection to the managed workflow; do not alter intentional staging noindex differences to make the production comparison pass.