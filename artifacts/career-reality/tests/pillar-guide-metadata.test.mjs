import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import authoredBase from "../src/data/authored-guide-batch.mjs";
import authoredNext from "../src/data/authored-guide-batch-next.mjs";
import authoredPhaseOne from "../src/data/authored-guide-batch-phase-one.mjs";
import authoredPhaseTwo from "../src/data/authored-guide-batch-phase-two.mjs";

const guideData = JSON.parse(readFileSync(new URL("../src/data/generated-pillar-guides.json", import.meta.url), "utf8"));
const authoredGuides = Object.assign({}, authoredBase, authoredNext, authoredPhaseOne, authoredPhaseTwo);

test("guide generation preserves supplied dates and leaves missing dates empty", () => {
  assert.ok(guideData.guides.length > 0);
  for (const guide of guideData.guides) {
    const authored = authoredGuides[guide.slug] ?? {};
    assert.equal(guide.datePublished ?? null, authored.datePublished ?? null, `${guide.slug} publication date`);
    assert.equal(guide.dateModified ?? null, authored.dateModified ?? null, `${guide.slug} modified date`);
  }
});

test("guide metadata does not attach unsupported author or reviewer identities", () => {
  for (const guide of guideData.guides) {
    assert.equal("author" in guide, false);
    assert.equal("reviewer" in guide, false);
  }
});

test("per-guide runtime chunks match the generated catalog", () => {
  for (const guide of guideData.guides) {
    const splitGuide = JSON.parse(
      readFileSync(new URL(`../src/data/generated-pillar-guides/by-slug/${guide.slug}.json`, import.meta.url), "utf8"),
    );
    assert.deepEqual(splitGuide, guide, `${guide.slug} runtime chunk`);
  }
});
