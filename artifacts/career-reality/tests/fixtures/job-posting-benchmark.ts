import type { JobEvidenceStatus, JobRequirementCategory } from "@workspace/career-tools";

export type BenchmarkRequirement = {
  text: string;
  category: JobRequirementCategory;
  evidenceStatus: Exclude<JobEvidenceStatus, "confirmed-gap">;
  quoteContains: string | null;
  rationale: string;
};

export type BenchmarkPair = {
  id: string;
  jobText: string;
  resumeText: string;
  requirements: BenchmarkRequirement[];
};

export type ReadinessBenchmarkCase = {
  id: string;
  jobText: string;
  resumeText: string;
  expectedEvidence: Array<{
    requirementText: string;
    status: Exclude<JobEvidenceStatus, "confirmed-gap">;
  }>;
  confirmedGapRequirement?: string;
  expectedScore: number | null;
  expectedBand: "go" | "sharpen" | "pause" | "unscored";
  expectedRecommendation: string;
};

/**
 * Fully synthetic examples. No real job posting, resume, or person is represented.
 * Expected labels are explicit author-adjudicated reference labels, not independent
 * human review or a representative sample of hiring data.
 */
export const benchmarkPairs: BenchmarkPair[] = [
  {
    id: "direct-action",
    jobText: "Responsibilities\nBuild Python data pipelines for finance reporting.",
    resumeText: "Built Python data pipelines used by the finance team to automate monthly reporting.",
    requirements: [{
      text: "Build Python data pipelines for finance reporting",
      category: "responsibility",
      evidenceStatus: "direct",
      quoteContains: "Built Python data pipelines",
      rationale: "The excerpt names the requested work and gives an action and context.",
    }],
  },
  {
    id: "missing-skill-and-incidental-tool",
    jobText: [
      "Must have SQL experience.",
      "Our internal prototype uses Python in one reporting script.",
    ].join("\n"),
    resumeText: "Created Power BI dashboards for a finance team.",
    requirements: [{
      text: "Must have SQL experience",
      category: "essential-competency",
      evidenceStatus: "not-documented",
      quoteContains: null,
      rationale: "No SQL evidence is supplied; the second job sentence is company context, not a candidate requirement.",
    }],
  },
  {
    id: "different-cloud",
    jobText: "Must have AWS experience.",
    resumeText: "Deployed Azure services and managed cloud infrastructure.",
    requirements: [{
      text: "Must have AWS experience",
      category: "essential-competency",
      evidenceStatus: "transferable",
      quoteContains: "Deployed Azure services",
      rationale: "Azure experience is relevant background but is not AWS experience.",
    }],
  },
  {
    id: "partial-multi-skill",
    jobText: "Must have Python and SQL experience.",
    resumeText: "Built Python services for internal reporting.",
    requirements: [{
      text: "Must have Python and SQL experience",
      category: "essential-competency",
      evidenceStatus: "partial",
      quoteContains: "Built Python services",
      rationale: "Python is evidenced; SQL is not documented.",
    }],
  },
  {
    id: "qualification",
    jobText: "A bachelor's degree is required.",
    resumeText: "Earned a bachelor's degree in mathematics.",
    requirements: [{
      text: "A bachelor's degree is required",
      category: "qualification",
      evidenceStatus: "partial",
      quoteContains: "bachelor's degree",
      rationale: "The qualification appears, but the short excerpt does not show its relevance to the role.",
    }],
  },
  {
    id: "eligibility",
    jobText: "Must have current work authorization for India.",
    resumeText: "Built internal reporting software for a regional team.",
    requirements: [{
      text: "Must have current work authorization for India",
      category: "eligibility",
      evidenceStatus: "not-documented",
      quoteContains: null,
      rationale: "Eligibility is not established by the supplied work-history excerpt.",
    }],
  },
  {
    id: "preferred-skill",
    jobText: "Power BI experience is preferred.",
    resumeText: "Created Power BI reports for monthly operations reviews.",
    requirements: [{
      text: "Power BI experience is preferred",
      category: "preferred",
      evidenceStatus: "direct",
      quoteContains: "Created Power BI reports",
      rationale: "The excerpt shows the preferred tool used in a concrete task.",
    }],
  },
  {
    id: "contextual-tool",
    jobText: "Kubernetes experience.",
    resumeText: "Kubernetes",
    requirements: [{
      text: "Kubernetes experience",
      category: "contextual-tool",
      evidenceStatus: "partial",
      quoteContains: "Kubernetes",
      rationale: "A keyword appears, but there is no context showing the depth or use of the skill.",
    }],
  },
  {
    id: "unclear-criterion",
    jobText: "Must be a rockstar with a good attitude.",
    resumeText: "Built internal dashboards for a support team.",
    requirements: [{
      text: "Must be a rockstar with a good attitude",
      category: "unclear",
      evidenceStatus: "unresolved",
      quoteContains: null,
      rationale: "The wording is subjective and does not define verifiable evidence.",
    }],
  },
  {
    id: "negated-evidence",
    jobText: "Must have Kubernetes production experience.",
    resumeText: "I did not operate Kubernetes in production.",
    requirements: [{
      text: "Must have Kubernetes production experience",
      category: "essential-competency",
      evidenceStatus: "not-documented",
      quoteContains: null,
      rationale: "The excerpt explicitly denies the requested experience and is not positive evidence.",
    }],
  },
  {
    id: "synonym-miss",
    jobText: "Must have data analysis experience.",
    resumeText: "Analyzed sales records and summarized trends for leadership.",
    requirements: [{
      text: "Must have data analysis experience",
      category: "essential-competency",
      evidenceStatus: "direct",
      quoteContains: "Analyzed sales records",
      rationale: "The excerpt describes data-analysis work without repeating the exact label.",
    }],
  },
  {
    id: "data-analysis-trend-summary",
    jobText: "Must have data analysis experience.",
    resumeText: "Identified seasonal patterns in monthly revenue data.",
    requirements: [{
      text: "Must have data analysis experience",
      category: "essential-competency",
      evidenceStatus: "direct",
      quoteContains: "Identified seasonal patterns in monthly revenue data",
      rationale: "The excerpt describes identifying patterns in data without using the exact skill label.",
    }],
  },
  {
    id: "data-analysis-keyword-overlap-only",
    jobText: "Must have data analysis experience.",
    resumeText: "Managed a sales team and maintained customer records.",
    requirements: [{
      text: "Must have data analysis experience",
      category: "essential-competency",
      evidenceStatus: "not-documented",
      quoteContains: null,
      rationale: "Sales and records overlap with the example domain, but no analytical activity is described.",
    }],
  },
  {
    id: "data-analysis-negated-paraphrase",
    jobText: "Must have data analysis experience.",
    resumeText: "Did not analyze sales records for the quarterly review.",
    requirements: [{
      text: "Must have data analysis experience",
      category: "essential-competency",
      evidenceStatus: "not-documented",
      quoteContains: null,
      rationale: "The resume explicitly negates the paraphrased activity, so it is not positive evidence.",
    }],
  },
  {
    id: "project-management-paraphrase",
    jobText: "Must have project management experience.",
    resumeText: "Coordinated project timelines and tracked delivery milestones.",
    requirements: [{
      text: "Must have project management experience",
      category: "essential-competency",
      evidenceStatus: "direct",
      quoteContains: "Coordinated project timelines",
      rationale: "The excerpt describes coordinating a project timeline and milestones without the exact label.",
    }],
  },
  {
    id: "project-management-keyword-overlap-only",
    jobText: "Must have project management experience.",
    resumeText: "Contributed to a project team and maintained customer records.",
    requirements: [{
      text: "Must have project management experience",
      category: "essential-competency",
      evidenceStatus: "not-documented",
      quoteContains: null,
      rationale: "Mentioning a project team does not establish planning or coordination responsibility.",
    }],
  },
  {
    id: "stakeholder-management-paraphrase",
    jobText: "Must have stakeholder management experience.",
    resumeText: "Aligned cross-functional stakeholders around launch priorities.",
    requirements: [{
      text: "Must have stakeholder management experience",
      category: "essential-competency",
      evidenceStatus: "direct",
      quoteContains: "Aligned cross-functional stakeholders",
      rationale: "The excerpt describes aligning stakeholders without repeating the exact skill label.",
    }],
  },
  {
    id: "stakeholder-management-keyword-overlap-only",
    jobText: "Must have stakeholder management experience.",
    resumeText: "Presented findings to stakeholders and maintained a project tracker.",
    requirements: [{
      text: "Must have stakeholder management experience",
      category: "essential-competency",
      evidenceStatus: "not-documented",
      quoteContains: null,
      rationale: "A presentation to stakeholders and a project tracker do not establish stakeholder management.",
    }],
  },
  {
    id: "long-paragraph-buried-responsibility",
    jobText: "Our internal prototype uses Python for internal demos, archived simulations, team exercises, and local testing, while wider company context spans several regions, varied product lines, long planning cycles, quarterly priorities and multiple reporting audiences with different governance processes, and you will own monthly finance reporting pipelines.",
    resumeText: "Owned monthly finance reporting pipelines and shipped close dashboards.",
    requirements: [{
      text: "and you will own monthly finance reporting pipelines",
      category: "responsibility",
      evidenceStatus: "direct",
      quoteContains: "Owned monthly finance reporting pipelines",
      rationale: "The paragraph contains irrelevant internal-tool context before a concrete responsibility near its end.",
    }],
  },
  {
    id: "unpunctuated-long-responsibility",
    jobText: `${"Our internal prototype uses Python and Go for demonstrations across regional teams and long planning cycles with shifting operating priorities and several internal reporting audiences ".repeat(2)}then you will own monthly finance reporting pipelines`,
    resumeText: "Owned monthly finance reporting pipelines and shipped close dashboards.",
    requirements: [{
      text: "you will own monthly finance reporting pipelines",
      category: "responsibility",
      evidenceStatus: "direct",
      quoteContains: "Owned monthly finance reporting pipelines",
      rationale: "The explicit candidate-duty phrase provides a safe boundary after long company context without punctuation.",
    }],
  },
  {
    id: "unpunctuated-company-accountability",
    jobText: `Our internal platform is accountable for prototype maintenance ${"across internal support teams and regional product groups with long planning cycles and varied operating workflows ".repeat(3)}`,
    resumeText: "Built finance dashboards for the operations team.",
    requirements: [],
  },
  {
    id: "accountable-for-equivalent-responsibility",
    jobText: "The role is accountable for stakeholder management across Finance and Engineering.",
    resumeText: "Managed cross-functional stakeholders across Finance and Engineering for a monthly launch.",
    requirements: [{
      text: "The role is accountable for stakeholder management across Finance and Engineering",
      category: "responsibility",
      evidenceStatus: "direct",
      quoteContains: "Managed cross-functional stakeholders",
      rationale: "Accountability wording expresses a responsibility without using a direct action verb.",
    }],
  },
];

