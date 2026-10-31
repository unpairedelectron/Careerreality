---
name: Indian month abbreviations
description: Locale-specific abbreviated month names emitted by the runtime's en-IN ICU data.
---

When displaying dates with `toLocaleString("en-IN", { month: "short" })`, the runtime used here renders September as “Sept,” not “Sep.”

**Why:** Browser assertions for the monthly PF schedule failed when assuming the common US-style abbreviation.

**How to apply:** For localized month labels, verify the actual locale output and avoid hardcoding a different locale's abbreviations in tests.
