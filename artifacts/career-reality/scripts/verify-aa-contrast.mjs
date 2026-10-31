import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(await import("node:fs/promises").then(({ readFile }) =>
  readFile(path.join(root, "src/data/route-registry.json"), "utf8"),
));
const routes = [...new Set(registry.routes
  .filter((route) => route.path === "/" || route.kind === "tool" || route.kind === "guide")
  .map((route) => route.path))];
const routesToCheck = process.env.CONTRAST_ROUTE
  ? routes.filter((route) => route === process.env.CONTRAST_ROUTE)
  : routes;
if (process.env.CONTRAST_ROUTE && routesToCheck.length === 0) {
  throw new Error(`Unknown contrast route: ${process.env.CONTRAST_ROUTE}`);
}
const port = Number(process.env.CONTRAST_PORT || 4178);
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/serve-published.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: String(port), BASE_PATH: "/" },
  stdio: "ignore",
});
let browser;

try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) { ready = true; break; }
    } catch { /* wait for the local preview server */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error("Built app did not start for the contrast audit.");

  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let skippedImageBackgroundTexts = 0;
  const settleVisuals = async () => {
    await page.evaluate(async () => {
      const active = document.getAnimations({ subtree: true }).filter((animation) => {
        const iterations = animation.effect?.getComputedTiming().iterations;
        return animation.playState === "running" && Number.isFinite(iterations);
      });
      await Promise.race([
        Promise.allSettled(active.map((animation) => animation.finished)),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    });
  };
  const failures = [];
  for (const route of routesToCheck) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    if (!response?.ok()) {
      failures.push(`${route}: page returned ${response?.status() ?? "no response"}`);
      continue;
    }
    try {
      await page.waitForFunction(
        () => !document.body.innerText.includes("Loading page…"),
        null,
        { timeout: 15_000 },
      );
    } catch {
      failures.push(`${route}: application did not finish rendering before the contrast check.`);
      continue;
    }
    await settleVisuals();
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    for (const theme of ["light", "dark"]) {
      if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
      await settleVisuals();
      await page.waitForTimeout(100);
      const results = await page.evaluate(() => {
        const parse = (value) => {
          const match = value.match(/rgba?\(([^)]+)\)/i);
          if (!match) return null;
          const values = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
          return [values[0], values[1], values[2], values[3] ?? 1];
        };
        const over = (front, back) => {
          const alpha = front[3];
          return [
            front[0] * alpha + back[0] * (1 - alpha),
            front[1] * alpha + back[1] * (1 - alpha),
            front[2] * alpha + back[2] * (1 - alpha),
            1,
          ];
        };
        const luminance = ([r, g, b]) => {
          const channel = (value) => {
            const v = value / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        };
        const ratio = (a, b) => {
          const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
          return (values[0] + 0.05) / (values[1] + 0.05);
        };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const failures = [];
        let skippedImageBackgroundTexts = 0;
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const text = node.textContent?.trim();
          const element = node.parentElement;
          if (!text || !element || element.closest("svg,[aria-hidden='true'],[hidden]")) continue;
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const ancestors = [];
          for (let current = element; current; current = current.parentElement) ancestors.push(current);
          if (ancestors.some((ancestor) => getComputedStyle(ancestor).backgroundImage !== "none")) {
            skippedImageBackgroundTexts += 1;
            continue;
          }
          const style = getComputedStyle(element);
          if (style.visibility === "hidden" || style.display === "none") continue;
          let background = [255, 255, 255, 1];
          for (const ancestor of ancestors.reverse()) {
            const color = parse(getComputedStyle(ancestor).backgroundColor);
            if (color && color[3] > 0) background = over(color, background);
          }
          const foreground = parse(style.color);
          if (!foreground) continue;
          const opacity = ancestors.reduce((value, ancestor) => value * Number.parseFloat(getComputedStyle(ancestor).opacity || "1"), 1);
          foreground[3] *= opacity;
          const visibleForeground = over(foreground, background);
          const size = Number.parseFloat(style.fontSize);
          const weight = Number.parseInt(style.fontWeight, 10) || 400;
          const large = size >= 24 || (size >= 18.66 && weight >= 700);
          const measured = ratio(visibleForeground, background);
          if (measured < (large ? 3 : 4.5)) {
            failures.push({
              text: text.slice(0, 72),
              ratio: Number(measured.toFixed(2)),
              required: large ? 3 : 4.5,
              foreground: style.color,
              background: `rgb(${background.slice(0, 3).join(", ")})`,
            });
          }
        }
        return { failures: failures.slice(0, 20), skippedImageBackgroundTexts };
      });
      skippedImageBackgroundTexts += results.skippedImageBackgroundTexts;
      failures.push(...results.failures.map((item) => `${route} [${theme}] ${item.ratio}:1 < ${item.required}:1 (${item.foreground} on ${item.background}) — ${item.text}`));
    }
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
  }
  await browser.close();
  browser = undefined;
  console.log(`Checked AA text contrast in light and dark modes on ${routesToCheck.length} routes.`);
  console.log(`Skipped ${skippedImageBackgroundTexts} text nodes over CSS gradients or images; solid-color text was audited.`);
  if (failures.length) {
    console.error(failures.slice(0, 80).join("\n"));
    console.error(`${failures.length} contrast or route failures.`);
    process.exitCode = 1;
  } else {
    console.log("All sampled visible text meets WCAG AA contrast thresholds.");
  }
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
