import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { indexNowKey, readSitemapUrls, submitIndexNow } from "../scripts/submit-indexnow.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("publishes the matching IndexNow key at the site root", () => {
  assert.equal(fs.readFileSync(path.join(root, "public", `${indexNowKey}.txt`), "utf8").trim(), indexNowKey);
});

test("reads distinct canonical HTTPS URLs from the sitemap", () => {
  const urls = readSitemapUrls(
    "<urlset><url><loc>https://careerreality.in/</loc></url><url><loc>https://careerreality.in/guides/</loc></url><url><loc>https://careerreality.in/</loc></url></urlset>",
  );
  assert.deepEqual(urls, ["https://careerreality.in/", "https://careerreality.in/guides/"]);
});

test("rejects URLs outside the canonical origin", () => {
  assert.throws(() => readSitemapUrls("<urlset><url><loc>https://www.careerreality.in/</loc></url></urlset>"), /outside the canonical site origin/);
  assert.throws(() => readSitemapUrls("<urlset><url><loc>http://careerreality.in/</loc></url></urlset>"), /outside the canonical site origin/);
});

test("submits sitemap URLs with the required IndexNow payload", async () => {
  let request;
  const status = await submitIndexNow(["https://careerreality.in/"], async (url, options) => {
    request = { url, options };
    return { status: 202 };
  });
  assert.equal(status, 202);
  assert.equal(request.url, "https://api.indexnow.org/indexnow");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), {
    host: "careerreality.in",
    key: indexNowKey,
    keyLocation: `https://careerreality.in/${indexNowKey}.txt`,
    urlList: ["https://careerreality.in/"],
  });
});

test("reports provider rejection instead of claiming URLs were submitted", async () => {
  await assert.rejects(
    submitIndexNow(["https://careerreality.in/"], async () => ({ status: 403, text: async () => "Invalid key" })),
    /HTTP 403\): Invalid key/,
  );
});
