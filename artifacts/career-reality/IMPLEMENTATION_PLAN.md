# CareerReality Implementation Plan

## Product north star

CareerReality is an evidence-backed career decision platform for Indian professionals. It should help a visitor move from a single urgent question (salary, resignation, company stability, layoffs, or AI impact) to a confident, explainable next step, then give them a reason to return as their career changes.

The product is intentionally not a generic job board, content farm, or AI app builder. Its defensibility comes from India-specific context, transparent methodology, useful tools, structured user contributions, and a data flywheel that improves the product over time.

## Milestone 1 — Decision hub foundation

**Status: in progress**

- Establish the brand promise: “Stop guessing. Know the reality.”
- Create a responsive home experience that connects salary, risk, company, layoff, and AI signals.
- Make the first-minute journey usable without an account.
- Add realistic local demo interactions for:
  - CTC/in-hand result preview
  - Career Reality Index exploration
  - Career tool selection
  - Company and market signal browsing
  - Pro value preview
- Provide clear methodology, freshness, and trust cues.
- Add visible conversion paths for premium intelligence and the weekly reality briefing.
- Keep the experience accessible, keyboard-friendly, and useful on small screens.

## Milestone 2 — Production hardening

**Target: next implementation pass**

- Connect the frontend to the shared API through the OpenAPI-first contract.
- Add event tracking for page views, tool starts, tool completions, result CTAs, signups, contribution submissions, and premium intent.
- Add error monitoring and uptime checks.
- Add server-side input validation, rate limits, anti-spam controls, and safe handling for anonymous salary data.
- Add explicit loading, partial-data, failure, and retry states for every data-backed surface.
- Add privacy, terms, methodology, source attribution, and correction-request surfaces.
- Add automated backups and a tested restore path before storing meaningful user submissions.

## Milestone 3 — Search and content engine

**Target: weeks 2–4**

- Build consistent SEO metadata and Open Graph previews for every indexable route.
- Add canonical URLs, sitemap coverage, robots rules, breadcrumbs, Article/FAQ/Dataset schema where applicable.
- Organize content into Salary Reality, Career Risk, Role Reality, Company Intelligence, and AI Intelligence clusters.
- Connect pillar pages, tools, company pages, city pages, role pages, and supporting articles with intentional internal links.
- Add freshness markers, methodology links, author/source context, and visible update dates.
- Use Search Console signals to prioritize pages with high impressions but weak click-through.

## Milestone 4 — Personal decision workspace

**Target: weeks 4–8**

- Add an optional account and saved analyses.
- Let users save a salary benchmark, company, or risk assessment.
- Add a personal comparison view for offers and companies.
- Add shareable result summaries that protect private inputs.
- Add a “next best action” summary after each assessment.
- Add watchlists for companies, roles, cities, and market signals.

## Milestone 5 — Career Reality Pro

**Target: weeks 6–10**

- Validate pricing with a lightweight premium funnel before expanding scope.
- Offer deeper salary percentiles by role, experience, and city.
- Unlock full company comparisons and richer evidence summaries.
- Provide saved dashboards, priority tools, and weekly intelligence.
- Add watchlist notifications for layoff, hiring, and salary-market changes.
- Track the full conversion funnel: exposure → intent → checkout → activation → retention.
- Keep core utility free and make the paid layer about depth, continuity, and personalization.

## Milestone 6 — Data flywheel and trust layer

**Target: weeks 8–12**

- Accept anonymous salary and employer signals with clear consent.
- Add duplicate detection, moderation, verification heuristics, and confidence labels.
- Track data freshness, sample size, geographic coverage, and known limitations.
- Separate editorial conclusions from sponsored or commercial material.
- Publish a visible methodology and correction process.
- Reward useful contributions with transparent credits or access benefits without encouraging fabricated data.

## Milestone 7 — B2B intelligence

**Target: quarter 2**

- Package aggregated, privacy-safe company and salary intelligence.
- Explore employer benchmarking, university reports, recruiter intelligence, and workforce research.
- Add role-based access and exportable reports only after the consumer data foundation is trustworthy.
- Keep the consumer product as the trust and contribution engine.

## Success measures

### Acquisition

- Organic impressions and clicks by topic cluster
- Search click-through rate on optimized pages
- Qualified landing-page sessions
- Returning visitor rate

### Activation

- Tool start rate
- Tool completion rate
- Second-tool engagement
- Result share/save rate
- Email or alert signup rate

### Trust and quality

- Calculation and API error rate
- Form abandonment and retry rate
- Data freshness and verification coverage
- Support or correction requests

### Monetization

- Premium offer exposure-to-intent rate
- Checkout conversion
- Pro activation rate
- Monthly retention
- Revenue per active subscriber
- B2B qualified leads

## Delivery principles

1. Keep the first useful answer free and fast.
2. Never hide uncertainty behind a confident score.
3. Treat sensitive career and salary data as privacy-critical.
4. Prefer connected user journeys over isolated feature pages.
5. Instrument before scaling traffic or paid acquisition.
6. Use real data contracts and explicit failure states once backend integration begins.
7. Protect editorial independence as a product feature.