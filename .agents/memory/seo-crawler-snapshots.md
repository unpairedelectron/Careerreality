---
name: SEO crawler snapshots
description: Public indexable routes need postbuild static HTML snapshots so metadata and meaningful content exist before client hydration.
---

Public article and indexable tool/company/category pages use postbuild snapshots generated from the real catalogues. Each snapshot must preserve the built asset tags while replacing route-specific title, description, canonical, Open Graph, and Twitter data; articles additionally carry Article and breadcrumb schema. Guide copy, FAQs, links, and schema must be present in the crawler-visible snapshot as well as the hydrated UI; the two render paths are not interchangeable.

**Why:** The web app is a client-rendered Vite application, and guide snapshots are assembled independently from the React tree. A client-only change can look correct in preview while leaving crawlers with stale or incomplete content.

**How to apply:** Generate the guide catalogue before building snapshots; the Vite prebuild must refresh authored guide data before sitemap and HTML generation. Keep every sitemap route, align route metadata with runtime SEO, and render FAQ answers visibly from the same authored source used for FAQ schema. For guides, verify built HTML includes copy, related links, Article and BreadcrumbList data, word-count and duplicate-paragraph checks. For legacy noindex handoffs, test both generated HTML and hydrated browser metadata because the page can otherwise restore the default index policy after load.

Run the full web build when regenerating snapshots, not the isolated postbuild command against existing snapshots.

**Why:** Snapshot generation consumes the untouched Vite HTML shell. After generation, the entry HTML contains the homepage snapshot; using it as the shell again can copy homepage content into other routes and cause misleading duplicate-content failures.

**How to apply:** Even for snapshot-script-only edits, rebuild the Vite shell before generation and verification.

Do not run a manual web build concurrently with the configured SEO-validation workflow.

**Why:** Both write the same output directory. Overlapping generation can consume an already-rendered homepage as the shell, copying homepage content and schema into other routes and producing false duplicate-content failures.

**How to apply:** Check whether the existing SEO workflow is building before starting a manual build. Keep production build and snapshot generation serialized against that shared output directory; independent read-only checks may still run in parallel.