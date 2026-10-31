import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __careerRealityAuthCacheProbe?: {
      seed: () => void;
      read: () => unknown;
    };
  }
}

async function expectSignedIn(page: Page) {
  await expect(page.getByTestId("button-account-menu")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("button-account-menu").click();
  await expect(page.getByTestId("link-workspace")).toBeVisible();
  await page.keyboard.press("Escape");
}

test("real Clerk cross-tab sign-out clears Compass cache and protected access", async ({
  page,
  context,
}) => {
  test.setTimeout(45_000);

  await context.route("**/api/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Test data unavailable" }),
    }),
  );

  await page.goto("/compass");
  await expectSignedIn(page);

  const secondTab = await context.newPage();
  await secondTab.goto("/compass");
  await expectSignedIn(secondTab);

  await page.evaluate(() => window.__careerRealityAuthCacheProbe?.seed());
  await expect
    .poll(() => page.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBe("cached-user-data");

  await secondTab.getByTestId("button-account-menu").click();
  await secondTab.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(secondTab).toHaveURL(/\/$/);

  await expect(page.getByTestId("button-account-menu")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByTestId("link-sign-in")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBeUndefined();

  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/sign-in(?:\?.*)?$/);
  await expect(page.getByText("Welcome back", { exact: false }).first()).toBeVisible();

  await secondTab.close();
});
