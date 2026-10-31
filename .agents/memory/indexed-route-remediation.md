---
name: Indexed-route remediation
description: How to clean up SEO and AdSense issues without changing routes already reported as indexed.
---

During SEO remediation, treat the latest indexed-page export as an immutable protection list for page copy, metadata, templates, and route behavior. Separate those protected routes into currently indexable pages and intentional legacy handoffs. The latter should retain their existing noindex/canonical-to-destination behavior and should not be forced into the sitemap just because they appear in an indexed export.

**Why:** Adding noindex legacy pages to a sitemap creates a contradictory crawl signal, while editing indexed article content can invalidate the evidence the cleanup is meant to preserve.

**How to apply:** Normalize the export by host, query string, and trailing slash; verify all protected indexable routes remain in the sitemap; verify every sitemap URL has a local snapshot, canonical, and indexable robots directive; then audit legacy exclusions separately.