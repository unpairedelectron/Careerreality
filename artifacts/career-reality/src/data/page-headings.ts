/**
 * One heading source for prerendered snapshots and hydrated React pages.
 *
 * `h1` is the keyword-bearing page heading. It is deliberately separate from the
 * route-registry `title` (which drives `<title>`), so shortening a document title
 * does not silently change the visible H1.
 *
 * `subhead` is the brand line shown directly under the H1, and `kicker` is a short
 * line shown above it. Both render as paragraphs, never as headings.
 *
 * Pillar guides and rules pages are not listed: both renders read their H1 from
 * `generated-pillar-guides.json` and `rules-library.json` respectively.
 *
 * `scripts/verify-route-snapshots.ts` fails the build when a snapshot H1 differs
 * from this module, and `tests/snapshot-parity.spec.ts` checks the hydrated H1.
 */
export type PageHeading = {
  h1: string;
  subhead?: string;
  kicker?: string;
};

export const pageHeadings: Record<string, PageHeading> = {
  "/": { h1: "Make your next move make sense." },

  // Hubs
  "/tools": { h1: "Career Tools for India", subhead: "Tools for the parts you can check." },
  "/guides": { h1: "Career Guides for India", subhead: "Guides for the questions behind the move." },
  "/layoffs": { h1: "When work changes, steady the ground." },
  "/rules": { h1: "Rules and Data Library" },
  "/interview-guides": { h1: "Career Interview Guides by Role in India", subhead: "Choose your interview guide." },

  // Layoff event reports (kicker is rendered from the event company name)
  "/layoffs/tcs-layoffs": { h1: "Tata Consultancy Services Layoff Report" },
  "/layoffs/ola-electric-layoffs": { h1: "Ola Electric Layoff Report" },
  "/layoffs/byjus-workforce-restructuring-2023": { h1: "BYJU’S Workforce Reduction Report" },
  "/layoffs/swiggy-workforce-reduction-2023": { h1: "Swiggy Workforce Reduction Report" },
  "/layoffs/paytm-restructuring-2023": { h1: "Paytm Workforce Reduction Report" },
  "/layoffs/opendoor-india-operations-closure-2026": { h1: "Opendoor India Operations Closure Report" },
  "/layoffs/paypal-india-workforce-reduction-2026": { h1: "PayPal India Workforce Reduction Report" },
  "/layoffs/adidas-india-technology-reduction-2026": { h1: "Adidas India Technology Team Report" },
  "/layoffs/amazon-stores-workforce-reduction-2026": { h1: "Amazon Stores Workforce Reduction Report" },
  "/layoffs/amazon-devices-services-reduction-2026": { h1: "Amazon Devices and Services Role Reductions" },
  "/layoffs/microsoft-voluntary-buyout-offer-2026": { h1: "Microsoft Voluntary Buyout Offer Report" },
  "/layoffs/hsbc-uk-wealth-restructuring-2026": { h1: "HSBC UK Wealth Management Cuts Report" },

  // Tools
  "/salary-calculator": { h1: "CTC Calculator India: Estimate In-Hand Pay", subhead: "The offer says CTC. Your budget needs cash." },
  "/offer-comparison": { h1: "Compare Job Offers: CTC and Take-Home" },
  "/tax-regime-comparison": { h1: "Compare Old vs New Tax for AY 2026–27" },
  "/gratuity-estimator": { h1: "Gratuity Worksheet: Limited Formula Illustration" },
  "/final-pay-estimator": { h1: "Notice Period and Leave Pay Calculator" },
  "/layoff-runway": { h1: "Job Loss Runway Calculator: Months of Cash" },
  "/home-loan-stress-test": { h1: "Home Loan EMI Stress Test with Your Budget" },
  "/resign-or-stay": { h1: "Should I Resign or Stay? Decision Worksheet" },
  "/companies": { h1: "Check the employer behind the offer." },
  "/compass": { h1: "Compare a Job Offer, Move, or Staying", subhead: "Make the next move make sense." },
  "/salary-drop": { h1: "Salary Change Calculator: Compare Two CTCs", subhead: "Compare a lower package without a false verdict." },
  "/escape-plan": { h1: "Career Change Plan: Build a Weekly Checklist", subhead: "Build a plan for the change you want to test." },
  "/career-reality-index": { h1: "Career Reality Check: Questions Before a Move", subhead: "A career decision should end in a clearer question, not a prettier number." },
  "/job-posting-reality-check": { h1: "Job Posting Reality Check" },
  "/ai": { h1: "AI at Work: Questions to Assess Task Changes", subhead: "Start with the task, not a role-level AI score." },

  // Trust
  "/about": { h1: "About CareerReality", subhead: "CareerReality, made for consequential decisions." },
  "/team": { h1: "Team and Affiliation", subhead: "People behind CareerReality." },
  "/editorial": { h1: "Editorial Standards", subhead: "Evidence, limits, and uncertainty." },
  "/corrections": { h1: "Corrections and Updates", subhead: "Tell us what needs correcting." },
  "/methodology": { h1: "Tools and Calculation Methods", subhead: "How the tools calculate." },
  "/sources": { h1: "Sources and Data", subhead: "Follow the source trail." },
  "/privacy-policy": { h1: "Privacy Information: Data Use and Deletion", subhead: "Privacy and data handling." },
  "/terms": { h1: "Terms of Use and Limits", subhead: "Limits and use of CareerReality." },
  "/contact": { h1: "Contact CareerReality", subhead: "Contact CareerReality Editorial." },
  "/accessibility": { h1: "Accessibility Statement", subhead: "Accessibility information." },
  "/security": { h1: "Security Reporting", subhead: "Report a security concern." },

  // Utility
  "/search": { h1: "Search CareerReality", subhead: "Search the active directory." },
  "/sitemap": { h1: "CareerReality Sitemap", subhead: "Browse tools, guides, and trust information." },
  "/mobile-app": { h1: "CareerReality Mobile App", subhead: "Take the context with you." },
  "/pro": { h1: "CareerReality Membership", subhead: "Membership is not available in this release candidate." },

  // Interview guides (kicker is "<role> interview guide")
  "/interview-guides/data-engineer": { h1: "Data Engineer Interview Questions and Guide", kicker: "Data Engineer interview guide" },
  "/interview-guides/data-scientist": { h1: "Data Scientist Interview Questions and Guide", kicker: "Data Scientist interview guide" },
  "/interview-guides/ai-ml-engineer": { h1: "AI/ML Engineer Interview Questions and Guide", kicker: "AI/ML Engineer interview guide" },
  "/interview-guides/gen-ai-engineer": { h1: "Generative AI Engineer Interview Questions", kicker: "Generative AI Engineer interview guide" },
  "/interview-guides/agentic-ai-engineer": { h1: "Agentic AI Engineer Interview Questions", kicker: "Agentic AI Engineer interview guide" },
};

export function normalizeHeadingPath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? "/";
  return withoutQuery.replace(/\/+$/, "") || "/";
}

export function getPageHeading(path: string): PageHeading | undefined {
  return pageHeadings[normalizeHeadingPath(path)];
}
