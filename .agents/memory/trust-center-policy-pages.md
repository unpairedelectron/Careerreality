---
name: Trust center policy pages
description: Trust routes should be distinct, explicit, and accurate to implemented product behavior rather than generic legal filler.
---

CareerReality trust pages are route-specific product documents. They should explain evidence limits, public versus signed-in behavior, privacy-safe analytics, corrections, contact handling, and legal/advice boundaries without inventing retention periods, response SLAs, vendors, addresses, or a legal entity.

Trust-page copy has separate hydrated React and crawler-visible snapshot implementations, with verifier assertions that can preserve stale wording. Update and verify both the public UI and generated snapshot content together.

**Why:** Trust disclosures are only as reliable as their evidence, and a confident promise the product does not enforce is worse than a clear limitation. Separate crawler snapshots can also preserve obsolete claims after a visible page changes.

**How to apply:** Update the relevant route copy, static snapshot generator, and route-content checks together whenever product behavior changes; preserve accessible headings, internal paths, and route-specific SEO schema.