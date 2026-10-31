import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { getSiteUrl } from "../scripts/seo-site-url.mjs";

test("canonical origin is required, normalized and SITE_URL takes precedence", () => {
  assert.throws(() => getSiteUrl({}), /Missing SITE_URL/);
  assert.throws(() => getSiteUrl({ SITE_URL: " ", VITE_SITE_URL: "" }), /Missing SITE_URL/);
  assert.equal(getSiteUrl({ VITE_SITE_URL: " https://canonical.example/ " }), "https://canonical.example");
  assert.equal(getSiteUrl({ SITE_URL: "https://canonical.example/", VITE_SITE_URL: "https://preview.example" }), "https://canonical.example");
  for (const value of ["not-a-url", "ftp://example.com", "https://user:password@example.com", "https://example.com/path", "https://example.com?query", "https://example.com/#fragment"]) {
    assert.throws(() => getSiteUrl({ SITE_URL: value }), /Invalid SITE_URL/);
  }
});

test("direct Vite production builds reject missing or invalid canonical origins", () => {
  for (const origin of ["", "https://example.com/not-an-origin"]) {
    const result = spawnSync("pnpm", ["exec", "vite", "build", "--config", "vite.config.ts"], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, PORT: "4174", BASE_PATH: "/", SITE_URL: origin, VITE_SITE_URL: "" },
      encoding: "utf8",
      timeout: 60_000,
    });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /(?:Missing|Invalid) SITE_URL/);
  }
});
