import assert from "node:assert/strict";
import test from "node:test";
import type { LayoffSignal, PublicDataProvenance, SalaryBenchmark } from "@workspace/db";
import {
  canPublishMarketSignal,
  canUseCompanySignal,
  canUseLayoffSignal,
  canUseSalaryBenchmark,
  isCompletePublicDataProvenance,
  isValidSourceUrl,
  publicProvenance,
} from "../src/lib/public-evidence.ts";

function provenance(
  status: PublicDataProvenance["status"] = "VERIFIED",
): PublicDataProvenance {
  return {
    status,
    reviewerId: "editor-1",
    sourceType: "Official public report",
    publicationDate: "2026-01-10",
    retrievedDate: "2026-01-11",
    reviewedAt: "2026-01-12T00:00:00.000Z",
    metric: "Annual compensation",
    transformation: "Converted published monthly values to annual INR",
    methodologyName: "Reported salary range",
    methodologyVersion: "1.0",
    methodologyInputs: ["Published compensation range"],
    methodologyCalculation: "Use reported p25, median, and p75 values",
    confidence: "High",
    limitations: ["Publisher sample may not represent all workers"],
  };
}

const signal = (evidence: PublicDataProvenance) => ({
  source: "Official public report",
  sourceUrl: "https://example.test/report",
  confidence: "High",
  provenance: evidence,
});

test("public evidence requires complete, chronologically valid provenance", () => {
  const complete = provenance();
  assert.equal(isCompletePublicDataProvenance(complete, "High"), true);
  assert.equal(canPublishMarketSignal(signal(complete)), true);
  assert.equal(canPublishMarketSignal({
    ...signal(complete),
    sourceUrl: undefined,
  }), false);
  assert.equal(isValidSourceUrl("https://user:pass@example.test/report"), false);

  assert.equal(isCompletePublicDataProvenance({
    ...complete,
    publicationDate: "2026-01-13",
  }, "High"), false);
  assert.equal(isCompletePublicDataProvenance({
    ...complete,
    retrievedDate: "2026-01-13",
  }, "High"), false);
  assert.equal(isCompletePublicDataProvenance({
    ...complete,
    methodologyInputs: [],
  }, "High"), false);
  assert.equal(canPublishMarketSignal({
    ...signal(complete),
    sourceUrl: "javascript:alert(1)",
  }), false);
});

test("estimated evidence may be published as labeled context but is not decision evidence", () => {
  const estimated = provenance("ESTIMATED");
  assert.equal(canPublishMarketSignal(signal(estimated)), true);
  assert.equal(canPublishMarketSignal(signal(estimated), false), false);
  assert.equal(isCompletePublicDataProvenance(estimated, "High", false), false);
});

test("company score use stays blocked and reviewer identity is redacted publicly", () => {
  const complete = provenance();
  assert.equal(canUseCompanySignal(signal(complete)), false);
  const publicFields = publicProvenance(complete);
  assert.ok(publicFields);
  assert.equal("reviewerId" in publicFields, false);
});

test("salary and layoff records with complete provenance still fail closed on invalid values", () => {
  const evidence = provenance();
  const validSalary: SalaryBenchmark = {
    id: "salary-1",
    role: "Software engineer",
    city: "Bengaluru",
    experienceBand: "5–8 years",
    p25: 1_000_000,
    median: 2_000_000,
    p75: 3_000_000,
    sampleSize: 25,
    source: "Official public report",
    sourceUrl: "https://example.test/report",
    provenance: evidence,
    confidence: "High",
    observedAt: new Date("2026-01-12T00:00:00.000Z"),
    refreshedAt: new Date("2026-01-12T00:00:00.000Z"),
  };
  assert.equal(canUseSalaryBenchmark(validSalary), true);
  assert.equal(canUseSalaryBenchmark({ ...validSalary, median: 900_000 }), false);
  assert.equal(canUseSalaryBenchmark({ ...validSalary, sampleSize: 0 }), false);
  assert.equal(canUseSalaryBenchmark({ ...validSalary, sourceUrl: null }), false);

  const validLayoff: LayoffSignal = {
    id: "layoff-1",
    company: "Example Ltd",
    signal: "A dated workforce announcement",
    type: "Layoff",
    confidence: "High",
    source: "Official public report",
    sourceUrl: "https://example.test/report",
    provenance: evidence,
    observedAt: new Date("2026-01-12T00:00:00.000Z"),
    refreshedAt: new Date("2026-01-12T00:00:00.000Z"),
  };
  assert.equal(canUseLayoffSignal(validLayoff), true);
  assert.equal(canUseLayoffSignal({ ...validLayoff, company: " " }), false);
  assert.equal(canUseLayoffSignal({ ...validLayoff, provenance: null }), false);
});
