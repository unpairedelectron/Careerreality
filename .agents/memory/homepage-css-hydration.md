---
name: Homepage CSS and hydration
description: Measured tradeoffs between critical CSS delivery and delayed React startup on the CareerReality homepage.
---

Keep the global stylesheet blocking and delay React startup behind the static homepage snapshot. Do not switch the global stylesheet to `media="print"` or defer it entirely unless critical styles can preserve the same rendered layout.

**Why:** On the matched mobile profile, deferred CSS moved LCP closer to one second but introduced substantial layout shift and higher blocking time. Blocking CSS with delayed React kept layout shift negligible while keeping LCP close to the target.

**How to apply:** When revisiting homepage startup, compare at least three matched Lighthouse runs and inspect CLS and TBT alongside LCP. Treat the static snapshot and the hydrated app as separate visual states; an LCP-only gain is not an improvement if the transition shifts the page.

For mobile Chromium CLS regression controls, wait for an actually painted snapshot and allow initial viewport settling before injecting a deliberate shift.

**Why:** A visible large shift injected soon after navigation was absent from the Layout Instability entries even though trace frames showed the movement. The same control after a one-second settling interval exceeded the budget reliably. A zero reading alone does not prove that measurement is working.

**How to apply:** Register observation before navigation, assert browser support and both snapshot/React states, and keep a deliberate-shift control that must exceed the accepted budget. Do not use an interaction to trigger it: recent input excludes shifts from CLS.
