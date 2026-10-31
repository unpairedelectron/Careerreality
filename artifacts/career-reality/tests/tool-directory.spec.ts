import { expect, test } from "./fixtures";

test("tools directory prioritizes customer situations and filters the registered routes", async ({ page }) => {
  await page.goto("/tools");

  await expect(page.getByTestId("link-featured-tool")).toHaveAttribute("href", "/offer-comparison");
  await expect(page.getByTestId("filter-tools-all")).toContainText("15");
  await expect(page.locator(".directory-rows .directory-row")).toHaveCount(14);
  await expect(page.locator(".directory-rows .directory-row").first()).toHaveAttribute("href", "/salary-calculator");

  await page.getByTestId("filter-tools-verify").click();
  await expect(page.locator(".directory-rows .directory-row")).toHaveCount(2);
  await expect(page.getByTestId("link-directory-tools--companies")).toBeVisible();
  await expect(page.getByTestId("link-directory-tools--job-posting-reality-check")).toBeVisible();

  await page.getByTestId("filter-tools-all").click();
  await page.getByTestId("input-search-tools").fill("monthly in-hand");
  await expect(page.locator(".directory-rows .directory-row")).toHaveCount(1);
  await expect(page.locator(".directory-rows .directory-row").first()).toHaveAttribute("href", "/salary-calculator");
});
