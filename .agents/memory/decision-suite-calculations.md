---
name: Client-side decision calculations
description: The product convention for expanding CareerReality tools before adding report persistence or new API contracts.
---

Keep new public-tool calculations client-side when they can be derived from visible inputs and the existing salary, company, or layoff datasets. Label simplified outputs as illustrative, directional, or planning estimates and show the assumptions beside the result.

**Why:** The current API exposes live signal datasets but not calculator/report persistence. Client-only math can still improve the decision loop without inventing a backend contract or implying unsupported certainty.

**How to apply:** Add a visible formula or factor breakdown, preserve privacy-safe analytics, and move to an API-backed model only when the calculation needs shared persistence, user history, or a new authoritative data source.

Public evidence must be scoped to the person’s explicit selection; never use the first row of a broad signal response as a proxy for the selected company or role.

**Why:** A first-row fallback made every Compass user see the same employer and market signal, which undermined trust even though the underlying dataset was live.

**How to apply:** Require an explicit selector or exact matching key for company and role evidence, and show a clear “choose a company” state when no scoped signal exists.