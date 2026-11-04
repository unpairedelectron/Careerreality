# Mobile homepage release check

Run from the workspace root:

```sh
pnpm --filter @workspace/career-reality run verify:mobile-homepage-lighthouse
```

This builds the actual production homepage (including its static snapshot), forces
the real auth runtime rather than E2E fixtures, and serves it with the published
static server. It does not publish anything or change the running dev preview.
The normal build requires the project's configured canonical site URL.

Three sequential cold Lighthouse navigations use the same mobile profile:
412×823, DPR 1.75, simulated 150 ms RTT, 1,638.4 Kbps throughput, and 4× CPU
slowdown. Each navigation observes at least eight seconds after load to cover
delayed React startup and auth imports. Run on an otherwise idle machine; CPU
contention still affects simulated results.

The existing release budget is **median LCP ≤ 2,000 ms**. The command exits
nonzero when the median exceeds that budget, any run attempts a Clerk request
(including failed requests or local Clerk chunks), or required audit/network
evidence is missing. It prints performance score, LCP, FCP, and CLS ranges, plus
median LCP. CLS and score are diagnostic ranges, not additional pass/fail budgets.
The Clerk assertion covers the observation window, not indefinitely delayed work.

JSON audits, traces, raw network logs, and a machine-readable summary are retained
under `generated-artifacts/homepage-lighthouse/run-*` at the workspace root.
This directory is excluded from Git and publishing; delete old runs as needed.
Use `pnpm --filter @workspace/career-reality run test:mobile-homepage-lighthouse`
for fast tests of the gate's failure conditions.

Optional explicit settings:
- `CHROME_PATH`: Chromium executable (default `/repl/tools/bin/chromium`).
- `LIGHTHOUSE_PREVIEW_PORT`: unused local port (default `4175`).
- `HOMEPAGE_LCP_BUDGET_MS`: intentional positive budget override, printed in the
  summary. Do not raise it just to make a regression pass.

Compare repeated runs on this same profile and runner. These local candidate
numbers are not a claim about live-site or field performance.
