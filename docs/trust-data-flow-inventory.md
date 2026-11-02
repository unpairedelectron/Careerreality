# Trust-page data-flow inventory

Updated 2 November 2026. This documents source-code observations. A browser request capture against the changed development build and production configuration remains a release gate; dev behavior cannot prove production cookies, analytics, retention, or provider settings.

| Page/feature type | Input and observed handling | External or persistent boundary | Unverified |
|---|---|---|---|
| Pure public worksheets | Calculations use entered values in the browser; privacy tests check salary amounts do not enter URLs, requests, storage, or reviewed analytics events | No server write for the tested salary calculator flow | Other tool-specific persistence/network behavior needs route-by-route capture |
| API-backed public data | Some pages request current data from the application API; report, job-link, alert, and catalog-suggestion endpoints have distinct handling | First-party API; selected flows use provider data or Resend email | Production payloads, logs, backups, geographic handling |
| Layoff planner | Sensitive role, cash, pay and expense values remain page-memory only; do not add to URLs, storage, API, or analytics | None for those planner inputs | Browser extensions and platform-level infrastructure outside app code |
| Contact | UI and API form path withdrawn; POST returns HTTP 410 and no longer inserts records | Email is the sole published route | Existing database records, mail provider routing, access, retention, deletion |
| Account/workspace | Clerk sign-in; profile and career-brief records are account-scoped in application code | Clerk and application API/database | Live Clerk provider settings, cookies, data region, backups and deletion semantics |
| Resume and submitted job links | Not represented as live public functionality pending operational safeguards | Routes/code are guarded and require separate production approval | Confirm production behavior with safe no-content checks before re-enabling |
| Analytics | Optional `window.umami` helper emits event names and selected labels; privacy tests reject sensitive amount/free-text dimensions | External analytics only if a provider script is configured | Production script, cookies/identifiers, recipients, consent/opt-out, retention |
| Static editorial and trust pages | Page requests load site assets and any shared application bundles | First-party site origin; no form submission on page load | Live third-party requests and browser storage must be captured on each page family |

The Playwright network-capture test records requested origins, response status, cookie names, local/session storage keys, and route results without submitting personal data. Review its run output before treating it as evidence. Do not treat local development capture as proof of live deployment behavior.
