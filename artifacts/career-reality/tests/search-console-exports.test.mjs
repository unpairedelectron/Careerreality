import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditSearchConsoleExports } from "../scripts/audit-search-console-exports.mjs";

function fixture(t, files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "search-console-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  for (const [name, contents] of Object.entries(files)) fs.writeFileSync(path.join(directory, name), contents);
  return directory;
}

const filters = (date, extras = "") => `Filter,Value\nSearch type,Web\nDate,${date}${extras}`;
const chart = "Date,Clicks,Impressions,CTR,Position\n2026-08-01,2,12,16.67%,3\n2026-08-02,1,8,12.5%,4\n";
const pages = "Top pages,Clicks,Impressions,CTR,Position\nhttps://example.com/,4,25,16%,2\nhttps://example.com/about/,2,15,13.33%,3\n";
const queries = "Top queries,Clicks,Impressions,CTR,Position\ncareer reality,1,5,20%,2\nother query,1,4,25%,3\n";

test("does not summarize a bundle whose Filters file is missing", (t) => {
  const report = auditSearchConsoleExports(fixture(t, { "Chart_1790603336091.csv": chart }));
  assert.equal(report.bundles[0].metrics, null);
  assert.match(report.bundles[0].warnings[0], /Filters file is missing/);
});

test("does not summarize when the Filters table lacks required filter metadata", (t) => {
  const report = auditSearchConsoleExports(fixture(t, {
    "Chart_1790603336091.csv": chart,
    "Filters_1790603336092.csv": "Filter,Value\nSearch type,Web\n",
  }));
  assert.equal(report.bundles[0].metrics, null);
  assert.match(report.bundles[0].warnings[0], /must include Search type and Date/);
});

test("detects exact duplicate bundles and labels their source file dates", (t) => {
  const files = {};
  for (const [time, contents] of [["1790603398205", filters("Last 3 months")], ["1790603995002", filters("Last 3 months")]]) {
    files[`0_Chart_${time}.csv`] = chart;
    files[`3_Filters_${Number(time) + 2}.csv`] = contents;
    files[`4_Pages_${Number(time) + 2}.csv`] = pages;
    files[`5_Queries_${Number(time) + 2}.csv`] = queries;
  }
  const report = auditSearchConsoleExports(fixture(t, files));
  assert.equal(report.duplicates.length, 1);
  assert.deepEqual(report.duplicates[0].sourceDates, ["2026-09-28", "2026-09-28"]);
  assert.equal(report.bundles[0].sourceDate, "2026-09-28");
});

test("reports differing date and country filters rather than combining scopes", (t) => {
  const files = {
    "0_Chart_1790603336091.csv": chart,
    "3_Filters_1790603336092.csv": filters("Last 16 months"),
    "0_Chart_1790603398205.csv": chart,
    "3_Filters_1790603398207.csv": filters("Last 3 months", "\nCountry,India\n"),
  };
  const report = auditSearchConsoleExports(fixture(t, files));
  assert.equal(report.bundles[0].filters.country, "None recorded");
  assert.equal(report.bundles[1].filters.country, "India");
  assert.deepEqual(new Set(report.bundles[0].scopeDifferences.map((difference) => difference.filter)), new Set(["dateRange", "country"]));
});

test("keeps Chart totals separate and labels Page and Query rows as incomplete", (t) => {
  const report = auditSearchConsoleExports(fixture(t, {
    "0_Chart_1790603336091.csv": chart,
    "3_Filters_1790603336092.csv": filters("Custom"),
    "4_Pages_1790603336093.csv": pages,
    "5_Queries_1790603336093.csv": queries,
  }));
  const metrics = report.bundles[0].metrics;
  assert.deepEqual({ clicks: metrics.chart.clicks, impressions: metrics.chart.impressions }, { clicks: 3, impressions: 20 });
  assert.deepEqual({ clicks: metrics.pages.clicks, impressions: metrics.pages.impressions }, { clicks: 6, impressions: 40 });
  assert.deepEqual({ clicks: metrics.queries.clicks, impressions: metrics.queries.impressions }, { clicks: 2, impressions: 9 });
  assert.match(metrics.queries.meaning, /anonymized/);
  assert.match(metrics.pages.meaning, /not property totals/);
});
