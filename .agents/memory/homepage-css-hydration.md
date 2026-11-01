---
name: Homepage CSS and hydration
description: Measured tradeoffs between critical CSS delivery and delayed React startup on the CareerReality homepage.
---

Keep the global stylesheet blocking and delay React startup behind the static homepage snapshot. Do not switch the global stylesheet to `media="print"` or defer it entirely unless critical styles can preserve the same rendered layout.

**Why:** On the matched mobile profile, deferred CSS moved LCP closer to one second but introduced substantial layout shift and higher blocking time. Blocking CSS with delayed React kept layout shift negligible while keeping LCP close to the target.

**How to apply:** When revisiting homepage startup, compare at least three matched Lighthouse runs and inspect CLS and TBT alongside LCP. Treat the static snapshot and the hydrated app as separate visual states; an LCP-only gain is not an improvement if the transition shifts the page.
