export type ApplicationReadinessStatus =
  | "READY"
  | "READY WITH WARNINGS"
  | "NOT READY"
  | "BLOCKED BY HUMAN INPUT";

export type ReadinessCheckStatus = "pass" | "warning" | "blocked" | "not-tested";

export type ApplicationReadinessCheck = {
  label: string;
  status: ReadinessCheckStatus;
  detail: string;
};

export type ApplicationReadinessTest = {
  name: string;
  status: "passed" | "partial" | "not-run" | "blocked";
  detail: string;
};

export type ApplicationScorecard = {
  productClarity: number;
  accuracy: number;
  provenance: number;
  methodology: number;
  userValue: number;
  ux: number;
  accessibility: number;
  mobile: number;
  performance: number;
  errorResilience: number;
  privacySecurity: number;
  contentTrust: number;
};

export type ApplicationReadinessEntry = {
  id: string;
  name: string;
  route: string;
  status: ApplicationReadinessStatus;
  scorecard: ApplicationScorecard;
  hardBlockers: string[];
  checks: ApplicationReadinessCheck[];
  tests: ApplicationReadinessTest[];
  recommendation: string;
};

export const applicationScoreWeights: Record<keyof ApplicationScorecard, number> = {
  productClarity: 10,
  accuracy: 15,
  provenance: 15,
  methodology: 10,
  userValue: 10,
  ux: 10,
  accessibility: 5,
  mobile: 5,
  performance: 5,
  errorResilience: 5,
  privacySecurity: 5,
  contentTrust: 5,
};

export function calculateApplicationScore(scorecard: ApplicationScorecard): number {
  const weightedTotal = (Object.keys(applicationScoreWeights) as Array<keyof ApplicationScorecard>)
    .reduce((total, dimension) => {
      const value = scorecard[dimension];
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error(`Invalid application score for ${dimension}`);
      }
      return total + value * applicationScoreWeights[dimension];
    }, 0) / 100;
  return Math.round(weightedTotal * 100) / 100;
}

export function effectiveReadinessStatus(
  entry: Pick<ApplicationReadinessEntry, "status" | "hardBlockers" | "scorecard">,
): ApplicationReadinessStatus {
  if (
    entry.hardBlockers.length > 0 &&
    (entry.status === "READY" || entry.status === "READY WITH WARNINGS")
  ) return "NOT READY";
  if (
    calculateApplicationScore(entry.scorecard) < 90 &&
    (entry.status === "READY" || entry.status === "READY WITH WARNINGS")
  ) return "NOT READY";
  return entry.status;
}
