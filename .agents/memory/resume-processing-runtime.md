---
name: Resume processing runtime
description: Resume parsing dependencies must not introduce browser-only globals into the bundled Node API.
---

Keep resume ingestion bounded and fail explicitly when extraction is incomplete; avoid parser packages that initialize browser canvas globals at Node startup unless they are proven safe in the API bundle.

**Why:** A PDF parser dependency pulled DOMMatrix/canvas initialization into the API bundle and prevented Express from starting, even though TypeScript and the parser code typechecked.

**How to apply:** Validate parser startup through the managed API workflow after dependency changes, not only through a package typecheck.