# SEO Strategy

## In scope
- Public CareerReality home, tool directories and calculators, pillar guides, rules library, Layoff Hub/event archives, and trust pages.
- Source-visible crawlability, sharing metadata, structured data, internal linking, AI crawler guidance, and WCAG 2.2 A/AA accessibility.
- Treat `artifacts/career-reality/src/data/route-registry.json` as the intended publication/indexability policy; investigate contradictory client-side overrides rather than assuming these are intentional exclusions.

## Out of scope
- Authenticated workspace pages (`/workspace/**`), admin and authentication pages.
- Internal API endpoints, design mockups, native mobile app, and the launch-video artifact unless linked as public site pages.
- Legacy article corpus withheld as noindex editorial holds; retired company-detail/category URLs redirect to current public destinations. Their historical content optimization issues do not apply to the current indexable pillar guides.

## Target audience
- Professionals in India evaluating written offers, take-home pay, career changes, employer questions, layoffs, and employment-related rules.

## Primary keywords
- India career tools, CTC and take-home salary calculator, offer comparison, salary tax regimes, layoff runway, career decision guides.

## Content strategy
- Source-backed explanations, explicit assumptions and uncertainty, worked calculation examples, and actionable checklists; do not frame reflection prompts or historic layoff records as employment forecasts.
- Current public content includes 18 pillar guides, rules reference pages and historical layoff event records. Archived articles and unsupported company scores remain withheld.

## Crawler assumptions
- Public indexable routes use generated static HTML snapshots because the runtime application is a Vite React SPA.
- Production runs the custom published server with registry-aware snapshot delivery, redirects and real 404 responses.
- Social and AI crawlers should consume route-specific content without executing JavaScript. Client navigation must preserve the same metadata policy.
- Public robots rules allow AI crawlers; llms.txt should accurately describe the current published scope.

## Dismissed categories
- (None explicitly dismissed by the user.)
