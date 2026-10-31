# Resume and job-link safeguards

## Current release boundary

- By default, the Job Posting Reality Check analyzes manually pasted text or PDF/DOCX text extracted locally in the browser. Resume files are not sent to the server. Local extraction limits files to 5 MB, PDFs to 30 pages, DOCX archives to 20 MB expanded and 256 entries, and extracted text to 30,000 characters; scanned PDFs fall back to manual paste without OCR. Extracted resume text and fetched job-page text are editable and require explicit review before analysis. A separate, gated option fetches supported public job links. Keep production job-link fetching disabled until its operator checks and security tests pass.
- Resume file processing is disabled by default in the API and hard-disabled when `NODE_ENV` is `production`, even if explicitly enabled. Keep that production guard until the approved contract is implemented in the client and production controls are verified.
- User-submitted job URL fetching is implemented for a narrow allowlist of Greenhouse, Lever, and Ashby job pages. It is disabled by default; do not enable production until the operator checks and security tests below are complete. Existing job-feed URL handling is not permission to fetch arbitrary user URLs.
- Account creation is not consent to upload or fetch resume/job content. Obtain feature-specific consent immediately before any such transfer.

## Benchmark and research use

- The job-posting benchmark currently contains synthetic examples only. Do not add real resume/job pairs or supporting excerpts to source control, test fixtures, logs, analytics, or public reports.
- Product consent does not authorize use in a benchmark study. Before any human review, obtain specific participant consent and privacy review covering the representative source, study purpose, independent reviewers, data handling, retention/deletion, and any transfer to reviewers.
- Use an approved controlled environment with least-privilege reviewer access and a documented deletion schedule. Keep raw source content and the mapping to any de-identified study records out of the product and the public report; publish aggregate results only.
- A study is not approved merely because data is publicly accessible, manually pasted, or de-identified. If a consented and approved source, reviewer controls, or held-out separation is unavailable, leave independent validation marked as pending and make no real-world accuracy or reliability claim.

## Approved resume-data contract

Before any resume upload, the feature must state that the selected file and extracted text leave the device and are sent to CareerReality's first-party API for the stated analysis. Explain the data categories, purpose, processing destination, and retention in plain language. Require an unchecked, affirmative consent control; do not infer consent from sign-up, continued use, or a preselected option. Do not send resume text to an AI model, analytics, or another processor unless that separate destination and purpose are disclosed and approved first.

Default retention is transient processing only: keep file bytes and extracted text in memory for the active request, do not persist them to a database, object store, cache, backups, or logs, and clear buffers after processing. Do not retain filenames, excerpts, inferred skills, or employer names beyond the response unless separately approved and explained. A user must be able to cancel before transmission and clear the local form/results; because no server copy is retained under this contract, there should be no retained resume record to delete. If any durable copy is introduced, block release until a user-facing deletion path, deletion timing, backup expiry, and verified deletion procedure are defined.

Require a signed-in session and enforce per-account limits before accepting an upload. Keep each result scoped to the submitting user; do not expose uploaded documents or extracted text to support staff, administrators, or other users through dashboards or logs. Operational logs may contain only non-content metadata needed for reliability and abuse prevention. Verify production request-body logging, error reporting, traces, backups, and service access controls before enabling the route; code-level in-memory handling alone does not establish these deployment controls.

## Job-link fetching contract and controls

Fetching a user-provided URL from a server can expose private services and cloud metadata through server-side request forgery. Do not add a general-purpose fetch or proxy endpoint. Before enabling the existing allowlisted feature in production:

