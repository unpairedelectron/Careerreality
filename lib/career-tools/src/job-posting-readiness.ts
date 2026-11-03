import type { JobEvidenceStatus, JobRequirement } from "./job-posting-analysis";

type ReadinessRequirement = Pick<
  JobRequirement,
  "id" | "signal" | "category" | "evidenceStatus"
>;

export type JobPostingReadinessBand = "go" | "sharpen" | "pause" | "unscored";

export type JobPostingReadiness = {
  score: number | null;
  mustHaveScore: number | null;
  responsibilityScore: number | null;
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
  const scoreFor = (items: readonly T[]) => {
    const totalWeight = items.reduce((total, requirement) =>
      total + (requirement.signal === "mandatory" ? 2 : 1), 0);
    if (!totalWeight) return null;
    const earnedWeight = items.reduce((total, requirement) => {
      const weight = requirement.signal === "mandatory" ? 2 : 1;
      const status = overrides[requirement.id] ?? requirement.evidenceStatus;
      const factor = status === "direct" ? 1
        : status === "transferable" ? 0.75
          : status === "partial" ? 0.5 : 0;
      return total + weight * factor;
    }, 0);
    return Math.round((earnedWeight / totalWeight) * 100);
  };
  const score = scoreFor(includedRequirements);
  const mustHaveScore = scoreFor(includedRequirements.filter((requirement) => requirement.signal === "mandatory"));
  const responsibilityScore = scoreFor(includedRequirements.filter((requirement) =>
    requirement.signal === "ambiguous" && requirement.category === "responsibility"
  ));
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
      : mustHaveScore === null && band === "go" ? "Strong evidence for listed role criteria"
        : mustHaveScore === null && band === "sharpen" ? "Strengthen evidence for listed role criteria"
          : mustHaveScore === null ? "Review fit for listed role criteria"
      : band === "go" ? "Go for it"
        : band === "sharpen" ? "Apply with a sharper resume"
          : "Pause and verify the must-haves";
  const nextAction = mandatoryGapConfirmedByUser
    ? "Before stepping away, ask whether this must-have can be learned on the job or is genuinely non-negotiable."
    : band === "unscored" ? "Check the original posting and clarify its must-haves before deciding."
      : mustHaveScore === null
        ? "Use concrete examples for the listed responsibilities and preferences; ask the employer whether any unstated must-haves apply."
      : band === "go" ? "Apply, leading with the closest evidence already in your resume."
        : band === "sharpen" ? "Bring your strongest relevant example forward and add true omitted experience."
          : "Verify the essential requirements with the employer; thin resume evidence is not proof you lack the skill.";

  return {
    score,
    mustHaveScore,
    responsibilityScore,
    band,
    verdict,
    nextAction,
    mandatoryGapConfirmedByUser,
    includedRequirements,
  };
}
