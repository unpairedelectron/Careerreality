import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const contentDir = path.join(root, "content/questions");
const roles = [
  ["data-engineer", "Data Engineer"],
  ["data-scientist", "Data Scientist"],
  ["ai-ml-engineer", "AI/ML Engineer"],
  ["gen-ai-engineer", "Generative AI Engineer"],
  ["agentic-ai-engineer", "Agentic AI Engineer"],
];
const rows = ["# Items requiring independent subject-matter review", "",
  "All entries below are drafts. No human reviewer or approval is recorded. AI-assisted drafting, source checking, and independent re-derivation are not substitutes for qualified human review.", ""];

for (const [id, title] of roles) {
  const items = JSON.parse(fs.readFileSync(path.join(contentDir, id, "items.json"), "utf8"));
  rows.push(`## ${title}`, "");
  for (const item of items) rows.push(`- \`${item.id}\` — ${item.topic} / ${item.subtopic}: ${item.question}`);
  rows.push("");
}

fs.writeFileSync(path.join(root, "docs/needs-sme-review.md"), `${rows.join("\n")}\n`);
console.log(`Wrote SME review queue for ${roles.length} roles.`);
