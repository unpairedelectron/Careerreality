---
name: Responsive theme regression checks
description: Non-obvious constraints for reliable homepage dark-mode browser baselines across responsive widths.
---

Responsive dark-mode checks must interact with the visible theme control: below the desktop breakpoint, the control is inside the mobile navigation and the desktop control remains hidden in the DOM.

**Why:** The mobile navigation renders a second theme-control instance, and the theme preference persists in local storage between viewport iterations. A generic locator or a shared browser state can otherwise make the test click the wrong element or start in the wrong theme.

**How to apply:** Open and close the mobile menu around the theme interaction on narrow viewports, target the visible control, and reset the stored theme preference before each viewport baseline.