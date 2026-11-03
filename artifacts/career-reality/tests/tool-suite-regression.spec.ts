import { expect, test } from "./fixtures";

test("offer comparison separates fixed cash from target pay on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/offer-comparison");
  await page.getByTestId("input-currentCtc").fill("2000000");
  await page.getByTestId("input-currentFixed").fill("1800000");
  await page.getByTestId("input-offerCtc").fill("3000000");
  await page.getByTestId("input-offerFixed").fill("2700000");
  await page.getByTestId("input-offerVariable").fill("100000");
  await page.getByTestId("button-calculate").click();

  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("Current estimated monthly take-home with zero variable");
  await expect(result).toContainText("New-offer estimated monthly average at full variable target");
  await expect(result).toContainText("₹1,98,883");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("offer comparison keeps optional payroll and transition details out of the first pass", async ({ page }) => {
  await page.goto("/offer-comparison");

  await expect(page.getByTestId("input-currentCtc")).toBeVisible();
  await expect(page.getByTestId("input-currentFixed")).toBeVisible();
  await expect(page.getByTestId("input-offerCtc")).toBeVisible();
  await expect(page.getByTestId("input-currentPfBasis")).toBeHidden();
  await expect(page.getByTestId("input-joiningBonusClawback")).toBeHidden();

  await page.getByText("Add current payroll details").click();
  await page.getByText("Add offer payroll details").click();
  await page.getByText("Add first-year transition costs").click();
  await expect(page.getByTestId("input-currentPfBasis")).toBeVisible();
  await expect(page.getByTestId("input-offerPfBasis")).toBeVisible();
  await expect(page.getByTestId("input-joiningBonusClawback")).toBeVisible();
});

