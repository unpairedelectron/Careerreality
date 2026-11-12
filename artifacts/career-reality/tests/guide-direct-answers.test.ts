import assert from "node:assert/strict";
import test from "node:test";
import generatedGuides from "../src/data/generated-pillar-guides.json";
import { guideDirectAnswers } from "../src/data/guide-direct-answers";

const guides = generatedGuides.guides;
const words = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length;
const normalise = (text: string) => text.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

test("every published guide has exactly one direct answer, and no answer is orphaned", () => {
  const slugs = new Set(guides.map((guide) => guide.slug));
  for (const slug of slugs) assert.ok(guideDirectAnswers[slug], `Missing direct answer for ${slug}`);
  for (const slug of Object.keys(guideDirectAnswers)) assert.ok(slugs.has(slug), `Direct answer has no published guide: ${slug}`);
});

test("questions are short questions and answers stay within the guide paragraph limits", () => {
  for (const [slug, { question, answer }] of Object.entries(guideDirectAnswers)) {
    assert.ok(question.endsWith("?"), `${slug}: question must end with a question mark`);
    assert.ok(words(question) <= 14, `${slug}: question is ${words(question)} words; keep it to 14`);
    assert.ok(words(answer) >= 20 && words(answer) <= 90, `${slug}: answer is ${words(answer)} words; expected 20–90`);
    assert.doesNotMatch(answer, /<|>|https?:/, `${slug}: answer must be plain text`);
  }
});

test("answers are unique and are not copies of the guide's own paragraphs", () => {
  const seen = new Map<string, string>();
  for (const guide of guides) {
    const { answer } = guideDirectAnswers[guide.slug];
    const key = normalise(answer);
    assert.ok(!seen.has(key), `${guide.slug} repeats the direct answer of ${seen.get(key)}`);
    seen.set(key, guide.slug);
    const paragraphs = [guide.editorialFrame, guide.lead ?? "", ...guide.sections.flatMap((section) => section.content.split(/\n{2,}/)), ...guide.faqs.map((faq) => faq.answer)];
    for (const paragraph of paragraphs) {
      assert.notEqual(normalise(paragraph), key, `${guide.slug}: direct answer duplicates a paragraph already on the page`);
    }
  }
});

test("answers introduce no figure that the guide itself does not already state", () => {
  for (const guide of guides) {
    const { question, answer } = guideDirectAnswers[guide.slug];
    const guideText = JSON.stringify(guide);
    for (const figure of `${question} ${answer}`.match(/\d[\d,.–]*\d|\d/gu) ?? []) {
      assert.ok(guideText.includes(figure), `${guide.slug}: "${figure}" does not appear anywhere in the guide; direct answers must not add new figures`);
    }
  }
});
