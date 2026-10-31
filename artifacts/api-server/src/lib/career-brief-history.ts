import type { CareerBrief, CareerBriefChange } from "@workspace/api-zod";
type BriefLike = Omit<CareerBrief, "whatChanged">;

export const CAREER_BRIEF_HISTORY_LIMIT = 24;
export type BriefSnapshotProfile = {
  role: string;
  company: string;
  city: string;
  experience: string;
  ctc: string;
  situation: string;
  target: string;
  resumeStatus: string | null;
  resumeUpdatedAt: string | null;
};

export type BriefSnapshot = {
  profile: BriefSnapshotProfile;
  headline: string;
  diagnosis: string;
  nextMove: string;
  confidence: CareerBrief["confidence"];
  evidence: CareerBrief["evidence"];
  createdAt: string;
};

const PROFILE_LABELS: Record<keyof BriefSnapshotProfile, string> = {
  role: "Role",
  company: "Company",
  city: "Location",
  experience: "Experience",
  ctc: "Compensation",
  situation: "Situation",
  target: "Target direction",
  resumeStatus: "Resume status",
  resumeUpdatedAt: "Resume evidence",
};

function normalized(value: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function hasScopedEvidence(snapshot: BriefSnapshot): boolean {
  return snapshot.evidence.some((item) => item.label !== "Profile baseline");
}

function evidenceFingerprint(item: BriefSnapshot["evidence"][number]): string {
  return [
    item.label,
    normalized(item.value),
    normalized(item.source),
    item.confidence,
  ].join("|");
}

export function createBriefSnapshot(
  profile: BriefSnapshotProfile,
  brief: BriefLike,
  createdAt = new Date(),
): BriefSnapshot {
  return {
    profile,
    headline: brief.headline,
    diagnosis: brief.diagnosis,
    nextMove: brief.nextMove,
    confidence: brief.confidence,
    evidence: brief.evidence,
    createdAt: createdAt.toISOString(),
  };
}

export function compareBriefSnapshots(
  previous: BriefSnapshot | null,
  current: BriefSnapshot,
): CareerBriefChange {
  if (!previous) {
    return {
      status: "initial",
      summary: "This is the first saved career read.",
      details: [],
    };
  }

  const details: CareerBriefChange["details"] = [];
  const currentFreshness = current.evidence[0]?.freshness ?? "Freshness unknown";
  const currentSource = current.evidence[0]?.source ?? "CareerReality engine";

  for (const key of Object.keys(PROFILE_LABELS) as Array<keyof BriefSnapshotProfile>) {
    const before = previous.profile[key];
    const after = current.profile[key];
    if (normalized(before) === normalized(after)) continue;
    const label = PROFILE_LABELS[key];
    if (key === "resumeUpdatedAt") {
      details.push({
        category: "profile",
        summary: "Resume evidence was refreshed.",
        source: "Resume extraction",
        freshness: currentFreshness,
      });
      continue;
    }
    details.push({
      category: "profile",
      summary: `${label} changed from “${before || "not provided"}” to “${after || "not provided"}”.`,
      source: "Saved career profile",
      freshness: currentFreshness,
    });
  }

  const previousByLabel = new Map(previous.evidence.map((item) => [item.label, item]));
  const currentByLabel = new Map(current.evidence.map((item) => [item.label, item]));

  for (const [label, before] of previousByLabel) {
    const after = currentByLabel.get(label);
    if (!after) {
      details.push({
        category: "evidence",
        summary: `${label} is no longer available in this read; this is a loss of evidence, not a positive signal.`,
        source: before.source,
        freshness: "Previous read",
      });
      continue;
    }
    if (evidenceFingerprint(before) !== evidenceFingerprint(after)) {
      details.push({
        category: "evidence",
        summary: `${label} changed: ${after.value}`,
        source: after.source,
        freshness: after.freshness,
      });
    }
  }

  for (const [label, after] of currentByLabel) {
    if (previousByLabel.has(label)) continue;
    details.push({
      category: "evidence",
      summary: `${label} became available: ${after.value}`,
      source: after.source,
      freshness: after.freshness,
    });
  }

  if (
    previous.headline !== current.headline
    || previous.diagnosis !== current.diagnosis
    || previous.nextMove !== current.nextMove
    || previous.confidence !== current.confidence
  ) {
    details.push({
      category: "interpretation",
      summary: `The read changed to “${current.headline}”.`,
      source: currentSource,
      freshness: currentFreshness,
    });
  }

  const lostScopedEvidence = hasScopedEvidence(previous) && !hasScopedEvidence(current);
  if (lostScopedEvidence) {
    return {
      status: "insufficient",
      summary: "This refresh has less usable evidence than the previous read; no improvement is claimed.",
      details,
    };
  }
  if (!details.length) {
    return {
      status: "unchanged",
      summary: "No material change was found since the previous saved read.",
      details: [],
    };
  }
  return {
    status: "changed",
    summary: `${details.length} material change${details.length === 1 ? "" : "s"} found since the previous saved read.`,
    details: details.slice(0, 6),
  };
}

export function shouldPersistBriefSnapshot(change: CareerBriefChange): boolean {
  return change.status !== "unchanged";
}

export function buildBriefHistoryEntries(
  rows: Array<{ id: string; createdAt: Date | string; snapshot: BriefSnapshot }>,
) {
  const chronological = [...rows].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  return chronological
    .map((row, index) => {
      const previous = chronological[index - 1]?.snapshot ?? null;
      return {
        id: row.id,
        createdAt: new Date(row.createdAt).toISOString(),
        headline: row.snapshot.headline,
        confidence: row.snapshot.confidence,
        evidence: row.snapshot.evidence,
        change: compareBriefSnapshots(previous, row.snapshot),
      };
    })
    .reverse();
}
