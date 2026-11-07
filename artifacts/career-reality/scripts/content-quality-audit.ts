import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  archivedArticleRecords,
  articles,
  articleCategories,
  collectRawArticleTextAudit,
  companies,
  toolsCatalog,
} from "../src/data/content.ts";
import {
  hasVerifiedEditorialReviewDates,
  hasVerifiedModifiedDate,
  hasVerifiedPublicationDate,
  isHumanVerifiedClaimSource,
  isVerifiedEditorialAuthor,
  isVerifiedEditorialReviewer,
} from "../src/data/editorial-readiness.ts";

const artifactRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(artifactRoot, "../..");
const reportsRoot = path.join(artifactRoot, "reports");
const sitemapPath = path.join(artifactRoot, "public/sitemap.xml");
const distRoot = path.join(artifactRoot, "dist/public");
const indexedUrlExportPath = path.join(workspaceRoot, "attached_assets/Table_1789671366775.csv");
const productionSnapshotPath = path.join(workspaceRoot, "docs", "PHASE_2_PROVENANCE_ROWS.csv");

function originalArchiveInventory() {
  const archiveRoot = path.join(workspaceRoot, "archive", "articles");
  let files: string[] = [];
  try {
    files = fs.readdirSync(archiveRoot).filter((file) => file.endsWith(".json")).sort();
  } catch {
    // Missing source archive is reported as a blocked audit gate below.
  }

  const slugs: string[] = [];
  const invalidFiles: string[] = [];
  for (const file of files) {
    try {
      const record = JSON.parse(fs.readFileSync(path.join(archiveRoot, file), "utf8")) as {
        slug?: unknown;
        title?: unknown;
        description?: unknown;
        body?: unknown;
      };
      if (
        typeof record.slug !== "string" ||
        typeof record.title !== "string" ||
        typeof record.description !== "string" ||
        typeof record.body !== "string" ||
        !record.body.trim()
      ) {
        invalidFiles.push(file);
        continue;
      }
      slugs.push(record.slug);
    } catch {
      invalidFiles.push(file);
    }
  }

  const archiveSlugs = new Set(slugs);
  const sourceSlugs = new Set(archivedArticleRecords.map((article) => article.slug));
  const missingFromArchive = [...sourceSlugs].filter((slug) => !archiveSlugs.has(slug));
  const notInSourceArchive = [...archiveSlugs].filter((slug) => !sourceSlugs.has(slug));
  return {
    fileCount: files.length,
    validCount: slugs.length,
    uniqueSlugCount: archiveSlugs.size,
    invalidFiles,
    missingFromArchive,
    notInSourceArchive,
    matchesQuarantinedSources:
      files.length === 44 &&
      slugs.length === 44 &&
      archiveSlugs.size === 44 &&
      invalidFiles.length === 0 &&
      missingFromArchive.length === 0 &&
      notInSourceArchive.length === 0,
  };
}

type AuditGate = {
  id: string;
  status: "pass" | "blocked" | "review";
  count?: number;
  detail: string;
};

type ReadinessStatus = "ready" | "blocked" | "review-required" | "not-assessed" | "no-items";

function readinessForGates(gates: AuditGate[]): ReadinessStatus {
  if (gates.some((gate) => gate.status === "blocked")) return "blocked";
  if (gates.some((gate) => gate.status === "review")) return "review-required";
  return "ready";
}

function normalizePath(value: string): string {
  const pathname = value.replace(/\/+$/, "");
  return pathname ? `${pathname}/` : "/";
}

function routeType(pathname: string): string {
  if (pathname.startsWith("/article/")) return "article";
  if (pathname.startsWith("/companies/")) return "company-detail";
  if (pathname.startsWith("/ai/")) return "legacy-ai-route";
  return "public-route";
}

function builtRouteMeta(pathname: string) {
  const relativePath = pathname === "/" ? "" : pathname.replace(/^\/+|\/+$/gu, "");
  const htmlPath = path.join(distRoot, relativePath, "index.html");
  if (!fs.existsSync(htmlPath)) {
    return { snapshotPresent: false, robots: "not-built", localCanonicalPath: null };
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/iu)?.[1] ?? "missing";
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/iu)?.[1];
  let localCanonicalPath: string | null = null;
  if (canonical) {
    try {
      localCanonicalPath = normalizePath(new URL(canonical).pathname);
    } catch {
      localCanonicalPath = null;
    }
  }
  return { snapshotPresent: true, robots, localCanonicalPath };
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function normalizeParagraph(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("en");
}

