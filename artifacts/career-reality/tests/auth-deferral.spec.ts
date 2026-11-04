import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __careerRealityLayoutShiftTotal?: number;
    __careerRealityAuthTest?: {
      loadAuth: () => void;
      setUser: (userId: string | null) => void;
      seedCache: () => void;
      cachedValue: () => unknown;
      readQueryData: (queryKey: readonly unknown[]) => unknown;
      startWorkspaceQuery: () => Promise<unknown>;
    };
  }
}

const immediateAuthRoutes = [
  { path: "/sign-in", loadedPath: "/sign-in", marker: "Welcome back" },
  { path: "/sign-up", loadedPath: "/sign-up", marker: "Build your career advantage." },
  { path: "/workspace", loadedPath: "/sign-in", marker: "Sign in" },
  {
    path: "/admin/application-readiness",
    loadedPath: "/sign-in?redirect_url=%2Fadmin%2Fapplication-readiness",
    marker: "Welcome back",
  },
];

const publicAuthDeferralRoutes = [
  { path: "/", name: "homepage" },
  { path: "/salary-calculator", name: "salary calculator" },
  { path: "/guides/offer-letter-red-flags-india", name: "guide" },
  { path: "/layoffs", name: "layoff hub" },
];

function trackClerkRuntimeRequests(page: Page): number[] {
  const requestTimes: number[] = [];
  page.on("request", (request) => {
    if (request.url().includes("clerk-runtime-test")) requestTimes.push(Date.now());
  });
  return requestTimes;
}

