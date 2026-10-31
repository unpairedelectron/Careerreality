# CareerReality Mobile — data sources

- Profile, saved decisions, plans, and authenticated workspace data use first-party APIs.
- Personalized market context may use salary benchmarks, company/watchlist signals, and live role-demand feeds.
- External job listings are limited to official ATS feeds or approved providers; major job boards remain outbound destinations.
- A configured provider may still deny access. Provider failure must appear as unavailable, with last-success freshness retained but never presented as current.
- The exact source set for a particular brief is shown with that brief; this document does not claim every provider is available.
