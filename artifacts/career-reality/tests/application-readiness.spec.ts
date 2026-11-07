import { expect, test } from "./fixtures";
import { applicationReadiness } from "../src/data/application-readiness";

test("readiness register requires sign-in and preserves its return route", async ({ page }) => {
  await page.goto("/admin/application-readiness");

  await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Fadmin%2Fapplication-readiness$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.route("**/api/workspace/readiness-access", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authorized: true }) }),
  );
  await page.route("**/api/workspace/readiness-data", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ records: JSON.stringify(applicationReadiness) }),
    }),
  );
  await page.getByTestId("button-e2e-sign-in").click();

  await expect(page).toHaveURL(/\/admin\/application-readiness$/);
  await expect(page.getByRole("heading", { name: "Application readiness" })).toBeVisible();
});

test("signed-in readiness view shows the threshold, blocker override, and noindex", async ({ page }) => {
  await page.route("**/api/workspace/readiness-access", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authorized: true }) }),
  );
  await page.route("**/api/workspace/readiness-data", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ records: JSON.stringify(applicationReadiness) }),
    }),
  );
  await page.addInitScript(() => {
    window.localStorage.setItem("career-reality-e2e-auth", "signed-in");
  });
  await page.goto("/admin/application-readiness");

  await expect(page.getByRole("heading", { name: "Application readiness" })).toBeVisible();
  const coverage = page.getByTestId("tool-readiness-coverage");
  await expect(coverage).toBeVisible();
  await expect(coverage.locator('[data-testid^="tool-readiness-row-"]')).toHaveCount(15);
  await expect(coverage.getByText("NEEDS REVIEW", { exact: true })).toHaveCount(8);
  await expect(coverage.getByText("Not scored", { exact: true })).toHaveCount(8);
  const jobPostingReview = page.getByTestId("tool-readiness-row-job-posting-reality-check");
  await expect(jobPostingReview).toContainText("local PDF/DOCX extraction without resume-content requests");
  await expect(jobPostingReview).toContainText("keyboard focus order");
  await expect(jobPostingReview).toContainText("required-field and fetch-error announcements");
  await expect(jobPostingReview).toContainText("No additional route-level gate was identified by this scoped review");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.getByTestId("readiness-entry-ctc-calculator")).toContainText("NOT READY");
  await expect(page.getByTestId("readiness-entry-company-intelligence")).toContainText("BLOCKED BY HUMAN INPUT");
  await expect(page.getByTestId("readiness-entry-layoff-radar")).toContainText("NOT READY");

  await page.getByTestId("readiness-entry-ctc-calculator").locator("summary").click();
  await expect(page.getByTestId("readiness-entry-ctc-calculator").getByText(/internal release target is 90\/100/i)).toBeVisible();
  await expect(page.getByText(/independent professional review is not formally completed/i)).toBeVisible();

  await page.getByTestId("filter-status-blocked-by-human-input").click();
  await expect(page.getByText("Showing 2 of 11")).toBeVisible();
  await expect(page.getByTestId("readiness-entry-career-compass")).toHaveCount(0);
});

test("signed-in users without reviewer permissions cannot open the readiness register", async ({ page }) => {
  let dataRequested = false;
  await page.route("**/api/workspace/readiness-access", (route) =>
    route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "Reviewer access required" }) }),
  );
  await page.route("**/api/workspace/readiness-data", (route) => {
    dataRequested = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ records: "[]" }) });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem("career-reality-e2e-auth", "signed-in");
  });
  await page.goto("/admin/application-readiness");

  await expect(page.getByRole("heading", { name: "Reviewer access required" })).toBeVisible();
  await expect(page.getByTestId("tool-readiness-coverage")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Release decisions" })).toHaveCount(0);
  expect(dataRequested).toBe(false);
});
