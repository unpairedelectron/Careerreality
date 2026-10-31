---
name: CareerReality trust principle
description: Product-wide rule for honest answers and measuring whether CareerReality improves real career decisions.
---

CareerReality answers should visibly follow four steps: what we know, what it means for the person, what we do not know, and what they should do next. The product must label uncertainty, stale data, missing context, and assumptions instead of projecting confidence it has not earned.

When a server-backed career profile is missing, treat it as a first-run setup experience: do not fill the dashboard with placeholder personalization, and make the path to a saved brief explicit.

The product north star is the percentage of active users who take a meaningful career action each week because of CareerReality. Meaningful action can include saving a decision, applying to a relevant role, asking for a raise, updating a resume, completing a progression action, contacting a recruiter, completing targeted learning, or choosing not to switch after reviewing evidence.

Company stability and hiring scores require claim-supporting source evidence and an approved, versioned method; a syntactically valid source URL alone is not validation. Apply this gate to API responses and client views, including aggregates and personalized decisions.

Layoff reporting must distinguish the reach of a voluntary-exit offer from accepted or completed departures. An eligible population is not a job-loss count.

**Why:** Treating an offer pool as completed cuts overstates the reported impact.

**How to apply:** Preserve the program type, reported eligibility scope, source, and unknown departure count in tracker cards, detail records, and alerts.

**Why:** Source-less company rows had numerical ratings in the public directory despite directional disclaimers.

**How to apply:** Exclude unapproved rows from cards, detail pages, summary statistics, and decision calculations; show an explicit no-signal state instead.

**Why:** A confident wrong answer can destroy trust; CareerReality earns durable value by helping people make better moves before it is too late.

**How to apply:** Use the four-part structure in personalized briefs, recommendations, tools, evidence panels, and recovery states. Treat action quality and decision usefulness as more important than engagement volume. A setup CTA must sync the profile before the app claims the brief is ready.