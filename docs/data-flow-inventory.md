# CareerReality data-flow inventory

Reviewed 2 November 2026. This inventory describes observed production behavior and code-backed flows; it is not a complete provider, retention, or legal audit.

| Feature or route | Information / activity | Destination or storage | Evidence and limits |
|---|---|---|---|
| Pure calculation worksheets | Values entered for calculations | Browser memory; salary-calculator values were not present in the URL or observed network requests | Production and local code review; applies only to pure worksheets, not account or API-backed features |
| Public content routes | Page request, host cookie | CareerReality site host | Six production routes returned 200. No external font or analytics request was observed after self-hosting fonts. The host set `GAESA` with a 30-day expiry; its purpose is not established by application code. |
| Sign-in and account-required routes | Account identity and session authentication | Clerk; profile and career-brief history also use CareerReality's application database | Production `/sign-in` loaded Clerk UI and environment/client requests through the first-party proxy. Local `/sign-in` also contacted the configured Clerk host and `img.clerk.com` directly and exposed Clerk cookie names. No credentials were entered, so account payload fields and provider retention were not inspected. |
| Layoff-alert subscriptions | Email, email hash, optional city and sector, confirmation state, token hashes and timestamps | Application database; confirmation and alert messages through Resend after double opt-in | Schema, route code, and product flow. Unsubscribed records remain stored; a retention period is not established. |
| Former contact form | Name, email, topic, message, receipt timestamp | Formerly `contact_messages` table | Git history and schema confirm the fields. The production table had zero rows at the time of the read-only count on 2 November 2026. Copies in backups or logs and a retention schedule were not verified. Current endpoint returns HTTP 410. |
| Optional product analytics | Event names and selected route/category labels | An optional Umami browser object exists in code | No analytics-provider request was observed on the six sampled production routes. Provider configuration, recipients, identifiers, and retention remain unconfirmed. |
| Fonts | Manrope, Newsreader, DM Mono font files | CareerReality static assets | Exact Google Fonts WOFF2 files are self-hosted with their SIL Open Font License 1.1 texts. The sampled production routes no longer request Google Fonts. |

## Capture scope

Production routes sampled: `/`, `/salary-calculator`, `/guides/read-the-offer-beyond-ctc`, `/layoffs`, `/companies`, and `/privacy-policy`; `/sign-in` was captured separately. All returned HTTP 200. The six public routes showed no Clerk/auth requests. Sign-in loaded Clerk through the first-party proxy. The sample does not prove behavior on every route, after authentication, or under every consent or account state.

## Open operational questions

- Confirm the purpose and owner documentation for the `GAESA` host cookie.
- Confirm Clerk account data fields, provider-side retention, and deletion behavior.
- Confirm backup/log retention and deletion schedules for contact and alert records.
- Confirm whether any external analytics provider is configured outside the sampled routes.
