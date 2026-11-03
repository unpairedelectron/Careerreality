import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __careerRealityAuthCacheProbe?: {
      seed: () => void;
      read: () => unknown;
    };
  }
}

type ClerkBrowserSession = {
  id: string;
  userId: string;
};

type ClerkBrowserUser = {
  id: string;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
};

type ClerkBrowser = {
  client?: { sessions?: ClerkBrowserSession[] };
  user?: ClerkBrowserUser | null;
  setActive: (params: { session: string }) => Promise<void>;
};

function clerkIdentity(page: Page) {
  return page.evaluate(() => {
    const user = (window as Window & { Clerk?: ClerkBrowser }).Clerk?.user;
    return {
      id: user?.id,
      email: user?.primaryEmailAddress?.emailAddress,
      fullName: user?.fullName,
    };
  });
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

test("real Clerk account switching clears Compass cache in both tabs", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);

  let salaryRequests = 0;
  await context.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/public/salary-benchmarks") {
      salaryRequests += 1;
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Test data unavailable" }),
    });
  });

  await page.goto("/compass");
  await expectSignedIn(page);

  const secondTab = await context.newPage();
  await secondTab.goto("/compass");
  await expectSignedIn(secondTab);

  const originalSession = await page.evaluate(() => {
    const clerk = (window as Window & { Clerk?: ClerkBrowser }).Clerk;
    const userId = clerk?.user?.id;
    return clerk?.client?.sessions?.find((session) => session.userId === userId) ?? null;
  });
  expect(originalSession, "The real Clerk session should identify its signed-in user").toBeTruthy();
  const originalUserId = originalSession!.userId;
  await expect
    .poll(() =>
      secondTab.evaluate(() => (window as Window & { Clerk?: ClerkBrowser }).Clerk?.user?.id),
    )
    .toBe(originalUserId);

  await page.evaluate(() => window.__careerRealityAuthCacheProbe?.seed());
  await secondTab.evaluate(() => window.__careerRealityAuthCacheProbe?.seed());
  await expect
    .poll(() => page.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBe("cached-user-data");
  await expect
    .poll(() => secondTab.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBe("cached-user-data");

  const switchedToUserId = await secondTab.evaluate(async (activeUserId) => {
    const clerk = (window as Window & { Clerk?: ClerkBrowser }).Clerk;
    const otherAccountSession = clerk?.client?.sessions?.find(
      (session) => session.userId !== activeUserId,
    );
    if (!clerk || !otherAccountSession) return null;

    await clerk.setActive({ session: otherAccountSession.id });
    return otherAccountSession.userId;
  }, originalUserId);
  expect(
    switchedToUserId,
    "The real Clerk browser profile must have a second signed-in account session to switch to",
  ).toBeTruthy();
  expect(switchedToUserId).not.toBe(originalUserId);

  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { Clerk?: ClerkBrowser }).Clerk?.user?.id),
    )
    .toBe(switchedToUserId);
  await expect
    .poll(() =>
      secondTab.evaluate(() => (window as Window & { Clerk?: ClerkBrowser }).Clerk?.user?.id),
    )
    .toBe(switchedToUserId);
  await expect
    .poll(() => page.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBeUndefined();
  await expect
    .poll(() => secondTab.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBeUndefined();

  const switchedUser = await clerkIdentity(page);
  const visibleAccountIdentity = switchedUser.email || switchedUser.fullName;
  expect(visibleAccountIdentity, "The switched account should have visible identity details").toBeTruthy();

  for (const tab of [page, secondTab]) {
    await tab.getByTestId("button-account-menu").click();
    await expect(tab.getByTestId("link-workspace")).toBeVisible();
    await expect(tab.getByText(visibleAccountIdentity!, { exact: true })).toBeVisible();
    await tab.keyboard.press("Escape");
  }

  await page.getByTestId("button-account-menu").click();
  await page.getByTestId("link-workspace").click();
  await expect(page).toHaveURL(/\/workspace(?:\/|$)/);
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);

  await page.goto("/compass");
  await expectSignedIn(page);
  await expect.poll(() => salaryRequests).toBeGreaterThan(0);
  const salaryRequestsBeforeSignOut = salaryRequests;
  await secondTab.getByTestId("button-account-menu").click();
  await secondTab.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(secondTab).toHaveURL(/\/$/);
  await expect(page.getByTestId("button-account-menu")).toHaveCount(0, { timeout: 20_000 });
  await expect(secondTab.getByTestId("button-account-menu")).toHaveCount(0, { timeout: 20_000 });
  await expect
    .poll(() => page.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBeUndefined();
  await expect
    .poll(() => secondTab.evaluate(() => window.__careerRealityAuthCacheProbe?.read()))
    .toBeUndefined();

  await page.evaluate(async (sessionId) => {
    const clerk = (window as Window & { Clerk?: ClerkBrowser }).Clerk;
    if (!clerk) throw new Error("Clerk did not remain available after cross-tab sign-out");
    await clerk.setActive({ session: sessionId });
  }, originalSession!.id);
  await expectSignedIn(page);
  await expectSignedIn(secondTab);
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { Clerk?: ClerkBrowser }).Clerk?.user?.id),
    )
    .toBe(originalUserId);
  await expect
    .poll(() =>
      secondTab.evaluate(() => (window as Window & { Clerk?: ClerkBrowser }).Clerk?.user?.id),
    )
    .toBe(originalUserId);
  await expect.poll(() => salaryRequests).toBeGreaterThan(salaryRequestsBeforeSignOut);

  await secondTab.close();
});
