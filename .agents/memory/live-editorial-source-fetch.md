---
name: Live editorial source fetching
description: Large parallel batches against the public CareerReality article pages can return scraper 500s.
---

Use the public article pages as attribution and editorial context, but do not make a large parallel scrape a prerequisite for the app build. If source extraction is needed again, fetch a small number of pages at a time or use an explicitly labelled editorial brief when the source service is unstable.

**Why:** A bulk fetch of otherwise valid article URLs returned scraper-side 500 responses during editorial-content work, while the app and live routes remained healthy.

**How to apply:** Keep source links and uncertainty visible; never silently present a generated fallback as fully reported content.