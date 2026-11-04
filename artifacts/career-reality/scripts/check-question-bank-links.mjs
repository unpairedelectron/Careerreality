import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = path.join(repoRoot, "content/questions");
const bankIds = ["data-engineer", "data-scientist", "ai-ml-engineer", "gen-ai-engineer", "agentic-ai-engineer"];
const references = new Map();

for (const bank of bankIds) {
  const bankRoot = path.join(contentRoot, bank);
  const items = JSON.parse(await readFile(path.join(bankRoot, "items.json"), "utf8"));
  const topicMap = JSON.parse(await readFile(path.join(bankRoot, "topic-map.json"), "utf8"));
  const add = (reference, kind) => {
    let url;
    try {
      url = new URL(reference.url);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported protocol");
    } catch {
      throw new Error(`${bank}: invalid source URL: ${reference.url}`);
    }
    const record = references.get(url.href) ?? { url: url.href, titles: new Set(), banks: new Set(), kinds: new Set() };
    record.titles.add(reference.title);
    record.banks.add(bank);
    record.kinds.add(kind);
    references.set(url.href, record);
  };
  for (const item of items) for (const reference of item.references ?? []) add(reference, "item");
  for (const topic of topicMap.topics ?? []) for (const reference of topic.sources ?? []) add(reference, "topic-map");
}

const urls = [...references.values()];
const results = new Array(urls.length);
let nextIndex = 0;
const concurrency = 4;
const timeoutMs = 15_000;
const maxAttempts = 2;

async function checkReference(reference) {
  let lastError = "request failed";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(reference.url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "CareerReality-question-bank-link-check/1.0",
          range: "bytes=0-0",
        },
      });
      const finalUrl = response.url;
      const status = response.status;
      await response.body?.cancel();
      if (status >= 200 && status < 400) return { ...reference, status, finalUrl, result: "OK" };
      lastError = `HTTP ${status}`;
      if (attempt < maxAttempts && (status === 429 || status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
      return { ...reference, status, finalUrl, result: status === 404 || status === 410 ? "BROKEN" : "REVIEW" };
    } catch (error) {
      lastError = error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : error?.cause?.code || error?.message || String(error);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  return { ...reference, result: "UNVERIFIED", detail: lastError };
}

async function worker() {
  while (nextIndex < urls.length) {
    const index = nextIndex;
    nextIndex += 1;
    results[index] = await checkReference(urls[index]);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));

for (const result of results) {
  const label = [...result.banks].join(",");
  const detail = result.status ? `${result.status} ${result.finalUrl}` : result.detail;
  console.log(`${result.result.padEnd(10)} ${label} ${detail}`);
}

const counts = Object.fromEntries(["OK", "BROKEN", "REVIEW", "UNVERIFIED"].map((key) => [
  key,
  results.filter((result) => result.result === key).length,
]));
console.log(`Checked ${results.length} unique URLs across ${bankIds.length} banks: ${counts.OK} reachable, ${counts.BROKEN} broken, ${counts.REVIEW} need manual review, ${counts.UNVERIFIED} unverified.`);
if (counts.BROKEN + counts.REVIEW + counts.UNVERIFIED > 0) {
  console.error("Non-OK links require manual review. HTTP reachability alone does not verify that a source supports its cited claim.");
  process.exitCode = 1;
}
