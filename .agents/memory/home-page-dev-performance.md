---
name: Home-page dev performance
description: Lessons from mobile Lighthouse runs against the CareerReality Vite preview.
---

For the home route, import small SEO constants from small modules and defer API-backed forms below the fold until they approach the viewport. Vite's development server serves and evaluates source modules without production tree-shaking, so importing one constant from a large editorial module can still pull its dependency graph into the initial route.

**Why:** A mobile Lighthouse run against the dev preview showed long blank/late-render time despite a fast document response; its network chain included large editorial and API modules that the homepage did not need above the fold.

**How to apply:** When investigating dev-preview LCP, inspect the browser's module request chain and separate route-critical imports from content or interactions that can load later. Compare with a production build before attributing dev-only overhead to deployed performance.
