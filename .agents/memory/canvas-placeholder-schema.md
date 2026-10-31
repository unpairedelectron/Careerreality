---
name: Canvas placeholder schema
description: The live canvas callback may expose create/update instead of the documented create-auto action.
---

When placing design iframe placeholders, verify the callback's accepted action shape first. In some workspace versions, `create-auto` is documented but rejected at runtime; create explicit iframe shapes with `state: "building"` instead, then update them to `live`.

**Why:** The canvas skill documentation and the registered callback schema can drift independently, and a failed placeholder call leaves the visual workbench without its intended progress state.

**How to apply:** Prefer `create-auto` when the callback accepts it; otherwise use explicit `create` actions and choose empty coordinates after reading the board state when placement matters.