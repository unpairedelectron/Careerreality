---
name: CareerReality release guardrails
description: User-specified scope, verification, and publication constraints for the CareerReality restoration.
---

- Preserve the 44 archived article drafts; consolidate distinct material into sourced guides rather than deleting content to pass checks.
- Keep each archived article at its original URL as a noindex hold page; do not redirect it to a guide while editorial gates remain unmet.
- Do not weaken the archived-body leakage gate to ship; if a public guide contains a draft excerpt or distinctive body text, stop for editorial review.
- Do not create extra audits, readiness reports, analysis documents, or repeated verification cycles. Limit each task to two attempts; if a check still fails, simplify honestly and move on.
- Run one live smoke check in Phase 6, after the owner publishes. Create `docs/work/FINAL_NOTE.md` only after that smoke check.
- Keep the route registry authoritative for routes, navigation, redirects, and sitemap inclusion.
- Keep the two retired legacy AI-news URLs as real 404s; do not restore them or redirect them to unrelated pages without explicit approval.
- Keep engineering, article, data, operations, account-QA, and release readiness separate. A release decision must evaluate the scope and risk of the changes being deployed; unrelated evidence gaps remain visible but do not block safe engineering-only changes.
- Remove exact repeated paragraphs only from assembled archive drafts, preserve the original archive exports, and keep source-level duplicate counts visible.

**Why:** the user set these release constraints to protect archived content and prevent unbounded verification work.

**How to apply:** use these rules for remaining CareerReality restoration work; do not publish or create the final note before the stated gates. Treat a copied draft excerpt or distinctive paragraph in a public guide as an editorial gate, not a false positive to suppress.

**Why:** the user explicitly chose to preserve the original article URLs while publication requirements are unmet.

**How to apply:** keep the archived body withheld and serve a noindex hold page at each original slug until genuine editorial approval changes that decision.

**Why:** a single site-wide readiness status incorrectly makes unrelated editorial, data, account, and infrastructure evidence block independently testable engineering changes.

**How to apply:** retain each domain's real blockers and strict article/data safeguards, but do not let those gates fail a release whose scope does not touch those domains.

**Why:** repeated source text can be objectively removed from the working draft without erasing the original evidence or disguising where duplication occurred.

**How to apply:** keep both assertions: raw sources report the original repeats, while assembled drafts must contain zero exact repeats.

**Why:** the user chose to leave the two previously indexed AI-news pages retired; no replacement content was approved.

**How to apply:** keep the URLs out of the route registry, sitemap, and internal links, and retain their real 404 responses unless the user later approves a closely matching replacement.
