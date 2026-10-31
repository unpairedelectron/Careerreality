import type {
  CompanySignal,
  LayoffSignal,
  PublicDataConfidence,
  PublicDataProvenance,
  SalaryBenchmark,
} from "@workspace/db";

export function isValidSourceUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

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

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidCalendarDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

function isValidInstant(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function hasOrderedEvidenceDates(
  provenance: Partial<PublicDataProvenance>,
): boolean {
  if (
    !isValidCalendarDate(provenance.publicationDate) ||
    !isValidCalendarDate(provenance.retrievedDate) ||
    !isValidInstant(provenance.reviewedAt)
  ) {
    return false;
  }
  const reviewedDate = new Date(provenance.reviewedAt).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return (
    provenance.publicationDate <= provenance.retrievedDate &&
    provenance.retrievedDate <= reviewedDate &&
    reviewedDate <= today
  );
}

const publishableStatuses = new Set(["VERIFIED", "DERIVED", "ESTIMATED"]);
const authoritativeStatuses = new Set(["VERIFIED", "DERIVED"]);

export function isCompletePublicDataProvenance(
  value: unknown,
  confidence: unknown,
  allowEstimated = true,
): value is PublicDataProvenance {
  if (typeof value !== "object" || value === null) return false;
  const provenance = value as Partial<PublicDataProvenance>;
  const statusAllowed = allowEstimated
    ? publishableStatuses.has(provenance.status ?? "")
    : authoritativeStatuses.has(provenance.status ?? "");

  return Boolean(
    statusAllowed &&
      hasText(provenance.sourceType) &&
      hasOrderedEvidenceDates(provenance) &&
      hasText(provenance.metric) &&
      hasText(provenance.transformation) &&
      hasText(provenance.methodologyName) &&
      hasText(provenance.methodologyVersion) &&
      Array.isArray(provenance.methodologyInputs) &&
      provenance.methodologyInputs.length > 0 &&
      provenance.methodologyInputs.every(hasText) &&
      hasText(provenance.methodologyCalculation) &&
      Array.isArray(provenance.limitations) &&
      provenance.limitations.length > 0 &&
      provenance.limitations.every(hasText) &&
      hasText(provenance.reviewerId) &&
      provenance.confidence === confidence &&
      (provenance.confidence as PublicDataConfidence) !== undefined,
  );
}

type PublicMarketSignal = {
  source: unknown;
  sourceUrl: unknown;
  confidence: unknown;
  provenance: unknown;
};

export function canPublishMarketSignal(
  signal: PublicMarketSignal,
  allowEstimated = true,
): boolean {
  return (
    hasText(signal.source) &&
    isValidSourceUrl(signal.sourceUrl) &&
    isCompletePublicDataProvenance(
      signal.provenance,
      signal.confidence,
      allowEstimated,
    )
  );
}

// No company score has a reviewed, versioned methodology yet, so source links
// alone are not enough to publish or use a score in personalized decisions.
const companyScoreMethodologyVersion: string | null = null;

export function canUseCompanySignal(signal: PublicMarketSignal): boolean {
  const provenance = signal.provenance;
  const company = signal as CompanySignal;
  if (
    companyScoreMethodologyVersion === null ||
    !canPublishMarketSignal(signal, false) ||
    typeof provenance !== "object" ||
    provenance === null
  ) {
    return false;
  }
  return (
    "methodologyVersion" in provenance &&
    provenance.methodologyVersion === companyScoreMethodologyVersion &&
    hasText(company.slug) &&
    hasText(company.name) &&
    hasText(company.sector) &&
    hasText(company.signal) &&
    hasText(company.momentum) &&
    hasText(company.source) &&
    Number.isFinite(company.stability) &&
    company.stability >= 0 &&
    company.stability <= 100 &&
    isValidDate(company.observedAt) &&
    isValidDate(company.refreshedAt)
  );
}

export function canUseSalaryBenchmark(
  signal: SalaryBenchmark,
  allowEstimated = false,
): boolean {
  return canPublishMarketSignal(signal, allowEstimated) &&
    hasText(signal.role) &&
    hasText(signal.city) &&
    hasText(signal.experienceBand) &&
    Number.isFinite(signal.p25) &&
    Number.isFinite(signal.median) &&
    Number.isFinite(signal.p75) &&
    signal.p25 >= 0 &&
    signal.p25 <= signal.median &&
    signal.median <= signal.p75 &&
    Number.isInteger(signal.sampleSize) &&
    signal.sampleSize > 0 &&
    isValidDate(signal.observedAt) &&
    isValidDate(signal.refreshedAt);
}

export function canUseLayoffSignal(
  signal: LayoffSignal,
  allowEstimated = false,
): boolean {
  return canPublishMarketSignal(signal, allowEstimated) &&
    hasText(signal.company) &&
    hasText(signal.signal) &&
    hasText(signal.type) &&
    isValidDate(signal.observedAt) &&
    isValidDate(signal.refreshedAt);
}

export function publicProvenance(
  value: PublicDataProvenance | null,
): Omit<PublicDataProvenance, "reviewerId"> | null {
  if (!value) return null;
  const { reviewerId: _reviewerId, ...publicFields } = value;
  return publicFields;
}
