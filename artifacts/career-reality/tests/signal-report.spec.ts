import { expect, test } from "./fixtures";

test("retired layoff radar URL forwards to the current runway worksheet", async ({ page }) => {
  await page.goto("/layoff-radar", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/layoff-runway\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: /Job Loss Runway Calculator/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Report a signal" })).toHaveCount(0);
});