- Accept only `https` URLs; reject credentials, unsupported ports, localhost and internal hostnames, and non-public IPv4/IPv6 literals, including IPv4-mapped IPv6.
- Resolve the hostname and reject the request if any resolved address is non-public. Pin the validated address for the connection or otherwise prevent DNS rebinding; repeat validation for every redirect.
- Disable automatic redirects, allow only a small fixed redirect count, and validate each destination before following it. Reject redirects to a different disallowed host or address.
- Apply strict connection/read timeouts, response-size limits, content-type allowlists, and a narrow GET-only policy. Do not forward cookies, authorization headers, or other caller credentials.
- Do not put the submitted URL, fetched page body, or extracted text in logs, analytics, or error messages. Do not fetch authenticated or paywalled pages.
- Show a just-in-time notice that the URL and public page content will be sent to CareerReality's server, explain processing and retention, and require affirmative consent before the request.
- Test DNS rebinding, redirect chains, private/reserved address ranges, malformed URLs, oversized responses, timeouts, and non-HTML responses. Prefer a vetted egress-control layer in addition to application checks.
- The product owner approved transient first-party processing on 2026-10-28. The page text and submitted URL are not persisted or logged; resume text is not sent.
- Production remains disabled unless both `JOB_LINK_FETCH_ENABLED=true` and `JOB_LINK_FETCH_PRODUCTION_READY=true` are set on the API, and `VITE_JOB_LINK_FETCH_ENABLED=true` is set for the web build. Operators must verify request logging, traces, backups, service access, and deployment behavior before setting the production-ready flag.

## Earlier production resume-processing audit — 2026-10-28

- A live audit request used only synthetic marker data. `POST /api/resume/intelligence` returned HTTP 422 from the PDF-processing error path rather than the expected unavailable response. This showed that the build serving at that time attempted to parse the dummy upload; it predates the later deployment check below. Do not send real resumes or treat that historical result as the current route state.
- The available 16:20–16:30 UTC runtime entries contained the parser error type and route status only. Searches for the synthetic file-name, upload-byte, field, extracted-text, and excerpt markers returned no log matches. This is evidence about the available application logs only, not other telemetry systems.
- Replit documentation states deployment logs are retained for 30 days and are visible to builders with project access. The deployment is public to app visitors; this does not make its operational logs public. The actual workspace member list and service-operator access were not available to this audit.
- Replit production database backups are configurable through scheduled backups and point-in-time restore; retention depends on plan and the configured window. The actual production database backup settings were not visible here. The current workspace resume route has no database or object-storage write for uploaded bytes or extracted text, but that source observation does not prove what the older serving build does.
- No application-level OpenTelemetry or external error-reporting setup was found in the workspace search. The live response included an edge trace-context header, so whether infrastructure traces capture request content remains unverified.
- **Historical release status:** at the time of this audit, the serving build differed from the guarded workspace and attempted to parse the synthetic upload. A later deployment probe returned 404, but this audit did not verify backup configuration, trace payloads, or actual operator membership; those controls remain unverified.

## Approval gate

The product owner approved the transient first-party job-link and resume-intelligence contracts on 2026-10-28. These approvals are not legal review and do not cover arbitrary URL fetching or separate resume-storage endpoints. Keep resume uploads unavailable until production operators verify the relevant infrastructure behavior and the disclosure, consent, retention, deletion, access, and security checks pass. Keep production job-link fetching disabled until its own operator checks and SSRF tests pass. Re-review public privacy copy before describing deployment controls as verified.

## Resume-intelligence approval and production status

- Product owner approved the resume-intelligence data contract as drafted on 2026-10-28. This approval is limited to `/api/resume/intelligence`; it does not approve the separate career-profile resume or compensation-document upload flows, and it does not establish that production controls are in place.
- Production probes on 2026-10-28 sent only harmless JSON bodies, with no file or resume content. Requests with the allowed `https://www.careerreality.in` Origin returned `400` with “Attach a PDF or DOCX resume to continue” instead of the expected unavailable response. After an operator reported the endpoint unavailable, a second direct probe returned the same `400` response. Production logs confirmed the requests reached `/api/resume/intelligence` and recorded request method, path, and status only. The serving deployment therefore still reaches an active upload handler.
- After a subsequent production deployment, a direct probe at 2026-10-28 16:48 UTC returned `404` with “Resume processing is not available.” Production logs for that request recorded only method, path, status, response time, and request ID; no request body or content was present. The route therefore appeared unavailable at that time.
- Do not enable this route. The production availability gate is currently met by that direct probe, but the overall approval gate remains open until operators verify and record tracing/error-report content, backup behavior, and staff/service access controls.
- The observed production request logs contained only metadata. This verifies the logging behavior for the tested request, not all production request paths. Available production logs and metrics do not establish distributed tracing, backup behavior, or operator/service access controls. Operators must verify and record those controls directly before the route can be enabled.

