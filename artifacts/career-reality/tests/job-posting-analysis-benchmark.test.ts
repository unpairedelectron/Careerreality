import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeJobPosting,
  calculateJobPostingReadiness,
  type JobEvidenceStatus,
  type JobRequirementCategory,
} from "@workspace/career-tools";
import { readinessBenchmarkCases } from "./fixtures/job-posting-benchmark";

type ExpectedRequirement = {
  text: string;
  category: JobRequirementCategory;
  signal: "mandatory" | "preferred" | "ambiguous";
  evidenceStatus: Exclude<JobEvidenceStatus, "confirmed-gap">;
  rationale: string;
};

type BenchmarkCase = {
  id: string;
  jobText: string;
  resumeText: string;
  expected?: ExpectedRequirement;
  expectedDuplicate?: boolean;
};

// Synthetic controlled examples only. These fixtures are regression checks, not a
// representative or externally validated measure of real-world hiring accuracy.
const benchmarkCases: BenchmarkCase[] = [
  {
    id: "direct-action-evidence",
    jobText: "Responsibilities\n- Build Python data pipelines for finance reporting",
    resumeText: "Built Python data pipelines that automated monthly finance reports.",
    expected: {
      text: "Build Python data pipelines for finance reporting",
      category: "responsibility",
      signal: "ambiguous",
      evidenceStatus: "direct",
      rationale: "The same skill appears in a resume action with an outcome.",
    },
  },
  {
    id: "mandatory-sql",
    jobText: "Must have SQL experience",
    resumeText: "Built SQL queries for sales and finance dashboards.",
    expected: {
      text: "Must have SQL experience",
      category: "essential-competency",
      signal: "mandatory",
      evidenceStatus: "direct",
      rationale: "The mandatory skill is evidenced alongside a concrete action.",
    },
  },
  {
    id: "partial-multi-skill",
    jobText: "Must have Python and SQL experience",
    resumeText: "Built Python services for reporting.",
    expected: {
      text: "Must have Python and SQL experience",
      category: "essential-competency",
      signal: "mandatory",
      evidenceStatus: "partial",
      rationale: "Only one of the two named skills appears in the resume.",
    },
  },
  {
    id: "not-documented",
    jobText: "Must have Kubernetes experience",
    resumeText: "Built internal reporting software.",
    expected: {
      text: "Must have Kubernetes experience",
      category: "essential-competency",
      signal: "mandatory",
      evidenceStatus: "not-documented",
      rationale: "No matching skill appears; absence is not treated as a confirmed gap.",
    },
  },
  {
    id: "transferable-cloud",
    jobText: "Must have AWS experience",
    resumeText: "Deployed Azure workloads for analytics.",
    expected: {
      text: "Must have AWS experience",
      category: "essential-competency",
      signal: "mandatory",
      evidenceStatus: "transferable",
      rationale: "A different cloud platform is relevant but not equivalent evidence.",
    },
  },
  {
    id: "qualification",
    jobText: "Bachelor degree required for this role",
    resumeText: "Built reporting tools for the operations team.",
    expected: {
      text: "Bachelor degree required for this role",
      category: "qualification",
      signal: "mandatory",
      evidenceStatus: "not-documented",
      rationale: "Qualification language is classified separately from competencies.",
    },
  },
  {
    id: "eligibility-condition",
    jobText: "Must have current work authorization for India",
    resumeText: "Built internal reporting software.",
    expected: {
      text: "Must have current work authorization for India",
      category: "eligibility",
      signal: "mandatory",
      evidenceStatus: "not-documented",
      rationale: "Work authorization is a distinct employment condition.",
    },
  },
  {
    id: "preferred-tool",
    jobText: "Kubernetes experience is a plus",
    resumeText: "Built Python services for reporting.",
    expected: {
      text: "Kubernetes experience is a plus",
      category: "preferred",
      signal: "preferred",
      evidenceStatus: "not-documented",
      rationale: "Preferred wording remains distinct from mandatory requirements.",
    },
  },
  {
    id: "vague-criterion",
    jobText: "Must be a rockstar with a good attitude",
    resumeText: "Built internal dashboards.",
    expected: {
      text: "Must be a rockstar with a good attitude",
      category: "unclear",
      signal: "mandatory",
      evidenceStatus: "unresolved",
      rationale: "Vague language is left unresolved rather than mapped to a skill gap.",
    },
  },
  {
    id: "weakly-supported-tool",
    jobText: "Kubernetes experience",
    resumeText: "Built Python services for reporting.",
    expected: {
      text: "Kubernetes experience",
      category: "contextual-tool",
      signal: "ambiguous",
      evidenceStatus: "not-documented",
      rationale: "A tool without an explicit duty is flagged for review.",
    },
  },
  {
    id: "duplicate-requirement",
    jobText: "Must have Python experience\nMust have Python experience",
    resumeText: "Built Python services for reporting.",
    expected: {
      text: "Must have Python experience",
      category: "essential-competency",
      signal: "mandatory",
      evidenceStatus: "direct",
      rationale: "Repeated wording is collapsed and flagged without raising its importance.",
    },
    expectedDuplicate: true,
  },
  {
    id: "non-requirement-copy",
    jobText: "We are an exciting company with a friendly culture",
    resumeText: "Built internal dashboards.",
  },
  {
    id: "long-paragraph-core-duty",
    jobText: "Our internal prototype uses Python for internal demos, archived simulations, team exercises, and local testing, while wider company context spans several regions, varied product lines, long planning cycles, quarterly priorities and multiple reporting audiences with different governance processes, and you will own monthly finance reporting pipelines.",
    resumeText: "Owned monthly finance reporting pipelines and shipped close dashboards.",
    expected: {
      text: "and you will own monthly finance reporting pipelines",
      category: "responsibility",
      signal: "ambiguous",
      evidenceStatus: "direct",
      rationale: "The long paragraph buries a core duty after company-context tools and prose.",
    },
  },
  {
    id: "accountability-paraphrase",
    jobText: "The role is accountable for stakeholder management across Finance and Engineering.",
    resumeText: "Managed cross-functional stakeholders across Finance and Engineering for a monthly launch.",
    expected: {
      text: "The role is accountable for stakeholder management across Finance and Engineering",
      category: "responsibility",
      signal: "ambiguous",
      evidenceStatus: "direct",
      rationale: "Accountability wording describes a responsibility without a direct action verb.",
    },
  },
  {
    id: "unpunctuated-long-candidate-duty",
    jobText: `${"Our internal prototype uses Python and Go for demonstrations across regional teams and long planning cycles with shifting operating priorities and several internal reporting audiences ".repeat(2)}then you will own monthly finance reporting pipelines`,
    resumeText: "Owned monthly finance reporting pipelines and shipped close dashboards.",
    expected: {
      text: "you will own monthly finance reporting pipelines",
      category: "responsibility",
      signal: "ambiguous",
      evidenceStatus: "direct",
      rationale: "The explicit duty boundary can be separated from company context even without punctuation.",
    },
  },
  {
    id: "unpunctuated-company-duty",
    jobText: `Our internal platform is accountable for prototype maintenance ${"across internal support teams and regional product groups with long planning cycles and varied operating workflows ".repeat(3)}`,
    resumeText: "Built finance dashboards for the operations team.",
  },
  {
    id: "markdown-required-qualifications",
    jobText: "## Required Qualifications\n1. SQL experience",
    resumeText: "Built SQL queries for finance dashboards.",
    expected: {
      text: "SQL experience",
      category: "essential-competency",
      signal: "mandatory",
      evidenceStatus: "direct",
      rationale: "A Markdown section and numbered item preserve the required signal.",
    },
  },
  {
    id: "markdown-preferred-skills",
    jobText: "### Preferred Skills:\n- Kubernetes experience",
    resumeText: "Built Python services for reporting.",
    expected: {
      text: "Kubernetes experience",
      category: "preferred",
      signal: "preferred",
      evidenceStatus: "not-documented",
      rationale: "A preferred section remains optional even without repeated preference wording.",
    },
  },
];

