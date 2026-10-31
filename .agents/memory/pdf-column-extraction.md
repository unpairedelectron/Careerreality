---
name: PDF column extraction
description: PDF.js can represent multi-column gutters as wide whitespace text items.
---

When rebuilding reading order from PDF.js text items, treat a whitespace-only item wider than the normal word-spacing threshold as a line break. Position checks between visible text items alone can miss the gutter because PDF.js may place a wide space item between the columns.

**Why:** A browser-uploaded synthetic resume showed PDF.js returning the column gutter as its own whitespace item, with its width spanning the gap; the next text item then began exactly at that whitespace item's end.

**How to apply:** When changing browser-side PDF extraction, test with a generated two-column PDF through the real upload flow and assert both extracted line separation and downstream evidence attribution.
