import { expect, test } from "./fixtures";

const pageTypes = [
  "/",
  "/salary-calculator",
  "/guides/read-the-offer-beyond-ctc",
  "/layoffs",
  "/companies",
  "/privacy-policy",
];

test("captures request origins and browser storage by page type", async ({ page }) => {
  const observations: Array<Record<string, unknown>> = [];
  const requests: Array<{ url: string; path: string; method: string; origin: string; resource: string }> = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    requests.push({
      url: request.url(),
      path: url.pathname,
      method: request.method(),
      origin: url.origin,
      resource: request.resourceType(),
    });
  });

  for (const path of pageTypes) {
    requests.length = 0;
    const response = await page.goto(path);
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => ({
      cookieNames: document.cookie.split(";").map((part) => part.trim().split("=")[0]).filter(Boolean),
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
      title: document.title,
    }));
    observations.push({
      route: path,
      status: response?.status() ?? null,
      ...state,
      requests: [...requests],
    });
    expect(response?.status()).toBeLessThan(400);
  }

  console.log(`TRUST_NETWORK_CAPTURE ${JSON.stringify(observations)}`);

  requests.length = 0;
  const signInResponse = await page.goto("/sign-in");
  await page.waitForTimeout(1_000);
  const signIn = await page.evaluate(() => ({
    cookieNames: document.cookie.split(";").map((part) => part.trim().split("=")[0]).filter(Boolean),
    localStorageKeys: Object.keys(localStorage),
    sessionStorageKeys: Object.keys(sessionStorage),
    title: document.title,
  }));
  console.log(`TRUST_SIGNIN_CAPTURE ${JSON.stringify({
    route: "/sign-in",
    status: signInResponse?.status() ?? null,
    ...signIn,
    requests: [...requests],
  })}`);
  expect(signInResponse?.status()).toBeLessThan(400);
});
