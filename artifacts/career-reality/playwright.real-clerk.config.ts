import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const storageStatePath = process.env.PLAYWRIGHT_CLERK_STORAGE_STATE;

if (!storageStatePath) {
  throw new Error(
    "Set PLAYWRIGHT_CLERK_STORAGE_STATE to a local Playwright state file for a real signed-in Clerk test account.",
  );
}

const storageState = resolve(storageStatePath);
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const statePathFromWorkspace = relative(workspaceRoot, storageState);
if (!statePathFromWorkspace.startsWith("..") && !statePathFromWorkspace.startsWith("/")) {
  throw new Error("Keep the signed-in Playwright state file outside the workspace.");
}
if (!existsSync(storageState)) {
  throw new Error("The configured local Playwright state file does not exist.");
}

export default defineConfig({
  testDir: "./tests",
  testMatch: "real-clerk-cross-tab.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4174",
    storageState,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    browserName: "chromium",
    launchOptions: { executablePath: "/repl/tools/bin/chromium" },
  },
  webServer: {
    command:
      "VITE_E2E=false VITE_E2E_AUTH_RUNTIME=false VITE_E2E_AUTH_CACHE_PROBE=true VITE_API_PROXY_TARGET=http://127.0.0.1:8080 PORT=4174 BASE_PATH=/ pnpm exec vite --config vite.config.ts --host 0.0.0.0",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
