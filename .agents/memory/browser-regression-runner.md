---
name: Browser regression runner
description: Environment constraints for running the CareerReality Playwright browser suite
---

The browser regression suite should launch the system-provided Chromium binary and avoid Playwright video recording.

**Why:** The workspace does not cache Playwright-managed browsers or ffmpeg, while system Chromium is available and supports the suite.

**How to apply:** Preserve the explicit Chromium launch path and trace/screenshot diagnostics in the Playwright configuration when updating the browser tests.

Shared data imported by Playwright tests runs under Node's ESM rules, not Vite's JSON loader. Use an explicit JSON import attribute when such modules import JSON.

**Why:** A JSON import accepted by Vite can fail during Playwright test discovery before any tests run.

**How to apply:** When a test imports frontend data transitively backed by JSON, make the JSON boundary compatible with both Node ESM and Vite.

For large responsive-route audits, verify HTTP status with the request fixture and reuse one browser page for small batches of client-side route checks. Keep separate cold-load/hydration tests for direct navigation. In this workspace, four Chromium workers reduced throughput compared with the default two.

**Why:** Repeated full-page loads and fresh test contexts dominated the route sweeps, while four concurrent Chromium workers saturated the available CPU and completed fewer tests within the same five-minute run.

**How to apply:** Batch only route audits that share the same assertions; preserve independent scenario tests and direct-load coverage. Measure worker counts on the current runner instead of assuming more workers are faster.

Production E2E runs must build the client with `VITE_E2E=true` before starting the preview; a stale or non-E2E `dist` can render Clerk instead of the test sign-in controls and create false auth failures. A shared worker context can reuse browser asset cache, but clear cookies per test and clear local/session storage only once on each new page so reload behavior remains testable.

**Why:** The production preview does not rebuild the client, and clearing storage on every navigation broke tests that intentionally exercise page reloads.

**How to apply:** Use the package's production E2E build path before Playwright, and keep storage isolation scoped to each new page rather than each document navigation.

For release-suite timing on this runner, run one Playwright command at a time. A second focused/full browser process caused severe contention and parent-process failures; the isolated two-worker release run was stable.

**Why:** Chromium jobs compete for limited runner resources, so overlapping runs can turn a fast suite into a timeout or an abrupt process failure.

**How to apply:** Finish focused checks before starting the full production suite; do not launch screenshot or route-audit runs concurrently.

When a production dynamic import fails, recreating a React `lazy()` wrapper for the same module URL does not reliably trigger a fresh network request; the browser can retain the rejected module load. Use a page reload as the account-menu recovery path unless the chunk URL itself can be safely varied.

**Why:** The failed-chunk experiment timed out without a second request after the lazy component was recreated; a full reload recovered the original route and loaded the chunk.

**How to apply:** Keep the failed menu isolated behind its local error boundary, and verify reload recovery after removing the test network failure.

The local web E2E suite also needs the API Server workflow available on port 8080 before running browser batches.

**Why:** The Vite test server proxies public evidence requests to that service, and unavailable endpoints produce browser 500 errors that route-hydration tests correctly fail on.

**How to apply:** Start the managed API Server workflow before invoking the serial two-worker Playwright shards; do not treat proxy errors as harmless test noise.