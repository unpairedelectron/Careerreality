import assert from "node:assert/strict";
import test from "node:test";
import type {
  CompanySignal,
  LayoffSignal,
  PublicDataProvenance,
  SalaryBenchmark,
} from "@workspace/api-client-react";
import {
  isSafeSourceUrl,
  isUsableCompanyScoreEvidence,
  isUsableLayoffEvidence,
  isUsableSalaryEvidence,
} from "../lib/public-evidence.ts";

const completeProvenance = (
  status: PublicDataProvenance["status"] = "VERIFIED",
): PublicDataProvenance => ({
  status,
  sourceType: "Official public report",
  publicationDate: "2026-09-08",
  retrievedDate: "2026-09-09",
  reviewedAt: "2026-09-10T10:00:00.000Z",
  metric: "Public market signal",
  transformation: "Mapped to the requested market scope",
  methodologyName: "Source-reported signal",
  methodologyVersion: "1.0",
  methodologyInputs: ["Published report"],
  methodologyCalculation: "Use the reported value without filling in missing data",
  confidence: "Medium",
  limitations: ["Source coverage may be incomplete"],
});

const salary = (status: PublicDataProvenance["status"]): SalaryBenchmark => ({
  id: `salary-${status.toLowerCase()}`,
  role: "Software engineer",
  city: "Bengaluru",
  experienceBand: "5–8 years",
  p25: 1_000_000,
  median: 1_500_000,
  p75: 2_000_000,
  sampleSize: 12,
  source: "Public report",
  sourceUrl: "https://example.test/salaries",
  confidence: "Medium",
  provenance: completeProvenance(status),
  observedAt: "2026-09-09T00:00:00.000Z",
  refreshedAt: "2026-09-09T00:00:00.000Z",
});

test("salary evidence requires complete provenance and accepts estimates only for contextual display", () => {
  assert.equal(isUsableSalaryEvidence(salary("VERIFIED")), true);
  assert.equal(isUsableSalaryEvidence(salary("ESTIMATED")), true);
  assert.equal(isUsableSalaryEvidence({
    ...salary("VERIFIED"),
    sourceUrl: "javascript:alert(1)",
  }), false);
  assert.equal(isUsableSalaryEvidence({
    ...salary("VERIFIED"),
    provenance: { ...completeProvenance(), methodologyInputs: [] },
  }), false);
});

test("layoff evidence is shown only with source-linked provenance", () => {
  const signal: LayoffSignal = {
    id: "layoff-1",
    company: "Example Co",
    signal: "Public notice reported",
    type: "Layoff",
    confidence: "Medium",
    source: "Public report",
    sourceUrl: "https://example.test/layoff",
    provenance: completeProvenance(),
    observedAt: "2026-09-09T00:00:00.000Z",
    refreshedAt: "2026-09-09T00:00:00.000Z",
  };
  assert.equal(isUsableLayoffEvidence(signal), true);
  assert.equal(isUsableLayoffEvidence({ ...signal, provenance: undefined }), false);
});

test("company scores stay hidden without an approved versioned methodology", () => {
  const signal: CompanySignal = {
    id: "company-1",
    slug: "example-co",
    name: "Example Co",
    sector: "Technology",
    stability: 72,
    momentum: "Steady",
    signal: "Public company signal",
    source: "Public report",
    sourceUrl: "https://example.test/company",
    confidence: "Medium",
    provenance: completeProvenance(),
    observedAt: "2026-09-09T00:00:00.000Z",
    refreshedAt: "2026-09-09T00:00:00.000Z",
  };
  assert.equal(isUsableCompanyScoreEvidence(signal), false);
});

test("source URLs reject non-web schemes and embedded credentials", () => {
  assert.equal(isSafeSourceUrl("https://example.test/report"), true);
  assert.equal(isSafeSourceUrl("javascript:alert(1)"), false);
  assert.equal(isSafeSourceUrl("https://user:pass@example.test/report"), false);
});
