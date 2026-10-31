import type { EditorialSource } from "./editorial-metadata";

type ArticleEditorialRecord = {
  authorName: string | null;
  authorProfileUrl: string | null;
  reviewerName: string | null;
  reviewerProfileUrl: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  lastReviewedAt: string | null;
  lastFactCheckedAt: string | null;
  status: "requires-editorial-review" | "verified";
};

type ArticleEditorialDates = {
  datePublished: string | null;
  dateModified: string | null;
};

export type EditorialReadinessInput = {
  editorialRecord: ArticleEditorialRecord;
  editorial: ArticleEditorialDates & {
    sources?: EditorialSource[];
    sectionHeadings?: string[];
  };
};

function nonEmpty(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validHttpUrl(value: string): boolean {
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

function isIndividualName(value: string | null): value is string {
  if (!nonEmpty(value) || value.trim().length < 2) return false;
  return !/^(?:unknown|unverified|tbd|editorial team|careerreality|ai|openai|chatgpt)$/iu.test(value.trim());
}

function dateOnly(value: string | null): string | null {
  if (!nonEmpty(value)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
      ? value
      : null;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function verifiedAndNotFuture(value: string | null, now: Date): boolean {
  const parsed = dateOnly(value);
  return parsed !== null && parsed <= now.toISOString().slice(0, 10);
}

function validVerifiedPerson(name: string | null, profileUrl: string | null): boolean {
  return isIndividualName(name) && (!profileUrl || validHttpUrl(profileUrl));
}

export function isVerifiedEditorialAuthor(record: ArticleEditorialRecord): boolean {
  return record.status === "verified" &&
    validVerifiedPerson(record.authorName, record.authorProfileUrl);
}

export function isVerifiedEditorialReviewer(record: ArticleEditorialRecord): boolean {
  return record.status === "verified" &&
    validVerifiedPerson(record.reviewerName, record.reviewerProfileUrl);
}

function verifiedDatePair(
  recordDate: string | null,
  publicDate: string | null,
  recordStatus: ArticleEditorialRecord["status"],
  now: Date,
): boolean {
  if (recordStatus !== "verified") return false;
  const recorded = dateOnly(recordDate);
  const published = dateOnly(publicDate);
  return recorded !== null &&
    published !== null &&
    recorded === published &&
    recorded <= now.toISOString().slice(0, 10);
}

export function hasVerifiedPublicationDate(
  article: EditorialReadinessInput,
  now = new Date(),
): boolean {
  return verifiedDatePair(
    article.editorialRecord.publishedAt,
    article.editorial.datePublished,
    article.editorialRecord.status,
    now,
  );
}

export function hasVerifiedModifiedDate(
  article: EditorialReadinessInput,
  now = new Date(),
): boolean {
  return verifiedDatePair(
    article.editorialRecord.updatedAt,
    article.editorial.dateModified,
    article.editorialRecord.status,
    now,
  );
}

export function hasVerifiedEditorialReviewDates(
  record: ArticleEditorialRecord,
  now = new Date(),
): boolean {
  return record.status === "verified" &&
    verifiedAndNotFuture(record.lastReviewedAt, now) &&
    verifiedAndNotFuture(record.lastFactCheckedAt, now);
}

export function isHumanVerifiedClaimSource(source: EditorialSource, now = new Date()): boolean {
  return source.role === "claim" &&
    source.verificationStatus === "VERIFIED" &&
    nonEmpty(source.reviewedBy) &&
    verifiedAndNotFuture(source.reviewedAt ?? null, now);
}

export function isArticlePublishable(
  article: EditorialReadinessInput,
  now = new Date(),
): boolean {
  const { editorial, editorialRecord } = article;
  const sources = editorial.sources ?? [];
  const claimSources = sources.filter((source) => source.role === "claim");
  const sourceRecordsValid = sources.length > 0 &&
    sources.every((source) =>
      nonEmpty(source.publisher) &&
      nonEmpty(source.title) &&
      nonEmpty(source.date) &&
      validHttpUrl(source.url) &&
      nonEmpty(source.section) &&
      nonEmpty(source.supports),
    );
  const claimLinksValid = claimSources.length > 0 &&
    claimSources.every((source) =>
      isHumanVerifiedClaimSource(source, now) &&
      (!editorial.sectionHeadings || editorial.sectionHeadings.includes(source.section)),
    );
  const hasModificationRecord = editorial.dateModified !== null ||
    editorialRecord.updatedAt !== null;

  return isVerifiedEditorialAuthor(editorialRecord) &&
    isVerifiedEditorialReviewer(editorialRecord) &&
    hasVerifiedPublicationDate(article, now) &&
    (!hasModificationRecord || hasVerifiedModifiedDate(article, now)) &&
    hasVerifiedEditorialReviewDates(editorialRecord, now) &&
    sourceRecordsValid &&
    claimLinksValid;
}

export function isValidEditorialPersonName(value: string | null): boolean {
  return isIndividualName(value);
}
