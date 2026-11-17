import assert from "node:assert/strict";
import test from "node:test";
import generatedGuides from "../src/data/generated-pillar-guides.json";
import { guideRelatedGuides } from "../src/data/guide-related-guides";

const slugs = new Set(generatedGuides.guides.map((guide) => guide.slug));

test("every published guide lists three distinct, published related guides", () => {
  for (const slug of slugs) {
    const related = guideRelatedGuides[slug];
    assert.ok(related, `Missing related guides for ${slug}`);
    assert.equal(new Set(related).size, 3, `${slug}: related guides must be three distinct guides`);
    for (const target of related) {
      assert.notEqual(target, slug, `${slug} links to itself`);
      assert.ok(slugs.has(target), `${slug} links to unknown guide ${target}`);
    }
  }
  for (const slug of Object.keys(guideRelatedGuides)) assert.ok(slugs.has(slug), `Related-guide list for unpublished guide ${slug}`);
});

test("every guide is linked from at least two other guides", () => {
  const inbound = new Map([...slugs].map((slug) => [slug, 0]));
  for (const related of Object.values(guideRelatedGuides)) for (const target of related) inbound.set(target, (inbound.get(target) ?? 0) + 1);
  for (const [slug, count] of inbound) assert.ok(count >= 2, `${slug} is linked from only ${count} guide(s)`);
});
