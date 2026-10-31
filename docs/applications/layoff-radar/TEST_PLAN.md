# Layoff Radar — test plan

## Automated
- Validate that missing citations, unusable provenance, invalid dates, and malformed confidence values are withheld.
- Test list loading, API failure, empty results, filtering, retry, and report submission/rate-limit/error paths.
- Confirm report PII redaction occurs server-side before persistence and that only approved reports can become public.

## Manual release checks
Review source quality, dates, classification copy, moderation states, screen-reader table structure, keyboard access to filters/dialog, and mobile layout. No taxonomy approval is recorded.
