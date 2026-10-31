import type {
  CompanySignal,
  LayoffSignal,
  PublicDataProvenance,
  SalaryBenchmark,
} from "@workspace/api-client-react";

const approvedCompanyScoreMethodologyVersion: string | null = null;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCalendarDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

function hasCompleteProvenance(
  value: PublicDataProvenance | null | undefined,
  confidence: string,
  sourceUrl: string | null | undefined,
  allowEstimated = true,
): value is PublicDataProvenance {
  if (!value || !isSafeSourceUrl(sourceUrl)) return false;
  const reviewedAt = new Date(value.reviewedAt);
  if (Number.isNaN(reviewedAt.getTime())) return false;
  const reviewedDate = reviewedAt.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const statusAllowed = allowEstimated
    ? ["VERIFIED", "DERIVED", "ESTIMATED"].includes(value.status)
    : ["VERIFIED", "DERIVED"].includes(value.status);

  return Boolean(
    statusAllowed &&
      hasText(value.sourceType) &&
      isCalendarDate(value.publicationDate) &&
      isCalendarDate(value.retrievedDate) &&
      value.publicationDate <= value.retrievedDate &&
      value.retrievedDate <= reviewedDate &&
      reviewedDate <= today &&
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

export function isSafeSourceUrl(value: string | null | undefined): value is string {
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

export function isUsableSalaryEvidence(
  value: SalaryBenchmark | undefined,
): value is SalaryBenchmark & { sourceUrl: string; provenance: PublicDataProvenance } {
  return Boolean(
    value &&
      hasText(value.role) &&
      hasText(value.city) &&
      hasText(value.experienceBand) &&
      hasText(value.source) &&
      hasCompleteProvenance(value.provenance, value.confidence, value.sourceUrl) &&
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

export function isUsableCompanyScoreEvidence(
  value: CompanySignal | undefined,
): value is CompanySignal & { sourceUrl: string; provenance: PublicDataProvenance } {
  return Boolean(
    value &&
      approvedCompanyScoreMethodologyVersion !== null &&
      value.provenance?.methodologyVersion === approvedCompanyScoreMethodologyVersion &&
      hasText(value.name) &&
      hasText(value.signal) &&
      hasText(value.source) &&
      hasCompleteProvenance(value.provenance, value.confidence, value.sourceUrl, false) &&
      Number.isFinite(value.stability) &&
      value.stability >= 0 &&
      value.stability <= 100,
  );
}

export function isUsableLayoffEvidence(
  value: LayoffSignal | undefined,
): value is LayoffSignal & { sourceUrl: string; provenance: PublicDataProvenance } {
  return Boolean(
    value &&
      hasText(value.company) &&
      hasText(value.signal) &&
      hasText(value.type) &&
      hasText(value.source) &&
      hasCompleteProvenance(value.provenance, value.confidence, value.sourceUrl),
  );
}

export function evidenceStatusLabel(status: PublicDataProvenance["status"]): string {
  if (status === "ESTIMATED") return "Estimated · context only";
  if (status === "DERIVED") return "Derived from cited source";
  return "Verified source evidence";
}
