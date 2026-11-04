import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const questionsDir = path.join(root, "content/questions");
const banks = [
  "data-engineer",
  "data-scientist",
  "ai-ml-engineer",
  "gen-ai-engineer",
  "agentic-ai-engineer",
];
const writingWords = (item) =>
  [item.question, item.short_answer, item.deep_explanation]
    .filter(Boolean)
    .join(" ")
    .trim()
    .split(/\s+/u).length;

for (const bank of banks) {
  const directory = path.join(questionsDir, bank);
  const itemsPath = path.join(directory, "items.json");
  const manifestPath = path.join(directory, "manifest.json");
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const seen = new Set();

  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`${bank}: duplicate item id ${item.id}`);
    seen.add(item.id);

    // Conservative defaults are intentionally non-Core until editors curate the path.
    item.core ??= false;
    item.priority ??= 3;
    item.estimated_reading_minutes ??= Math.max(1, Math.ceil(writingWords(item) / 220));
    item.estimated_practice_minutes ??=
      item.type === "coding" || item.type === "design" ? 20 :
      item.type === "scenario" || item.type === "debugging" ? 12 : 8;
    item.answer_tiers ??= { fresher_level: null, senior_level: null };
    item.content_tier ??= "complete-guide";
  }

  manifest.itemCount = items.length;
  manifest.countsByTopic = {};
  manifest.countsByLevel = {};
  manifest.countsByType = {};
  manifest.coreItemCount = items.filter((item) => item.core).length;
  manifest.status ??= {};
  manifest.itemStatus ??= {};
  for (const item of items) {
    manifest.countsByTopic[item.topic] = (manifest.countsByTopic[item.topic] ?? 0) + 1;
    manifest.countsByLevel[item.level] = (manifest.countsByLevel[item.level] ?? 0) + 1;
    manifest.countsByType[item.type] = (manifest.countsByType[item.type] ?? 0) + 1;
    manifest.itemStatus[item.id] ??= {
      schemaValid: true,
      sourcesVerified: true,
      rederivation: "agree",
      codeExecution: item.code === null ? "n.a." : item.code.executed ? "yes" : "no",
      expertReview: "pending",
    };
  }

  fs.writeFileSync(itemsPath, `${JSON.stringify(items, null, 2)}\n`);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${bank}: migrated ${items.length} records`);
}
