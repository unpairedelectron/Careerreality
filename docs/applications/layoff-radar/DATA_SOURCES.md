# Layoff Radar — data sources

- Public results are fetched from the first-party layoff-signal API.
- Eligible records carry a source URL and provenance metadata, including publication, retrieval, review, method, and limitations where supplied.
- User reports are sent to the first-party report endpoint. The server redacts email addresses, links, and phone-number-like strings before storage; the UI says reports remain private until moderation approval.
- The full moderation-to-publication path and all report-retention metadata were not end-to-end audited in this pass.
