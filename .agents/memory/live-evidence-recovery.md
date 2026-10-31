---
name: Live evidence recovery
description: Public data tools must distinguish unavailable live sources from valid empty results and never imply stale evidence is current.
---

Live-data tools show source, methodology, confidence, refresh time, and sample size when available. On query failure they show an explicit retry state and do not present stale results as current.

**Why:** Career decisions are sensitive to freshness and provenance; silent fallback makes an unavailable signal look more authoritative than it is.

**How to apply:** Reuse the shared evidence surface for public salary, company, and layoff queries, and keep browser coverage for both successful metadata and retry recovery.

Conditional GETs that return 304 must be retried or hydrated before a public tool renders; treating an empty 304 body as a valid empty dataset creates false “no benchmark” states.

**Why:** A cached salary response can legitimately have no body even though the underlying benchmark is current, and public decision tools should not confuse cache behavior with missing evidence.

**How to apply:** Keep the shared API client’s 304 recovery path covered when adding or debugging public salary, company, or layoff reads.

When a query refetch fails, treat its retained data as unavailable until a fresh response succeeds; never label retained data as a current live signal.

**Why:** Query libraries can preserve the last successful payload while exposing an error state, which otherwise turns a source outage into stale decision evidence.

**How to apply:** Gate public evidence and derived scoring inputs on the query error state, and show a source-specific retry explanation.

Public dataset responses should filter malformed rows at the API boundary and report whether the returned set is complete, partial, or empty, with a human-readable quality note when rows were omitted.

**Why:** A valid response can contain a mix of usable and malformed records; dropping the whole dataset hides useful evidence, while silently dropping rows hides confidence and coverage limits.

**How to apply:** Keep the coverage metadata in the shared evidence surface and validate rows again before client-side calculations consume them.

Fixture-backed browser tests for source-dependent salary results need a valid citation and complete, date-consistent provenance; otherwise the UI correctly filters the fixture and appears to have no result.

**Why:** Client eligibility checks intentionally treat incomplete evidence as unavailable, so an incomplete mock can look like a rendering regression rather than a fixture-contract failure.

**How to apply:** Build browser fixtures from the accepted provenance shape, and keep fixture-backed interaction coverage distinct from live freshness and representativeness review.