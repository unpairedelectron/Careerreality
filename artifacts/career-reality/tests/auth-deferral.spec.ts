import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __careerRealityAuthTest?: {
      loadAuth: () => void;
      setUser: (userId: string | null) => void;
      seedCache: () => void;
      cachedValue: () => unknown;
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
});
