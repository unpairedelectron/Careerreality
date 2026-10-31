---
name: Media generation fallback
description: How to keep media artifacts runnable when an optional generation callback is unavailable
---

When an optional media-generation callback is unavailable in the current workspace, keep the artifact runnable by creating a small local fallback asset and wiring it through the normal runtime path.

**Why:** A missing generated file breaks preview and export more severely than a restrained local asset; the product should still be complete and verifiable.

**How to apply:** Use a local, deterministic asset only when generation cannot run, preserve the same file type and path contract, and avoid leaving dead references in the composition.