import type { JobEvidenceStatus, JobRequirement } from "./job-posting-analysis";

type ReadinessRequirement = Pick<
  JobRequirement,
  "id" | "signal" | "category" | "evidenceStatus"
>;

export type JobPostingReadinessBand = "go" | "sharpen" | "pause" | "unscored";

export type JobPostingReadiness = {
  score: number | null;
  band: JobPostingReadinessBand;
  verdict: string;
  nextAction: string;
  mandatoryGapConfirmedByUser: boolean;
  includedRequirements: ReadinessRequirement[];
};

/**
 * Calculate a wording-evidence score and its current apply-or-pause cue.
 * The 40/70 cutoffs are judgment-based product choices, not validated hiring
 * thresholds or predictions of a candidate's ability or interview outcome.
 */
export function calculateJobPostingReadiness<T extends ReadinessRequirement>(
  requirements: readonly T[],
  overrides: Record<string, JobEvidenceStatus> = {},
): Omit<JobPostingReadiness, "includedRequirements"> & { includedRequirements: T[] } {
  const includedRequirements = requirements.filter((requirement) => {
    const status = overrides[requirement.id] ?? requirement.evidenceStatus;
    const isScorableResponsibility = requirement.signal === "ambiguous"
      && requirement.category === "responsibility";
    return (requirement.signal === "mandatory" || requirement.signal === "preferred" || isScorableResponsibility)
      && requirement.category !== "contextual-tool"
      && requirement.category !== "unclear"
      && status !== "unresolved";
  });
  const totalWeight = includedRequirements.reduce((total, requirement) =>
    total + (requirement.signal === "mandatory" ? 2 : 1), 0);
  const earnedWeight = includedRequirements.reduce((total, requirement) => {
    const weight = requirement.signal === "mandatory" ? 2 : 1;
    const status = overrides[requirement.id] ?? requirement.evidenceStatus;
    const factor = status === "direct" ? 1
      : status === "transferable" ? 0.75
        : status === "partial" ? 0.5 : 0;
    return total + weight * factor;
  }, 0);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : null;
  const mandatoryGapConfirmedByUser = includedRequirements.some((requirement) =>
    requirement.signal === "mandatory" && overrides[requirement.id] === "confirmed-gap"
  );
  const band: JobPostingReadinessBand = mandatoryGapConfirmedByUser
    ? "pause"
    : score === null ? "unscored"
      : score >= 70 ? "go"
        : score >= 40 ? "sharpen"
          : "pause";
  const verdict = mandatoryGapConfirmedByUser
    ? "Skip unless this requirement is negotiable"
    : band === "unscored" ? "Not enough clear requirements to score"
      : band === "go" ? "Go for it"
        : band === "sharpen" ? "Apply with a sharper resume"
          : "Pause and verify the must-haves";
  const nextAction = mandatoryGapConfirmedByUser
    ? "Before stepping away, ask whether this must-have can be learned on the job or is genuinely non-negotiable."
    : band === "unscored" ? "Check the original posting and clarify its must-haves before deciding."
      : band === "go" ? "Apply, leading with the closest evidence already in your resume."
        : band === "sharpen" ? "Bring your strongest relevant example forward and add true omitted experience."
          : "Verify the essential requirements with the employer; thin resume evidence is not proof you lack the skill.";

  return {
    score,
    band,
    verdict,
    nextAction,
    mandatoryGapConfirmedByUser,
    includedRequirements,
  };
}