### Production verification ledger

| Control | Evidence source and environment | Verification and observed result | Status | Evidence owner |
| --- | --- | --- | --- | --- |
| Endpoint availability | Public production deployment at `https://www.careerreality.in` | A synthetic JSON-only POST to `/api/resume/intelligence` returned HTTP 404, “Resume processing is not available,” at 2026-10-28 16:48 UTC and again at 17:28:20 UTC. No file or resume content was sent. The latest deployment build reported success before the 17:28 probe. | PASS for these observed requests | Agent verification |
| Request logging | Production deployment logs | The 16:48:11.289 UTC and 17:28:20.906 UTC entries recorded only request ID, method, path, status, response time, and completion message; no body or content appeared. This covers two synthetic no-content requests, not every production request path. | PASS for these observed requests only | Agent verification |
| Traces and error reports | Production response header and available deployment logs/metrics | The response included `x-cloud-trace-context`, but the available telemetry has no trace/span view and does not expose deployed monitoring or error-reporting configuration. Content capture by those systems could not be verified. | UNVERIFIED | Production observability/SRE operator |
| Backups and retention | No production backup, storage, database, cache, or temporary-file configuration/audit evidence was available | No destructive test was performed. The 404 confirms the route was unavailable for the probe; it does not establish historical retention or backup behavior. | UNVERIFIED | Production backup/storage operator |
| Staff and service access | No production IAM, service-account permission, or access-audit evidence was available | Access roles and audit records could not be inspected. | UNVERIFIED | Production infrastructure/IAM operator |

The route-availability result is separate from the privacy-control results. Do not treat the endpoint's 404, the source configuration, or the single request-log sample as proof that tracing, backups, or access controls satisfy the proposed contract. Record operator evidence for each UNVERIFIED item before enabling uploads.

On 2026-10-28, the requester confirmed that no admin evidence is available for tracing/error-report content, backup retention, or staff/service access. These controls remain UNVERIFIED, and the production resume route remains disabled.

### Engineering safeguards and release limits

- In the workspace source, any non-production enablement now requires an authenticated user and the explicit `x-resume-intelligence-consent: accepted-v1` header before multipart parsing. This is a server-side processing guard only; it is not proof that a user saw the disclosure or consented before transmission. The web checker analyzes manual pasted text locally and has a separate allowlisted job-link fetch option; the API and web flags keep that option disabled in production pending its own controls. Mobile onboarding previously exposed a resume picker with an incomplete disclosure; the workspace now removes that picker and blocks all resume-intelligence uploads from onboarding until the production controls are verified and the user-facing contract is implemented.
- The mobile onboarding no longer calls the resume-intelligence endpoint, lets users select a file, stores a new file URI/name from that flow, or persists a new response from that flow. Previously stored device-side structured resume intelligence is not automatically deleted; users can remove saved intelligence through the existing profile control. Other legacy resume storage endpoints are separate and are not covered by this approval.
- The route continues to return 404 in production even if explicitly enabled. The authentication and consent changes are workspace changes and were not included in the production build verified above.
- The current five-per-hour per-user limiter is process-local. It is not a reliable per-account limit across multiple API instances. A shared atomic limiter must be in place and verified before any production enablement.
- Keep the route unavailable until a future client presents the approved disclosure and obtains affirmative consent before sending bytes, a shared per-account rate limit is verified, and all UNVERIFIED production controls above have evidence. Do not infer production readiness from these application-level safeguards.
