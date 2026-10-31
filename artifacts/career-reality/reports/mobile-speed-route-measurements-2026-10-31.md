# Mobile speed measurements: tools, guides, and layoff pages

**Captured:** 2026-10-31, 15:11 UTC  
**Source:** Published site at `https://careerreality.in`  
**Change/deploy status:** Measurement only; no production changes or publishing were performed.

## Results

Lighthouse 13.4.1 performance captures used mobile form factor, simulated throttling (150 ms RTT, 1,638.4 Kbps throughput, 4× CPU slowdown), the supplied report's Android 11 / Moto G Power user agent, and its 412×823, DPR 1.75 screen profile. Screen emulation was disabled to match the supplied report. The earlier homepage report was captured at 14:41 UTC; the new captures were run separately at about 15:11 UTC.

JavaScript transfer is the sum of positive `transferSize` values for script requests in Lighthouse's network-request audit. It includes route chunks and any Clerk scripts fetched during the capture, including requests that start after the initial render. Values are rounded to the nearest KB in the table.

| Page | Route | LCP | TBT | Speed Index | JavaScript transfer |
| --- | --- | ---: | ---: | ---: | ---: |
| Supplied homepage baseline (14:41 UTC) | `/` | 4.05 s | 418 ms | 10.14 s | 552 KB |
| New homepage control | `/` | 1.72 s | 351 ms | 7.53 s | 547 KB |
| Public tool — CTC calculator | `/salary-calculator/` | 5.38 s | 435 ms | 2.41 s | 563 KB |
| Editorial guide — CTC vs take-home | `/guides/read-the-offer-beyond-ctc/` | 5.14 s | 310 ms | 2.39 s | 539 KB |
| Layoff support hub | `/layoffs/` | 5.04 s | 185 ms | 1.89 s | 558 KB |

The new homepage capture is a control, not a before/after test. Its differences from the supplied baseline (lower LCP, TBT, and Speed Index, with nearly unchanged JS bytes) cannot be attributed to auth deferral: the captures are separate runs, and the supplied report used the DevTools channel while these new reports used Lighthouse CLI.

## Auth deferral finding

The source schedules Clerk for public routes after five seconds, but these captures do not establish that the delay consistently applies to the sampled routes:

- In the new Lighthouse traces, the first `clerk.browser.js` request was at about 5.57 s for the homepage, but at 0.84 s for the tool, 0.53 s for the guide, and 0.37 s for the layoff hub.
- A separate, unthrottled browser navigation check observed Clerk requests within 0.29–0.58 s on all four pages. The supplied homepage baseline instead shows the first Clerk request at about 6.12 s.

Because the Lighthouse trace timings and the separate browser check disagree, and there is no pre-deferral route baseline, this measurement cannot support a claim that auth deferral improved the tool, guide, or layoff routes. It does show that Clerk is still transferred during public-page loads (about 84 KB for `clerk.browser.js`, plus UI bundles), and that the deferral behavior needs route-level verification.

## Remaining measured bottlenecks

- **Large JavaScript and main-thread cost:** Lighthouse reports 2.3–3.3 s of main-thread work on the new captures. Its unused-JavaScript audit estimates 286–298 KiB of savings; the Clerk UI bundles and shared app entry are among the largest flagged files.
- **High TBT on the tool and guide:** 435 ms on the calculator and 310 ms on the guide, compared with 185 ms on the layoff hub.
- **LCP remains slow on the three requested routes:** Each is above 5.0 s in this run, while the new homepage control is 1.72 s. The measured TTFB subpart is about 0.10–0.21 s, so server response time is not the largest reported part of the LCP path.
- **Render-blocking stylesheet:** The shared ~30 KB stylesheet is flagged on all routes, with estimated savings between 110 and 300 ms.

## Limits and reproduction

These are single-run diagnostics, not field data or a release gate. The Lighthouse CLI and DevTools capture channels differ, and Lighthouse results vary between runs. Use the route captures to identify work, not to claim a precise before/after improvement.

For another capture, use Lighthouse 13.4.1 against each route above with mobile form factor, the supplied throttle and user-agent settings, `--screenEmulation.disabled`, `--only-categories=performance`, and JSON output. The original homepage report is `attached_assets/careerreality.in-20261031T074131_1793457899263.json`.

## Local production-build comparison

**Captured:** 2026-10-31, after the guide data split
**Source:** Local Vite production preview, before and after the source change; not the published site
**Method:** Lighthouse 13.4.1, mobile form factor, 150 ms RTT, 1,638.4 Kbps throughput, 4× CPU slowdown, the same Android 11 / Moto G Power user agent and viewport profile, with screen emulation disabled. One run per route per build. JavaScript transfer is the sum of script `transferSize` values.

| Page | LCP before → after | TBT before → after | Speed Index before → after | JavaScript transfer before → after |
| --- | ---: | ---: | ---: | ---: |
| CTC calculator | 5.17 s → 5.17 s | 111 ms → 280 ms | 1.74 s → 1.58 s | 182,258 B → 182,306 B |
| CTC vs take-home guide | 4.72 s → 4.41 s | 87 ms → 111 ms | 1.56 s → 1.57 s | 243,102 B → 173,002 B |
| Layoff support hub | 4.58 s → 3.86 s | 101 ms → 42 ms | 1.61 s → 1.51 s | 170,931 B → 170,972 B |

The guide route transfers 70,100 fewer JavaScript bytes (28.8%). Its former all-guides page chunk transferred 82,676 bytes; the route now transfers the 8,484-byte page chunk and the 4,046-byte guide-data chunk for this guide only. The calculator and layoff route transfers are effectively unchanged. Their timing differences, and the guide timing differences, should not be attributed to the code change from these single runs. The local and published measurements are not interchangeable: the local preview does not reproduce the Clerk requests observed in the published captures.
