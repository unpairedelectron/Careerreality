import assert from "node:assert/strict";
import test from "node:test";
import type { EditorialSource } from "../src/data/editorial-metadata.ts";
import {
  hasVerifiedEditorialReviewDates,
  hasVerifiedModifiedDate,
  hasVerifiedPublicationDate,
  isArticlePublishable,
  isHumanVerifiedClaimSource,
  isVerifiedEditorialAuthor,
  isVerifiedEditorialReviewer,
} from "../src/data/editorial-readiness.ts";

const now = new Date("2026-10-08T12:00:00.000Z");

const verifiedRecord = {
  authorName: "Asha Mehta",
  authorProfileUrl: "https://example.test/authors/asha-mehta",
  reviewerName: "Ravi Iyer",
  reviewerProfileUrl: "https://example.test/reviewers/ravi-iyer",
  publishedAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-10T10:00:00.000Z",
  lastReviewedAt: "2026-09-10T10:00:00.000Z",
  lastFactCheckedAt: "2026-09-10T10:00:00.000Z",
  status: "verified" as const,
};

test("counts named author and reviewer records only after editorial verification", () => {
  assert.equal(isVerifiedEditorialAuthor(verifiedRecord), true);
  assert.equal(isVerifiedEditorialReviewer(verifiedRecord), true);
  assert.equal(isVerifiedEditorialAuthor({ ...verifiedRecord, authorName: "Editorial team" }), false);
  assert.equal(isVerifiedEditorialReviewer({ ...verifiedRecord, reviewerProfileUrl: "javascript:alert(1)" }), false);
  assert.equal(isVerifiedEditorialAuthor({ ...verifiedRecord, status: "requires-editorial-review" }), false);
});

test("requires public dates to match non-future verified editorial records", () => {
  const article = {
    editorialRecord: verifiedRecord,
    editorial: {
      datePublished: "2026-09-01",
      dateModified: "2026-09-10",
    },
  };
  assert.equal(hasVerifiedPublicationDate(article, now), true);
  assert.equal(hasVerifiedModifiedDate(article, now), true);
  assert.equal(hasVerifiedEditorialReviewDates(verifiedRecord, now), true);
  assert.equal(hasVerifiedPublicationDate({
    ...article,
    editorial: { ...article.editorial, datePublished: "2026-09-02" },
  }, now), false);
  assert.equal(hasVerifiedModifiedDate({
    ...article,
    editorialRecord: { ...verifiedRecord, updatedAt: "2026-10-10T00:00:00.000Z" },
    editorial: { ...article.editorial, dateModified: "2026-10-10" },
  }, now), false);
  assert.equal(hasVerifiedEditorialReviewDates({
    ...verifiedRecord,
    lastFactCheckedAt: "not-a-date",
  }, now), false);
});

test("counts claim citations as human-verified only with reviewer, date, and explicit status", () => {
  const source: EditorialSource = {
    publisher: "Public authority",
    title: "Annual report",
    date: "2026",
    url: "https://example.test/report",
    section: "The signal",
    supports: "The cited claim",
    role: "claim",
    verificationStatus: "VERIFIED",
    reviewedBy: "Ravi Iyer",
    reviewedAt: "2026-10-01T12:00:00.000Z",
  };
  assert.equal(isHumanVerifiedClaimSource(source, now), true);
  assert.equal(isHumanVerifiedClaimSource({ ...source, reviewedBy: null }, now), false);
  assert.equal(isHumanVerifiedClaimSource({ ...source, verificationStatus: "UNVERIFIED" }, now), false);
  assert.equal(isHumanVerifiedClaimSource({ ...source, reviewedAt: "2026-11-01T12:00:00.000Z" }, now), false);
});

test("article publication requires named review, verified dates, and claim-to-section evidence", () => {
  const source: EditorialSource = {
    publisher: "Public authority",
    title: "Annual report",
    date: "2026",
    url: "https://example.test/report",
    section: "Evidence",
    supports: "The specific statement in this section",
    role: "claim",
    verificationStatus: "VERIFIED",
    reviewedBy: "Ravi Iyer",
    reviewedAt: "2026-10-01T12:00:00.000Z",
  };
  const article = {
    editorialRecord: verifiedRecord,
    editorial: {
      datePublished: "2026-09-01",
      dateModified: "2026-09-10",
      sources: [source],
      sectionHeadings: ["Evidence"],
    },
  };
  assert.equal(isArticlePublishable(article, now), true);
  assert.equal(isArticlePublishable({
    ...article,
    editorial: { ...article.editorial, sectionHeadings: ["Other section"] },
  }, now), false);
  assert.equal(isArticlePublishable({
    ...article,
    editorialRecord: { ...verifiedRecord, reviewerName: null },
  }, now), false);
  assert.equal(isArticlePublishable({
    ...article,
    editorial: { ...article.editorial, sources: [{ ...source, verificationStatus: "UNVERIFIED" }] },
  }, now), false);
});
