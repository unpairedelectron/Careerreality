import { expect, test } from "@playwright/test";

// Keep the accepted "good" CLS ceiling from the original hydration check.
// Sum every unexpected shift from initial HTML through hydration (no scrolling
// or clicks), rather than allowing separate CLS session windows to hide shifts.
const MAX_HYDRATION_CLS = 0.1;

type Shift = {
  value: number;
  startTime: number;
  sources: Array<{ node: string; previousRect: unknown; currentRect: unknown }>;
};

declare global {
  interface Window {
    __homepageShifts: {
      supported: boolean;
      entries: Shift[];
      flush: () => void;
    };
  }
}

// This spec belongs only to the dedicated production config; ordinary dev
// coverage cannot exercise the static HTML -> React replacement.
test.skip(!process.env.PLAYWRIGHT_HYDRATION, "Run test:e2e:homepage-hydration:production.");

for (const deliberateShift of [false, true]) {
  test(deliberateShift
    ? "measurement detects a deliberate first-screen layout shift"
    : "mobile homepage stays within CLS budget from snapshot through hydration",
  async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      localStorage.removeItem("career-reality-theme");
      const entries: Shift[] = [];
      const supported = PerformanceObserver.supportedEntryTypes.includes("layout-shift");
      const record = (records: PerformanceEntry[]) => {
        for (const entry of records as Array<PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
          sources?: Array<{ node?: Node; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }>;
        }>) {
          if (entry.hadRecentInput) continue;
          entries.push({
            value: entry.value,
            startTime: entry.startTime,
            sources: (entry.sources ?? []).map((source) => ({
              node: source.node instanceof Element
                ? `${source.node.tagName}.${source.node.className}`
                : source.node?.nodeName ?? "removed node",
              previousRect: source.previousRect.toJSON(),
              currentRect: source.currentRect.toJSON(),
            })),
          });
        }
      };
      const observer = new PerformanceObserver((list) => record(list.getEntries()));
      if (supported) observer.observe({ type: "layout-shift", buffered: true });
      window.__homepageShifts = {
        supported,
        entries,
        flush: () => record(observer.takeRecords()),
      };
    });

    // Hold only the React entry, not HTML, CSS or fonts. This guarantees a
    // painted static state even on fast runners without modifying app timers.
    let releaseClient!: () => void;
    const clientGate = new Promise<void>((resolve) => { releaseClient = resolve; });
    await page.route(/\/assets\/client-entry-[\w-]+\.js(?:\?.*)?$/, async (route) => {
      await clientGate;
      await route.continue();
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      const response = await page.goto("/", { waitUntil: "commit" });
      expect(response?.status()).toBe(200);
      expect(await page.evaluate(() => window.__homepageShifts.supported),
        "Chromium must support layout-shift observation; missing data is not zero CLS").toBe(true);
      await expect(page.locator("#root .snapshot-home")).toBeVisible();
      await expect(page.locator("#root .home-page")).toHaveCount(0);
      await expect.poll(() => page.evaluate(() =>
        performance.getEntriesByName("first-contentful-paint").length)).toBe(1);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      });
      // RAF callbacks run before paint. Also outlast Chromium's initial
      // viewport-resize exclusion window before applying the control shift.
      await page.waitForTimeout(1_000);

      if (deliberateShift) {
        await page.evaluate(async () => {
          const heading = document.querySelector<HTMLElement>(".snapshot-home h1")!;
          heading.style.marginTop = "350px";
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        await page.waitForTimeout(250);
      }

      releaseClient();
      await expect(page.locator("#root .snapshot-home")).toHaveCount(0);
      await expect(page.locator("#root .home-page")).toBeVisible();
      await expect(page.getByTestId("button-mobile-menu")).toBeVisible();
      await expect(page.getByRole("heading", { name: /Make your next move/ })).toBeVisible();
      // Fixed observation tail includes late fonts/CSS and post-mount effects.
      // There is deliberately no input/scroll that could exclude a shift.
      await page.waitForTimeout(3_000);
      const result = await page.evaluate(() => {
        window.__homepageShifts.flush();
        const entries = window.__homepageShifts.entries;
        return {
          cumulativeLayoutShift: entries.reduce((sum, entry) => sum + entry.value, 0),
          entries,
          scrollY: window.scrollY,
        };
      });
      await testInfo.attach("homepage-hydration-cls.json", {
        body: JSON.stringify({ budget: MAX_HYDRATION_CLS, deliberateShift, ...result }, null, 2),
        contentType: "application/json",
      });
      expect(errors).toEqual([]);
      expect(result.scrollY).toBe(0);
      const diagnostic = `Homepage hydration CLS ${result.cumulativeLayoutShift}; budget ${MAX_HYDRATION_CLS}. See homepage-hydration-cls.json for shifted elements.`;
      if (deliberateShift) {
        expect(result.cumulativeLayoutShift, diagnostic).toBeGreaterThan(MAX_HYDRATION_CLS);
      } else {
        expect(result.cumulativeLayoutShift, diagnostic).toBeLessThanOrEqual(MAX_HYDRATION_CLS);
      }
    } finally {
      releaseClient();
    }
  });
}