const statuses: Array<ExpectedRequirement["evidenceStatus"]> = [
  "direct", "transferable", "partial", "not-documented", "unresolved",
];

test("reports labeled synthetic requirement-matching benchmark metrics", () => {
  const observations = benchmarkCases.map((fixture) => {
    const analysis = analyzeJobPosting(fixture.jobText, fixture.resumeText);
    const matched = fixture.expected
      ? analysis.requirements.find((item) => item.text === fixture.expected?.text)
      : undefined;
    return { fixture, analysis, matched };
  });

  const expectedCases = observations.filter(({ fixture }) => fixture.expected);
  const extracted = expectedCases.filter(({ matched }) => matched);
  const falsePositives = observations.reduce((count, { fixture, analysis }) => (
    count + analysis.requirements.filter((item) => !fixture.expected || item.text !== fixture.expected.text).length
  ), 0);
  const statusCorrect = extracted.filter(({ fixture, matched }) => matched?.evidenceStatus === fixture.expected?.evidenceStatus).length;
  const categoryCorrect = extracted.filter(({ fixture, matched }) => matched?.category === fixture.expected?.category).length;
  const signalCorrect = extracted.filter(({ fixture, matched }) => matched?.signal === fixture.expected?.signal).length;

  const statusMetrics = statuses.map((status) => {
    const expectedForStatus = expectedCases.filter(({ fixture }) => fixture.expected?.evidenceStatus === status);
    const predictedForStatus = extracted.filter(({ matched }) => matched?.evidenceStatus === status);
    const truePositives = expectedForStatus.filter(({ matched }) => matched?.evidenceStatus === status).length;
    const falsePositivesForStatus = predictedForStatus.filter(({ fixture }) => fixture.expected?.evidenceStatus !== status).length;
    const falseNegatives = expectedForStatus.length - truePositives;
    const precision = truePositives + falsePositivesForStatus === 0
      ? 0
      : truePositives / (truePositives + falsePositivesForStatus);
    const recall = expectedForStatus.length === 0 ? 0 : truePositives / expectedForStatus.length;
    return { status, support: expectedForStatus.length, precision, recall };
  });

  const report = {
    corpus: "synthetic controlled cases; not field-validated",
    cases: benchmarkCases.length,
    expectedRequirements: expectedCases.length,
    extractedRequirements: extracted.length,
    extractionPrecision: extracted.length / (extracted.length + falsePositives),
    extractionRecall: extracted.length / expectedCases.length,
    unexpectedRequirements: falsePositives,
    statusAccuracy: statusCorrect / extracted.length,
    categoryAccuracy: categoryCorrect / extracted.length,
    signalAccuracy: signalCorrect / extracted.length,
    statusMetrics,
  };

  console.info(`JOB POSTING BENCHMARK ${JSON.stringify(report)}`);
  assert.equal(report.extractionPrecision, 1);
  assert.equal(report.extractionRecall, 1);
  assert.equal(extracted.length, expectedCases.length, "all labeled requirements should be extracted");
  assert.equal(falsePositives, 0, "non-requirement copy should not become a requirement");
  assert.equal(statusCorrect, extracted.length, "evidence statuses should match the labeled examples");
  assert.equal(categoryCorrect, extracted.length, "requirement categories should match the labeled examples");
  assert.equal(signalCorrect, extracted.length, "mandatory/preferred/ambiguous signals should match the labels");
  for (const { fixture, analysis } of observations) {
    if (fixture.expectedDuplicate) {
      assert.equal(analysis.requirements.length, 1);
      assert.ok(analysis.requirements[0].flags.includes("Repeated wording"));
    }
    for (const item of analysis.requirements) {
      if (item.evidenceQuote) assert.ok(fixture.resumeText.includes(item.evidenceQuote));
    }
  }
});

