import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guides = JSON.parse(fs.readFileSync(path.join(artifactDir, "src/data/generated-pillar-guides.json"), "utf8")).guides;
const routeRegistry = JSON.parse(fs.readFileSync(path.join(artifactDir, "src/data/route-registry.json"), "utf8"));
const knownRoutes = new Set(routeRegistry.routes.map((route) => route.path.replace(/\/+$/u, "") || "/"));
const validDate = (value) => typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
  !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
const validSourceUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
};
const isInternalRoute = (value) => {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return false;
  const routePath = value.split(/[?#]/u)[0].replace(/\/+$/u, "") || "/";
  return knownRoutes.has(routePath);
};
const report = guides.map((guide) => {
  const sourceLinks = (guide.sections ?? []).flatMap((section) => section.sourceLinks ?? []);
  const describeSource = (source) => ({
    label: source.label ?? null,
    url: source.url ?? null,
    year: source.year ?? null,
    internalRoute: isInternalRoute(source.url),
    missing: [
      ...(!validSourceUrl(source.url) && !isInternalRoute(source.url) ? ["valid source URL or registered internal route"] : []),
      ...(!source.label?.trim() ? ["source title/label"] : []),
      ...(validSourceUrl(source.url) && !/^\d{4}$/u.test(source.year ?? "") ? ["source year"] : []),
    ],
  });
  const invalidSourceRecords = sourceLinks
    .map(describeSource)
    .filter((source) => source.missing.length);
  const unverifiedSourceRecords = sourceLinks
    .filter((source) => validSourceUrl(source.url))
    .filter((source) =>
      source.verificationStatus !== "VERIFIED" ||
      !source.reviewedBy?.trim() ||
      !validDate(source.reviewedAt),
    )
    .map((source) => ({
      label: source.label ?? null,
      url: source.url ?? null,
      missing: [
        ...(source.verificationStatus !== "VERIFIED" ? ["human verification status"] : []),
        ...(!source.reviewedBy?.trim() ? ["reviewer identity"] : []),
        ...(!validDate(source.reviewedAt) ? ["review date"] : []),
      ],
    }));
  const missing = [
    ...(guide.datePublished === null ? ["verified original publication date"] : !validDate(guide.datePublished) ? ["valid publication date"] : []),
    ...(guide.dateModified === null ? ["verified substantive modification date"] : !validDate(guide.dateModified) ? ["valid modification date"] : []),
    ...(!sourceLinks.length ? ["source links"] : []),
  ];
  return {
    path: guide.path,
    missing,
    sourceLinkCount: sourceLinks.length,
    internalReferenceCount: sourceLinks.filter((source) => isInternalRoute(source.url)).length,
    externalSourceCount: sourceLinks.filter((source) => validSourceUrl(source.url)).length,
    invalidSourceRecords,
    sourceRecordsAwaitingHumanVerification: unverifiedSourceRecords,
    invalidDates: [
      ...(guide.datePublished !== null && !validDate(guide.datePublished) ? ["datePublished"] : []),
      ...(guide.dateModified !== null && !validDate(guide.dateModified) ? ["dateModified"] : []),
    ],
  };
});
const missing = report.filter((item) => item.missing.length);
const completeRecords = report.filter((item) =>
  item.missing.length === 0 &&
  item.invalidSourceRecords.length === 0 &&
  item.sourceRecordsAwaitingHumanVerification.length === 0 &&
  item.invalidDates.length === 0,
);
console.log(JSON.stringify({
  totalGuides: guides.length,
  completeRecords: completeRecords.length,
  invalidDateRecordCount: report.filter((item) => item.invalidDates.length > 0).length,
  invalidSourceRecordCount: report.reduce((sum, item) => sum + item.invalidSourceRecords.length, 0),
  sourceRecordsAwaitingHumanVerificationCount: report.reduce((sum, item) => sum + item.sourceRecordsAwaitingHumanVerification.length, 0),
  recordsAwaitingOwnerOrEditorialEvidence: missing,
  recordsWithInvalidDates: report.filter((item) => item.invalidDates.length),
  recordsWithInvalidSourceLinks: report.filter((item) => item.invalidSourceRecords.length > 0),
  recordsAwaitingHumanVerification: report.filter((item) => item.sourceRecordsAwaitingHumanVerification.length > 0),
}, null, 2));
