import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteOrigin = "https://careerreality.in";
export const indexNowKey = "c5ac35a82c4feb97ba498dcf01ef7011";
const keyLocation = `${siteOrigin}/${indexNowKey}.txt`;
const sitemapPath = path.join(root, "public", "sitemap.xml");
const endpoint = "https://api.indexnow.org/indexnow";

export function readSitemapUrls(xml, origin = siteOrigin) {
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
  if (urls.length === 0) throw new Error("No URLs found in public/sitemap.xml.");
  for (const value of urls) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.origin !== origin || url.username || url.password) {
      throw new Error(`Sitemap URL is outside the canonical site origin: ${value}`);
    }
  }
  return [...new Set(urls)];
}

export async function submitIndexNow(urls, fetchImpl = fetch) {
  if (urls.length === 0) throw new Error("At least one URL is required.");
  if (urls.length > 10_000) throw new Error("IndexNow accepts at most 10,000 URLs per request.");

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(siteOrigin).host,
      key: indexNowKey,
      keyLocation,
      urlList: urls,
    }),
  });
  if (![200, 202].includes(response.status)) {
    const detail = (await response.text()).trim();
    throw new Error(`IndexNow rejected the request (HTTP ${response.status})${detail ? `: ${detail}` : ""}`);
  }
  return response.status;
}

async function main() {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const urls = readSitemapUrls(sitemap);
  const status = await submitIndexNow(urls);
  console.log(`IndexNow accepted ${urls.length} sitemap URLs (HTTP ${status}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
