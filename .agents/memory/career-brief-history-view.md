---
name: Career brief history view
description: Product rules for the private timeline that shows how personalized career reads changed.
---

The history endpoint returns newest-first entries, but each comparison is computed oldest-first. Every entry includes its current evidence context so first and unchanged reads still show source and freshness; insufficient evidence is labeled explicitly.

**Why:** A timeline without provenance makes baseline and no-change reads look empty and can hide the difference between no signal and no change.

**How to apply:** Keep history user-scoped, display the change status and details together with current evidence context, and retain the warning that missing evidence is not improvement.