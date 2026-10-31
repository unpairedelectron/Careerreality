import { expect, test } from "./fixtures";

test("homepage surfaces the latest HSBC and Amazon sourced records", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("card-layoff-event-hsbc-uk-wealth-restructuring-2026")).toContainText("HSBC");
  await expect(page.getByTestId("card-layoff-event-amazon-stores-workforce-reduction-2026")).toContainText("Amazon");
  await expect(page.getByTestId("link-layoff-event-source-hsbc-uk-wealth-restructuring-2026"))
    .toHaveAttribute("href", /reuters\.com/);
});

test("HSBC detail offers a private role- and runway-aware plan", async ({ page }) => {
  await page.goto("/layoffs/hsbc-uk-wealth-restructuring-2026/");

  await expect(page.getByTestId("section-layoff-response-plan")).toBeVisible();
  await expect(page.getByTestId("text-event-method")).toContainText("Reported");
  await expect(page.getByTestId("status-layoff-runway-incomplete")).toBeVisible();

  await page.getByTestId("select-layoff-role").selectOption("sales-advisory");
  await page.getByTestId("choice-layoff-match-yes").check();
  await page.getByTestId("input-layoff-cash").fill("100000");
  await page.getByTestId("input-layoff-pay").fill("0");
  await page.getByTestId("input-layoff-essentials").fill("50000");

  await expect(page.getByTestId("text-layoff-runway")).toContainText("2.0");
  await expect(page.getByTestId("list-layoff-next-steps")).toContainText("Ask your manager or HR");
  await expect(page.getByText("Map portable client-facing strengths")).toBeVisible();
  await expect(page).not.toHaveURL(/cash|100000|50000/);

  await page.reload();
  await expect(page.getByTestId("select-layoff-role")).toHaveValue("");
  await expect(page.getByTestId("input-layoff-cash")).toHaveValue("");
});