test("tax comparison calculates a salary-only AY example and shows its boundaries", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tax-regime-comparison");
  await expect(page.getByTestId("field-groups-tax-regime-comparison")).toBeVisible();
  await expect(page.getByTestId("field-group-salary")).toContainText("gross salary");
  await expect(page.getByTestId("field-group-deductions")).toContainText("Eligible deductions");
  await expect(page.getByTestId("field-group-hra")).toContainText("House rent allowance");
  await page.getByTestId("input-grossSalary").fill("1800000");
  await page.getByTestId("input-section80C").fill("150000");
  await page.getByTestId("input-section80D").fill("25000");
  await page.getByTestId("input-nps80ccd1b").fill("25000");
  await page.getByTestId("button-calculate").click();

  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("Estimated old-regime tax");
  await expect(result).toContainText("Estimated new-regime tax");
  await expect(result).toContainText("AY 2026–27");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("gratuity example uses the six-month rounding boundary", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gratuity-estimator");
  await page.getByTestId("input-monthlyWageBase").fill("26000");
  await page.getByTestId("input-completedYears").fill("5");
  await page.getByTestId("input-additionalMonths").fill("7");
  await page.getByTestId("button-calculate").click();

  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("Formula service years");
  await expect(result).toContainText("₹90,000");
  await expect(result).toContainText("₹20,00,000");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("gratuity UI exposes deceased employees as a separate pro-rata category", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gratuity-estimator");
  await page.getByTestId("input-monthlyWageBase").fill("26000");
  await page.getByTestId("input-completedYears").fill("2");
  await page.getByTestId("input-additionalMonths").fill("2");
  await page.getByTestId("input-serviceType").selectOption("death");
  await page.getByTestId("button-calculate").click();
  await expect(page.getByTestId("tool-result")).toContainText("₹32,500");
});

test("final-pay example reconciles the entered divisor and days", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/final-pay-estimator");
  await page.getByTestId("input-monthlyCash").fill("52000");
  await page.getByTestId("input-monthlyDaysBasis").fill("26");
  await page.getByTestId("input-noticeDays").fill("15");
  await page.getByTestId("input-unusedLeaveDays").fill("5");
  await page.getByTestId("button-calculate").click();

  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("Daily rate used");
  await expect(result).toContainText("Combined gross arithmetic total");
  await expect(result).toContainText("₹40,000");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("layoff runway exposes the first below-zero month and reconciled balances", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/layoff-runway");
  await page.getByTestId("input-liquidSavings").fill("360000");
  await page.getByTestId("input-essentialMonthlyCosts").fill("40000");
  await page.getByTestId("input-monthlyDebtPayments").fill("5000");
  await page.getByTestId("input-otherMonthlyIncome").fill("5000");
  await page.getByTestId("button-calculate").click();

  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("9.0 months");
  await expect(result).toContainText("First month projected below zero");
  await expect(result).toContainText("Month 10");
  await expect(result).toContainText("-₹40,000");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("home-loan stress test calculates a rate change and clear resets the result", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home-loan-stress-test");
  await page.getByTestId("input-loanPrincipal").fill("20000000");
  await page.getByTestId("input-annualRatePercent").fill("8.5");
  await page.getByTestId("input-stressRatePercent").fill("10");
  await page.getByTestId("input-termMonths").fill("240");
  await page.getByTestId("input-monthlyTakeHome").fill("200000");
  await page.getByTestId("input-otherMonthlyCosts").fill("60000");
  await page.getByTestId("button-calculate").click();

  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("Monthly payment at entered rate");
  await expect(result).toContainText("Monthly payment at entered stress rate");
  await expect(result).toContainText("Monthly cash after stressed payment and stated costs");
  await expect(result).toContainText("not a prediction");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Clear inputs" }).click();
  await expect(page.getByTestId("input-loanPrincipal")).toHaveValue("");
  await expect(page.getByTestId("tool-result")).toHaveCount(0);
});

test("resign-or-stay compares entered values without recommending an outcome", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/resign-or-stay");
  await expect(page.getByTestId("field-groups-resign-or-stay")).toBeVisible();
  await expect(page.getByTestId("field-group-cash")).toContainText("Cash and obligations");
  await expect(page.getByTestId("field-group-health")).toContainText("Health and energy");
  await expect(page.getByTestId("field-group-location")).toContainText("Location and daily life");
  for (const factor of ["cash", "health", "scope", "learning", "location"]) {
    await page.getByTestId(`input-${factor}Importance`).fill("5");
    await page.getByTestId(`input-${factor}Stay`).fill("5");
    await page.getByTestId(`input-${factor}Move`).fill("3");
  }
  await page.getByTestId("button-calculate").click();

  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("Stay: sum of entered weighted values");
  await expect(result).toContainText("125");
  await expect(result).toContainText("Move: sum of entered weighted values");
  await expect(result).toContainText("75");
  await expect(result).toContainText("not an outcome score, recommendation, or prediction");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Clear inputs" }).click();
  await expect(page.getByTestId("input-cashImportance")).toHaveValue("");
  await expect(page.getByTestId("tool-result")).toHaveCount(0);
});

test("financial and decision worksheets return to a blank state after clearing results", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cases = [
    { route: "/offer-comparison", values: { currentCtc: "2000000", currentFixed: "1800000", offerCtc: "3000000", offerFixed: "2700000" } },
    { route: "/tax-regime-comparison", values: { grossSalary: "1800000" } },
    { route: "/gratuity-estimator", values: { monthlyWageBase: "26000", completedYears: "5" } },
    { route: "/final-pay-estimator", values: { monthlyCash: "52000", monthlyDaysBasis: "26" } },
    { route: "/layoff-runway", values: { liquidSavings: "360000", essentialMonthlyCosts: "40000" } },
    { route: "/home-loan-stress-test", values: { loanPrincipal: "2000000", annualRatePercent: "8.5", stressRatePercent: "10", termMonths: "240", monthlyTakeHome: "200000" } },
    { route: "/resign-or-stay", values: Object.fromEntries(["cash", "health", "scope", "learning", "location"].flatMap((factor) => [[`${factor}Importance`, "5"], [`${factor}Stay`, "4"], [`${factor}Move`, "3"]])) },
  ];

  for (const { route, values } of cases) {
    await page.goto(route);
    for (const [key, value] of Object.entries(values)) {
      await page.getByTestId(`input-${key}`).fill(value);
    }
    await page.getByTestId("button-calculate").click();
    await expect(page.getByTestId("tool-result"), `${route} should show a calculated result`).toBeVisible();
    await page.getByRole("button", { name: "Clear inputs" }).click();
    await expect(page.getByTestId("tool-result"), `${route} should clear its result`).toHaveCount(0);
    for (const key of Object.keys(values)) {
      await expect(page.getByTestId(`input-${key}`), `${route} should clear ${key}`).toHaveValue("");
    }
  }
});
