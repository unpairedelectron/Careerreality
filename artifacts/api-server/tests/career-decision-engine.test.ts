import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCareerDecision,
  type CompanySignal,
  type LiveJobMarketSignal,
  type SalarySignal,
  type WatchSignal,
} from "../src/lib/career-decision-engine";

const now = new Date("2026-09-10T00:00:00.000Z");
const salary: SalarySignal = {
  role: "Software engineer",
  city: "Bengaluru",
  experienceBand: "5–8 years",
  p25: 1_800_000,
  median: 2_600_000,
  p75: 3_800_000,
  sampleSize: 42,
  source: "Market sample",
  confidence: "High",
  refreshedAt: new Date("2026-09-08T00:00:00.000Z"),
};
const company: CompanySignal = {
  name: "Example Labs",
  stability: 78,
  momentum: "Growing",
  signal: "Hiring remains active",
  source: "Company sample",
  confidence: "High",
  refreshedAt: new Date("2026-09-09T00:00:00.000Z"),
};
const watch: WatchSignal = {
  company: "Example Labs",
  type: "Hiring freeze",
  signal: "Hiring freeze reported",
  source: "Watch sample",
  confidence: "Medium",
  refreshedAt: new Date("2026-09-09T00:00:00.000Z"),
};
const liveJobMarket: LiveJobMarketSignal = {
  status: "available",
  count: 18,
  scope: "Staff Data Engineer in Bengaluru",
  source: "TheirStack jobs",
  confidence: "Medium",
  refreshedAt: new Date("2026-09-10T00:00:00.000Z"),
};

function profile(overrides: Partial<Parameters<typeof buildCareerDecision>[0]["profile"]> = {}) {
  return {
    role: "Software engineer",
    company: "Example Labs",
    city: "Bangalore",
    experience: "6 years",
    ctc: "₹14 LPA",
    situation: "Stable and not looking",
    target: "Become an engineering manager",
    ...overrides,
  };
}

test("uses role, city, experience, and CTC to produce a dynamic expansion read", () => {
  const result = buildCareerDecision({ profile: profile(), salaryRows: [salary], company, now });

  assert.equal(result.headline, "Turn current impact into a larger remit.");
  assert.match(result.diagnosis, /below the lower quartile/i);
  assert.match(result.nextMove, /measurable outcome/i);
  assert.equal(result.confidence, "High");
  assert.equal(result.evidence[0]?.label, "Market pay");
  assert.match(result.evidence[0]?.value ?? "", /Bengaluru/);
});

test("changes direction and action for a switch target instead of prescribing promotion", () => {
  const result = buildCareerDecision({
    profile: profile({ target: "Switch into product management" }),
    salaryRows: [salary],
    company,
    now,
  });

  assert.equal(result.headline, "Build a proof-backed path into the new role.");
  assert.match(result.nextMove, /case study/i);
  assert.doesNotMatch(result.nextMove, /engineering manager/i);
});

test("elevates runway and optionality when situation and company watch signals are risky", () => {
  const result = buildCareerDecision({
    profile: profile({ situation: "Laid off and looking urgently", target: "Find a software engineering role" }),
    salaryRows: [salary],
    watch,
    now,
  });

  assert.equal(result.headline, "Protect your runway before you optimize the move.");
  assert.match(result.diagnosis, /runway/i);
  assert.match(result.nextMove, /without resigning/i);
  assert.equal(result.evidence.some((item) => item.label === "Company watch"), true);
});

test("keeps unknown visible when only a weak experience fallback is available", () => {
  const result = buildCareerDecision({
    profile: profile({ role: "Researcher", city: "Pune", ctc: "Unknown" }),
    salaryRows: [{ ...salary, city: "Pune", role: "Operations manager", sampleSize: 6, confidence: "Low" }],
    now,
  });

  assert.equal(result.confidence, "Low");
  assert.match(result.evidence[0]?.value ?? "", /role match is not precise/i);
  assert.match(result.diagnosis, /not precise enough|inside the/i);
});

test("uses live role demand in the same decision output as salary and company evidence", () => {
  const result = buildCareerDecision({
    profile: profile({ target: "Staff Data Engineer" }),
    salaryRows: [salary],
    liveJobMarket,
    now,
  });

  const demand = result.evidence.find((item) => item.label === "Live role demand");
  assert.equal(demand?.source, "TheirStack jobs");
  assert.match(demand?.value ?? "", /18 direct-employer listings/i);
  assert.match(result.diagnosis, /Live role demand returned 18/i);
});

test("does not turn a failed live provider into stale demand evidence", () => {
  const result = buildCareerDecision({
    profile: profile(),
    salaryRows: [salary],
    liveJobMarket: {
      status: "unavailable",
      count: 0,
      scope: "Staff Data Engineer in Bengaluru",
      source: "TheirStack jobs",
      confidence: "Low",
    },
    now,
  });

  const demand = result.evidence.find((item) => item.label === "Live role demand");
  assert.equal(demand?.freshness, "Unavailable");
  assert.match(demand?.value ?? "", /could not be verified/i);
  assert.match(result.diagnosis, /could not be verified/i);
});