test("checks apply recommendations against reviewed synthetic resume examples", () => {
  const normalizeRequirement = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  for (const fixture of readinessBenchmarkCases) {
    const analysis = analyzeJobPosting(fixture.jobText, fixture.resumeText);
    const overrides: Record<string, JobEvidenceStatus> = {};

    for (const expected of fixture.expectedEvidence) {
      const requirement = analysis.requirements.find((item) =>
        normalizeRequirement(item.text) === normalizeRequirement(expected.requirementText)
      );
      assert.ok(requirement, `${fixture.id}: expected requirement "${expected.requirementText}"`);
      assert.equal(
        requirement.evidenceStatus,
        expected.status,
        `${fixture.id}: evidence status for "${expected.requirementText}"`,
      );
      if (fixture.confirmedGapRequirement === expected.requirementText) {
        assert.notEqual(
          requirement.evidenceStatus,
          "confirmed-gap",
          `${fixture.id}: extraction must not create the user's confirmation`,
        );
        overrides[requirement.id] = "confirmed-gap";
      }
    }

    const result = calculateJobPostingReadiness(analysis.requirements, overrides);
    assert.equal(result.score, fixture.expectedScore, `${fixture.id}: expected score`);
    assert.equal(result.band, fixture.expectedBand, `${fixture.id}: expected recommendation band`);
    assert.equal(
      result.verdict,
      fixture.expectedRecommendation,
      `${fixture.id}: expected user-facing recommendation`,
    );
    assert.equal(
      result.mandatoryGapConfirmedByUser,
      Boolean(fixture.confirmedGapRequirement),
      `${fixture.id}: only an explicit override should trigger the confirmed-gap branch`,
    );
    if (fixture.confirmedGapRequirement) {
      assert.equal(result.score, 67, `${fixture.id}: the score remains evidence-based when the override changes the verdict`);
    }
    if (fixture.id === "incomplete-operations-resume") {
      assert.equal(result.verdict, "Pause and verify the must-haves");
      assert.equal(result.mandatoryGapConfirmedByUser, false);
    }
  }
});
