import { defineConfig, devices } from "@playwright/test";

// A real post-build snapshot is required; Vite dev serves an empty root.
export default defineConfig({
  testDir: "./tests",
  testMatch: "homepage-hydration.spec.ts",
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ["list"],
    ["json", { outputFile: "../../generated-artifacts/homepage-hydration-results.json" }],
  ],
  outputDir: "../../generated-artifacts/homepage-hydration",
  use: {
    baseURL: "http://127.0.0.1:4174",
    ...devices["Pixel 7"],
    viewport: { width: 402, height: 874 },
    browserName: "chromium",
    launchOptions: { executablePath: "/repl/tools/bin/chromium" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "PORT=4174 BASE_PATH=/ pnpm exec vite preview --config vite.config.ts --host 0.0.0.0",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
