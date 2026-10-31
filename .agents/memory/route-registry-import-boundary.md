---
name: Route registry import boundary
description: Keep the route registry JSON import compatible with both Vite and Node ESM tests.
---

Import the route registry JSON through one TypeScript wrapper and have application modules and TypeScript tests import that wrapper. Keep the JSON import attribute at that single boundary; build scripts that read the JSON through `fs` are unaffected.

**Why:** Vite accepted mixed attributed and un-attributed imports but emitted warnings, while Node ESM tests failed when a source module loaded the JSON without an import attribute. Centralizing the boundary resolved both runtime paths.

**How to apply:** When a runtime consumer needs route registry data, import the TypeScript wrapper rather than importing the JSON file directly.
