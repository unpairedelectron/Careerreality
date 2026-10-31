---
name: Resume parser testing
description: Resume API regression tests should isolate extraction from live market data while exercising real multipart uploads.
---

Keep resume parser tests deterministic by injecting the market-data loader and using small in-memory PDF/DOCX fixtures. Exercise the real multipart route for validation, extraction, limits, throttling, and structured-only output.

**Why:** Resume processing can otherwise depend on seeded market rows or persist sensitive upload state without the test suite noticing.

**How to apply:** When changing extraction or upload validation, extend the isolated route tests before relying on live database rows or client-only mocks.