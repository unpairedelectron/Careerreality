import assert from "node:assert/strict";
import test from "node:test";
import {
  CAREER_BRIEF_HISTORY_LIMIT,
  buildBriefHistoryEntries,
  compareBriefSnapshots,
  createBriefSnapshot,
  shouldPersistBriefSnapshot,
  type BriefSnapshotProfile,
} from "../src/lib/career-brief-history";

const profile: BriefSnapshotProfile = {
  role: "Software engineer",
  company: "Example Labs",
  city: "Bengaluru",
  experience: "6 years",
  ctc: "₹14 LPA",
  situation: "Stable and not looking",
  target: "Become an engineering manager",
  resumeStatus: "not_added",
  resumeUpdatedAt: null,
};

function brief(overrides: Record<string, unknown> = {}) {
  return {
    headline: "Turn current impact into a larger remit.",
    diagnosis: "Your compensation is below the lower quartile for this market match.",
    nextMove: "Build one measurable outcome into a manager-ready case.",
    freshness: "Checked 2 days ago",
    confidence: "High" as const,
    evidence: [
      {
        label: "Market pay",
        value: "₹18L–₹38L in Bengaluru",
        source: "Market sample",
        freshness: "Checked 2 days ago",
        confidence: "High" as const,
      },
    ],
    ...overrides,
  };
}

function snapshot(overrides: Record<string, unknown> = {}) {
  return createBriefSnapshot(profile, brief(overrides), new Date("2026-09-10T00:00:00.000Z"));
}

test("returns an explicit initial state without a prior read", () => {
  const result = compareBriefSnapshots(null, snapshot());
  assert.equal(result.status, "initial");
  assert.equal(result.details.length, 0);
});

test("reports profile changes with saved-profile provenance", () => {
  const current = snapshot();
  current.profile = { ...current.profile, target: "Switch into product management" };
  const result = compareBriefSnapshots(snapshot(), current);
  assert.equal(result.status, "changed");
  assert.match(result.details[0]?.summary ?? "", /Target direction changed/);
  assert.equal(result.details[0]?.source, "Saved career profile");
});

test("reports changed market evidence with source and freshness", () => {
  const current = snapshot({
    evidence: [{
      label: "Market pay",
      value: "₹22L–₹44L in Bengaluru",
      source: "Fresh market sample",
      freshness: "Checked today",
      confidence: "High" as const,
    }],
  });
  const result = compareBriefSnapshots(snapshot(), current);
  assert.equal(result.status, "changed");
  assert.match(result.details[0]?.summary ?? "", /₹22L/);
  assert.equal(result.details[0]?.source, "Fresh market sample");
  assert.equal(result.details[0]?.freshness, "Checked today");
});

test("reports interpretation changes separately from evidence changes", () => {
  const result = compareBriefSnapshots(
    snapshot(),
    snapshot({
      headline: "Build a proof-backed path into the new role.",
      nextMove: "Write one role-specific case study before applying.",
    }),
  );
  assert.equal(result.status, "changed");
  assert.equal(result.details[0]?.category, "interpretation");
});

test("ignores freshness-only changes when the underlying read is unchanged", () => {
  const current = snapshot();
  current.createdAt = "2026-09-11T00:00:00.000Z";
  const result = compareBriefSnapshots(snapshot(), current);
  assert.equal(result.status, "unchanged");
  assert.equal(result.details.length, 0);
});

test("does not treat missing evidence as an improvement", () => {
  const current = snapshot({ evidence: [] });
  const result = compareBriefSnapshots(snapshot(), current);
  assert.equal(result.status, "insufficient");
  assert.match(result.summary, /less usable evidence/i);
  assert.match(result.details[0]?.summary ?? "", /loss of evidence/i);
});

test("builds newest-first history entries while comparing in chronological order", () => {
  const first = snapshot();
  const second = snapshot();
  second.profile = { ...second.profile, city: "Mumbai" };
  const entries = buildBriefHistoryEntries([
    { id: "second", createdAt: "2026-09-11T00:00:00.000Z", snapshot: second },
    { id: "first", createdAt: "2026-09-10T00:00:00.000Z", snapshot: first },
  ]);
  assert.deepEqual(entries.map((entry) => entry.id), ["second", "first"]);
  assert.equal(entries[0]?.change.status, "changed");
  assert.equal(entries[1]?.change.status, "initial");
});

test("does not save duplicate refreshes but keeps meaningful changes", () => {
  const unchanged = compareBriefSnapshots(snapshot(), snapshot());
  const changed = compareBriefSnapshots(
    snapshot(),
    snapshot({ headline: "A different read." }),
  );

  assert.equal(shouldPersistBriefSnapshot(unchanged), false);
  assert.equal(shouldPersistBriefSnapshot(changed), true);
  assert.equal(CAREER_BRIEF_HISTORY_LIMIT, 24);
});