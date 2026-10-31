import fs from "node:fs";
import path from "node:path";
import { getSiteUrl } from "./seo-site-url.mjs";

const root = path.resolve(import.meta.dirname, "..");
const indexPath = path.join(root, "dist", "public", "index.html");
const siteUrl = getSiteUrl();

if (!fs.existsSync(indexPath)) {
  throw new Error(`Built index not found at ${indexPath}`);
}

const html = fs.readFileSync(indexPath, "utf8").replaceAll("__SITE_URL__", siteUrl);
fs.writeFileSync(indexPath, html);