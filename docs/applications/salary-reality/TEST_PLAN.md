# Salary Reality — test plan

## Automated
- Unit-test eligible-record filtering for missing citations, invalid dates, unsupported provenance, malformed quartiles, and inconsistent P25/median/P75 ordering.
- Test target comparisons below P25, at each boundary, and above P75; invalid inputs must not produce a label.
- Test that analytics payloads never include target CTC.

## Manual release checks
Exercise every role/city/experience combination that is advertised, API error and empty states, source links, keyboard use, 200% zoom, and mobile overflow. Current dataset coverage and sample representativeness require a separate human review.
