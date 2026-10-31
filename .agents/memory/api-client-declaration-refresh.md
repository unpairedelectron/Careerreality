---
name: API client declaration refresh
description: Refresh generated workspace client declarations when mobile typechecks disagree with the checked-in API schemas.
---

When a merged API schema change is present in `lib/api-client-react/src` but the mobile typecheck still reports missing fields, regenerate the client package declarations before changing application code.

**Why:** The mobile project uses the API client's project-reference output, which can lag behind the checked-in generated source after a schema merge.

**How to apply:** Run the API client package's declaration-only TypeScript build, then rerun the mobile typecheck; only patch feature code if the errors remain.