import { expect, test } from "./fixtures";

test("homepage exposes the layoff update block and alert form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /If work changes/i })).toBeVisible();
  await expect(page.getByTestId("form-layoff-alert-signup")).toBeVisible();
  await expect(page.getByTestId("link-home-layoff-hub")).toBeVisible();
});

test("Layoff Hub shows current review date, records, and signup", async ({ page }) => {
  await page.goto("/layoffs/");
  await expect(page.getByTestId("text-events-last-updated")).toContainText("Last updated");
  await expect(page.getByTestId("card-event-hsbc-uk-wealth-restructuring-2026")).toBeVisible();
  await expect(page.getByTestId("card-event-microsoft-voluntary-buyout-offer-2026")).toBeVisible();
  await expect(page.getByTestId("card-event-amazon-devices-services-reduction-2026")).toBeVisible();
  await expect(page.locator("#event-tracker .event-row").first()).toContainText("Amazon");
  await expect(page.getByTestId("form-layoff-alert-signup")).toBeVisible();
});

test("Layoff Hub deep links scroll to the event and alert sections", async ({ page }) => {
  for (const id of ["event-tracker", "email-alerts"]) {
    await page.goto(`/layoffs/#${id}`);
    const target = page.locator(`#${id}`);
    await expect(target).toBeVisible();
    await expect.poll(() => target.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    })).toBe(true);
  }
});

test("shared footer keeps all six tool links on the primary public pages", async ({ page }) => {
  for (const route of ["/", "/layoffs/", "/companies/", "/salary-calculator/", "/guides/"]) {
    await page.goto(route);
    const footerTools = page.locator('[data-section="tools"] a');
    await expect(footerTools).toHaveCount(6);
  }
});

test("companies page keeps branding out of its visible heading and breadcrumb", async ({ page }) => {
  await page.goto("/companies/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check the employer behind the offer.");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).not.toContainText("CareerReality");
  await expect(page).toHaveTitle(/\| CareerReality/);
  await expect(page.getByTestId("section-source-table")).not.toContainText(/automated fetch|workspace/i);
});

test("CTC examples disclose zero PF and professional tax assumptions", async ({ page }) => {
  await page.goto("/salary-calculator/");
  await expect(page.getByTestId("button-example-lower")).toContainText("employee PF and professional tax are both set to ₹0");
  await expect(page.getByTestId("button-example-mid")).toContainText("Employee PF and professional tax are both set to ₹0");
});
