# Company Intelligence — technical spec

The `/companies` list and company detail route use generated public-data queries and the shared provenance eligibility helpers. External links are validated as HTTP(S). Missing or invalid citations lower the visible confidence label rather than being hidden.

The public web views do not render numeric stability or momentum scores. Search sends the company query to the first-party API. A separate user-initiated watchlist action may save a selected company and signal to the signed-in workspace. Routes remain noindex.
