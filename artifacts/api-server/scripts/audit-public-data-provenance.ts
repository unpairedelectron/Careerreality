import {
  companySignalsTable,
  db,
  layoffSignalsTable,
  salaryBenchmarksTable,
  type CompanySignal,
  type LayoffSignal,
  type SalaryBenchmark,
} from "@workspace/db";
import {
  companySignalSeed,
  layoffSignalSeed,
  salaryBenchmarkSeed,
} from "../src/data/public-signal-seed";
import {
  canUseCompanySignal,
  canUseLayoffSignal,
  canUseSalaryBenchmark,
} from "../src/lib/public-evidence";

type ProvenanceRecord = {
  sourceUrl: string | null;
  provenance: { status?: string } | null;
};

function summarize<T extends ProvenanceRecord>(
  records: T[],
  canPublish: (record: T) => boolean,
) {
  const publishableRecords = records.filter(canPublish);
  return {
    totalRecords: records.length,
    verifiedRecords: publishableRecords.filter((record) => record.provenance?.status === "VERIFIED").length,
    derivedRecords: publishableRecords.filter((record) => record.provenance?.status === "DERIVED").length,
    missingSourceUrl: records.filter((record) => !record.sourceUrl).length,
    missingProvenance: records.filter((record) => !record.provenance).length,
    ineligibleRecords: records.length - publishableRecords.length,
    publishableRecords: publishableRecords.length,
  };
}

async function main() {
  const [salaryRows, companyRows, layoffRows] = await Promise.all([
    db.select().from(salaryBenchmarksTable),
    db.select().from(companySignalsTable),
    db.select().from(layoffSignalsTable),
  ]);
  const now = new Date();
  const seedSalaryRows = salaryBenchmarkSeed.map((row) => ({
    ...row,
    id: "seed",
    refreshedAt: now,
    provenance: null,
  })) as SalaryBenchmark[];
  const seedCompanyRows = companySignalSeed.map((row) => ({
    ...row,
    id: "seed",
    refreshedAt: now,
    provenance: null,
  })) as CompanySignal[];
  const seedLayoffRows = layoffSignalSeed.map((row) => ({
    ...row,
    id: "seed",
    refreshedAt: now,
    provenance: null,
  })) as LayoffSignal[];

  console.log(JSON.stringify({
    database: {
      salaryBenchmarks: summarize(salaryRows, canUseSalaryBenchmark),
      companySignals: summarize(companyRows, canUseCompanySignal),
      layoffSignals: summarize(layoffRows, canUseLayoffSignal),
    },
    staticSeeds: {
      salaryBenchmarks: summarize(seedSalaryRows, canUseSalaryBenchmark),
      companySignals: summarize(seedCompanyRows, canUseCompanySignal),
      layoffSignals: summarize(seedLayoffRows, canUseLayoffSignal),
    },
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Public-data provenance audit failed:", error);
  process.exitCode = 1;
});
