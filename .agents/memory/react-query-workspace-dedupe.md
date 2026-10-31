---
name: React Query workspace dedupe
description: Prevent separate React Query provider and hook contexts in the workspace web bundle.
---

When a workspace app consumes generated hooks from a shared package, explicitly deduplicate `@tanstack/react-query` alongside React and React DOM in the app bundler. Peer-resolution can otherwise produce two physical React Query instances even when the declared versions match, so hooks cannot see the provider and hydration fails with “No QueryClient set”.

**Why:** Typechecking and a successful Vite build do not exercise the provider context at runtime. The failure only appeared on hydrated public routes in the published bundle.

**How to apply:** Keep the shared runtime dependencies aligned, configure bundler-level deduplication for the provider and hook libraries, and include a browser smoke check for representative data routes so this class of failure is caught before publishing.