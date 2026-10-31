import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TABLE_NAMES = new Set(["Chart", "Countries", "Devices", "Filters", "Pages", "Queries", "Search_appearance"]);
const MAX_BUNDLE_GAP_MS = 5_000;

function parseCsv(text) {
  const records = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) records.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value !== "")) records.push(row);
  if (quoted) throw new Error("CSV ends inside a quoted field.");

  const [header = [], ...data] = records;
  return data.map((values) => Object.fromEntries(
    header.map((name, index) => [name.trim(), (values[index] ?? "").trim()]),
  ));
}

function tableFile(filename) {
  const match = filename.match(/^(?:\d+_)?(Chart|Countries|Devices|Filters|Pages|Queries|Search_appearance)_(\d+)\.csv$/i);
  if (!match) return null;
  const table = [...TABLE_NAMES].find((name) => name.toLowerCase() === match[1].toLowerCase());
  return { table, timestamp: Number(match[2]) };
}

function discoverBundles(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({ name: entry.name, parsed: tableFile(entry.name) }))
    .filter((entry) => entry.parsed)
    .sort((a, b) => a.parsed.timestamp - b.parsed.timestamp || a.name.localeCompare(b.name));

  const clusters = [];
  for (const file of files) {
    let cluster = clusters.at(-1);
    if (!cluster || file.parsed.timestamp - cluster.lastTimestamp > MAX_BUNDLE_GAP_MS) {
      cluster = { files: [], lastTimestamp: file.parsed.timestamp };
      clusters.push(cluster);
    }
    cluster.files.push(file);
    cluster.lastTimestamp = file.parsed.timestamp;
  }

  return clusters.map((cluster) => {
    const tables = {};
    for (const file of cluster.files) {
      if (tables[file.parsed.table]) {
        throw new Error(`Duplicate ${file.parsed.table} table in export bundle: ${file.name}`);
      }
      tables[file.parsed.table] = path.join(directory, file.name);
    }
    const timestamp = cluster.files[0].parsed.timestamp;
    return { timestamp, sourceDate: new Date(timestamp).toISOString().slice(0, 10), tables };
  });
}

function filtersFor(bundle) {
  const file = bundle.tables.Filters;
  if (!file) return { error: "Filters file is missing; this bundle was not summarized." };

  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const filters = Object.fromEntries(rows
    .filter((row) => row.Filter && row.Value)
    .map((row) => [row.Filter.trim().toLowerCase(), row.Value.trim()]));
  const searchType = filters["search type"] ?? null;
  const dateRange = filters.date ?? null;
  if (!searchType || !dateRange) {
    return {
      error: `Filters file must include Search type and Date; found ${file}.`,
      searchType,
      dateRange,
      country: filters.country ?? "None recorded",
      device: filters.device ?? "None recorded",
    };
  }
  return {
    searchType,
    dateRange,
    country: filters.country ?? "None recorded",
    device: filters.device ?? "None recorded",
  };
}

function sumMetrics(file) {
  if (!file) return null;
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const sum = (column) => rows.reduce((total, row) => total + (Number(row[column]) || 0), 0);
  return { rows: rows.length, clicks: sum("Clicks"), impressions: sum("Impressions") };
}

function bundleSignature(bundle) {
  const entries = Object.entries(bundle.tables)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([table, file]) => `${table}:${crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}`);
  return entries.length ? entries.join("|") : null;
}

export function auditSearchConsoleExports(directory) {
  const bundles = discoverBundles(directory).map((bundle) => {
    const filters = filtersFor(bundle);
    const validFilters = !filters.error;
    return {
      sourceDate: bundle.sourceDate,
      sourceTimestamp: bundle.timestamp,
      sourceFiles: Object.fromEntries(Object.entries(bundle.tables).map(([table, file]) => [table, path.basename(file)])),
      filters,
      scopeDifferences: [],
      metrics: validFilters ? {
        chart: { ...sumMetrics(bundle.tables.Chart), meaning: "Daily Chart totals for this bundle's recorded filters." },
        pages: { ...sumMetrics(bundle.tables.Pages), meaning: "Visible Page row sums only; not property totals." },
        queries: {
          ...sumMetrics(bundle.tables.Queries),
          meaning: "Reported Query row sums only; anonymized and other omitted queries are not included.",
        },
      } : null,
      warnings: validFilters ? [] : [filters.error],
      signature: bundleSignature(bundle),
    };
  });

  for (const bundle of bundles) {
    if (!bundle.metrics) continue;
    bundle.scopeDifferences = bundles
      .filter((other) => other !== bundle && other.metrics)
      .flatMap((other) => ["searchType", "dateRange", "country", "device"]
        .filter((key) => bundle.filters[key] !== other.filters[key])
        .map((key) => ({
          comparedWith: other.sourceDate,
          filter: key,
          thisValue: bundle.filters[key],
          otherValue: other.filters[key],
        })));
  }

  const bySignature = new Map();
  for (const bundle of bundles) {
    if (!bundle.signature) continue;
    const matches = bySignature.get(bundle.signature) ?? [];
    matches.push(bundle);
    bySignature.set(bundle.signature, matches);
  }
  const duplicates = [...bySignature.values()]
    .filter((matches) => matches.length > 1)
    .map((matches) => ({
      sourceDates: matches.map((bundle) => bundle.sourceDate),
      files: matches.map((bundle) => bundle.sourceFiles),
      note: "Exact byte-identical table contents; retain one bundle for analysis.",
    }));
  for (const bundle of bundles) delete bundle.signature;

  return {
    bundles,
    duplicates,
    notes: [
      "Read each bundle's Filters file before interpreting any table.",
      "Countries and Devices tables are aggregates; their presence does not apply those filters to Pages or Queries.",
      "Use Chart totals as the property baseline. Page and Query row sums are not property totals.",
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = path.resolve(process.argv[2] ?? path.resolve(import.meta.dirname, "../../../attached_assets"));
  try {
    console.log(JSON.stringify(auditSearchConsoleExports(directory), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
