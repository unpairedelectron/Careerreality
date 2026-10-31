import { expect, test } from "@playwright/test";

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

test.describe("deferred Clerk auth regression coverage", () => {
  for (const route of immediateAuthRoutes) {
    test(`initializes the auth runtime immediately for ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 4_500 });

      await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
      await expect(page).toHaveURL(new RegExp(`${route.loadedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));
      await expect(page.getByText(route.marker, { exact: false }).first()).toBeVisible();
    });
  }

  test("redirects signed-in homepage visitors only after auth finishes loading", async ({ page }) => {
    await page.goto("/?__e2e_user=first-user");
    await expect(page.getByTestId("e2e-clerk-runtime-ready")).toBeAttached({ timeout: 9_000 });
    await expect(page).toHaveURL(/\/\?__e2e_user=first-user$/);
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Test data unavailable" }) }),
    );

    await page.evaluate(() => window.__careerRealityAuthTest?.loadAuth());
    await expect(page).toHaveURL(/\/compass\/?$/, { timeout: 5_000 });
    await expect(page.getByTestId("button-account-menu")).toBeVisible();
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
});