test.describe("deferred Clerk auth regression coverage", () => {
  test("production build reload recovers after the Clerk chunk becomes available", async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_AUTH_PRODUCTION !== "true",
      "Recovery after a hashed Clerk chunk failure is checked against the production build.",
    );

    const clerkChunkPattern = /\/assets\/clerk-runtime-test-[\w-]+\.js(?:\?.*)?$/;
    let failedChunks = 0;
    const clerkChunkRequests: string[] = [];
    const availableChunkResponses: string[] = [];
    page.on("request", (request) => {
      if (clerkChunkPattern.test(new URL(request.url()).pathname)) {
        clerkChunkRequests.push(request.url());
      }
    });
    page.on("response", (response) => {
      if (
        clerkChunkPattern.test(new URL(response.url()).pathname) &&
        response.ok()
      ) {
        availableChunkResponses.push(response.url());
      }
    });
    await page.route(clerkChunkPattern, async (route) => {
      failedChunks += 1;
      await route.abort();
    });

    await page.goto("/workspace/");
    await expect(page.getByRole("alert")).toContainText(
      "Sign-in could not be loaded. Check your connection and reload this page.",
    );
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Your Desk" })).toHaveCount(0);
    expect(failedChunks).toBe(1);
    expect(clerkChunkRequests).toHaveLength(1);

    await page.unroute(clerkChunkPattern);
    const pageReloaded = page.waitForEvent("load");
    const clerkChunkRecovered = page.waitForResponse((response) =>
      clerkChunkPattern.test(new URL(response.url()).pathname) && response.ok(),
    );
    await page.getByRole("button", { name: "Reload page" }).click();
    await Promise.all([pageReloaded, clerkChunkRecovered]);
    expect(clerkChunkRequests).toHaveLength(2);
    expect(availableChunkResponses).toHaveLength(1);
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Your Desk" })).toHaveCount(0);
    await expect(page.getByText("Private area / catalog desk")).toHaveCount(0);
    await page.goto("/sign-in/");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("production build keeps public pages free of Clerk chunks until protected navigation", async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_AUTH_PRODUCTION !== "true",
      "Hashed Clerk chunk requests are checked against the production build.",
    );

    const clerkChunkPattern = /\/assets\/clerk-runtime-test-[\w-]+\.js(?:\?.*)?$/;
    const clerkRequests: string[] = [];
    page.on("request", (request) => {
      if (clerkChunkPattern.test(new URL(request.url()).pathname)) {
        clerkRequests.push(request.url());
      }
    });

    for (const route of publicAuthDeferralRoutes) {
      const response = await page.goto(route.path);
      expect(response?.status(), `public ${route.name} route should load`).toBe(200);
      await expect(page.locator("body")).toBeVisible();
      await page.waitForTimeout(1_000);
      expect(clerkRequests, `public ${route.name} should not request Clerk`).toHaveLength(0);
    }

    const clerkChunkResponse = page.waitForResponse(
      (response) =>
        clerkChunkPattern.test(new URL(response.url()).pathname) && response.ok(),
    );
    await page.goto("/compass?__e2e_user=first-user");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached();
    await clerkChunkResponse;
    expect(clerkRequests).toHaveLength(1);
    expect(new URL(clerkRequests[0]).pathname).toMatch(
      /^\/assets\/clerk-runtime-test-[\w-]+\.js$/,
    );
  });

  test("production build keeps account-menu chunk failures local and offers reload recovery", async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_AUTH_PRODUCTION !== "true",
      "The hashed account-menu chunk is checked against the production build.",
    );

    const accountChunkPattern = /\/assets\/account-menu-[\w-]+\.js(?:\?.*)?$/;
    let failedChunks = 0;
    await page.route(accountChunkPattern, async (route) => {
      failedChunks += 1;
      await route.abort();
    });

    await page.goto("/compass?__e2e_user=first-user");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached();
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page.getByRole("alert")).toContainText("Account menu could not be loaded.");
    await expect(page.getByRole("heading", { name: /Make the next move/ })).toBeVisible();
    expect(failedChunks).toBe(1);

    await page.unroute(accountChunkPattern);
    await page.getByRole("button", { name: "Reload page" }).click();
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached();
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page.getByTestId("button-account-menu")).toBeVisible();
  });

  test("production build keeps unused route chunks off the mobile homepage", async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_AUTH_PRODUCTION !== "true",
      "Production chunk boundaries are checked against the production build.",
    );
    await page.setViewportSize({ width: 402, height: 874 });

    const scriptRequests: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script" && new URL(request.url()).pathname.includes("/assets/")) {
        scriptRequests.push(new URL(request.url()).pathname);
      }
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Make your next move/ })).toBeVisible();
    await page.waitForTimeout(1_000);

    const initialRequests = [...scriptRequests];
    expect(initialRequests.join("\n")).not.toMatch(
      /account-menu|clerk-runtime|query-runtime|registered-routes|compass|workspace|sign-in/i,
    );
    await page.getByTestId("button-mobile-menu").click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Sign in" }),
    ).toBeVisible();
    await page.getByTestId("button-mobile-menu").click();
    await page.getByTestId("home-below-fold-trigger").scrollIntoViewIfNeeded();
    await expect.poll(() => scriptRequests.length).toBeGreaterThan(initialRequests.length);
    await expect(page.getByTestId("form-home-ctc")).toBeVisible();
  });

  test("production build keeps mobile homepage hydration layout shift within budget", async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_AUTH_PRODUCTION !== "true",
      "Hydration layout shift is checked against the production build.",
    );
    await page.setViewportSize({ width: 402, height: 874 });
    await page.addInitScript(() => {
      window.__careerRealityLayoutShiftTotal = 0;
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!entry.hadRecentInput) {
            window.__careerRealityLayoutShiftTotal =
              (window.__careerRealityLayoutShiftTotal ?? 0) + (entry.value ?? 0);
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Make your next move/ })).toBeVisible();
    await page.waitForTimeout(3_000);
    const cumulativeLayoutShift = await page.evaluate(
      () => window.__careerRealityLayoutShiftTotal ?? 0,
    );
    expect(cumulativeLayoutShift).toBeLessThanOrEqual(0.1);
  });

  test("production build fails closed when its deferred Clerk chunk cannot load", async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_AUTH_PRODUCTION !== "true",
      "The hashed Clerk chunk is checked against the production build.",
    );

    const failedClerkChunks: string[] = [];
    await page.route(/\/assets\/clerk-runtime-test-[\w-]+\.js(?:\?.*)?$/, async (route) => {
      failedClerkChunks.push(route.request().url());
      await route.abort();
    });

    await page.goto("/workspace/");
    await expect(page.getByRole("alert")).toContainText(
      "Sign-in could not be loaded. Check your connection and reload this page.",
    );
    await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Desk" })).toHaveCount(0);
    await expect(page.getByText("Private area / catalog desk")).toHaveCount(0);
    expect(failedClerkChunks).toHaveLength(1);
    expect(new URL(failedClerkChunks[0]).pathname).toMatch(
      /^\/assets\/clerk-runtime-test-[\w-]+\.js$/,
    );
  });

  test("keeps workspace and catalog review hidden when the Clerk runtime fails to load", async ({ page }) => {
    let failedRuntimeImports = 0;
    await page.route("**/*clerk-runtime-test*", async (route) => {
      failedRuntimeImports += 1;
      await route.abort();
    });

    const protectedRoutes = ["/workspace", "/workspace/catalog"];
    for (const [index, path] of protectedRoutes.entries()) {
      await page.goto(path);
      const failureMessage = page.getByRole("alert");
      await expect(failureMessage).toContainText(
        "Sign-in could not be loaded. Check your connection and reload this page.",
      );
      await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Your Desk" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Review what is missing." })).toHaveCount(0);
      await expect(page.getByText("Private area / catalog desk")).toHaveCount(0);
      expect(failedRuntimeImports).toBe(index + 1);
    }
  });

  for (const route of [
    { path: "/compass", protectedHeading: /Make the next move/ },
    { path: "/pro", protectedHeading: "Membership is not available in this release candidate." },
    { path: "/admin/application-readiness", protectedHeading: "Application readiness" },
  ]) {
    test(`keeps ${route.path} hidden when the Clerk runtime fails to load`, async ({ page }) => {
      let failedRuntimeImports = 0;
      await page.route("**/*clerk-runtime-test*", async (requestRoute) => {
        failedRuntimeImports += 1;
        await requestRoute.abort();
      });

      await page.goto(route.path);
      await expect(page.getByRole("alert")).toContainText(
        "Sign-in could not be loaded. Check your connection and reload this page.",
      );
      await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible();
      await expect(page.getByRole("heading", { name: route.protectedHeading })).toHaveCount(0);
      expect(failedRuntimeImports).toBe(1);
    });
  }

  for (const route of publicAuthDeferralRoutes) {
    test(`defers Clerk runtime requests on the public ${route.name}`, async ({ page }) => {
      const clerkRuntimeRequestTimes = trackClerkRuntimeRequests(page);

      await page.goto(route.path);
      await expect(page.locator("body")).toBeVisible();
      await page.waitForTimeout(1_000);
      expect(clerkRuntimeRequestTimes).toHaveLength(0);

      await page.waitForTimeout(5_000);
      expect(clerkRuntimeRequestTimes).toHaveLength(0);
      await expect(page.getByTestId("e2e-clerk-runtime-ready")).toHaveCount(0);
    });
  }

  for (const route of immediateAuthRoutes) {
    test(`initializes the auth runtime immediately for ${route.path}`, async ({ page }) => {
      const clerkRuntimeRequestTimes = trackClerkRuntimeRequests(page);
      const navigationStartedAt = Date.now();

      await page.goto(route.path);
      await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 4_500 });
      expect(clerkRuntimeRequestTimes).toHaveLength(1);
      expect(clerkRuntimeRequestTimes[0] - navigationStartedAt).toBeLessThan(5_000);

      await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
      await expect(page).toHaveURL(new RegExp(`${route.loadedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));
      await expect(page.getByText(route.marker, { exact: false }).first()).toBeVisible();
    });
  }

  test("keeps public pages auth-deferred until a visitor requests a protected route", async ({ page }) => {
    let runtimeImports = 0;
    await page.route("**/*clerk-runtime-test*", async (route) => {
      runtimeImports += 1;
      await route.continue();
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Make your next move/ })).toBeVisible();
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toHaveCount(0);
    expect(runtimeImports).toBe(0);

    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Test data unavailable" }) }),
    );
    await page.evaluate(() => {
      window.history.pushState({}, "", "/compass?__e2e_user=first-user");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 4_500 });
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page.getByTestId("button-account-menu")).toBeVisible();
    expect(runtimeImports).toBe(1);
    await page.evaluate(() => {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page).toHaveURL(/\/compass\/?$/, { timeout: 5_000 });
  });

  test("loads auth when a visitor opens sign-in from a public page", async ({ page }) => {
    let runtimeImports = 0;
    await page.route("**/*clerk-runtime-test*", async (route) => {
      runtimeImports += 1;
      await route.continue();
    });

    await page.goto("/");
    await expect(page.getByTestId("link-sign-in")).toBeVisible();
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toHaveCount(0);
    await page.getByTestId("link-sign-in").click();
    await expect(page).toHaveURL(/\/sign-in\/?$/);
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 4_500 });
    expect(runtimeImports).toBe(1);
  });

  test("sign-out and user changes clear the signed-in query cache", async ({ page }) => {
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Test data unavailable" }) }),
    );
    await page.goto("/compass?__e2e_user=first-user");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page.getByTestId("button-account-menu")).toBeVisible();

    await page.evaluate(() => window.__careerRealityAuthTest?.seedCache());
    await page.getByTestId("button-account-menu").click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => window.__careerRealityAuthTest?.cachedValue())).toBeUndefined();

    await page.evaluate(() => window.__careerRealityAuthTest?.seedCache());
    await page.evaluate(() => window.__careerRealityAuthTest?.setUser("second-user"));
    await expect(page).toHaveURL(/\/compass\/?$/);
    await expect.poll(() => page.evaluate(() => window.__careerRealityAuthTest?.cachedValue())).toBeUndefined();
  });

  test("clears cached Compass data when another tab switches or signs out", async ({ page }) => {
    await page.context().route("**/api/**", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Test data unavailable" }) }),
    );
    expect(await page.evaluate(() => typeof BroadcastChannel)).toBe("function");
    await page.goto("/compass?__e2e_user=first-user");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page.getByTestId("button-account-menu")).toBeVisible();

    const secondTab = await page.context().newPage();
    await secondTab.goto("/compass?__e2e_user=first-user");
    await expect(secondTab.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(secondTab.getByTestId("button-account-menu")).toBeVisible();

    await page.evaluate(() => window.__careerRealityAuthTest?.seedCache());
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.setUser("second-user"));
    await expect.poll(() => page.evaluate(() => window.__careerRealityAuthTest?.cachedValue())).toBeUndefined();

    await page.evaluate(() => window.__careerRealityAuthTest?.seedCache());
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.setUser(null));
    await expect.poll(() => page.evaluate(() => window.__careerRealityAuthTest?.cachedValue())).toBeUndefined();
    await secondTab.close();
  });

  test("clears cached Compass data across tabs without BroadcastChannel", async ({ page }) => {
    await page.context().addInitScript(() => {
      Object.defineProperty(window, "BroadcastChannel", {
        configurable: true,
        value: undefined,
      });
    });
    await page.context().route("**/api/**", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Test data unavailable" }) }),
    );
    await page.goto("/compass?__e2e_user=first-user");
    expect(await page.evaluate(() => typeof BroadcastChannel)).toBe("undefined");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page.getByTestId("button-account-menu")).toBeVisible();

    const secondTab = await page.context().newPage();
    await secondTab.goto("/compass?__e2e_user=first-user");
    expect(await secondTab.evaluate(() => typeof BroadcastChannel)).toBe("undefined");
    await expect(secondTab.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(secondTab.getByTestId("button-account-menu")).toBeVisible();

    await page.evaluate(() => window.__careerRealityAuthTest?.seedCache());
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.setUser("second-user"));
    await expect.poll(() => page.evaluate(() => window.__careerRealityAuthTest?.cachedValue())).toBeUndefined();

    await page.evaluate(() => window.__careerRealityAuthTest?.seedCache());
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.setUser(null));
    await expect.poll(() => page.evaluate(() => window.__careerRealityAuthTest?.cachedValue())).toBeUndefined();
    await secondTab.close();
  });

  test("does not restore in-flight Compass or workspace data after another tab switches accounts", async ({
    page,
    context,
  }) => {
    let releaseSalaryResponse!: () => void;
    let releaseWorkspaceResponse!: () => void;
    let markSalaryStarted!: () => void;
    let markWorkspaceStarted!: () => void;
    let markSalaryResponseSent!: () => void;
    let markWorkspaceResponseSent!: () => void;
    const salaryResponseGate = new Promise<void>((resolve) => {
      releaseSalaryResponse = resolve;
    });
    const workspaceResponseGate = new Promise<void>((resolve) => {
      releaseWorkspaceResponse = resolve;
    });
    const salaryRequestStarted = new Promise<void>((resolve) => {
      markSalaryStarted = resolve;
    });
    const workspaceRequestStarted = new Promise<void>((resolve) => {
      markWorkspaceStarted = resolve;
    });
    const salaryResponseSent = new Promise<void>((resolve) => {
      markSalaryResponseSent = resolve;
    });
    const workspaceResponseSent = new Promise<void>((resolve) => {
      markWorkspaceResponseSent = resolve;
    });

    await context.route("**/api/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/api/public/salary-benchmarks") {
        markSalaryStarted();
        await salaryResponseGate;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ marker: "old-user-compass-response" }),
        });
        markSalaryResponseSent();
        return;
      }
      if (pathname === "/api/workspace/summary") {
        markWorkspaceStarted();
        await workspaceResponseGate;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ marker: "old-user-workspace-response" }),
        });
        markWorkspaceResponseSent();
        return;
      }
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Test data unavailable" }),
      });
    });

    await page.goto("/compass?__e2e_user=first-user");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page.getByTestId("button-account-menu")).toBeVisible();
    await salaryRequestStarted;

    const workspaceQuery = page.evaluate(() => window.__careerRealityAuthTest?.startWorkspaceQuery());
    await workspaceRequestStarted;

    const secondTab = await context.newPage();
    await secondTab.goto("/sign-in?__e2e_user=first-user");
    await expect(secondTab.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.setUser("second-user"));

    const salaryQueryKey = [
      "/api/public/salary-benchmarks",
      { role: "Software engineer", city: "Bengaluru", experienceBand: "5–8 years" },
    ] as const;
    const workspaceQueryKey = ["/api/workspace/summary"] as const;
    await expect
      .poll(() =>
        page.evaluate(
          ({ salaryKey, workspaceKey }) => ({
            salary: window.__careerRealityAuthTest?.readQueryData(salaryKey),
            workspace: window.__careerRealityAuthTest?.readQueryData(workspaceKey),
          }),
          { salaryKey: salaryQueryKey, workspaceKey: workspaceQueryKey },
        ),
      )
      .toEqual({ salary: undefined, workspace: undefined });

    releaseSalaryResponse();
    releaseWorkspaceResponse();
    await workspaceQuery;
    await Promise.all([salaryResponseSent, workspaceResponseSent]);
    await expect
      .poll(() =>
        page.evaluate(
          ({ salaryKey, workspaceKey }) => ({
            salary: window.__careerRealityAuthTest?.readQueryData(salaryKey),
            workspace: window.__careerRealityAuthTest?.readQueryData(workspaceKey),
          }),
          { salaryKey: salaryQueryKey, workspaceKey: workspaceQueryKey },
        ),
      )
      .toEqual({ salary: undefined, workspace: undefined });
    await secondTab.close();
  });

  test("does not show a workspace save that finishes after another tab switches accounts", async ({
    page,
    context,
  }) => {
    let releaseSave!: () => void;
    let markSaveStarted!: () => void;
    let markSaveResponseSent!: () => void;
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    const saveRequestStarted = new Promise<void>((resolve) => {
      markSaveStarted = resolve;
    });
    const saveResponseSent = new Promise<void>((resolve) => {
      markSaveResponseSent = resolve;
    });

    await context.route("**/api/**", async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname === "/api/saved-decisions" && request.method() === "POST") {
        markSaveStarted();
        await saveGate;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "late-old-user-decision",
            kind: "salary",
            title: "Old account decision",
            summary: "Should not enter the new account workspace.",
            signal: "Delayed save",
            createdAt: "2026-10-01T00:00:00.000Z",
          }),
        });
        markSaveResponseSent();
        return;
      }
      if (pathname === "/api/saved-decisions" && request.method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }
      if (pathname === "/api/watchlist" && request.method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }
      if (pathname === "/api/workspace/summary" && request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            savedDecisionCount: 0,
            watchlistCount: 0,
            latestDecision: null,
            latestWatchlistItem: null,
          }),
        });
        return;
      }
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Test data unavailable" }),
      });
    });

    await page.goto("/workspace?__e2e_user=first-user");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await page.getByTestId("tab-decisions").click();
    await page.getByTestId("button-new-decision").click();
    await page.getByPlaceholder("e.g. Acme Corp Offer").fill("Old account decision");
    await page.getByPlaceholder("e.g. +14% above market, strong pipeline").fill("Delayed save");
    await page.getByPlaceholder("What does this mean for your next move?").fill("Should not enter the new account workspace.");
    await page.getByRole("button", { name: "Save decision" }).click();
    await saveRequestStarted;

    const secondTab = await context.newPage();
    await secondTab.goto("/sign-in?__e2e_user=first-user");
    await expect(secondTab.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 3_000 });
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await secondTab.evaluate(() => window.__careerRealityAuthTest?.setUser("second-user"));
    await page.evaluate(() => window.__careerRealityAuthTest?.setUser("second-user"));

    await expect(page.getByText("No decisions recorded yet.")).toBeVisible();
    releaseSave();
    await saveResponseSent;

    await expect(page.getByText("Old account decision")).toHaveCount(0);
    await expect(page.getByText("Decision saved")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const decisions = window.__careerRealityAuthTest?.readQueryData(["/api/saved-decisions"]);
          const summary = window.__careerRealityAuthTest?.readQueryData(["/api/workspace/summary"]);
          return {
            decisions,
            summaryContainsOldSave: JSON.stringify(summary ?? "").includes("Old account decision"),
          };
        }),
      )
      .toEqual({
        decisions: [],
        summaryContainsOldSave: false,
      });

    await secondTab.close();
  });
});
