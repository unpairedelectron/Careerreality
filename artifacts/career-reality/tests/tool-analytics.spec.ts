import { expect, test } from "./fixtures";
import { readFile } from "node:fs/promises";

test("tool completion analytics records only the fixed tool and platform", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__careerRealityAnalyticsEvents = [];
    (window as any).umami = {
      track: (name: string, data?: Record<string, unknown>) => {
        (window as any).__careerRealityAnalyticsEvents.push({ name, data });
      },
    };
  });

  await page.goto("/offer-comparison/");
  await expect(page.getByText("Published date not recorded")).toHaveCount(0);
  await expect(page.getByTestId("tax-period-scope")).toContainText("Tax Year 2026–27");
  await page.getByTestId("input-taxPeriod").selectOption("assessment-year-2026-27");
  await expect(page.getByTestId("tax-period-scope")).toContainText("Assessment Year 2026–27");
  await page.getByTestId("input-taxPeriod").selectOption("tax-year-2026-27");
  await expect(page.getByTestId("tax-period-scope")).toContainText("Tax Year 2026–27");
  await expect(page.getByRole("link", { name: "Check employer risk before accepting" })).toHaveAttribute("href", "/companies/");
  await page.getByTestId("input-currentCtc").fill("2400000");
  await page.getByTestId("input-currentFixed").fill("2200000");
  await page.getByTestId("input-offerCtc").fill("2800000");
  await page.getByTestId("input-offerFixed").fill("2500000");
  await page.getByText("Add current payroll details").click();
  await page.getByText("Add offer payroll details").click();
  await page.getByTestId("input-currentPfBasis").selectOption("statutory-ceiling");
  await page.getByTestId("input-currentPfStartDate").fill("2026-09-01");
  await page.getByTestId("input-offerPfBasis").selectOption("statutory-ceiling");
  await page.getByTestId("input-offerPfStartDate").fill("2026-10-01");
  await page.getByTestId("button-calculate").click();
  await expect(page.getByTestId("tool-result")).toBeVisible();
  await expect(page.getByTestId("tool-result")).toContainText("Tax Year 2026–27");
  await expect(page.getByTestId("input-currentPfStartDate")).toHaveValue("2026-09-01");
  await expect(page.getByTestId("input-offerPfStartDate")).toHaveValue("2026-10-01");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("button-download-offer-result").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("careerreality-offer-comparison.csv");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const downloadedCsv = await readFile(downloadPath!, "utf8");
  expect(downloadedCsv).toContain("2400000");
  expect(downloadedCsv).toContain("Tax Year 2026–27");

  const events = await page.evaluate(() => (window as any).__careerRealityAnalyticsEvents);
  expect(events).toEqual([{
    name: "decision_tool_completed",
    data: { tool_id: "offer-comparison", platform: "web" },
  }]);
});

test("salary calculator states the income period covered by its tax model", async ({ page }) => {
  await page.goto("/salary-calculator/");
  await expect(page.getByTestId("tax-period-scope")).toContainText("Tax Year 2026–27");
  await expect(page.getByTestId("tax-period-scope")).toContainText("Income-tax Act, 2025");
});

test("counts a valid edited CTC estimate without sending salary inputs", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__careerRealityAnalyticsEvents = [];
    (window as any).umami = {
      track: (name: string, data?: Record<string, unknown>) => {
        (window as any).__careerRealityAnalyticsEvents.push({ name, data });
      },
    };
  });
  await page.goto("/salary-calculator/");
  expect(await page.evaluate(() => (window as any).__careerRealityAnalyticsEvents)).toEqual([]);
  await page.getByTestId("input-annualFixedPay").fill("1700000");
  await expect(page.getByTestId("result-salary-calculator")).toBeVisible();
  await expect(page.getByTestId("ctc-assumption-summary")).toContainText("Fixed gross ₹17,00,000 / year");
  await page.getByTestId("input-annualVariablePay").fill("100000");
  await expect.poll(() => page.evaluate(() => (window as any).__careerRealityAnalyticsEvents)).toEqual([{
    name: "decision_tool_completed",
    data: { tool_id: "ctc-calculator", platform: "web" },
  }]);
});

test("sends the old article to its replacement guide", async ({ page }) => {
  await page.goto("/article/what-20-lpa-actually-feels-like-india-purchasing-power/");
  await expect(page).toHaveURL(/\/guides\/read-the-offer-beyond-ctc\/?$/);
});

test("shows the qualified ₹20L example on the published CTC guide", async ({ page }) => {
  await page.goto("/guides/read-the-offer-beyond-ctc/");
  await expect(page.getByTestId("guide-worked-example-direct-answer")).toContainText("₹1,33,931 per month at zero variable pay");
  await expect(page.getByTestId("guide-worked-example-direct-answer")).toContainText("₹1,45,811 per month averaged across the year");
  await expect(page.getByText(/Tax Year 2026–27/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the CTC calculator" }).first()).toHaveAttribute("href", "/salary-calculator/");
});

test("opens every guide with its direct answer", async ({ page }) => {
  await page.goto("/guides/gratuity-four-years-eight-months/");
  const box = page.getByTestId("guide-direct-answer");
  await expect(box.getByRole("heading", { name: "Does 4 years 8 months count as 5 years for gratuity?" })).toBeVisible();
  await expect(box).toContainText("That does not settle eligibility");
});

test("tax-regime comparison labels and calculates both sides for AY 2026–27", async ({ page }) => {
  await page.goto("/tax-regime-comparison/");
  await page.getByTestId("input-grossSalary").fill("2000000");
  await page.getByTestId("button-calculate").click();
  const result = page.getByTestId("tool-result");
  await expect(result).toContainText("AY 2026–27");
  await expect(result).toContainText("₹1,92,400");
});
