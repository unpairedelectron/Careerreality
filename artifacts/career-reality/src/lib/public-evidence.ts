import type {
  CompanySignal,
  DatasetMeta,
  LayoffSignal,
  PublicDataProvenance,
  SalaryBenchmark,
} from "@workspace/api-client-react";

export type BoundedNumberResult = {
  value: number | null;
  error?: string;
};

type UsableSalaryBenchmark = SalaryBenchmark & {
  sourceUrl: string;
  provenance: PublicDataProvenance;
};

type UsableCompanySignal = CompanySignal & {
  sourceUrl: string;
  provenance: PublicDataProvenance;
};

type UsableLayoffSignal = LayoffSignal & {
  sourceUrl: string;
  provenance: PublicDataProvenance;
};

// Do not publish numeric company scores until a methodology version is approved.
const approvedCompanyScoreMethodologyVersion: string | null = null;

export function parseBoundedNumber(
  raw: string,
  min: number,
  max: number,
  label: string,
): BoundedNumberResult {
  if (raw.trim() === "") {
    return { value: null, error: `${label} is required.` };
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { value: null, error: `${label} must be a number.` };
  }
  if (value < min || value > max) {
    return {
      value: null,
      error: `${label} must be between ${min.toLocaleString("en-IN")} and ${max.toLocaleString("en-IN")}.`,
    };
  }
  return { value };
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function hasCalendarDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

function hasOrderedEvidenceDates(
  value: PublicDataProvenance,
): boolean {
  const reviewedDate = new Date(value.reviewedAt).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return (
    value.publicationDate <= value.retrievedDate &&
    value.retrievedDate <= reviewedDate &&
    reviewedDate <= today
  );
}

function hasCompletePublishedProvenance(
  value: PublicDataProvenance | undefined,
  confidence: string,
  allowEstimated = true,
): value is PublicDataProvenance {
  if (!value) return false;
  const validStatus = allowEstimated
    ? ["VERIFIED", "DERIVED", "ESTIMATED"].includes(value.status)
    : ["VERIFIED", "DERIVED"].includes(value.status);
  return Boolean(
    validStatus &&
      hasText(value.sourceType) &&
      hasCalendarDate(value.publicationDate) &&
      hasCalendarDate(value.retrievedDate) &&
      hasDate(value.reviewedAt) &&
      hasOrderedEvidenceDates(value) &&
      hasText(value.metric) &&
      hasText(value.transformation) &&
      hasText(value.methodologyName) &&
      hasText(value.methodologyVersion) &&
      value.methodologyInputs.length > 0 &&
      value.methodologyInputs.every(hasText) &&
      hasText(value.methodologyCalculation) &&
      value.limitations.length > 0 &&
      value.limitations.every(hasText) &&
      value.confidence === confidence,
  );
}

export function provenanceStatusLabel(
  status: PublicDataProvenance["status"],
): string {
  return status === "ESTIMATED"
    ? "Estimated"
    : status === "DERIVED"
      ? "Derived"
      : "Verified";
}

function hasValidHttpSource(value: unknown): value is string {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function validatedSourceUrl(
  value: string | null | undefined,
): string | null {
  return hasValidHttpSource(value) ? value : null;
}

export function isUsableSalaryBenchmark(
  value: SalaryBenchmark | undefined,
): value is UsableSalaryBenchmark {
  return Boolean(
    value &&
      hasText(value.role) &&
      hasText(value.city) &&
      hasText(value.experienceBand) &&
      hasText(value.source) &&
      hasValidHttpSource(value.sourceUrl) &&
      hasCompletePublishedProvenance(value.provenance, value.confidence) &&
      hasDate(value.observedAt) &&
      Number.isFinite(value.p25) &&
      Number.isFinite(value.median) &&
      Number.isFinite(value.p75) &&
      value.p25 >= 0 &&
      value.p25 <= value.median &&
      value.median <= value.p75 &&
      Number.isInteger(value.sampleSize) &&
      value.sampleSize > 0,
  );
}

export function isUsableCompanySignal(
  value: CompanySignal | undefined,
): value is UsableCompanySignal {
  return Boolean(
    value &&
      approvedCompanyScoreMethodologyVersion !== null &&
      value.provenance?.methodologyVersion === approvedCompanyScoreMethodologyVersion &&
      hasText(value.slug) &&
      hasText(value.name) &&
      hasText(value.sector) &&
      hasText(value.signal) &&
      hasText(value.source) &&
      hasValidHttpSource(value.sourceUrl) &&
      hasCompletePublishedProvenance(value.provenance, value.confidence, false) &&
      hasDate(value.observedAt) &&
      Number.isFinite(value.stability) &&
      value.stability >= 0 &&
      value.stability <= 100,
  );
}

export function isUsableLayoffSignal(
  value: LayoffSignal | undefined,
): value is UsableLayoffSignal {
  return Boolean(
    value &&
      hasText(value.company) &&
      hasText(value.signal) &&
      hasText(value.type) &&
      hasText(value.source) &&
      hasValidHttpSource(value.sourceUrl) &&
      hasCompletePublishedProvenance(value.provenance, value.confidence) &&
      hasDate(value.observedAt),
  );
}

export function usableSalaryBenchmarks(
  values: SalaryBenchmark[] | undefined,
): UsableSalaryBenchmark[] {
  return (values ?? []).filter(isUsableSalaryBenchmark);
}

export function usableDecisionSalaryBenchmarks(
  values: SalaryBenchmark[] | undefined,
): UsableSalaryBenchmark[] {
  return usableSalaryBenchmarks(values).filter(
    (value) => value.provenance.status !== "ESTIMATED",
  );
}

export function usableCompanySignals(
  values: CompanySignal[] | undefined,
): UsableCompanySignal[] {
  return (values ?? []).filter(isUsableCompanySignal);
}

export function usableLayoffSignals(
  values: LayoffSignal[] | undefined,
): UsableLayoffSignal[] {
  return (values ?? []).filter(isUsableLayoffSignal);
}

export function usableDecisionLayoffSignals(
  values: LayoffSignal[] | undefined,
): UsableLayoffSignal[] {
  return usableLayoffSignals(values).filter(
    (value) => value.provenance.status !== "ESTIMATED",
  );
}

export function evidenceAgeLabel(meta?: Pick<DatasetMeta, "refreshedAt">): string {
  if (!meta?.refreshedAt || Number.isNaN(new Date(meta.refreshedAt).getTime())) {
    return "source retrieval date unavailable";
  }
  return `latest source retrieved ${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(meta.refreshedAt))}`;
}