import assert from "node:assert/strict";
import test from "node:test";
import { buildContentQualityReport, parseCsvRows } from "../scripts/content-quality-audit.ts";
import guideCatalog from "../src/data/generated-pillar-guides.json";
import { guideToolLinks, guideWorkedExamples } from "../src/data/guide-worked-examples";
import rulesLibrary from "../src/data/rules-library.json";

test("each Rules Library page has a verification date and official government sources", () => {
  assert.equal(rulesLibrary.pages.length, 10);
  for (const page of rulesLibrary.pages) {
    assert.equal(page.verified, "2026-10-10");
    assert.ok(page.sources.length > 0, `${page.path} needs at least one source`);
    for (const source of page.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(
        url.hostname.endsWith(".gov.in") || url.hostname.endsWith(".nic.in"),
        `${page.path} has a non-government source: ${source.url}`,
      );
    }
  }
});

test("professional-tax guidance keeps rates state-specific and links the five named state portals", () => {
  const page = rulesLibrary.pages.find((candidate) => candidate.path === "/rules/professional-tax-states");
  assert.ok(page, "Missing the professional-tax rules page");
  assert.match(page.intro, /state-specific/);
  assert.match(page.intro, /without inventing a single national rate/);
  assert.match(page.plainLanguage, /governing work location, category, period/);
  assert.match(page.plainLanguage, /do not imply a universal rate/);
  assert.deepEqual(page.rows.map(([state]) => state), [
    "Maharashtra",
    "Karnataka",
    "West Bengal",
    "Telangana",
    "Gujarat",
  ]);
  assert.equal(page.sources.length, 5);
  assert.equal(page.rows.filter(([, detail]) => detail.includes("₹")).length, 1);
  assert.match(page.rows.find(([state]) => state === "Telangana")?.[1] ?? "", /₹15,001–20,000 ₹150\/month; above ₹20,000 ₹200\/month/);
});

test("every published guide has one scoped worked example and next-step tool", () => {
  const guideSlugs = guideCatalog.guides.map((guide) => guide.slug).sort();
  const exampleSlugs = Object.keys(guideWorkedExamples).sort();
  const toolSlugs = Object.keys(guideToolLinks).sort();
  assert.deepEqual(exampleSlugs, guideSlugs);
  assert.deepEqual(toolSlugs, guideSlugs);

  for (const slug of guideSlugs) {
    const example = guideWorkedExamples[slug as keyof typeof guideWorkedExamples];
    assert.ok(example.caption.length > 40);
    assert.ok(example.rows.length > 0);
    assert.ok(example.checks.length > 0);
    assert.ok(guideToolLinks[slug].href.startsWith("/"));
  }
});

test("all 29 published guides keep prose paragraphs within the 90-word limit", () => {
  assert.equal(guideCatalog.guides.length, 29);
  for (const guide of guideCatalog.guides) {
    for (const section of guide.sections) {
      for (const paragraph of section.content.split(/\n\s*\n/).filter(Boolean)) {
        const words = paragraph.trim().split(/\s+/).filter(Boolean).length;
        assert.ok(words <= 90, `${guide.path} has a ${words}-word paragraph`);
      }
    }
  }
});

test("three current official payroll and labour facts match their dated source records", () => {
  const page = (path: string) => {
    const found = rulesLibrary.pages.find((candidate) => candidate.path === path);
    assert.ok(found, `Missing rules page ${path}`);
    return found;
  };
  const row = (path: string, label: string) => page(path).rows.find(([heading]) => heading === label)?.[1] ?? "";

  const epf = page("/rules/employee-pf");
  assert.equal(epf.verified, "2026-10-10");
  assert.equal(row("/rules/employee-pf", "Effective date"), "17 September 2026");
  assert.equal(row("/rules/employee-pf", "Previous statutory wage ceiling"), "₹15,000 per month");
  assert.equal(row("/rules/employee-pf", "Revised statutory wage ceiling"), "₹25,000 per month");
  assert.ok(epf.sources.some((source) => source.url.endsWith("/EPFO_Wage_Ceiling_FAQs.pdf")));

  assert.match(row("/rules/gratuity-wages", "Fixed-term employee"), /eligible after one year of service/);
  assert.match(row("/rules/leave-encashment", "Encashment"), /no maximum encashment limit/);
  assert.match(row("/rules/leave-encashment", "State law"), /more favourable state-law benefit/);
});

