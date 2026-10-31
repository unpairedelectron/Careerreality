# Tool entry-point and query map

This map covers the CareerReality public-tool links and query behavior relevant to the CTC calculator. It is not a claim that every application route is query-free.

| Entry or route | Values read from URL | Values written to URL | CTC handoff |
| --- | --- | --- | --- |
| Homepage `/` | None for the calculator entry | None | Direct link to `/salary-calculator`; no salary form or prefill |
| Salary Reality `/salary-reality` | `role`, `city`, `experienceBand` | Those selected context values are kept in the route query | “Decode this offer” opens `/salary-calculator` without role, city, salary, or other query values |
| Layoff Radar `/layoff-radar` | `query`, `type` | Current search and filter state | No CTC handoff |
| CTC calculator `/salary-calculator` | None | None | All calculator inputs remain in current page form state |
| Sign-in redirect from a save/watch control | `redirect_url` carries the originating path and query | None from the CTC tool | The calculator has no save/watch control and does not create this redirect |

The live calculator includes an `#method` anchor for direct access to its assumptions and sources; the anchor is not a place to store inputs. Static route snapshots preserve that anchor. A URL fragment is not used to prefill or retain salary values.

## Privacy verification contract

- No CTC, fixed-pay, variable-pay, tax, PF, or take-home amount is read from or written to the calculator URL.
- The calculator does not update browser history, local storage, session storage, analytics dimensions, API requests, server logs, or a saved-decision record with entered amounts.
- Home and Salary Reality links are checked as path-only handoffs.
- `tests/analytics-privacy.spec.ts` checks the URL, both browser storage areas, analytics events, and request URL/body strings after entering a distinctive CTC amount.
