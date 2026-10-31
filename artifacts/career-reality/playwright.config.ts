import { defineConfig, devices } from "@playwright/test";

const productionCheck = process.env.PLAYWRIGHT_PRODUCTION === "true";
const publishedCheck = process.env.PLAYWRIGHT_PUBLISHED === "true";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4174";
const requestedBrowser = process.env.PLAYWRIGHT_BROWSER;
const browserName = requestedBrowser === "firefox" || requestedBrowser === "webkit"
  ? requestedBrowser
  : "chromium";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    browserName,
    launchOptions: browserName === "chromium"
      ? { executablePath: "/repl/tools/bin/chromium" }
      : undefined,
  },
  ...(publishedCheck
    ? {}
    : {
        webServer: {
          command: productionCheck
            ? "PORT=4174 BASE_PATH=/ pnpm exec vite preview --config vite.config.ts --host 0.0.0.0"
            : "VITE_E2E=true VITE_JOB_LINK_FETCH_ENABLED=true VITE_API_PROXY_TARGET=http://127.0.0.1:8080 PORT=4174 BASE_PATH=/ pnpm exec vite --config vite.config.ts --host 0.0.0.0",
          url: "http://127.0.0.1:4174",
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }),
});