test("content audit reports missing editorial gates without granting readiness", () => {
  const report = buildContentQualityReport("2026-10-07T00:00:00.000Z");

  assert.equal(report.generatedAt, "2026-10-07T00:00:00.000Z");
  assert.equal(report.readiness.engineering, "ready");
  assert.equal(report.readiness.articlePublication, "blocked");
  assert.equal(report.readiness.data, "blocked");
  assert.equal(report.readiness.operationalVerification, "not-assessed");
  assert.equal(report.readiness.accountQa, "not-assessed");
  assert.equal(report.readiness.release, "ready");
  assert.match(report.readiness.releaseScope, /unrelated article, data, account, and infrastructure requirements are separate/);
  assert.ok(!report.readiness.blockers.articlePublication.includes("archived-article-duplicate-review"));
  assert.ok(report.readiness.blockers.data.includes("production-market-data-provenance"));
  assert.ok(!report.readiness.blockers.engineering.includes("archived-article-duplicate-review"));
  assert.equal(report.reapplicationAllowed, null);
  assert.match(report.reapplicationNote, /does not assess AdSense readiness of the current public pages/);
  assert.equal(report.inventory.articles, 0);
  assert.equal(report.inventory.archivedArticles, 44);
  assert.equal(report.inventory.originalArchiveFiles, 44);
  assert.equal(report.inventory.auditedArticleRecords, 44);
  assert.equal(report.content.originalArchiveIntegrity.matchesQuarantinedSources, true);
  assert.equal(report.content.archivedArticleDispositions.length, 44);
  assert.equal(
    report.content.archivedArticleDispositions.reduce((total, article) => total + article.duplicateParagraphCopies, 0),
    report.content.raw.duplicateWithinArticleOccurrences,
  );
  assert.ok(report.content.archivedArticleDispositions.every((article) =>
    article.substantiveWords >= 750 &&
    article.blockers.includes("No verified named author record.") &&
    article.blockers.includes("No verified reviewer record.") &&
    !article.blockers.includes("No article-specific hero image and meaningful alt-text metadata is recorded."),
  ));
  assert.ok(!report.readiness.blockers.articlePublication.includes("article-hero-image-alt-coverage"));
  assert.equal(report.inventory.verifiedNamedAuthors, 0);
  assert.equal(report.inventory.verifiedReviewers, 0);
  assert.equal(report.inventory.articlesWithVerifiedPublicationDates, 0);
  assert.equal(report.inventory.articlesWithVerifiedModifiedDates, 0);
  assert.equal(report.content.sourceInventory.humanVerifiedClaims, 0);
  assert.equal(report.content.raw.articleCount, 44);
  assert.ok(report.content.raw.duplicateWithinArticleOccurrences > 0);
  assert.equal(
    report.content.raw.duplicateGroups.reduce((total, group) => total + group.copies - 1, 0),
    report.content.raw.duplicateWithinArticleOccurrences,
  );
  assert.ok(report.content.raw.duplicateGroups.every((group) =>
    group.locations.length === group.copies &&
    group.locations.every((location) => location.sectionHeading.trim() && location.paragraphIndex > 0) &&
    group.excerpt.length > 0 &&
    group.reviewStatus === "requires-editorial-review",
  ));
  const greenCareerTemplate = report.content.raw.duplicateGroups.find((group) =>
    group.articleSlug === "green-careers-esg-renewable-sustainability-india-2026" &&
    group.classification === "repeated-template-candidate" &&
    group.locations.every((location) => location.paragraphIndex === 2),
  );
  assert.equal(greenCareerTemplate?.copies, 16);
  assert.equal(
    report.content.archivedDuplicateParagraphOccurrences,
    report.content.raw.duplicateWithinArticleOccurrences,
  );
  assert.equal(report.content.archivedAssembledDuplicateParagraphOccurrences, 0);
  assert.ok(report.content.archivedArticleDispositions.every((article) =>
    article.duplicateParagraphCopiesAfterAssembly === 0,
  ));
  assert.equal(report.content.duplicateParagraphOccurrencesInContent, 0);
  assert.ok(report.gates.some((gate) =>
    gate.id === "post-assembly-duplicate-paragraphs" &&
    gate.status === "pass" &&
    gate.count === 0,
  ));
  assert.ok(report.gates.some((gate) =>
    gate.id === "original-archive-retention" &&
    gate.status === "pass" &&
    gate.count === 44,
  ));
  assert.ok(report.gates.some((gate) =>
    gate.id === "archived-article-duplicate-review" &&
    gate.status === "pass" &&
    gate.count === 0 &&
    gate.detail.includes(`${report.content.raw.duplicateWithinArticleOccurrences} copies`),
  ));
  assert.ok(report.gates.some((gate) =>
    gate.id === "quarantined-article-restoration-review" &&
    gate.status === "blocked" &&
    gate.count === 44,
  ));
  assert.ok(report.gates.some((gate) =>
    gate.id === "named-authors-and-reviewers" &&
    gate.status === "blocked" &&
    gate.count === 44,
  ));
  assert.ok(report.productionMarketData);
  assert.equal(
    report.productionMarketData.tables.reduce((sum, table) => sum + table.rowCount, 0),
    392,
  );
  assert.equal(
    report.productionMarketData.tables.reduce((sum, table) => sum + table.incompleteProvenanceRows, 0),
    392,
  );
  assert.ok(report.gates.some((gate) =>
    gate.id === "production-market-data-provenance" &&
    gate.status === "blocked" &&
    gate.count === 392 &&
    gate.detail.includes("not an approved freshness policy"),
  ));
  assert.ok(report.gates.some((gate) => gate.id === "company-score-methodology" && gate.status === "blocked"));
  assert.equal(report.indexability.sitemapPathCount, 87);
  assert.ok(report.gates.some((gate) =>
    gate.id === "sitemap-robots-alignment" &&
    gate.status === "pass",
  ));
  assert.equal(report.indexability.indexedUrlExport.rowCount, 74);
  assert.equal(report.indexability.indexedUrlExport.uniquePathCount, 61);
  assert.equal(report.indexability.indexedUrlExport.outsideSitemap.length, 49);
  assert.equal(report.indexability.indexedUrlExport.sitemapNotInExport.length, 75);
  assert.equal(report.indexability.indexedUrlExport.routes.length, 136);
});

test("indexed URL CSV parser preserves quoted commas, quotes, and line breaks", () => {
  assert.deepEqual(parseCsvRows('URL,Note\nhttps://example.test/a,"has, comma"\nhttps://example.test/b,"two\nlines"\n'), [
    ["URL", "Note"],
    ["https://example.test/a", "has, comma"],
    ["https://example.test/b", "two\nlines"],
  ]);
});
