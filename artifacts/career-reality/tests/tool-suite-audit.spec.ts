import { expect, test } from "./fixtures";

const auditedToolRoutes = [
  "/salary-calculator",
  "/offer-comparison",
  "/tax-regime-comparison",
  "/gratuity-estimator",
  "/final-pay-estimator",
  "/layoff-runway",
  "/home-loan-stress-test",
  "/resign-or-stay",
  "/companies",
  "/compass",
  "/salary-drop",
  "/escape-plan",
  "/career-reality-index",
  "/ai",
];

test("all 14 in-scope tools render at phone width with named inputs and no page overflow", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 360, height: 800 });

  for (const route of auditedToolRoutes) {
    const response = await request.get(route);
    expect(response.ok(), `${route} should return a successful response`).toBeTruthy();
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const audit = await page.evaluate(() => {
      const visible = (element: Element) => !element.closest('[hidden], [aria-hidden="true"]');
      const hasAccessibleName = (element: Element) => {
        const ariaName = element.getAttribute("aria-label") ?? element.getAttribute("aria-labelledby");
        if (ariaName?.trim()) return true;
        if (element instanceof HTMLInputElement) return element.type === "hidden" || Boolean(element.labels?.length);
        if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return Boolean(element.labels?.length);
        if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
          return Boolean(element.textContent?.trim() || element.getAttribute("title"));
        }
        return true;
      };
      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        unnamedControls: Array.from(document.querySelectorAll("input, textarea, select, button, a"))
          .filter(visible)
          .filter((element) => !hasAccessibleName(element))
          .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
      };
    });

    expect(audit.scrollWidth, `${route} should not overflow horizontally`).toBeLessThanOrEqual(audit.width + 1);
    expect(audit.unnamedControls, `${route} should label visible controls`).toEqual([]);
  }
});