function findRepeatedParagraphs(
  sections: Array<{ heading: string; body: string }>,
): number {
  const seen = new Set<string>();
  let duplicateOccurrences = 0;
  for (const section of sections) {
    for (const rawParagraph of section.body.split(/\n\s*\n+/u)) {
      const paragraph = normalizeParagraph(rawParagraph);
      if (!paragraph) continue;
      if (seen.has(paragraph)) duplicateOccurrences += 1;
      seen.add(paragraph);
    }
  }
  return duplicateOccurrences;
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (inQuotes && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  if (inQuotes) throw new Error("The indexed-URL CSV ends inside a quoted field.");
  return rows;
}

function indexedUrlInventory() {
  const sitemapPaths = readSitemapPaths();
  const companyPaths = companies.map((company) => normalizePath(`/companies/${company.slug}`));
  if (!fs.existsSync(indexedUrlExportPath)) {
    const routePaths = [...new Set([...sitemapPaths, ...companyPaths])].sort();
    return {
      file: null,
      rowCount: null,
      uniquePathCount: null,
      latestCrawlDate: null,
      outsideSitemap: [],
      sitemapNotInExport: [],
      rowsWithoutValidUrl: null,
      routes: routePaths.map((canonicalPath) => ({
        canonicalPath,
        routeType: routeType(canonicalPath),
        sitemapListed: sitemapPaths.includes(canonicalPath),
        searchConsoleExport: false,
        exportRowCount: 0,
        lastCrawled: null,
        ...builtRouteMeta(canonicalPath),
        proposedAction: "Keep URL unchanged; review this route individually before any indexability change.",
      })),
      note: "No indexed-URL export was found; Search Console coverage was not independently compared.",
    };
  }

  const csv = parseCsvRows(fs.readFileSync(indexedUrlExportPath, "utf8"));
  const [header = [], ...records] = csv;
  const urlColumn = header.findIndex((value) => value.trim().toLowerCase() === "url");
  const crawlDateColumn = header.findIndex((value) => value.trim().toLowerCase() === "last crawled");
  if (urlColumn < 0) throw new Error("The indexed-URL CSV has no URL column.");

  const indexedRowsByPath = new Map<string, { rowCount: number; crawlDates: string[] }>();
  const crawlDates: string[] = [];
  let rowsWithoutValidUrl = 0;
  for (const record of records) {
    const value = record[urlColumn]?.trim();
    if (!value) continue;
    let pathname: string;
    try {
      pathname = normalizePath(new URL(value).pathname);
    } catch {
      rowsWithoutValidUrl += 1;
      continue;
    }
    const crawlDate = crawlDateColumn >= 0 ? record[crawlDateColumn]?.trim() : "";
    const pathRows = indexedRowsByPath.get(pathname) ?? { rowCount: 0, crawlDates: [] };
    pathRows.rowCount += 1;
    if (crawlDate && /^\d{4}-\d{2}-\d{2}$/u.test(crawlDate)) {
      crawlDates.push(crawlDate);
      pathRows.crawlDates.push(crawlDate);
    }
    indexedRowsByPath.set(pathname, pathRows);
  }

  const indexedPaths = new Set(indexedRowsByPath.keys());
  const sitemapPathSet = new Set(sitemapPaths);
  const routePaths = [...new Set([...sitemapPathSet, ...indexedPaths, ...companyPaths])].sort();
  return {
    file: path.relative(workspaceRoot, indexedUrlExportPath),
    rowCount: records.length,
    uniquePathCount: indexedPaths.size,
    rowsWithoutValidUrl,
    latestCrawlDate: crawlDates.sort().at(-1) ?? null,
    outsideSitemap: [...indexedPaths].filter((pathname) => !sitemapPaths.includes(pathname)).sort(),
    sitemapNotInExport: sitemapPaths.filter((pathname) => !indexedPaths.has(pathname)).sort(),
    routes: routePaths.map((canonicalPath) => {
      const exportRow = indexedRowsByPath.get(canonicalPath);
      return {
        canonicalPath,
        routeType: routeType(canonicalPath),
        sitemapListed: sitemapPathSet.has(canonicalPath),
        searchConsoleExport: Boolean(exportRow),
        exportRowCount: exportRow?.rowCount ?? 0,
        lastCrawled: exportRow?.crawlDates.sort().at(-1) ?? null,
        ...builtRouteMeta(canonicalPath),
        proposedAction: "Keep URL unchanged; review this route individually before any indexability change.",
      };
    }),
    note: "Search Console export is a dated snapshot, not a live index-status check. Compare each difference before changing URLs.",
  };
}

function readProductionSnapshot() {
  if (!fs.existsSync(productionSnapshotPath)) return null;
  const records = parseCsvRows(fs.readFileSync(productionSnapshotPath, "utf8"));
  const [headers, ...lines] = records;
  if (!headers?.length) return null;
  const column = new Map(headers.map((header, index) => [header.trim(), index]));
  const value = (line: string[], field: string) =>
    (line[column.get(field) ?? -1] ?? "").trim();
  const missing = (cell: string) =>
    !cell || /^(?:NOT RECORDED|UNKNOWN|N\/A|NULL)$/iu.test(cell);
  const captureDate = lines
    .map((line) => value(line, "snapshot_captured_at"))
    .find((candidate) => /^\d{4}-\d{2}-\d{2}$/u.test(candidate));
  if (!captureDate || Number.isNaN(new Date(`${captureDate}T00:00:00.000Z`).getTime())) {
    throw new Error("Production provenance snapshot must include a valid snapshot_captured_at date.");
  }
  const captureTime = new Date(`${captureDate}T00:00:00.000Z`).getTime();
  const rowsByDataset = new Map<string, string[][]>();
  for (const line of lines) {
    const dataset = value(line, "dataset");
    if (!dataset) continue;
    rowsByDataset.set(dataset, [...(rowsByDataset.get(dataset) ?? []), line]);
  }
  const tables = [...rowsByDataset.entries()].map(([dataset, rows]) => {
    const timestamp = (raw: string) => {
      if (!raw) return null;
      const normalized = raw.replace(" ", "T").replace(/\+00$/u, "Z");
      const time = new Date(normalized).getTime();
      return Number.isNaN(time) ? null : time;
    };
    const latestRefreshedAt = rows
      .map((row) => value(row, "database_refreshed_at"))
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
    const hasIncompleteProvenance = (row: string[]) =>
      [
        "source_url",
        "source_type",
        "publication_date",
        "retrieved_date",
        "transformation",
        "methodology_name",
        "methodology_version",
        "methodology_inputs",
        "methodology_calculation",
      ].some((field) => missing(value(row, field))) ||
      !isHttpUrl(value(row, "source_url")) ||
      !["VERIFIED", "DERIVED", "ESTIMATED"].includes(value(row, "provenance_status"));
    return {
      dataset,
      rowCount: rows.length,
      missingSourceUrl: rows.filter((row) => missing(value(row, "source_url"))).length,
      malformedSourceUrl: rows.filter((row) => {
        const sourceUrl = value(row, "source_url");
        return !missing(sourceUrl) && !isHttpUrl(sourceUrl);
      }).length,
      missingSourceType: rows.filter((row) => missing(value(row, "source_type"))).length,
      missingPublicationDate: rows.filter((row) => missing(value(row, "publication_date"))).length,
      missingRetrievedDate: rows.filter((row) => missing(value(row, "retrieved_date"))).length,
      missingTransformation: rows.filter((row) => missing(value(row, "transformation"))).length,
      missingMethodologyName: rows.filter((row) => missing(value(row, "methodology_name"))).length,
      missingMethodologyVersion: rows.filter((row) => missing(value(row, "methodology_version"))).length,
      missingMethodologyInputs: rows.filter((row) => missing(value(row, "methodology_inputs"))).length,
      missingMethodologyCalculation: rows.filter((row) => missing(value(row, "methodology_calculation"))).length,
      incompleteProvenanceRows: rows.filter(hasIncompleteProvenance).length,
      unverifiedRows: rows.filter((row) => value(row, "verification_status") !== "VERIFIED").length,
      suppressedRows: rows.filter((row) => value(row, "publication_decision") === "SUPPRESS").length,
      olderThan30Days: rows.filter((row) => {
        const refreshedAt = timestamp(value(row, "database_refreshed_at"));
        return refreshedAt !== null && captureTime - refreshedAt > 30 * 24 * 60 * 60 * 1000;
      }).length,
      latestRefreshedAt,
    };
  });
  return {
    capturedAt: `${captureDate} (date of read-only export)`,
    source: "Read-only production SELECT; no production writes",
    queryFile: "docs/PHASE_2_PROVENANCE_ROWS.csv",
    publicationDecisionScope: "SUPPRESS is an audit-only classification in the export; it is not stored in or written to production.",
    ageComparisonDays: 30,
    tables,
  };
}

function readSitemapPaths(): string[] {
  if (!fs.existsSync(sitemapPath)) return [];
  const xml = fs.readFileSync(sitemapPath, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => {
    const decoded = match[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'");
    return normalizePath(new URL(decoded).pathname);
  });
}

function sourceInventory() {
  const auditedArticles = [...articles, ...archivedArticleRecords];
  const sources = auditedArticles.flatMap((article) => article.editorial.sources);
  const claimSources = sources.filter((source) => source.role === "claim");
  const humanVerifiedClaims = claimSources.filter((source) => isHumanVerifiedClaimSource(source)).length;
  return {
    total: sources.length,
    claimSources: claimSources.length,
    contextSources: sources.filter((source) => source.role === "context").length,
    malformedOrCredentialedUrls: sources.filter((source) => !isHttpUrl(source.url)).length,
    missingSourceDates: sources.filter((source) => !source.date.trim()).length,
    missingSectionLinks: auditedArticles.reduce(
      (count, article) => count + article.editorial.sources.filter(
        (source) => !article.sections.some((section) => section.heading === source.section),
      ).length,
      0,
    ),
    humanVerifiedClaims,
    claimSourcesAwaitingReview: claimSources.length - humanVerifiedClaims,
    verificationNote: "Citation claims count as human-verified only when a reviewer, review date, and VERIFIED status are present. URL syntax and section labels alone do not establish source credibility or prove claim support.",
  };
}

export function buildContentQualityReport(generatedAt = new Date().toISOString()) {
  const rawTextAudit = collectRawArticleTextAudit();
  const originalArchive = originalArchiveInventory();
  const auditedArticles = [...articles, ...archivedArticleRecords];
  const articleWordCounts = auditedArticles.map((article) => countWords([
    article.title,
    article.excerpt,
    ...article.sections.flatMap((section) => [section.heading, section.body]),
  ].join(" "))).sort((left, right) => left - right);
  const duplicateParagraphOccurrencesInContent = articles.reduce(
    (count, article) => count + findRepeatedParagraphs(article.sections),
    0,
  );
  const archivedDuplicateParagraphOccurrences = rawTextAudit.duplicateWithinArticleOccurrences;
  const archivedAssembledDuplicateParagraphOccurrences = archivedArticleRecords.reduce(
    (count, article) => count + findRepeatedParagraphs(article.sections),
    0,
  );
  const archivedDuplicateCounts = new Map<string, number>();
  for (const group of rawTextAudit.duplicateGroups) {
    archivedDuplicateCounts.set(
      group.articleSlug,
      (archivedDuplicateCounts.get(group.articleSlug) ?? 0) + group.copies - 1,
    );
  }
  const archivedArticleDispositions = archivedArticleRecords.map((article) => {
    const substantiveWords = countWords([
      article.excerpt,
      ...article.sections.map((section) => section.body),
    ].join(" "));
    const duplicateParagraphs = archivedDuplicateCounts.get(article.slug) ?? 0;
    const claimSources = article.editorial.sources.filter((source) => source.role === "claim");
    const blockers = [
      ...(substantiveWords < 750 ? ["Under the 750-word substantive-content minimum."] : []),
      ...(isVerifiedEditorialAuthor(article.editorialRecord) ? [] : ["No verified named author record."]),
      ...(isVerifiedEditorialReviewer(article.editorialRecord) ? [] : ["No verified reviewer record."]),
      ...(hasVerifiedPublicationDate(article) && hasVerifiedModifiedDate(article) &&
        hasVerifiedEditorialReviewDates(article.editorialRecord) ? [] : ["No verified publication, modification, review, and fact-check date record."]),
      ...(claimSources.length > 0 && claimSources.every((source) => isHumanVerifiedClaimSource(source))
        ? [] : ["Claim-level sourcing is absent or has not been human-verified."]),
      ...(!article.editorial.seoTitle.trim() || !article.editorial.metaDescription.trim() || !article.editorial.h1.trim()
        ? ["Required title, description, or H1 metadata is missing."] : []),
      ...(
        !article.heroImage?.alt.trim() ||
        !article.heroImage.src.startsWith("/api/storage/public-objects?path=")
          ? ["No article-specific hero image and meaningful alt-text metadata is recorded."]
          : []
      ),
    ];
    return {
      slug: article.slug,
      title: article.title,
      substantiveWords,
      duplicateParagraphCopies: duplicateParagraphs,
      duplicateParagraphCopiesAfterAssembly: findRepeatedParagraphs(article.sections),
      blockers,
    };
  });
  const placeholderPattern = /\b(?:TODO|TBD|lorem ipsum|coming soon|insert\s+[A-Z_]+)\b/iu;
  const articlesWithPlaceholderText = auditedArticles
    .filter((article) => placeholderPattern.test([
      article.title,
      article.excerpt,
      ...article.sections.flatMap((section) => [section.heading, section.body]),
    ].join("\n")))
    .map((article) => article.slug);
  const sitemapPaths = readSitemapPaths();
  const sitemapDuplicates = [...new Set(sitemapPaths.filter((route, index) => sitemapPaths.indexOf(route) !== index))];
  const indexedUrls = indexedUrlInventory();
  const productionSnapshot = readProductionSnapshot();
  const sitemapSnapshotIssues = indexedUrls.routes
    .filter((route) => route.sitemapListed && route.snapshotPresent)
    .filter((route) =>
      route.robots.toLowerCase().includes("noindex") ||
      (route.localCanonicalPath !== null && route.localCanonicalPath !== route.canonicalPath),
    );
  const builtSnapshotCount = indexedUrls.routes.filter((route) => route.snapshotPresent).length;
  const builtSitemapSnapshotCount = indexedUrls.routes
    .filter((route) => route.sitemapListed && route.snapshotPresent).length;
  const authorNames = [...new Set(
    auditedArticles
      .filter((article) => isVerifiedEditorialAuthor(article.editorialRecord))
      .map((article) => article.editorialRecord.authorName!.trim()),
  )];
  const reviewerNames = [...new Set(
    auditedArticles
      .filter((article) => isVerifiedEditorialReviewer(article.editorialRecord))
      .map((article) => article.editorialRecord.reviewerName!.trim()),
  )];
  const verifiedPublicationDates = auditedArticles.filter((article) => hasVerifiedPublicationDate(article)).length;
  const verifiedModifiedDates = auditedArticles.filter((article) => hasVerifiedModifiedDate(article)).length;
  const verifiedReviewAndFactCheckDates = auditedArticles.filter((article) =>
    hasVerifiedEditorialReviewDates(article.editorialRecord),
  ).length;
  const verifiedAuthorReviewerRecords = auditedArticles.filter((article) =>
    isVerifiedEditorialAuthor(article.editorialRecord) &&
    isVerifiedEditorialReviewer(article.editorialRecord),
  ).length;
  const articlesMissingVerifiedDates = auditedArticles.filter((article) =>
    !hasVerifiedPublicationDate(article) ||
    !hasVerifiedModifiedDate(article) ||
    !hasVerifiedEditorialReviewDates(article.editorialRecord),
  ).length;
  const articlesRequiringEditorialReview = auditedArticles.filter((article) =>
    !isVerifiedEditorialAuthor(article.editorialRecord) ||
    !isVerifiedEditorialReviewer(article.editorialRecord) ||
    !hasVerifiedPublicationDate(article) ||
    !hasVerifiedModifiedDate(article) ||
    !hasVerifiedEditorialReviewDates(article.editorialRecord),
  ).length;
  const editorialSources = sourceInventory();

  const gates: AuditGate[] = [
    {
      id: "named-authors-and-reviewers",
      status: verifiedAuthorReviewerRecords === auditedArticles.length ? "pass" : "blocked",
      count: auditedArticles.length - verifiedAuthorReviewerRecords,
      detail: `${authorNames.length} verified named authors and ${reviewerNames.length} verified reviewers are recorded. Incomplete records require editorial review; do not invent profiles or bylines.`,
    },
    {
      id: "verified-publication-and-review-dates",
      status: verifiedPublicationDates === auditedArticles.length &&
        verifiedModifiedDates === auditedArticles.length &&
        verifiedReviewAndFactCheckDates === auditedArticles.length
        ? "pass"
        : "blocked",
      count: articlesMissingVerifiedDates,
      detail: `${verifiedPublicationDates}/${auditedArticles.length} publication dates, ${verifiedModifiedDates}/${auditedArticles.length} modified dates, and ${verifiedReviewAndFactCheckDates}/${auditedArticles.length} verified review+fact-check date pairs are complete. Dates only count when they match a verified editorial record and are not in the future.`,
    },
    {
      id: "claim-to-source-review",
      status: editorialSources.claimSourcesAwaitingReview === 0 ? "pass" : "blocked",
      count: editorialSources.claimSourcesAwaitingReview,
      detail: `${editorialSources.humanVerifiedClaims}/${editorialSources.claimSources} claim citations have a reviewer, review date, and VERIFIED status. Remaining citations require human claim-to-source review.`,
    },
    {
      id: "article-hero-image-alt-coverage",
      status: archivedArticleRecords.every((article) =>
        article.heroImage?.alt.trim() &&
        article.heroImage.src.startsWith("/api/storage/public-objects?path="),
      ) ? "pass" : "blocked",
      count: archivedArticleRecords.filter((article) =>
        !article.heroImage?.alt.trim() ||
        !article.heroImage.src.startsWith("/api/storage/public-objects?path="),
      ).length,
      detail: `${archivedArticleRecords.length - archivedArticleRecords.filter((article) =>
        !article.heroImage?.alt.trim() ||
        !article.heroImage.src.startsWith("/api/storage/public-objects?path="),
      ).length}/${archivedArticleRecords.length} archived articles have an image URL and meaningful alt text.`,
    },
    {
      id: "company-score-methodology",
      status: "blocked",
      count: companies.length,
      detail: "Company scores remain withheld until a versioned methodology and per-signal evidence are approved.",
    },
    {
      id: "production-market-data-provenance",
      status: productionSnapshot?.tables.some((table) => table.incompleteProvenanceRows > 0) ? "blocked" : "review",
      count: productionSnapshot?.tables.reduce((sum, table) => sum + table.incompleteProvenanceRows, 0),
      detail: productionSnapshot
        ? `The ${productionSnapshot.capturedAt} read-only production snapshot found ${productionSnapshot.tables.reduce((sum, table) => sum + table.incompleteProvenanceRows, 0)} of ${productionSnapshot.tables.reduce((sum, table) => sum + table.rowCount, 0)} rows with incomplete publication provenance. ${productionSnapshot.tables.reduce((sum, table) => sum + table.unverifiedRows, 0)} are unverified; ${productionSnapshot.tables.reduce((sum, table) => sum + table.suppressedRows, 0)} are classified SUPPRESS in this audit export only, not stored or written in production. ${productionSnapshot.tables.reduce((sum, table) => sum + table.olderThan30Days, 0)} database refresh timestamps are older than ${productionSnapshot.ageComparisonDays} days for comparison only; this is not an approved freshness policy.`
        : "No production aggregate snapshot is included. The local report cannot establish source completeness or row freshness.",
    },
    {
      id: "duplicate-canonical-paths",
      status: sitemapDuplicates.length === 0 ? "pass" : "blocked",
      count: sitemapDuplicates.length,
      detail: sitemapDuplicates.length === 0
        ? "No duplicate normalized paths were found in the local sitemap."
        : `Duplicate normalized sitemap paths: ${sitemapDuplicates.join(", ")}`,
    },
    {
      id: "sitemap-snapshot-coverage",
      status: builtSitemapSnapshotCount >= sitemapPaths.length ? "pass" : "review",
      count: builtSitemapSnapshotCount,
      detail: `The local build has ${builtSitemapSnapshotCount} snapshots for ${sitemapPaths.length} sitemap paths. A missing build is not evidence of a production 404.`,
    },
    {
      id: "sitemap-robots-alignment",
      status: sitemapSnapshotIssues.length === 0 ? "pass" : "blocked",
      count: sitemapSnapshotIssues.length,
      detail: sitemapSnapshotIssues.length === 0
        ? "No built route listed in the local sitemap has a noindex directive or mismatched canonical."
        : `Review sitemap routes with a noindex directive or mismatched canonical: ${sitemapSnapshotIssues.map((route) => route.canonicalPath).join(", ")}`,
    },
    {
      id: "post-assembly-duplicate-paragraphs",
      status: duplicateParagraphOccurrencesInContent === 0 ? "pass" : "blocked",
      count: duplicateParagraphOccurrencesInContent,
      detail: `${articles.length} active public articles were checked after assembly. Repeated exact paragraphs block publication until manually reviewed and corrected.`,
    },
    {
      id: "original-archive-retention",
      status: originalArchive.matchesQuarantinedSources ? "pass" : "blocked",
      count: originalArchive.fileCount,
      detail: `archive/articles contains ${originalArchive.validCount} valid original JSON exports across ${originalArchive.uniqueSlugCount} slugs; the files must match all ${archivedArticleRecords.length} quarantined source slugs. Invalid files: ${originalArchive.invalidFiles.length}; missing slugs: ${originalArchive.missingFromArchive.length}; extra slugs: ${originalArchive.notInSourceArchive.length}.`,
    },
    {
      id: "archived-article-duplicate-review",
      status: archivedAssembledDuplicateParagraphOccurrences === 0 ? "pass" : "blocked",
      count: archivedAssembledDuplicateParagraphOccurrences,
      detail: `${archivedArticleRecords.length} quarantined assembled drafts contain ${archivedAssembledDuplicateParagraphOccurrences} exact duplicate paragraph copies. Deterministic assembly removes exact repeats after preserving the first copy; original source text remains preserved and the raw-source audit separately reports ${archivedDuplicateParagraphOccurrences} copies.`,
    },
    {
      id: "quarantined-article-restoration-review",
      status: archivedArticleRecords.length === 0 ? "pass" : "blocked",
      count: archivedArticleRecords.length,
      detail: "Archived originals remain unavailable publicly until evidence, originality, authorship, dates, usefulness, and human-approved route disposition are reviewed.",
    },
    {
      id: "placeholder-text",
      status: articlesWithPlaceholderText.length === 0 ? "pass" : "blocked",
      count: articlesWithPlaceholderText.length,
      detail: articlesWithPlaceholderText.length === 0
        ? "No configured placeholder patterns were found in article text."
        : `Review these articles: ${articlesWithPlaceholderText.join(", ")}`,
    },
    {
      id: "live-production-crawl",
      status: "review",
      detail: "Run the published SEO verifier separately; this local audit does not assert current production HTTP, canonical, or robots status.",
    },
  ];

  const engineeringGateIds = new Set([
    "duplicate-canonical-paths",
    "sitemap-snapshot-coverage",
    "sitemap-robots-alignment",
    "post-assembly-duplicate-paragraphs",
    "original-archive-retention",
  ]);
  const articleGateIds = new Set([
    "named-authors-and-reviewers",
    "verified-publication-and-review-dates",
    "claim-to-source-review",
    "article-hero-image-alt-coverage",
    "archived-article-duplicate-review",
    "quarantined-article-restoration-review",
    "placeholder-text",
  ]);
  const dataGateIds = new Set(["company-score-methodology", "production-market-data-provenance"]);
  const gatesFor = (ids: Set<string>) => gates.filter((gate) => ids.has(gate.id));
  const engineeringGates = gatesFor(engineeringGateIds);
  const articleGates = gatesFor(articleGateIds);
  const dataGates = gatesFor(dataGateIds);
  const engineeringReadiness = readinessForGates(engineeringGates);
  const readiness = {
    engineering: engineeringReadiness,
    articlePublication: articles.length === 0 && archivedArticleRecords.length === 0
      ? "no-items" as const
      : readinessForGates(articleGates),
    data: readinessForGates(dataGates),
    operationalVerification: "not-assessed" as const,
    accountQa: "not-assessed" as const,
    release: engineeringReadiness,
    releaseScope: "engineering and build integrity only; unrelated article, data, account, and infrastructure requirements are separate",
    blockers: {
      engineering: engineeringGates.filter((gate) => gate.status !== "pass").map((gate) => gate.id),
      articlePublication: articleGates.filter((gate) => gate.status !== "pass").map((gate) => gate.id),
      data: dataGates.filter((gate) => gate.status !== "pass").map((gate) => gate.id),
    },
  };

  const middleWordCount = articleWordCounts.length
    ? articleWordCounts[Math.floor(articleWordCounts.length / 2)]
    : 0;
  return {
    reportVersion: 5,
    generatedAt,
    readiness,
    scope: {
      project: "CareerReality",
      evidenceBoundary: "Local source including the full quarantined archive, supplied indexed-URL export, and read-only production aggregate snapshot; this command does not crawl production or write production data.",
    },
    inventory: {
      articles: articles.length,
      archivedArticles: archivedArticleRecords.length,
      originalArchiveFiles: originalArchive.fileCount,
      auditedArticleRecords: auditedArticles.length,
      categories: articleCategories.length,
      staticCompanyRecords: companies.length,
      publicTools: toolsCatalog.length,
      verifiedNamedAuthors: authorNames.length,
      verifiedReviewers: reviewerNames.length,
      articlesWithVerifiedPublicationDates: verifiedPublicationDates,
      articlesWithVerifiedModifiedDates: verifiedModifiedDates,
      articlesWithVerifiedReviewAndFactCheckDates: verifiedReviewAndFactCheckDates,
      articlesRequiringEditorialReview,
      articlesMissingVerifiedDates,
      articlesWithVerifiedAuthorAndReviewer: verifiedAuthorReviewerRecords,
      articleWords: {
        minimum: articleWordCounts[0] ?? 0,
        median: middleWordCount,
        maximum: articleWordCounts.at(-1) ?? 0,
      },
    },
    content: {
      raw: rawTextAudit,
      archivedArticleDispositions,
      originalArchiveIntegrity: originalArchive,
      duplicateParagraphOccurrencesInContent,
      archivedDuplicateParagraphOccurrences,
      archivedAssembledDuplicateParagraphOccurrences,
      articlesWithPlaceholderText,
      sourceInventory: sourceInventory(),
    },
    indexability: {
      sitemapFilePresent: fs.existsSync(sitemapPath),
      sitemapPathCount: sitemapPaths.length,
      duplicateNormalizedPaths: sitemapDuplicates,
      indexedUrlExport: indexedUrls,
      builtSnapshotCount,
      builtSitemapSnapshotCount,
      builtNoindexPaths: indexedUrls.routes
        .filter((route) => route.robots.toLowerCase().includes("noindex"))
        .map((route) => route.canonicalPath),
      exportedNoindexPaths: indexedUrls.routes
        .filter((route) => route.searchConsoleExport && route.robots.toLowerCase().includes("noindex"))
        .map((route) => route.canonicalPath),
      urlChangePolicy: "This staging branch keeps retained article and unverified-data routes at HTTP 200 with noindex; no redirects, deletions, or production changes are approved.",
    },
    productionMarketData: productionSnapshot,
    gates,
    reapplicationAllowed: null,
    reapplicationNote: "This audit evaluates archived article restoration and suppressed market data; it does not assess AdSense readiness of the current public pages.",
  };
}

function renderMarkdown(
  report: ReturnType<typeof buildContentQualityReport>,
  routeMatrixFile: string,
): string {
  const gateRows = report.gates.map((gate) =>
    `| ${gate.status.toUpperCase()} | ${gate.id} | ${gate.count ?? "—"} | ${gate.detail} |`,
  ).join("\n");
  const indexed = report.indexability.indexedUrlExport;
  const production = report.productionMarketData;
  const outside = indexed.outsideSitemap.length
    ? indexed.outsideSitemap.map((route) => `- \`${route}\``).join("\n")
    : "- None recorded";
  const absent = indexed.sitemapNotInExport.length
    ? indexed.sitemapNotInExport.map((route) => `- \`${route}\``).join("\n")
    : "- None recorded";
  const localNoindex = report.indexability.builtNoindexPaths.length
    ? report.indexability.builtNoindexPaths.map((route) => `- \`${route}\``).join("\n")
    : "- None observed";
  const exportedLocalNoindex = report.indexability.exportedNoindexPaths.length
    ? report.indexability.exportedNoindexPaths.map((route) => `- \`${route}\``).join("\n")
    : "- None observed";

  return `# CareerReality content quality and AdSense readiness audit

- Generated: ${report.generatedAt}
- Engineering/build readiness: **${report.readiness.engineering}**
- Archived article publication readiness: **${report.readiness.articlePublication}**
- Market-data publication readiness: **${report.readiness.data}**
- Operational verification: **${report.readiness.operationalVerification}**
- AdSense reapplication: **Not assessed by this archive-and-data audit**
- ${report.reapplicationNote}
- Scope: ${report.scope.evidenceBoundary}

## Inventory

| Measure | Result |
| --- | ---: |
| Public articles | ${report.inventory.articles} |
| Quarantined originals | ${report.inventory.archivedArticles} |
| Preserved original archive files | ${report.inventory.originalArchiveFiles} |
| Article records audited | ${report.inventory.auditedArticleRecords} |
| Categories | ${report.inventory.categories} |
| Static company records | ${report.inventory.staticCompanyRecords} |
| Public tools | ${report.inventory.publicTools} |
| Verified individual authors | ${report.inventory.verifiedNamedAuthors} |
| Verified editorial reviewers | ${report.inventory.verifiedReviewers} |
| Articles with verified publication dates | ${report.inventory.articlesWithVerifiedPublicationDates} |
| Articles with verified modified dates | ${report.inventory.articlesWithVerifiedModifiedDates} |
| Articles with verified review and fact-check dates | ${report.inventory.articlesWithVerifiedReviewAndFactCheckDates} |
| Articles with verified author and reviewer | ${report.inventory.articlesWithVerifiedAuthorAndReviewer} |
| Articles still requiring editorial review | ${report.inventory.articlesRequiringEditorialReview} |
| Article word count (min / median / max) | ${report.inventory.articleWords.minimum} / ${report.inventory.articleWords.median} / ${report.inventory.articleWords.maximum} |

## Content and evidence

- Raw exact paragraph duplicates in the quarantined corpus: ${report.content.raw.duplicateWithinArticleOccurrences} repeated occurrences across ${report.content.raw.duplicateWithinArticleGroups} groups.
- Most copies of one paragraph inside an article: ${report.content.raw.maxCopiesWithinArticle}.
- Exact blocks shared across quarantined articles: ${report.content.raw.crossArticleSharedGroups}; maximum distinct articles sharing one block: ${report.content.raw.maxDistinctArticlesSharingBlock}. Near-duplicates and legitimate shared boilerplate are not classified by this exact-match scan.
- Exact repeated paragraphs in assembled content: ${report.content.duplicateParagraphOccurrencesInContent}.
- Citation records: ${report.content.sourceInventory.total} total (${report.content.sourceInventory.claimSources} marked claim sources; ${report.content.sourceInventory.contextSources} context sources).
- Human-verified claim citations: ${report.content.sourceInventory.humanVerifiedClaims}/${report.content.sourceInventory.claimSources}; awaiting review: ${report.content.sourceInventory.claimSourcesAwaitingReview}.
- Citation URL syntax failures: ${report.content.sourceInventory.malformedOrCredentialedUrls}; section mapping gaps: ${report.content.sourceInventory.missingSectionLinks}.
- ${report.content.sourceInventory.verificationNote}

## Quarantined article dispositions

These records remain preserved and unpublished. The raw-source scan keeps every original duplicate count; deterministic assembly retains the first exact copy and removes subsequent copies from the assembled draft. Missing author/reviewer approval, claim verification, and article-specific hero image/alt text are publication blockers, not deployment blockers.

| Article | Substantive words | Extra duplicate paragraphs | Specific blockers |
| --- | ---: | ---: | --- |
${report.content.archivedArticleDispositions.map((article) =>
    `| ${article.title.replaceAll("|", "\\|")} (\`${article.slug}\`) | ${article.substantiveWords} | ${article.duplicateParagraphCopies} | ${article.blockers.join(" ")} |`,
  ).join("\n")}

## Indexed URL export comparison

- File: ${indexed.file ?? "not present"}
- Export rows: ${indexed.rowCount ?? "not available"}; unique normalized paths: ${indexed.uniquePathCount ?? "not available"}.
- Route-by-route matrix: \`${routeMatrixFile}\` (${indexed.routes.length} unique sitemap, Search Console, and company-detail paths; ${indexed.rowsWithoutValidUrl ?? 0} export rows with invalid URLs).
- Current local build snapshots: ${report.indexability.builtSnapshotCount} total, including ${report.indexability.builtSitemapSnapshotCount} of ${report.indexability.sitemapPathCount} sitemap paths; local noindex routes in the inventory: ${report.indexability.builtNoindexPaths.length}; export-listed local noindex paths: ${report.indexability.exportedNoindexPaths.length}.
- Latest Last crawled date in export: ${indexed.latestCrawlDate ?? "not available"}.
- ${indexed.note}

Local build routes with a noindex directive:

${localNoindex}

Export-listed paths that are noindex in the local build (this does not establish their current production state):

${exportedLocalNoindex}

Paths in the export but outside the current local sitemap:

${outside}

Paths in the current local sitemap but absent from the export:

${absent}

## Production market data snapshot

${production
    ? `- Captured: ${production.capturedAt}; source: ${production.source}.
- Query: \`${production.queryFile}\`; the 30-day value is a comparison window in the audit, not an approved freshness policy.

| Dataset | Rows | Missing URL | Missing source type | Missing publication / retrieval dates | Missing transformation / methodology fields | Incomplete | Unverified | Audit-only SUPPRESS | >${production.ageComparisonDays} days* | Latest database refresh |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${production.tables.map((table) => `| ${table.dataset} | ${table.rowCount} | ${table.missingSourceUrl} | ${table.missingSourceType} | ${table.missingPublicationDate} / ${table.missingRetrievedDate} | ${table.missingTransformation} / ${table.missingMethodologyName + table.missingMethodologyVersion + table.missingMethodologyInputs + table.missingMethodologyCalculation} | ${table.incompleteProvenanceRows} | ${table.unverifiedRows} | ${table.suppressedRows} | ${table.olderThan30Days} | ${table.latestRefreshedAt ?? "unknown"} |`).join("\n")}

${production.publicationDecisionScope}

*30-day values compare database refresh timestamps only. They are not source retrieval dates and do not define an approved freshness policy.`
    : "No production aggregate snapshot is included."}

## Readiness gates

| Status | Gate | Count | Finding |
| --- | --- | ---: | --- |
${gateRows}

## Safe next steps

1. Confirm real author and reviewer identities and document the actual human/AI review workflow.
2. Review source credibility and claim-to-source support; URL syntax alone is not evidence validation.
3. Approve or retire the company scoring methodology before publishing numerical company scores.
4. Review every sitemap/index-export difference against Search Console and keep URLs unchanged until a route-by-route migration decision exists.
5. Run the published SEO verifier against production; do not treat this local report as a live crawl.
6. Do not resubmit to AdSense until the blocked and review gates have an owner and pass criteria.
`;
}

function renderMigrationPlan(
  report: ReturnType<typeof buildContentQualityReport>,
  routeMatrixFile: string,
): string {
  const indexed = report.indexability.indexedUrlExport;
  const production = report.productionMarketData;
  const outside = indexed.outsideSitemap.length
    ? indexed.outsideSitemap.map((route) => `- \`${route}\``).join("\n")
    : "- None recorded";
  const absent = indexed.sitemapNotInExport.length
    ? indexed.sitemapNotInExport.map((route) => `- \`${route}\``).join("\n")
    : "- None recorded";
  const incompleteRows = production?.tables.reduce(
    (total, table) => total + table.incompleteProvenanceRows,
    0,
  ) ?? 0;
  const totalRows = production?.tables.reduce((total, table) => total + table.rowCount, 0) ?? 0;

  return `# Indexed-URL review and migration plan

**Generated:** ${report.generatedAt}

**Status:** Assessment only. No URL, redirect, robots, sitemap, production-data, or publishing change is authorized by this document.

## Evidence reviewed

- Search Console export: \`${indexed.file ?? "not present"}\`.
- Local sitemap: ${report.indexability.sitemapPathCount} unique normalized paths.
- Search Console export: ${indexed.rowCount ?? "not available"} rows representing ${indexed.uniquePathCount ?? "not available"} unique normalized paths; latest recorded crawl is ${indexed.latestCrawlDate ?? "not available"}.
- Route matrix: \`${routeMatrixFile}\`. It joins the sitemap, export, and ${report.inventory.staticCompanyRecords} company-detail records, then records local snapshot presence, robots directives, and canonical paths.
- Production data snapshot: \`${production?.queryFile ?? "not included"}\`. It is a read-only aggregate snapshot. ${incompleteRows} of ${totalRows} legacy market rows lack complete publication provenance; the audit-only SUPPRESS label is not stored or written in production.
- The Search Console export is a dated crawl/index snapshot, not a live URL Inspection result. A row in the export does not establish that a URL is currently indexed or indexable.

## Differences that need individual review

### Export paths outside the local sitemap

${outside}

Do not add these paths to the sitemap solely because they appear in the export. Inspect each path's current production response, canonical, robots directive, redirect destination, and Search Console URL Inspection state. The local build may retain old paths as noindex handoffs; that local behavior does not prove the deployed behavior.

### Sitemap paths absent from the export

${absent}

Absence from this export is not evidence of a removal, deindexing, or crawl failure. Check each URL in Search Console and compare its response, canonical, robots directive, sitemap membership, and useful page content.

### Company-detail records and editorial review

- The local route inventory contains ${report.inventory.staticCompanyRecords} company-detail pages. Numerical company scores remain withheld until a versioned methodology and source-level evidence are approved.
- ${report.inventory.auditedArticleRecords} article records still require editorial review. The active public catalogue has ${report.inventory.articles} articles and the quarantined archive has ${report.inventory.archivedArticles}. Verified authors, reviewers, publication and modification dates, review/fact-check dates, and claim support remain human-required gates.
- Local route directives and canonical values are for impact analysis only; they do not establish current production behavior.

## Route-by-route procedure

Use the CSV as the checklist; do not make a site-wide decision from aggregate counts.

1. For each route, record the current production HTTP status, redirect chain, canonical, robots directive, sitemap membership, and Search Console URL Inspection result.
2. For articles, separately record editorial usefulness, evidence quality, source support, originality, and whether any claim needs correction. Do not infer an author, reviewer, publication date, or review date.
3. Choose one documented action per route: preserve as-is, improve the page while preserving its URL, retain as a deliberate noindex handoff, or propose a redirect/deletion for separate approval.
4. Before any approved change, test the exact old and destination URLs for status, canonical, robots, content relevance, and redirect behavior. Avoid chains, loops, unrelated destinations, and noindex URLs in the sitemap.
5. After a separately approved release, recheck the deployed host and custom domain, then monitor Search Console after recrawl. The development preview and local snapshots are not substitutes for this production check.

## Current recommendation and open decision

- Preserve every existing URL for now. No redirect, deletion, mass noindex, or sitemap change is proposed.
- Keep all indexed article URL decisions in the route matrix until evidence and editorial records are reviewed. Improve individual pages only at their current URLs when corrections are supported and an owner approves restoration.
- The route matrix lists each URL with the current local snapshot; it is not a request to change production.
- Do not decide whether articles should remain indexable or be individually noindexed until the route matrix, article evidence, and review gates have been examined. No unapproved production indexing change is authorized.

## Release boundary

This plan does not authorize publishing, AdSense resubmission, URL migration, changes to production data, or broad indexability changes. AdSense resubmission remains blocked until the readiness gates pass.
`;
}

