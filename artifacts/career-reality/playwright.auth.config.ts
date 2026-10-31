import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "auth-deferral.spec.ts",
  fullyParallel: true,
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    browserName: "chromium",
    launchOptions: { executablePath: "/repl/tools/bin/chromium" },
  },
  webServer: {
    command: "VITE_E2E=false VITE_E2E_AUTH_RUNTIME=true VITE_API_PROXY_TARGET=http://127.0.0.1:8080 PORT=4174 BASE_PATH=/ pnpm exec vite --config vite.config.ts --host 0.0.0.0",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
