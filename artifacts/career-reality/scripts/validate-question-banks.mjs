import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = path.join(repoRoot, "content/questions");
const schema = JSON.parse(fs.readFileSync(path.join(contentRoot, "schema.json"), "utf8"));
const banks = [
  { id: "data-engineer", minimum: 150 },
  { id: "data-scientist", minimum: 150 },
  { id: "ai-ml-engineer", minimum: 140 },
  { id: "gen-ai-engineer", minimum: 140 },
  { id: "agentic-ai-engineer", minimum: 110 },
];
const expectedReviewStatus = "Drafted with AI assistance; code executed; sources cited; independent expert review pending";
const allItems = [];
const failures = [];
const addFailure = (location, message) => failures.push(`${location}: ${message}`);
const isDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;

function checkKeys(value, required, allowed, location) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    addFailure(location, "must be an object");
    return false;
  }
  for (const key of required) if (!(key in value)) addFailure(location, `missing required field ${key}`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) addFailure(location, `unexpected field ${key}`);
  return true;
}

for (const bank of banks) {
  const bankDir = path.join(contentRoot, bank.id);
  const items = JSON.parse(fs.readFileSync(path.join(bankDir, "items.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(bankDir, "manifest.json"), "utf8"));
  const topicMap = JSON.parse(fs.readFileSync(path.join(bankDir, "topic-map.json"), "utf8"));
  if (!Array.isArray(items)) {
    addFailure(`${bank.id}/items.json`, "must contain an array");
    continue;
  }
  if (manifest.bank !== bank.id || manifest.itemCount !== items.length) {
    addFailure(`${bank.id}/manifest.json`, "bank identifier or itemCount does not match content");
  }
  if (!manifest.itemStatus || typeof manifest.itemStatus !== "object") {
    addFailure(`${bank.id}/manifest.json`, "per-item status map is required");
  }
  if (!Array.isArray(topicMap.topics) || topicMap.bank !== bank.id) {
    addFailure(`${bank.id}/topic-map.json`, "bank identifier and topics array are required");
  }

  const counts = { topics: {}, levels: {}, types: {} };
  for (const [index, item] of items.entries()) {
    const where = `${bank.id}/items.json[${index}]`;
    const requiredKeys = schema.required;
    const allowedKeys = Object.keys(schema.properties);
    if (!checkKeys(item, requiredKeys, allowedKeys, where)) continue;
    if (item.bank !== bank.id) addFailure(where, "bank does not match containing directory");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(item.id)) addFailure(where, "id is not a kebab-case slug");
    for (const field of ["topic", "subtopic", "question", "what_is_assessed", "short_answer", "deep_explanation", "versions_checked"]) {
      if (typeof item[field] !== "string" || !item[field].trim()) addFailure(where, `${field} must be non-empty`);
    }
    if (!["L1", "L2", "L3", "L4"].includes(item.level)) addFailure(where, "invalid level");
    if (!["concept", "trade-off", "scenario", "debugging", "coding", "design", "behavioural-technical"].includes(item.type)) addFailure(where, "invalid type");
    for (const field of ["strong_answer_signals", "weak_answer_signals", "common_mistakes"]) {
      if (!Array.isArray(item[field]) || item[field].length === 0 || item[field].some((value) => typeof value !== "string" || !value.trim())) {
        addFailure(where, `${field} must contain non-empty strings`);
      }
    }
    if (!Array.isArray(item.follow_ups) || item.follow_ups.length < 2 || item.follow_ups.length > 4) {
      addFailure(where, "follow_ups must contain two to four entries");
    } else {
      item.follow_ups.forEach((followUp, followIndex) => {
        const followWhere = `${where}.follow_ups[${followIndex}]`;
        checkKeys(followUp, ["question", "short_answer"], ["question", "short_answer"], followWhere);
        if (!followUp.question?.trim() || !followUp.short_answer?.trim()) addFailure(followWhere, "question and short_answer must be non-empty");
      });
    }
    if (item.visual_aid !== undefined && item.visual_aid !== null) {
      checkKeys(item.visual_aid, ["kind", "alt", "content"], ["kind", "alt", "content"], `${where}.visual_aid`);
      if (!["diagram", "timeline", "comparison-table"].includes(item.visual_aid.kind)) addFailure(where, "invalid visual_aid kind");
      if (!item.visual_aid.alt?.trim() || !item.visual_aid.content?.trim()) addFailure(where, "visual aid requires descriptive alt text and content");
    }
    if (item.code !== null) {
      checkKeys(item.code, ["language", "sample", "executed", "output"], ["language", "sample", "executed", "output"], `${where}.code`);
      if (!item.code.sample?.trim() || !item.code.output?.trim()) addFailure(where, "code sample and actual output or visible not-executed label are required");
      if (!item.code.executed && !/not executed/iu.test(item.code.output)) addFailure(where, "unexecuted code must be visibly labelled 'not executed'");
    }
    if (!Array.isArray(item.references) || item.references.length === 0) {
      addFailure(where, "at least one reference is required");
    } else {
      for (const [refIndex, reference] of item.references.entries()) {
        const refWhere = `${where}.references[${refIndex}]`;
        checkKeys(reference, ["title", "publisher", "url", "retrieved_date"], ["title", "publisher", "url", "retrieved_date"], refWhere);
        try {
          const url = new URL(reference.url);
          if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) addFailure(refWhere, "URL must be public HTTP(S) without embedded credentials");
        } catch {
          addFailure(refWhere, "invalid source URL");
        }
        if (!isDate(reference.retrieved_date)) addFailure(refWhere, "retrieved_date must be a valid ISO date");
      }
    }
    if (!["Stable", "Moderate", "Fast-moving"].includes(item.volatility)) addFailure(where, "invalid volatility");
    if (!isDate(item.last_verified)) addFailure(where, "last_verified must be a valid ISO date");
    if (item.review_status !== expectedReviewStatus) addFailure(where, "review_status must preserve the exact pending-expert-review wording");
    const itemStatus = manifest.itemStatus?.[item.id];
    if (!itemStatus) {
      addFailure(`${bank.id}/manifest.json`, `missing per-item status for ${item.id}`);
    } else if (
      itemStatus.schemaValid !== true ||
      itemStatus.sourcesVerified !== true ||
      itemStatus.rederivation !== "agree" ||
      itemStatus.codeExecution !== (item.code === null ? "n.a." : item.code.executed ? "yes" : "no") ||
      itemStatus.expertReview !== "pending"
    ) {
      addFailure(`${bank.id}/manifest.json`, `per-item status does not match ${item.id}`);
    }
    const verification = item.verification;
    if (checkKeys(
      verification,
      ["sources_checked", "rederivation_agreement", "rederivation_notes", "disagreements", "code_executed", "confidence"],
      ["sources_checked", "rederivation_agreement", "rederivation_notes", "disagreements", "code_executed", "confidence"],
      `${where}.verification`,
    )) {
      if (verification.rederivation_agreement !== true) addFailure(where, "rederivation agreement must be explicitly recorded");
      if (!Array.isArray(verification.sources_checked) || verification.sources_checked.length === 0) addFailure(where, "sources_checked must not be empty");
      if (!Array.isArray(verification.rederivation_notes) || verification.rederivation_notes.length === 0) addFailure(where, "rederivation_notes must record the independent comparison");
      if (!["yes", "no", "n.a."].includes(verification.code_executed)) addFailure(where, "invalid code execution status");
      if (!["high", "medium", "low"].includes(verification.confidence)) addFailure(where, "invalid confidence");
      if (item.code === null && verification.code_executed !== "n.a.") addFailure(where, "code-free item must mark execution not applicable");
      if (item.code !== null && verification.code_executed !== (item.code.executed ? "yes" : "no")) addFailure(where, "code execution status conflicts with code record");
    }

    counts.topics[item.topic] = (counts.topics[item.topic] ?? 0) + 1;
    counts.levels[item.level] = (counts.levels[item.level] ?? 0) + 1;
    counts.types[item.type] = (counts.types[item.type] ?? 0) + 1;
    allItems.push(item);
  }
  for (const [key, value] of Object.entries({
    countsByTopic: counts.topics,
    countsByLevel: counts.levels,
    countsByType: counts.types,
  })) {
    if (JSON.stringify(value) !== JSON.stringify(manifest[key])) addFailure(`${bank.id}/manifest.json`, `${key} does not match item content`);
  }
}

// Documented near-duplicate gate: Jaccard similarity over normalized question tokens; reject > 0.82.
function questionSimilarity(left, right) {
  const tokenize = (text) => new Set(text.toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu) ?? []);
  const a = tokenize(left);
  const b = tokenize(right);
  const intersection = [...a].filter((word) => b.has(word)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 1;
}
for (let left = 0; left < allItems.length; left += 1) {
  for (let right = left + 1; right < allItems.length; right += 1) {
    const similarity = questionSimilarity(allItems[left].question, allItems[right].question);
    if (similarity > 0.82) {
      addFailure("near-duplicate gate", `${allItems[left].id} and ${allItems[right].id} score ${similarity.toFixed(3)} (> 0.82)`);
    }
  }
}

if (failures.length) {
  console.error(`Question-bank validation failed with ${failures.length} issue(s):\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Question-bank schema and duplicate validation passed: ${allItems.length} items across ${banks.length} banks.`);
  for (const bank of banks) {
    const count = JSON.parse(fs.readFileSync(path.join(contentRoot, bank.id, "items.json"), "utf8")).length;
    console.log(`${bank.id}: ${count}/${bank.minimum} minimum; count threshold remains a reported content gate, not a relaxed validator target.`);
  }
}
