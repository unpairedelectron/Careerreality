import fs from "node:fs";
import path from "node:path";
import { getSiteUrl } from "./seo-site-url.mjs";
import { renderLlmsGuide } from "./lib/llms-guide.mjs";

const root = path.resolve(import.meta.dirname, "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "src/data/route-registry.json"), "utf8"));
const expected = renderLlmsGuide(registry, getSiteUrl());
const check = process.argv.includes("--check");
const target = path.join(root, process.argv.includes("--dist") ? "dist/public/llms.txt" : "public/llms.txt");
if (check) {
  if (fs.readFileSync(target, "utf8") !== expected) {
    throw new Error(`AI crawler guidance is out of sync with the route registry: ${target}. Run generate-llms-guide.mjs and rebuild.`);
  }
  console.log("Verified AI crawler guidance against the route registry.");
} else {
  fs.writeFileSync(target, expected);
}
