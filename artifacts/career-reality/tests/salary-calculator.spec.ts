import { expect, test } from "./fixtures";

test.describe("CTC calculator page", () => {
  test("keeps the calculator usable without horizontal overflow on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/salary-calculator");
    await expect(page.getByTestId("input-annualCtc")).toBeVisible();
    await expect(page.getByTestId("result-salary-calculator")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("shows shared worked-example amounts and source/method context", async ({ page }) => {
    await page.goto("/salary-calculator");

    await expect(page.getByText(/Tax Year 2026–27 default-regime in-hand cash/)).toBeVisible();
    await expect(page.getByTestId("metric-fixed-monthly-cash")).toContainText("₹1,33,377");
    await expect(page.getByTestId("metric-target-monthly-average")).toContainText("₹1,45,257");
    const ledger = page.getByTestId("payslip-ledger");
    await expect(ledger.getByRole("columnheader", { name: "Fixed pay only" })).toBeVisible();
    await expect(page.getByTestId("ledger-annual-take-home")).toContainText("₹16,00,528");
    await expect(page.getByTestId("ledger-annual-take-home")).toContainText("₹17,43,088");
    await expect(page.getByTestId("ledger-monthly-take-home")).toContainText("₹1,33,377");
    await expect(page.getByTestId("ledger-monthly-take-home")).toContainText("₹1,45,257");
    await expect(page.getByTestId("ledger-income-tax")).toContainText("−₹1,84,912");
    await expect(page.getByTestId("metric-target-monthly-average")).toContainText(
      "not a guaranteed monthly payslip",
    );
    await expect(page.getByTestId("source-income-tax-rates-ay")).toHaveAttribute(
      "href",
      "https://www.incometaxindia.gov.in/tax-rates",
    );
    await expect(page.getByTestId("source-salaried-ay")).toHaveAttribute(
      "href",
      "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1",
    );
    await expect(page.getByTestId("source-ay-salary-deduction")).toHaveAttribute(
      "href",
      "https://www.incometaxindia.gov.in/w/section-16-64",
    );
    await expect(page.getByTestId("source-labour-ministry-pf-ceiling")).toHaveAttribute(
      "href",
      "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111&lang=2&reg=48",
    );
    await expect(page.getByTestId("source-epfo-ceiling-faq")).toHaveAttribute(
      "href",
      "https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf",
    );
    await expect(page.getByTestId("source-tax-year-rates")).toHaveAttribute(
      "href",
      "https://www.incometaxindia.gov.in/w/section-202-78",
    );
    await expect(page.getByTestId("source-tax-year-salary-deduction")).toHaveAttribute(
      "href",
      "https://www.incometaxindia.gov.in/w/section-19-206",
    );
    await expect(page.getByTestId("source-tax-year-rebate")).toHaveAttribute(
      "href",
      "https://www.incometaxindia.gov.in/w/section-156-88",
    );
    await expect(page.getByTestId("source-verification-note")).toContainText("17 September 2026");
    await expect(page.getByTestId("tax-period-scope")).toContainText("Tax Year 2026–27");
    await expect(page.getByTestId("tax-period-scope")).toContainText("Income-tax Act, 2025");
    await expect(page.getByTestId("input-pfContributionBasis")).toHaveValue("manual");
    await expect(page.getByTestId("input-annualEmployeePfAtZeroVariable")).toHaveValue("36000");
    await expect(page.getByTestId("input-annualEmployeePfAtTarget")).toHaveValue("36000");

    await page.getByTestId("input-annualFixedPay").fill("1700000");
    await page.getByTestId("button-example-20lpa").click();
    await expect(page.getByTestId("input-annualFixedPay")).toHaveValue("1784000");
    await expect(page.getByTestId("input-pfContributionBasis")).toHaveValue("statutory-ceiling");
    await expect(page.getByTestId("input-pfEmploymentStartDate")).toHaveValue("2026-04-01");
    await expect(page.getByTestId("pf-monthly-schedule")).toContainText("Sept 2026");
  });

  test("deducts professional tax in both periods while retaining the same rate schedule", async ({ page }) => {
    await page.goto("/salary-calculator");
    const fixedCash = page.getByTestId("metric-fixed-monthly-cash");
    await page.getByTestId("input-annualProfessionalTax").fill("2400");
    await expect(page.getByTestId("breakdown-employment-tax-deduction")).toContainText("₹2,400 / year");
    const currentAmount = await fixedCash.innerText();
    await page.getByTestId("input-taxPeriod").selectOption("assessment-year-2026-27");
    await expect(page.getByTestId("tax-period-scope")).toContainText("Assessment Year 2026–27");
    await expect(page.getByTestId("tax-period-scope")).toContainText("FY 2025–26");
    await expect(page.getByTestId("breakdown-employment-tax-deduction")).toContainText("₹2,400 / year");
    expect(await fixedCash.innerText()).toBe(currentAmount);
    await page.getByTestId("input-taxPeriod").selectOption("tax-year-2026-27");
    await expect(page.getByTestId("tax-period-scope")).toContainText("Tax Year 2026–27");
    await expect(page.getByTestId("breakdown-employment-tax-deduction")).toContainText("₹2,400 / year");
  });

  test("manual PF amounts change cash without changing the tax-only estimate", async ({ page }) => {
    await page.goto("/salary-calculator");
    await page.getByTestId("input-pfContributionBasis").selectOption("manual");
    const fixedMonthly = page.getByTestId("metric-fixed-monthly-cash");
    const fixedTaxOnly = page.getByTestId("metric-tax-only-fixed");
    const taxOnlyBefore = await fixedTaxOnly.innerText();

    await page.getByTestId("input-annualEmployeePfAtZeroVariable").fill("60000");
    await expect(fixedMonthly).toContainText("₹1,31,377");
    expect(await fixedTaxOnly.innerText()).toBe(taxOnlyBefore);

    await page.getByTestId("input-annualEmployeePfAtTarget").fill("60000");
    await expect(page.getByTestId("metric-target-monthly-average")).toContainText("₹1,43,257");
  });

  test("requires an explicit start date and shows the monthly transition estimate", async ({ page }) => {
    await page.goto("/salary-calculator");
    await page.getByTestId("input-pfContributionBasis").selectOption("statutory-ceiling");
    await expect(page.getByTestId("validation-summary")).toContainText("Check the highlighted fields");
    await expect(page.getByTestId("input-pfEmploymentStartDate")).toBeVisible();
    await page.getByTestId("input-pfEmploymentStartDate").fill("2026-09-01");
    const schedule = page.getByTestId("pf-monthly-schedule");
    await expect(schedule).toContainText("Sept 2026");
    await expect(schedule).toContainText("Oct 2026");
    await expect(schedule).toContainText("Employer EPS");
    await expect(schedule).toContainText("Employer EPF");
  });

  test("suppresses take-home when CTC cannot reconcile and restores the example on reset", async ({
    page,
  }) => {
    await page.goto("/salary-calculator");
    await page.getByTestId("input-annualCtc").fill("1900000");

    await expect(page.getByTestId("ctc-shortfall-alert")).toContainText("₹1,00,000 over CTC");
    await expect(page.getByTestId("result-salary-calculator")).not.toBeVisible();
    await expect(page.getByTestId("metric-fixed-monthly-cash")).not.toBeVisible();

    await page.getByTestId("button-reset-calculator").click();
    await expect(page.getByTestId("metric-fixed-monthly-cash")).toContainText("₹1,33,377");
    await expect(page.getByTestId("ctc-shortfall-alert")).not.toBeVisible();
  });

  test("withholds results and explains invalid input", async ({ page }) => {
    await page.goto("/salary-calculator");
    const basicPercent = page.getByTestId("input-basicPercentOfFixed");
    await basicPercent.fill("101");

    await expect(basicPercent).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("validation-summary")).toContainText("Check the highlighted fields");
    await expect(page.getByTestId("result-salary-calculator")).not.toBeVisible();
  });
});