/**
 * Manually reviewed, synthetic resume/posting scenarios for score behavior.
 * These labels are author-adjudicated regression expectations, not independent
 * human review, a representative sample, or validation of hiring outcomes.
 * Score and recommendation assertions validate implementation of the current
 * rules; the 40/70 cutoffs themselves remain judgment-based.
 */
export const readinessBenchmarkCases: ReadinessBenchmarkCase[] = [
  {
    id: "strong-product-analyst",
    jobText: [
      "Senior product analyst",
      "Requirements",
      "Must have SQL experience.",
      "Must have Python experience.",
      "Power BI experience is preferred.",
    ].join("\n"),
    resumeText: [
      "Product analyst with five years supporting subscription and finance teams.",
      "Built SQL queries and Python jobs that reduced monthly reporting time by 35%.",
      "Created Power BI dashboards used by product and finance leaders.",
    ].join("\n"),
    expectedEvidence: [
      { requirementText: "Must have SQL experience", status: "direct" },
      { requirementText: "Must have Python experience", status: "direct" },
      { requirementText: "Power BI experience is preferred", status: "direct" },
    ],
    expectedScore: 100,
    expectedBand: "go",
    expectedRecommendation: "Go for it",
  },
  {
    id: "mixed-cloud-analytics",
    jobText: [
      "Analytics engineer",
      "Requirements",
      "Must have Python and SQL experience.",
      "Must have AWS experience.",
      "Tableau experience is preferred.",
    ].join("\n"),
    resumeText: [
      "Analytics engineer supporting finance and operations teams.",
      "Built Python data pipelines and deployed Azure workloads for monthly reporting.",
      "Prepared monthly operations reports for business stakeholders.",
    ].join("\n"),
    expectedEvidence: [
      { requirementText: "Must have Python and SQL experience", status: "partial" },
      { requirementText: "Must have AWS experience", status: "transferable" },
      { requirementText: "Tableau experience is preferred", status: "not-documented" },
    ],
    expectedScore: 50,
    expectedBand: "sharpen",
    expectedRecommendation: "Apply with a sharper resume",
  },
  {
    id: "weak-platform-match",
    jobText: [
      "Platform engineer",
      "Requirements",
      "Must have Kubernetes experience.",
      "Must have Terraform experience.",
      "Must have AWS experience.",
    ].join("\n"),
    resumeText: [
      "Customer operations coordinator.",
      "Scheduled service teams and prepared weekly customer updates.",
    ].join("\n"),
    expectedEvidence: [
      { requirementText: "Must have Kubernetes experience", status: "not-documented" },
      { requirementText: "Must have Terraform experience", status: "not-documented" },
      { requirementText: "Must have AWS experience", status: "not-documented" },
    ],
    expectedScore: 0,
    expectedBand: "pause",
    expectedRecommendation: "Pause and verify the must-haves",
  },
  {
    id: "incomplete-operations-resume",
    jobText: [
      "Operations analyst",
      "Requirements",
      "Must have SQL experience.",
      "Must have Python experience.",
      "Excel experience is preferred.",
    ].join("\n"),
    resumeText: "Operations analyst, 2022–2024. Prepared weekly reports for regional managers.",
    expectedEvidence: [
      { requirementText: "Must have SQL experience", status: "not-documented" },
      { requirementText: "Must have Python experience", status: "not-documented" },
      { requirementText: "Excel experience is preferred", status: "not-documented" },
    ],
    expectedScore: 0,
    expectedBand: "pause",
    expectedRecommendation: "Pause and verify the must-haves",
  },
  {
    id: "explicitly-confirmed-mandatory-gap",
    jobText: [
      "Data engineer",
      "Requirements",
      "Must have Python experience.",
      "Must have AWS experience.",
      "Must have Kubernetes experience.",
    ].join("\n"),
    resumeText: [
      "Data engineer.",
      "Built Python reporting scripts and deployed services on AWS.",
      "No Kubernetes experience.",
    ].join("\n"),
    expectedEvidence: [
      { requirementText: "Must have Python experience", status: "direct" },
      { requirementText: "Must have AWS experience", status: "direct" },
      { requirementText: "Must have Kubernetes experience", status: "not-documented" },
    ],
    confirmedGapRequirement: "Must have Kubernetes experience",
    expectedScore: 67,
    expectedBand: "pause",
    expectedRecommendation: "Skip unless this requirement is negotiable",
  },
];
