// Renders the CareerReality PNG brand assets from the same mark used in the site header.
// Usage: node scripts/brand/render-logo.mjs
import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const font = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, "public/fonts", file)).toString("base64")}`;
const TEAL = "#1f716a";
const TEAL_DEEP = "#175a54";
const CREAM = "#f5f8f2";
const LEAF = "#e9d9b7";

// Tile geometry mirrors .cr-brand-mark: border-radius 8 8 8 2 on a 32px square.
const mark = (size) => {
  const r = size * 0.25;
  const rs = size * 0.0625;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stop-color="${TEAL}"/><stop offset="1" stop-color="${TEAL_DEEP}"/></linearGradient></defs>
  <path d="M128 0H384A128 128 0 0 1 512 128V384A128 128 0 0 1 384 512H32A32 32 0 0 1 0 480V128A128 128 0 0 1 128 0Z" fill="url(#g)"/>
  <text x="250" y="318" text-anchor="middle" fill="${CREAM}" font-family="DM Mono, ui-monospace, monospace" font-weight="500" font-size="200" letter-spacing="-16">CR</text>
  <path d="M392 150c-4-38 18-62 56-64 3 38-19 62-56 64Z" fill="${LEAF}"/>
  <path d="M392 150c10-16 22-28 38-38" stroke="${TEAL_DEEP}" stroke-width="5" stroke-linecap="round" fill="none"/>
  <rect x="152" y="356" width="196" height="14" rx="7" fill="${LEAF}"/>
</svg>`.replace(/width="\d+" height="\d+" viewBox/, `width="${size}" height="${size}" viewBox`);
};

const page = (body, w, h, bg = "transparent") => `<!doctype html><html><head><style>
@font-face{font-family:'DM Mono';font-weight:500;src:url(${font("aFTR7PB1QTsUX8KYvumzEYOtbQ.woff2")}) format('woff2')}
@font-face{font-family:'Manrope';font-weight:800;src:url(${font("xn7gYHE41ni1AdIRggexSg.woff2")}) format('woff2')}
html,body{margin:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden}
.row{display:flex;align-items:center;gap:${Math.round(h * 0.16)}px;height:100%;padding:0 ${Math.round(h * 0.2)}px;box-sizing:border-box}
.word{font:800 ${Math.round(h * 0.34)}px/1 Manrope;letter-spacing:-.055em;color:#14201e}.word span{color:${TEAL}}
.dark .word{color:${CREAM}}.dark .word span{color:#7fd3c0}
</style></head><body>${body}</body></html>`;

const jobs = [
  { file: "logo.png", w: 512, h: 512, html: page(mark(512), 512, 512) },
  { file: "apple-touch-icon.png", w: 180, h: 180, html: page(mark(180), 180, 180, "#f3f1eb") },
  { file: "favicon-48.png", w: 48, h: 48, html: page(mark(48), 48, 48) },
  { file: "logo-wordmark.png", w: 1040, h: 300, html: page(`<div class="row">${mark(180)}<div class="word">Career<span>Reality</span></div></div>`, 1200, 300) },
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "msedge" });
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const p = await ctx.newPage();
for (const job of jobs) {
  await p.setViewportSize({ width: job.w, height: job.h });
  await p.setContent(job.html);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(root, "public", job.file), omitBackground: true });
  console.log("wrote public/" + job.file);
}
await browser.close();

// Keep the vector logo and favicon in step with the PNGs.
fs.writeFileSync(path.join(root, "public/logo.svg"), mark(512).replace(/width="512" height="512" /, ""));
fs.writeFileSync(path.join(root, "public/favicon.svg"), mark(180).replace(/width="180" height="180" /, 'width="180" height="180" '));
console.log("wrote public/logo.svg, public/favicon.svg");
