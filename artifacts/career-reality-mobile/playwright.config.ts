// This config is executed by the web artifact's Playwright dependency.
// It is excluded from the Expo app typecheck.
// @ts-nocheck
import playwright from '../career-reality/node_modules/@playwright/test';

const { defineConfig, devices } = playwright;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.MOBILE_PREVIEW_URL ?? 'http://127.0.0.1:19912',
    ...devices['Desktop Chrome'],
    launchOptions: {
      executablePath: '/repl/tools/bin/chromium',
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  timeout: 30_000,
});