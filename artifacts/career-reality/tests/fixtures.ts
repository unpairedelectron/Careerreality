import { expect, test as base, type BrowserContext } from "@playwright/test";

type WorkerFixtures = {
  workerContext: BrowserContext;
};

export const test = base.extend<{}, WorkerFixtures>({
  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4174",
        viewport: { width: 1280, height: 720 },
      });
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],
  context: async ({ workerContext }, use) => {
    await workerContext.clearCookies();
    await use(workerContext);
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await page.addInitScript(() => {
      if (window.name !== "__playwright_test_page__") {
        localStorage.clear();
        sessionStorage.clear();
        window.name = "__playwright_test_page__";
      }
    });
    const navigate = page.goto.bind(page);
    page.goto = (url, options = {}) =>
      navigate(url, { waitUntil: "domcontentloaded", ...options });
    await use(page);
    await page.close();
  },
});

export { expect };
