import { expect, test } from "./fixtures";

const publicRoutes = [
  "/compass",
  "/tools",
  "/tools/ctc",
  "/tools/risk",
  "/tools/layoffs",
  "/companies",
  "/career-reality-index",
] as const;

for (const route of publicRoutes) {
  test(`hydrates ${route} without a runtime crash`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    expect((await page.locator("h1").innerText()).trim(), `${route} should have a real page heading`).not.toBe("");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("Something went wrong");
    expect(consoleErrors, `${route} emitted browser console errors`).toEqual([]);
    expect(pageErrors, `${route} emitted uncaught page errors`).toEqual([]);
  });
}