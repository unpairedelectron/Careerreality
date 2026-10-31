import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://job-matching-test:job-matching-test@127.0.0.1:5432/job-matching-test";

const { matchJobToProfile } = await import("../src/routes/jobs.ts");

const profile = {
  role: "Senior Data Engineer",
  target: "Staff Data Engineer",
  city: "Bengaluru",
  experience: "8 years",
  ctc: "₹31.5L",
};

function listing(overrides: Record<string, unknown>) {
  return {
    id: "job-id",
    source: "northstar",
    sourceName: "Northstar careers",
    externalId: "northstar-1",
    title: "Staff Data Engineer",
    company: "Northstar Labs",
    location: "Bengaluru · Hybrid",
    remoteType: "hybrid",
    canonicalUrl: "https://careers.northstar.example/jobs/1",
    applyUrl: "https://careers.northstar.example/jobs/1/apply",
    description: "8+ years of experience. Build data platforms for product teams.",
    employmentType: null,
    publishedAt: null,
    lastSeenAt: new Date("2026-09-09T09:00:00.000Z"),
    fetchedAt: new Date("2026-09-09T09:00:00.000Z"),
    ...overrides,
  } as never;
}

test("matches saved role, direction, level, city, and experience while naming compensation unknowns", () => {
  const result = matchJobToProfile(listing({}), profile);

  assert.equal(result.eligible, true);
  assert.ok(result.score >= 52);
  assert.ok(result.evidence.some((item) => item.includes("Direction signal")));
  assert.ok(result.evidence.some((item) => item.includes("Experience")));
  assert.ok(result.unknowns.some((item) => item.includes("Compensation is not listed")));
});

test("does not recommend openings that violate saved city, level, experience, or compensation constraints", () => {
  const wrongCity = matchJobToProfile(listing({
    location: "Mumbai",
    remoteType: "onsite",
  }), profile);
  const tooJunior = matchJobToProfile(listing({
    title: "Junior Data Engineer",
    description: "1-2 years of experience.",
  }), profile);
  const underpaid = matchJobToProfile(listing({
    description: "8+ years of experience. Compensation ₹20L.",
  }), profile);

  assert.equal(wrongCity.eligible, false);
  assert.equal(tooJunior.eligible, false);
  assert.equal(underpaid.eligible, false);
  assert.ok(wrongCity.unknowns.some((item) => item.includes("does not match Bengaluru")));
  assert.ok(underpaid.unknowns.some((item) => item.includes("below your current")));
});