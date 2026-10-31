# Company Intelligence — test plan

## Automated
- Assert that numeric score fields never render in list or detail views.
- Test missing, malformed, stale, and non-HTTP source links and their fallback labels.
- Cover API pending, error, empty, and detail-not-found states; never turn a failed request into a reassuring default.

## Manual release checks
Review a representative set of live sources, citations, company names, date semantics, watchlist consent, keyboard interaction, and mobile layout. A reviewer must approve the scoring method before any score is restored.
