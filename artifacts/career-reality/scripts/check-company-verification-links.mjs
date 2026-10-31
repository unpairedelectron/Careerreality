import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourcesPath = path.join(root, "../src/data/company-verification-sources.json");
const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
let failed = false;

for (const source of sources) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(source.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "CareerReality-source-link-check/1.0" },
    });
    const ok = response.status >= 200 && response.status < 400;
    console.log(`${ok ? "OK" : "FAIL"} ${response.status} ${source.id} ${response.url}`);
    if (!ok) failed = true;
    await response.body?.cancel();
  } catch (error) {
    failed = true;
    const reason = error?.name === "AbortError" ? "timeout" : error?.cause?.code || error?.message || String(error);
    console.log(`UNVERIFIED ${source.id} ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}

if (failed) {
  console.error("At least one official source did not return a successful response. Review the destination manually; do not mark it verified from this run.");
  process.exitCode = 1;
}
