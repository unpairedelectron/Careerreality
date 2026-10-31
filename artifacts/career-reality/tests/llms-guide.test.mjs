import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderLlmsGuide } from "../scripts/lib/llms-guide.mjs";

const registry = JSON.parse(readFileSync(new URL("../src/data/route-registry.json", import.meta.url), "utf8"));
const origin = "https://example.test";
const guide = renderLlmsGuide(registry, origin);
const linkedPaths = (text) => [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => new URL(match[1]).pathname);

test("every public sitemap snapshot is linked once; no withheld or private route is recommended", () => {
  const expected = registry.routes
    .filter((route) => route.indexability === "indexable" && route.sitemap)
    .map((route) => route.path === "/" ? "/" : `${route.path}/`);
  const actual = linkedPaths(guide).filter((path) => path !== registry.sitemapPolicy.xmlRoute);
  assert.deepEqual(actual.toSorted(), expected.toSorted());
  assert.equal(new Set(actual).size, actual.length);
  assert.equal(actual.filter((path) => /^\/guides\/[^/]+\/$/.test(path)).length, 18);
  assert.ok(!actual.some((path) => /article|workspace|salary-reality|confirm|unsubscribe/.test(path)));
});

test("publication changes remove routes automatically and metadata changes propagate", () => {
  for (const patch of [{ indexability: "noindex" }, { sitemap: false }]) {
    const changed = structuredClone(registry);
    Object.assign(changed.routes.find((route) => route.path === "/compass"), patch);
    assert.ok(!linkedPaths(renderLlmsGuide(changed, origin)).includes("/compass/"));
  }
  const changed = structuredClone(registry);
  changed.routes.find((route) => route.path === "/compass").description = "Updated scope and limitations.";
  assert.ok(renderLlmsGuide(changed, origin).includes("Updated scope and limitations."));
});

test("unsupported public route kinds and non-snapshot publication fail explicitly", () => {
  for (const patch of [{ kind: "new-collection" }, { render: "app-shell" }]) {
    const changed = structuredClone(registry);
    Object.assign(changed.routes.find((route) => route.path === "/compass"), patch);
    assert.throws(() => renderLlmsGuide(changed, origin), /\/compass/);
  }
});

test("guidance preserves archive, evidence, forecast, policy, and voluntary-guidance limits", () => {
  for (const text of [
    "archived article corpus, which remains withheld",
    "not confirmed search-engine indexing",
    "dated, source-linked event records",
    "not a layoff tracker",
    "not a company rating",
    "not an owner-approved privacy policy",
    "not a robots directive",
    "does not predict job-search duration",
    "not review, fulfilment, or a response time",
  ]) assert.ok(guide.includes(text), text);
  assert.doesNotMatch(guide, /Other noindex tools|local release candidate|No publishable company or layoff records/);
});

test("checked-in guide matches the registry with its canonical origin", () => {
  const checkedIn = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
  const canonicalOrigin = new URL(checkedIn.match(/\]\((https?:\/\/[^)]+)\)/)[1]).origin;
  assert.equal(checkedIn, renderLlmsGuide(registry, canonicalOrigin));
});
