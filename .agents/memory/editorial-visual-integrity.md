---
name: Editorial visual integrity
description: Rules for figures embedded in CareerReality editorial articles.
---

Every editorial figure must either present an exact, scoped, source-backed measurement or clearly present a qualitative framework. Qualitative items must not receive proportional bars, percentages, rankings, or chart-like scale treatment that implies measured data; their labels and captions should explain the reading lens instead.

**Why:** Category-level visuals previously turned words such as “Core” and “Middle” into arbitrary bar lengths, which looked like market evidence even though the values were editorial labels. Article-specific qualitative frameworks preserve usefulness without manufacturing precision.

**How to apply:** When adding an article, create a slug-specific visual override first. Use `measurement: "source-backed"` only when the value and scope are directly supported by an attributed source; otherwise use `measurement: "qualitative"` and render non-proportional cards.