import assert from "node:assert/strict";
import test from "node:test";
import type {
  CompanySignal,
  PublicDataProvenance,
  SalaryBenchmark,
} from "@workspace/api-client-react";
import {
  isUsableCompanySignal,
  isUsableSalaryBenchmark,
  usableDecisionSalaryBenchmarks,
  usableSalaryBenchmarks,
  validatedSourceUrl,
} from "../src/lib/public-evidence.ts";

function provenance(status: PublicDataProvenance["status"]): PublicDataProvenance {
  return {
    status,
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

function salary(status: PublicDataProvenance["status"]): SalaryBenchmark {
  return {
    id: `salary-${status.toLowerCase()}`,
    role: "Software engineer",
    city: "Bengaluru",
    experienceBand: "5–8 years",
    p25: 1_000_000,
    median: 1_500_000,
    p75: 2_000_000,
    sampleSize: 12,
    source: "Official public report",
    sourceUrl: "https://example.test/salaries",
    observedAt: "2026-01-11T00:00:00.000Z",
    refreshedAt: "2026-01-11T00:00:00.000Z",
    confidence: "High",
    provenance: provenance(status),
  };
}

test("estimated salary evidence stays visible but is excluded from decision benchmarks", () => {
  const verified = salary("VERIFIED");
  const derived = salary("DERIVED");
  const estimated = salary("ESTIMATED");

  assert.equal(isUsableSalaryBenchmark(estimated), true);
  assert.equal(usableSalaryBenchmarks([verified, derived, estimated]).length, 3);
  assert.deepEqual(
    usableDecisionSalaryBenchmarks([verified, derived, estimated]).map((row) => row.provenance.status),
    ["VERIFIED", "DERIVED"],
  );
});

test("company scores remain unavailable until an approved methodology version exists", () => {
  const company = {
    id: "company-1",
    slug: "example-company",
    name: "Example Company",
    sector: "Technology",
    stability: 70,
    momentum: "Steady",
    signal: "Public hiring signals are mixed.",
    source: "Official public report",
    sourceUrl: "https://example.test/company",
    observedAt: "2026-01-11T00:00:00.000Z",
    refreshedAt: "2026-01-11T00:00:00.000Z",
    confidence: "High",
    provenance: provenance("VERIFIED"),
  } satisfies CompanySignal;

  assert.equal(isUsableCompanySignal(company), false);
});

test("source links accept only credential-free HTTP or HTTPS URLs", () => {
  assert.equal(validatedSourceUrl("https://example.test/report"), "https://example.test/report");
  assert.equal(validatedSourceUrl("javascript:alert(1)"), null);
  assert.equal(validatedSourceUrl("https://user:pass@example.test/report"), null);
});
