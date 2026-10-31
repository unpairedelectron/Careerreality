---
name: PDF parser runtime boundaries
description: Runtime constraints for server-side pdf-parse and browser-side PDF.js.
---

The Node API must load the pdf-parse implementation subpath externally rather than bundling or importing the package entry. The browser PDF viewer/parser must stay on a PDF.js release compatible with the deployed browser/runtime set; PDF.js 6.4.299 called `Uint8Array.prototype.toHex`, which was absent in Node 24 and the test browser used here, so use the 4.x line unless compatibility is reverified.

The CareerReality static host serves `.mjs` assets as `application/octet-stream`, which browsers reject when PDF.js dynamically imports its module worker. Emit the PDF.js worker with a `.js` extension and cover its successful JavaScript response and extraction in a production-preview browser test.

**Why:** PDF libraries can fail at different runtime boundaries: the pdf-parse package entry self-tests when bundled as CommonJS, newer pdf-parse releases pull browser canvas globals into the server bundle, PDF.js 6 assumed a typed-array method not supported by the tested runtime, and the deployed static host's MIME mapping rejects `.mjs` workers.

**How to apply:** For API extraction, keep pdf-parse on the Node-safe 1.x line, require `pdf-parse/lib/pdf-parse.js`, and externalize both `pdf-parse` and `pdf-parse/*` in the API esbuild configuration. For client-side extraction, test PDF.js in a production preview and ensure the worker response has a JavaScript MIME type before accepting a build or major upgrade.