---
name: Production verification
description: Live deployment checks must validate the actual published build, custom domain, and readiness route separately from the dev preview.
---

Verify the production URL returned by deployment metadata, then independently check the custom domain, route-specific HTML metadata, sitemap, robots.txt, API health, and readiness. A green dev preview does not prove the published build is current or that the deployment edge exposes readiness correctly.

**Why:** Production can continue serving an older static build while the workspace and dev workflow contain newer metadata and route snapshots; custom-domain DNS can also still point to a previous host.

**How to apply:** Treat stale production HTML, missing custom-domain attachment, or a protected readiness route as launch blockers until publishing/routing configuration is corrected and rechecked.

When the intended custom domain is not yet attached, build-time SEO fallbacks must point to the active published host rather than a legacy or separately hosted domain; switch the canonical URL to the custom domain only after verifying that it resolves to the same deployment.

**Why:** A healthy Replit deployment can still advertise a different host in canonical tags, robots, and sitemaps, sending crawlers and users to an older production surface.

**How to apply:** Before launch, compare deployment metadata, DNS/HTTP responses, canonical tags, robots, and sitemap locations as one host-consistency check.

After a DNS change, public resolvers may return the new record while the workspace resolver still holds a stale or negative cache entry. Compare both before interpreting failed live checks. A request forced to the expected IP can isolate the destination, but rerun the full check using normal DNS once the workspace resolver has updated.

**Why:** The verifier can report host fetch failures from stale local DNS even when the published host is already reachable through public DNS.

**How to apply:** After DNS edits, query an independent public resolver and the normal workspace resolver, test the target IP directly only as a diagnostic, then rerun the published gate without DNS overrides.

For backend privacy gates, verify the active production revision by sending a synthetic, non-sensitive request and checking its response and available logs. Current source and a successful build do not prove that the serving API includes a newly added disable guard.

**Why:** A live resume-upload endpoint reached PDF parsing even though the workspace source hard-disabled resume processing in production; build history showed the serving revision predated that guard.

**How to apply:** Before declaring a data-handling control effective, compare the deployed revision with the guard's introduction, exercise only synthetic marker data, search available operational logs without exposing their contents, and record which telemetry systems were not observable.

PageSpeed Insights can return HTTP 429 after its daily query allowance is exhausted.

**Why:** Retrying within the same quota window provides no new measurement and risks treating unavailable performance data as an observed score.

**How to apply:** Stop PSI requests for that run, report the metric as unavailable, and resume after quota reset or use independently available CrUX data. Never infer a score from the failed response.

Keep live observations separate from local remediation. A read-only release workflow can report a live state that conflicts with an earlier crawl, while its local comparison may have been built before the latest local edits. Do not attribute that live state to workspace changes unless the exact build was deployed.

**Why:** During the CareerReality remediation, the earlier baseline recorded three sitemap URLs and sampled article routes as noindex; a later captured run reported 69 URLs and sampled article routes as indexable, although no remediation deployment occurred.

**How to apply:** Record both observation dates and their exact scope, preserve the failed run, and mark production verification unresolved until a deliberate post-deploy crawl matches the current build. Do not rerun live checks just to overwrite an unexplained discrepancy.

When the release validator compares the live sitemap with the current route registry, a local addition of indexable pages can create an expected published-only failure until the new build is deployed. Keep intended local routes and record the exact missing live paths; do not remove routes merely to make the stale production sitemap match.

**Why:** The local contract can be correct while production still serves the prior sitemap; the mismatch is evidence of deployment lag, not a reason to weaken the local route set.

**How to apply:** Report local and published counts separately, name missing and unexpected URLs, and leave production state unchanged unless publishing is explicitly approved.