function readArguments(args: string[]) {
  const dateArgument = args.find((argument) => argument.startsWith("--date="))?.slice("--date=".length);
  if (dateArgument && !/^\d{4}-\d{2}-\d{2}$/u.test(dateArgument)) {
    throw new Error("--date must use YYYY-MM-DD.");
  }
  const outputArgument = args.find((argument) => argument.startsWith("--out-dir="))?.slice("--out-dir=".length);
  return {
    strict: args.includes("--strict"),
    date: dateArgument ?? new Date().toISOString().slice(0, 10),
    outputDir: outputArgument ? path.resolve(process.cwd(), outputArgument) : reportsRoot,
  };
}

async function main(args: string[]) {
  const options = readArguments(args);
  const report = buildContentQualityReport();
  fs.mkdirSync(options.outputDir, { recursive: true });
  const baseName = `adsense-readiness-${options.date}`;
  const jsonPath = path.join(options.outputDir, `${baseName}.json`);
  const markdownPath = path.join(options.outputDir, `${baseName}.md`);
  const routeMatrixJsonPath = path.join(options.outputDir, `adsense-indexed-url-matrix-${options.date}.json`);
  const routeMatrixCsvPath = path.join(options.outputDir, `adsense-indexed-url-matrix-${options.date}.csv`);
  const migrationPlanPath = path.join(options.outputDir, `adsense-indexed-url-migration-plan-${options.date}.md`);
  const productionSnapshotJsonPath = path.join(options.outputDir, `adsense-production-data-snapshot-${options.date}.json`);
  const routeMatrix = report.indexability.indexedUrlExport.routes;
  const csvCell = (value: string | number | boolean | null) => {
    const text = value === null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  const routeMatrixCsv = [
    ["route_path", "route_type", "sitemap_listed", "search_console_export_row", "export_row_count", "last_crawled", "local_snapshot_present", "local_robots", "local_canonical_path", "proposed_action"],
    ...routeMatrix.map((route) => [
      route.localCanonicalPath,
      route.routeType,
      route.sitemapListed,
      route.searchConsoleExport,
      route.exportRowCount,
      route.lastCrawled,
      route.snapshotPresent,
      route.robots,
      route.canonicalPath,
      route.proposedAction,
    ]),
  ].map((row) => row.map(csvCell).join(",")).join("\n");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(routeMatrixJsonPath, `${JSON.stringify(routeMatrix, null, 2)}\n`);
  fs.writeFileSync(routeMatrixCsvPath, `${routeMatrixCsv}\n`);
  fs.writeFileSync(markdownPath, renderMarkdown(report, path.relative(workspaceRoot, routeMatrixCsvPath)));
  fs.writeFileSync(migrationPlanPath, renderMigrationPlan(report, path.relative(workspaceRoot, routeMatrixCsvPath)));
  if (report.productionMarketData) {
    fs.writeFileSync(
      productionSnapshotJsonPath,
      `${JSON.stringify({
        snapshotVersion: 1,
        capturedAt: report.productionMarketData.capturedAt,
        source: report.productionMarketData.source,
        sourceFile: report.productionMarketData.queryFile,
        publicationDecisionScope: report.productionMarketData.publicationDecisionScope,
        ageComparisonDays: report.productionMarketData.ageComparisonDays,
        tables: report.productionMarketData.tables,
      }, null, 2)}\n`,
    );
  }
  console.log(`Audit report written: ${path.relative(workspaceRoot, markdownPath)}`);
  console.log(`Machine-readable report written: ${path.relative(workspaceRoot, jsonPath)}`);
  console.log(`Route matrix written: ${path.relative(workspaceRoot, routeMatrixCsvPath)}`);
  console.log(`Migration plan written: ${path.relative(workspaceRoot, migrationPlanPath)}`);
  if (report.productionMarketData) {
    console.log(`Production snapshot written: ${path.relative(workspaceRoot, productionSnapshotJsonPath)}`);
  }
  console.log(`Engineering readiness: ${report.readiness.engineering}`);
  console.log(`Article publication readiness: ${report.readiness.articlePublication}`);
  console.log(`Data readiness: ${report.readiness.data}`);
  console.log(`Operational verification: ${report.readiness.operationalVerification}`);
  console.log(`Account QA readiness: ${report.readiness.accountQa}`);
  console.log(`Release readiness: ${report.readiness.release} (${report.readiness.releaseScope})`);

  if (options.strict && report.readiness.engineering !== "ready") {
    process.exitCode = 2;
    console.error("Strict audit failed: an engineering or build-integrity gate remains unresolved. Other readiness domains are separate.");
  }
}

const runningFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (runningFile === fileURLToPath(import.meta.url) || runningFile === path.resolve(process.cwd(), "content-quality-audit.ts")) {
  await main(process.argv.slice(2));
}

export { parseCsvRows, readSitemapPaths };
