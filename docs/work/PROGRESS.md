# CareerReality publish release progress

**Updated:** 2026-10-09
**Branch:** `remediation/adsense-low-value-content-2026-10-08`
**Instruction:** current user request supersedes earlier quarantine-only publication choices.
**Production:** `https://www.careerreality.in` is currently deployed; this release has not been published.

## Release scope and constraints

- Preserve the 44 archived article records and restore their source content as drafts before merging them into 16–20 pillar guides.
- Restore all requested tools as real deterministic tools or source-dated official-reference pages; no invented ratings, forecasts, scores, benchmarks, or company claims.
- Keep the route registry as the only source for app routes, navigation, redirects, and sitemap inclusion.
- Use CareerReality Editorial attribution and explain the actual editorial process. Put names, legal entity, and qualified tax-review requests in `OWNER_FOLLOWUPS.md`; these do not block release.
- Add a contact form that stores only its submitted message fields in the database. Do not send tool inputs to analytics or logs. No ad code.
- Publish useful pages only: each live tool has its tool, worked example, method, assumptions, limits, dated sources, FAQ, and related guides; use server-generated snapshots and form fallbacks for no-JS access.
- Do not delete archived content or change production data directly. Back up before any production data mutation.

## Phases

- [ ] Phase 1 — restore 44 articles as draft records and retired tool routes as draft registry entries.
- [ ] Phase 2 — implement the requested calculators, planning tools, and employer due-diligence checklist without numerical employer scores.
- [ ] Phase 3 — consolidate the archive into 16–20 distinct, sourced 1,200–2,500-word pillar guides and map old article URLs to their destination guides.
- [ ] Phase 4 — complete the homepage, tools/guides hubs, shared navigation, trust pages, and database-backed contact flow.
- [ ] Phase 5 — enable indexability for complete pages; generate canonicals, redirects, internal links, and sitemap from the route registry.
- [ ] Phase 6 — one typecheck/build pass, request production publication, then one live smoke pass; one fix/redeploy maximum if smoke fails.
- [ ] Write `docs/work/FINAL_NOTE.md` in under 30 lines after the live smoke pass.

## Current state

- [x] Located 44 archived article JSON files and the route registry; the live deployment is still the prior release.
- [x] Confirmed the existing repo already contains a functional CTC calculator and several interactive client-side planning tools.
- [ ] No article, tool, trust-page, contact-form, or route restoration changes for this release are complete yet.
- [ ] No database backup or data mutation has occurred. No production publication has been initiated.

## Release constraint

The Replit publishing flow requires the workspace owner to click Publish. I can prepare and verify this release and run the live smoke check after it is published, but cannot initiate publication through code or this session.

## Final fix pass

- [x] A — Enforce main-content word floors, long-paragraph duplication, and forbidden-copy checks in the build.
- [x] B — Apply supplied author/contact facts, Team page, trust-page copy, and restricted structured data.
- [x] C — Verify and repair the offer-beyond-CTC guide against its requested contents.
- [x] D — Review all guides for topic-matched examples, sourced facts, and repetitive language.
- [x] E — Align tax-period labels and calculations to official sources.
- [x] F — Align hubs and metadata with current functionality.
- [x] G — Verify and repair legacy company/article redirects.
- [x] H — Verify the Rules Library against official-source requirements.
- [x] I — Bring every tool page to its required main-content floor.
- [x] J — Fix image/gradient contrast and run the bounded smoke checks.
- [x] K — Run final typecheck, build, and gates; do not publish.

## Close-out pass — 11 October 2026

- [x] 1 — Enforce plain main-content word floors, duplicate-paragraph checks, and forbidden-copy checks against built snapshots.
- [x] 2 — Rebuild offer comparison as a working, sourced two-offer tool with verified output.
- [x] 3 — Index complete tools and align homepage and hub descriptions with actual methods.
- [x] 4 — Align tax-period terminology and calculations to official AY 2026–27 sources.
- [x] 5 — Verify exact owner-supplied trust facts, forms, schema, and shared links in built pages.
- [x] 6 — Verify legacy redirects, registry-based sitemap/robots, and published-SEO baseline count.
- [x] 7 — Verify all 18 guides, topic examples, three official facts, and paragraph limits.
- [x] 8 — Verify ten official-source rules pages, word counts, dates, and state-tax boundaries.
- [x] 9 — Measure mobile performance, optimize critical payloads, contrast, and two-minute smoke coverage.
- [x] 10 — Write the owner handover guide under 70 lines.
- [x] 11 — Run final typecheck, build, and every local gate; do not publish.
