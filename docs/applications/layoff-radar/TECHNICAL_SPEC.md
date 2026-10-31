# Layoff Radar — technical spec

The `/layoff-radar` page uses generated list/report hooks. Query and type filters drive a first-party request; source URLs are restricted to HTTP(S) before rendering. Loading, API error, no eligible result, and results are separate states, and errors do not fall back to stale records.

The report form trims fields, bounds the description, and sends company, description, and selected confidence. A successful response is shown as queued, not published. The route remains noindex until event classification and the review pipeline are verified.
