import { expect, test } from "./fixtures";

test("layoff hub updates the private month-by-month cash-flow projection", async ({ page }) => {
  await page.goto("/layoffs/");

  await page.getByTestId("input-money-cash").fill("300000");
  await page.getByTestId("input-runway-monthly-income").fill("15000");
  await page.getByTestId("select-runway-income-end-month").selectOption("3");
  await page.getByTestId("input-money-severance").fill("60000");
  await page.getByTestId("select-runway-payout-month").selectOption("2");
  await page.getByTestId("input-runway-expense-housing").fill("30000");
  await page.getByTestId("input-runway-expense-food").fill("10000");

  await expect(page.getByTestId("row-runway-month-1")).toContainText("₹2,75,000");
  await expect(page.getByTestId("row-runway-month-2")).toContainText("₹3,10,000");
  await expect(page.getByTestId("row-runway-month-11")).toHaveClass(/is-shortfall/);
  await expect(page.getByTestId("text-runway-outcome")).toContainText("first falls below ₹0");
  await expect(page).not.toHaveURL(/300000|60000|40000/);

  await page.reload();
  await expect(page.getByTestId("input-money-cash")).toHaveValue("");
  await expect(page.getByTestId("input-runway-monthly-income")).toHaveValue("");
});

test("mobile cash-flow inputs fit the screen and the table scrolls inside its panel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/layoffs/");
  await page.getByTestId("calculator-monthly-cash-flow").waitFor();
  await page.getByTestId("input-money-cash").fill("100000");
  await page.getByTestId("input-runway-expense-housing").fill("25000");
  await page.locator(".layoff-money").scrollIntoViewIfNeeded();

  const layout = await page.evaluate(() => {
    const calculator = document.querySelector("[data-testid='calculator-monthly-cash-flow']");
    const table = document.querySelector(".runway-table-wrap");
    if (!calculator || !table) throw new Error("Runway calculator layout is missing.");
    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      calculatorRight: calculator.getBoundingClientRect().right,
      tableWidth: table.clientWidth,
      tableContent: table.scrollWidth,
    };
  });

  expect(layout.document).toBeLessThanOrEqual(layout.viewport);
  expect(layout.calculatorRight).toBeLessThanOrEqual(layout.viewport);
  expect(layout.tableContent).toBeGreaterThan(layout.tableWidth);
});
