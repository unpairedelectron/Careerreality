import {
  companySignalsTable,
  db,
  layoffSignalsTable,
  salaryBenchmarksTable,
} from "@workspace/db";
import {
  companySignalSeed,
  layoffSignalSeed,
  salaryBenchmarkSeed,
} from "../data/public-signal-seed";
import {
  canPublishMarketSignal,
  canUseCompanySignal,
} from "./public-evidence";

export type IncompletePublicSignalSeedCounts = {
  salary: number;
  companies: number;
  layoffs: number;
};

export class PublicSignalSeedProvenanceError extends Error {
  readonly incompleteCounts: IncompletePublicSignalSeedCounts;

  constructor(incompleteCounts: IncompletePublicSignalSeedCounts) {
    const totalIncomplete = Object.values(incompleteCounts).reduce(
      (total, count) => total + count,
      0,
    );
    super(
      `Refusing to seed ${totalIncomplete} public signal records without complete, reviewed provenance (${incompleteCounts.salary} salary, ${incompleteCounts.companies} company, ${incompleteCounts.layoffs} layoff). No records were written.`,
    );
    this.name = "PublicSignalSeedProvenanceError";
    this.incompleteCounts = incompleteCounts;
  }
}

export async function seedPublicSignalData(): Promise<void> {
  // The current seed catalog has no provenance fields, so treat every item as
  // incomplete until a source-reviewed seed record is deliberately added.
  const incompleteCounts = {
    salary: salaryBenchmarkSeed.filter((row) => !canPublishMarketSignal({
      ...row,
      provenance: undefined,
    })).length,
    companies: companySignalSeed.filter(
      (row) => !canUseCompanySignal({ ...row, provenance: undefined }),
    ).length,
    layoffs: layoffSignalSeed.filter(
      (row) => !canPublishMarketSignal({ ...row, provenance: undefined }),
    ).length,
  };
  const totalIncomplete = Object.values(incompleteCounts).reduce(
    (total, count) => total + count,
    0,
  );
  if (totalIncomplete > 0) {
    throw new PublicSignalSeedProvenanceError(incompleteCounts);
  }

  await Promise.all([
    db
      .insert(salaryBenchmarksTable)
      .values(salaryBenchmarkSeed)
      .onConflictDoNothing(),
    db
      .insert(companySignalsTable)
      .values(companySignalSeed)
      .onConflictDoNothing(),
    db
      .insert(layoffSignalsTable)
      .values(layoffSignalSeed)
      .onConflictDoNothing(),
  ]);
}