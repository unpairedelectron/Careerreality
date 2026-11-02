# CareerReality trust-page review

**Review date:** 2 November 2026  
**Production changes:** None. Publishing and deployment were not performed.

## Summary

The trust-page changes build locally and pass the local route-snapshot contract. The current production site remains on its previous build. The published-SEO check has one specific failure: production’s sitemap contains 79 canonical URLs, while the current local build contains 81. The two missing production URLs are `/accessibility/` and `/security/`. They were retained in the local sitemap; removing them to make an undeployed production copy appear current would be incorrect.

## Production and local request review

- Six sampled production public routes returned HTTP 200 and made no observed Clerk requests. Google Fonts was the only recorded external host in those public-page captures.
- Production sign-in loaded Clerk through same-origin proxy routes. The host also set a `GAESA` cookie with a 30-day expiry; its purpose was not established.
- The same sampled local public pages made no observed third-party requests. The pages now load the same Manrope and Inter WOFF2 files from the app origin: 13 font files, a local CSS file, and three license texts. Browser checks confirmed Manrope loaded. No font appearance, homepage styling, design tokens, or tool logic was changed.
- Local sign-in contacted the configured Clerk host and `img.clerk.com`. Clerk cookie names were observed, but values were not recorded.

## Retired contact endpoint and stored data

- A production POST with an allowed origin returned **401**. The local route, after being placed before the broad authentication router, returns **410 Gone**. Production was not changed, so the live response remains unverified as retired and must not be described as 410.
- A read-only production count found **zero current rows** in `contact_messages`. The known table fields are name, email, topic, message, and received time.
- Whether copies exist in backups or logs, and their retention periods, remain unknown.

## Public trust content and route checks

- Public copy and snapshots were revised to remove developer-facing review notes. The approved operator string remains exactly **“Doffysoft pvt. Limited.”** No registration status was asserted or denied.
- The local build generated 85 crawler-visible route snapshots and 57 app shells. Its snapshot verifier passed, including registered-route, sitemap, canonical, link, and structured-data checks.
- A scan of the 11 public trust snapshots found no reference to the retired contact endpoint. Their meta descriptions are within the configured 100–160 character range. The local sitemap contains 81 canonical routes, including the public contact page, and does not contain the contact API endpoint.
- The local organization structured data uses the approved entity string. The source index contains 13 entries.

## Accessibility and performance

- axe-core 4.10.3 checked all 11 trust routes at desktop and phone sizes: **zero automated WCAG 2.0/2.1/2.2 A/AA violations**. Axe reported one item per page for manual review; those items are not represented as passed manual checks.
- Keyboard Tab showed visible focus on the first link.
- One Lighthouse run on production `/privacy-policy/` scored **0.76 performance**, **1.00 accessibility**, and **1.00 SEO**. It reported FCP and LCP of 1.7 seconds, TBT of 970 ms, and CLS of 0. This is a single sampled run, not a site-wide performance result.

## Published-SEO result

The configured `published-seo` workflow completed the local build contract with zero local failures, then failed one published check:

> Published sitemap matches local route set — expected 81 canonical URLs; observed 79 live URLs; missing 2 (`/accessibility/`, `/security/`); unexpected 0.

The known-good route observations showed no differences. The live sitemap audit covered 79 pages in 2,088 ms with zero worker failures, below its 5,000 ms warning threshold. Because publishing was explicitly out of scope, the production sitemap discrepancy remains open.

## Remaining unknowns

1. What purpose the production `GAESA` cookie serves.
2. Clerk’s exact account fields and retention/deletion practices.
3. Whether contact-message copies exist in production backups or logs and how long they are retained.
4. Whether production will serve the new accessibility and security routes after a future approved publish.

Supporting detail is in `docs/data-flow-inventory.md` and the internal `docs/legal-review-pack.md`.
