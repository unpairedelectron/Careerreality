---
name: Mobile Playwright accessibility mapping
description: React Native Web accessibilityState may not render the expected ARIA state attributes in browser regression tests.
---

Prefer stable test IDs and visible readout transitions when testing React Native Web controls. Do not assume `accessibilityState={{ selected }}` becomes an `aria-selected` attribute; verify the user-visible state change instead.

**Why:** The Expo web renderer can expose the button role and label while omitting the corresponding ARIA state attribute, causing a false-negative browser test even though the interaction works.

**How to apply:** For mobile Playwright coverage, assert the control is actionable and that its rendered output changes after the click; only assert ARIA state attributes when the rendered DOM has been verified to provide them.

React Native Web can expose repeated text nodes from its rendered tree, and off-screen ScrollView content may report as hidden until scrolled into view. Prefer stable test IDs or unique returned content, and call `scrollIntoViewIfNeeded()` before asserting a below-fold readout.

**Why:** Broad text locators otherwise create strict-mode failures or false visibility failures in otherwise-correct mobile flows.

**How to apply:** Scope assertions to a specific state container where possible; when validating a long personalized result, scroll to the exact server-returned text before checking visibility.

For long route-by-route mobile web audits, use one Playwright worker when repeated page loads time out under concurrent browser tests.

**Why:** Concurrent navigation made a route-shell visibility assertion time out once, while the same complete route audit passed serially.

**How to apply:** If a multi-route smoke test has a transient shell-readiness failure under parallel load, rerun that audit with one worker before treating the route as broken.