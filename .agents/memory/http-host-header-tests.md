---
name: HTTP Host-header tests
description: Reliable way to send custom Host headers in local Node.js HTTP integration tests.
---

Node's built-in `fetch` does not reliably honor a manually supplied `Host` header in these tests. Use `node:http`'s `request()` when a local server's host-based routing must be exercised.

**Why:** The `www`-host redirect integration test appeared to return the apex 200 response because the test client sent its loopback host instead of the requested custom hostname.

**How to apply:** For code that branches on `request.headers.host`, issue the test request with `node:http`, explicitly set `headers.host`, and keep `fetch` for ordinary readiness checks.
