import { toolRoutes } from "./public-routes";

export const toolDirectoryCategories = [
  { id: "offers-pay", label: "Offers and pay" },
  { id: "leaving-safety", label: "Leaving and financial safety" },
  { id: "verify", label: "Verify before acting" },
  { id: "explore", label: "Explore and plan" },
] as const;

export type ToolDirectoryCategory = (typeof toolDirectoryCategories)[number]["id"];
export type ToolDirectoryReadiness = "READY" | "READY WITH WARNINGS" | "NOT READY" | "BLOCKED BY HUMAN INPUT" | "NEEDS REVIEW";

type ToolDirectoryMetadata = {
  priority: number;
  category: ToolDirectoryCategory;
  customerQuestion: string;
  technicalReview?: {
    evidence: string;
    remainingGate: string;
  };
};

const metadataByToolId: Record<string, ToolDirectoryMetadata> = {
  "offer-comparison": {
    priority: 1,
    category: "offers-pay",
    customerQuestion: "Compare written offers beyond the headline CTC.",
    technicalReview: {
      evidence: "The current route describes separate zero-variable and full-target estimates, employer costs, and entered transition costs.",
      remainingGate: "Route-matched arithmetic and payroll-assumption review are not recorded; keep take-home results as estimates.",
    },
  },
  "ctc-calculator": {
    priority: 2,
    category: "offers-pay",
    customerQuestion: "Estimate monthly in-hand pay from stated payroll assumptions.",
  },
  "tax-regime-comparison": {
    priority: 3,
    category: "offers-pay",
    customerQuestion: "Compare old and new tax estimates for the stated tax year.",
    technicalReview: {
      evidence: "The tool is scoped to AY 2026–27 and names deductions and rebate limits for residents under 60.",
      remainingGate: "A qualified reviewer must verify the current official tax rules and worked examples before readiness can be cleared.",
    },
  },
  "job-posting-reality-check": {
    priority: 4,
    category: "verify",
    customerQuestion: "See what the resume supports for a specific job posting.",
    technicalReview: {
      evidence: "Route browser checks cover local PDF/DOCX extraction without resume-content requests, named controls, keyboard focus order, required-field and fetch-error announcements, and evidence attribution.",
      remainingGate: "No additional route-level gate was identified by this scoped review; it is not a formal WCAG conformance audit.",
    },
  },
  "employer-due-diligence": {
    priority: 5,
    category: "verify",
    customerQuestion: "Check an employer and offer against available evidence.",
  },
  "layoff-runway": {
    priority: 6,
    category: "leaving-safety",
    customerQuestion: "Estimate how long confirmed cash can cover essential costs.",
    technicalReview: {
      evidence: "Model tests cover 12 monthly rows, surplus, shortfall, no depletion, and negative-input rejection.",
      remainingGate: "Complete current-route usability, privacy, and narrow-screen review; do not imply job-search duration.",
    },
  },
  "final-pay-estimator": {
    priority: 7,
    category: "leaving-safety",
    customerQuestion: "Organize final-pay components to reconcile with an employer.",
    technicalReview: {
      evidence: "Model tests reconcile the entered daily-rate basis and reject invalid divisors.",
      remainingGate: "State leave rules, contract terms, and employer policy need current review; this is not a legal entitlement decision.",
    },
  },
  "gratuity-estimator": {
    priority: 8,
    category: "leaving-safety",
    customerQuestion: "Illustrate a limited gratuity formula from entered details.",
    technicalReview: {
      evidence: "Tests cover the dated ceiling, fixed-term threshold, service rounding, death, and disablement cases.",
      remainingGate: "A qualified reviewer must verify current official rules and exclusions; do not infer eligibility from the illustration.",
    },
  },
  "salary-drop": {
    priority: 9,
    category: "offers-pay",
    customerQuestion: "Compare two salary packages against household costs.",
  },
  "resign-or-stay": {
    priority: 10,
    category: "leaving-safety",
    customerQuestion: "Compare staying, renegotiating, and leaving without a verdict.",
    technicalReview: {
      evidence: "A prior checklist assessment exists, but it refers to a redirected legacy route rather than this current worksheet.",
      remainingGate: "Revalidate current inputs, results, privacy, and route-level accessibility; keep it non-predictive.",
    },
  },
  "career-compass": {
    priority: 11,
    category: "explore",
    customerQuestion: "Compare a move, an offer, or staying using your own constraints.",
  },
  "home-loan-stress-test": {
    priority: 12,
    category: "leaving-safety",
    customerQuestion: "Check whether a higher loan rate fits your monthly budget.",
    technicalReview: {
      evidence: "Model tests reconcile payment, principal, and interest and reject fractional month terms.",
      remainingGate: "Verify the user's lender terms and validate the stress assumptions; do not frame the output as lending or affordability advice.",
    },
  },
  "escape-plan": {
    priority: 13,
    category: "explore",
    customerQuestion: "Turn a career goal into a realistic weekly action plan.",
  },
  "career-reality-check": {
    priority: 14,
    category: "explore",
    customerQuestion: "Identify one career assumption or fact to verify before moving.",
  },
  "ai-work-prompts": {
    priority: 15,
    category: "explore",
    customerQuestion: "Examine how AI may change tasks, review, and accountability.",
  },
};

const legacyAssessmentByToolId: Record<string, { id: string; note: string }> = {
  "offer-comparison": {
    id: "salary-reality",
    note: "A prior salary-reality assessment exists, but its route and scope differ; it is not used as this tool's current score.",
  },
  "layoff-runway": {
    id: "layoff-radar",
    note: "A prior layoff-radar assessment exists, but it does not assess the current runway calculator.",
  },
  "resign-or-stay": {
    id: "resignation-risk",
    note: "A prior resignation-risk assessment uses a redirected route; revalidate it against the current worksheet.",
  },
};

export const toolDirectoryItems = toolRoutes
  .map((route) => {
    const toolId = route.toolId;
    if (!toolId) throw new Error(`Tool route ${route.path} is missing a toolId.`);
    const metadata = metadataByToolId[toolId];
    if (!metadata) throw new Error(`Tool route ${route.path} has no directory priority metadata.`);
    const legacyAssessment = legacyAssessmentByToolId[toolId] ?? null;

    return {
      route,
      toolId,
      ...metadata,
      legacyAssessment,
    };
  })
  .sort((a, b) => a.priority - b.priority);

export function getToolDirectoryCategoryLabel(category: ToolDirectoryCategory): string {
  return toolDirectoryCategories.find((item) => item.id === category)?.label ?? category;
}
