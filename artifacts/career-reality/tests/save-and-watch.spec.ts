import { expect, test } from "./fixtures";
import type { Page, Route } from "@playwright/test";

const company = {
  id: "company-acme",
  slug: "acme-corp",
  name: "Acme Corp",
  sector: "Technology",
  stability: 76,
  momentum: "Hiring selectively",
  signal: "New hiring is concentrated in revenue teams.",
  source: "Public filings",
  sourceUrl: "https://example.test/acme-company-signal",
  confidence: "High",
  observedAt: "2026-08-18T00:00:00.000Z",
  refreshedAt: "2026-08-20T00:00:00.000Z",
};

const secondCompany = {
  id: "company-northstar",
  slug: "northstar-labs",
  name: "Northstar Labs",
  sector: "Technology",
  stability: 42,
  momentum: "Under review",
  signal: "Hiring is concentrated in a small number of infrastructure teams.",
  source: "Public filings",
  sourceUrl: "https://example.test/northstar-company-signal",
  confidence: "Medium",
  observedAt: "2026-08-18T00:00:00.000Z",
  refreshedAt: "2026-08-20T00:00:00.000Z",
};

const layoffSignal = {
  id: "signal-acme",
  company: company.name,
  signal: "Hiring has slowed in two teams.",
  type: "Hiring freeze",
  source: "Public reporting",
  confidence: "High",
  observedAt: "2026-08-18T00:00:00.000Z",
};

const salaryBenchmark = {
  id: "salary-software-bengaluru",
  role: "Software engineer",
  city: "Bengaluru",
  experienceBand: "5–8 years",
  p25: 1600000,
  median: 2200000,
  p75: 3000000,
  sampleSize: 42,
  source: "CareerReality reported snapshots",
  sourceUrl: null,
  confidence: "High",
  observedAt: "2026-08-18T00:00:00.000Z",
  refreshedAt: "2026-08-20T00:00:00.000Z",
};

type SavedDecision = {
  id: string;
  kind: "salary";
  title: string;
  summary: string;
  signal: string;
  createdAt: string;
};

type WatchlistItem = {
  id: string;
  company: string;
  signal: string;
  note: string;
  createdAt: string;
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

type CompassFixtureOptions = {
  failSource?: "salary" | "company" | "layoff";
  failAction?: "save" | "watchlist";
  failWorkspace?: boolean;
  companySourceMissing?: boolean;
};

async function installCompassFixtures(page: Page, options: CompassFixtureOptions = {}) {
  const savedDecisions: SavedDecision[] = [];
  const watchlist: WatchlistItem[] = [];
  const companyRows = options.companySourceMissing
    ? [{ ...company, sourceUrl: null }, { ...secondCompany, sourceUrl: null }]
    : [company, secondCompany];
  let sourceFailuresRemaining = options.failSource ? 2 : 0;
  let actionFailed = false;
  let workspaceFailuresRemaining = options.failWorkspace ? 2 : 0;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/public/salary-benchmarks" && request.method() === "GET") {
      if (options.failSource === "salary" && sourceFailuresRemaining > 0) {
        sourceFailuresRemaining -= 1;
        return json(route, { error: "Salary source unavailable" }, 503);
      }
      return json(route, { data: [salaryBenchmark], meta: { dataset: "salary", refreshedAt: salaryBenchmark.refreshedAt, source: salaryBenchmark.source, methodology: "Reported snapshots", confidence: "High", sampleSize: salaryBenchmark.sampleSize } });
    }
    if (path === "/api/public/companies" && request.method() === "GET") {
      if (options.failSource === "company" && sourceFailuresRemaining > 0) {
        sourceFailuresRemaining -= 1;
        return json(route, { error: "Company source unavailable" }, 503);
      }
      return json(route, { data: companyRows, meta: { dataset: "companies", refreshedAt: company.refreshedAt, source: company.source, methodology: "Public filings", confidence: "High", sampleSize: 2 } });
    }
    if (path === `/api/public/companies/${company.slug}` && request.method() === "GET") {
      return json(route, { data: companyRows[0] });
    }
    if (path === "/api/public/layoff-signals" && request.method() === "GET") {
      if (options.failSource === "layoff" && sourceFailuresRemaining > 0) {
        sourceFailuresRemaining -= 1;
        return json(route, { error: "Layoff source unavailable" }, 503);
      }
      return json(route, { data: [layoffSignal], meta: { dataset: "layoffs", refreshedAt: company.refreshedAt, source: "Public reporting", methodology: "Editorial review", confidence: "High", sampleSize: 1 } });
    }
    if (path === "/api/saved-decisions" && request.method() === "GET") {
      if (options.failWorkspace && workspaceFailuresRemaining > 0) {
        workspaceFailuresRemaining -= 1;
        return json(route, { error: "Workspace unavailable" }, 503);
      }
      return json(route, savedDecisions);
    }
    if (path === "/api/saved-decisions" && request.method() === "POST") {
      if (options.failAction === "save" && !actionFailed) {
        actionFailed = true;
        return json(route, { error: "Save unavailable" }, 503);
      }
      const input = JSON.parse(request.postData() ?? "{}") as Omit<SavedDecision, "id" | "createdAt">;
      const decision: SavedDecision = {
        ...input,
        id: `decision-${savedDecisions.length + 1}`,
        createdAt: "2026-09-04T00:00:00.000Z",
      };
      savedDecisions.push(decision);
      return json(route, decision, 201);
    }
    if (path === "/api/watchlist" && request.method() === "GET") {
      return json(route, watchlist);
    }
    if (path === "/api/watchlist" && request.method() === "POST") {
      if (options.failAction === "watchlist" && !actionFailed) {
        actionFailed = true;
        return json(route, { error: "Watchlist unavailable" }, 503);
      }
      const input = JSON.parse(request.postData() ?? "{}") as Omit<WatchlistItem, "id" | "createdAt">;
      const item: WatchlistItem = {
        ...input,
        id: `watch-${watchlist.length + 1}`,
        createdAt: "2026-09-04T00:00:00.000Z",
      };
      watchlist.push(item);
      return json(route, item, 201);
    }
    if (path === "/api/workspace/summary" && request.method() === "GET") {
      return json(route, {
        savedDecisionCount: savedDecisions.length,
        watchlistCount: watchlist.length,
        latestDecision: savedDecisions.at(-1) ?? null,
        latestWatchlistItem: watchlist.at(-1) ?? null,
      });
    }

    return route.continue();
  });
}

async function installApiFixtures(page: Page) {
  const savedDecisions: SavedDecision[] = [];
  const watchlist: WatchlistItem[] = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/public/companies" && request.method() === "GET") {
      return json(route, { data: [company], meta: { refreshedAt: company.refreshedAt, confidence: "High" } });
    }
    if (path === `/api/public/companies/${company.slug}` && request.method() === "GET") {
      return json(route, { data: company });
    }
    if (path === "/api/public/layoff-signals" && request.method() === "GET") {
      return json(route, { data: [layoffSignal], meta: { refreshedAt: company.refreshedAt, confidence: "High" } });
    }
    if (path === "/api/saved-decisions" && request.method() === "GET") {
      return json(route, savedDecisions);
    }
    if (path === "/api/saved-decisions" && request.method() === "POST") {
      const input = JSON.parse(request.postData() ?? "{}") as Omit<SavedDecision, "id" | "createdAt">;
      const decision: SavedDecision = {
        ...input,
        id: `decision-${savedDecisions.length + 1}`,
        createdAt: "2026-09-04T00:00:00.000Z",
      };
      savedDecisions.push(decision);
      return json(route, decision, 201);
    }
    if (path === "/api/watchlist" && request.method() === "GET") {
      return json(route, watchlist);
    }
    if (path === "/api/watchlist" && request.method() === "POST") {
      const input = JSON.parse(request.postData() ?? "{}") as Omit<WatchlistItem, "id" | "createdAt">;
      const item: WatchlistItem = {
        ...input,
        id: `watch-${watchlist.length + 1}`,
        createdAt: "2026-09-04T00:00:00.000Z",
      };
      watchlist.push(item);
      return json(route, item, 201);
    }
    if (path === "/api/workspace/summary" && request.method() === "GET") {
      return json(route, {
        savedDecisionCount: savedDecisions.length,
        watchlistCount: watchlist.length,
        latestDecision: savedDecisions.at(-1) ?? null,
        latestWatchlistItem: watchlist.at(-1) ?? null,
      });
    }

    return route.continue();
  });
}

async function signInForTest(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("career-reality-e2e-auth", "signed-in");
  });
}

async function captureAnalytics(page: Page) {
  await page.addInitScript(() => {
    const storageKey = "career-reality-e2e-events";
    const storedEvents = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as unknown[];
    (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents = storedEvents;
    window.umami = {
      track(name, data) {
        const events = ((window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ??= []);
        events.push({ name, data });
        window.localStorage.setItem(storageKey, JSON.stringify(events));
      },
    };
  });
}

test.describe("save and watch loops", () => {
  test("keeps the CTC estimate local with no workspace save control", async ({ page }) => {
    await page.goto("/salary-calculator");

    const calculatorResult = page.getByTestId("result-salary-calculator");
    await expect(calculatorResult).toBeVisible();
    await expect(page.getByRole("button", { name: "Save to workspace" })).toHaveCount(0);
    await expect(calculatorResult.getByRole("button", { name: /share/i })).toHaveCount(0);
    await expect(page.getByText("No calculator save or share feature")).toBeVisible();
  });

  test("retired company detail URLs return to the input-only due-diligence hub", async ({ page }) => {
    await page.goto("/companies/groww");

    await expect(page).toHaveURL(/\/companies\/?$/);
    await expect(page.getByRole("heading", { name: "Check the employer behind the offer." })).toBeVisible();
    await expect(page.getByText("No company rating")).toBeVisible();
    await expect(page.getByText("A status summary, not a verdict.")).toBeVisible();
    await expect(page.getByText(/(?:76|42)\s*\/\s*100/)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Groww/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Watch this company/i })).toHaveCount(0);
  });

  test("completes the preferred Compass snapshot and watchlist loop", async ({ page }) => {
    test.fixme(true, "Requires owner-reviewed company evidence and an approved signed-in QA session; test auth and example.test fixtures are not production evidence.");
    await signInForTest(page);
    await captureAnalytics(page);
    await installCompassFixtures(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/compass\/?$/);
    await page.getByTestId("compass-company").selectOption({ label: "Acme Corp" });

    await page.getByRole("tab", { name: /Is now the right time/ }).click();
    await page.getByRole("button", { name: "Show breakdown" }).click();
    await page.getByLabel("Notice period in days").fill("75");
    await page.getByRole("button", { name: "Watch this company" }).click();
    await expect(page.getByRole("button", { name: "Watching in workspace" })).toBeVisible();
    await page.getByRole("button", { name: "Save snapshot" }).click();
    await expect(page.getByRole("button", { name: "Snapshot saved" })).toBeVisible();

    await page.getByRole("link", { name: "Open workspace" }).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await page.getByTestId("tab-decisions").click();
    await expect(page.getByText("CareerReality Compass snapshot")).toBeVisible();
    await page.reload();
    await page.getByTestId("tab-decisions").click();
    await expect(page.getByText("CareerReality Compass snapshot")).toBeVisible();
    await page.getByTestId("tab-watchlist").click();
    await expect(page.getByText("Acme Corp")).toBeVisible();

    const events = await page.evaluate(() => (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ?? []);
    const names = (events as Array<{ name: string }>).map((event) => event.name);
    expect(names).toEqual(expect.arrayContaining([
      "compass_opened",
      "decision_tab_selected",
      "breakdown_opened",
      "notice_period_changed",
      "snapshot_saved",
      "company_added_to_watchlist",
      "workspace_opened",
    ]));
    const safeKeys = new Set([
      "route",
      "decision_key",
      "notice_period_band",
      "catalog_slug",
      "content_kind",
      "confidence_band",
      "location",
    ]);
    for (const event of events as Array<{ data?: Record<string, unknown> }>) {
      for (const key of Object.keys(event.data ?? {})) {
        expect(safeKeys.has(key), `Unexpected Compass analytics dimension: ${key}`).toBe(true);
      }
    }
  });

  test("updates Compass evidence, readout, and watchlist payload when the company changes", async ({ page }) => {
    test.fixme(true, "Requires owner-reviewed company and layoff evidence plus an approved signed-in QA session; synthetic example.test records must not be made publishable.");
    await signInForTest(page);
    await installCompassFixtures(page);
    const watchRequests: Array<{ company?: string; signal?: string }> = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/watchlist") && request.method() === "POST") {
        watchRequests.push(JSON.parse(request.postData() ?? "{}") as { company?: string; signal?: string });
      }
    });
    await page.goto("/compass");

    await page.getByTestId("compass-company").selectOption({ label: "Acme Corp" });
    await expect(page.getByText("Acme Corp needs one question")).toBeVisible();
    await expect(page.getByText("Acme Corp has a live signal")).toBeVisible();
    await expect(page.getByText(layoffSignal.signal)).toBeVisible();
    await expect(page.locator(".compass-readout-title")).toContainText("Acme Corp");
    await expect(page.getByTestId("compass-stability-signal")).toContainText("76 / 100");

    await page.getByTestId("compass-company").selectOption({ label: "Northstar Labs" });
    await expect(page.getByText("Northstar Labs needs one question")).toBeVisible();
    await expect(page.getByText("Northstar Labs has no matched radar signal")).toBeVisible();
    await expect(page.getByText("No matching public layoff signal is available for this company; that is not proof of safety.")).toBeVisible();
    const layoffSignalRow = page.locator(".compass-signal").filter({ hasText: "Layoff exposure" });
    await expect(layoffSignalRow).toContainText("Unavailable");
    await expect(layoffSignalRow.locator(".compass-signal-fill")).toHaveAttribute("style", /width:\s*0%/);
    await expect(page.getByText("Acme Corp has a live signal")).toHaveCount(0);
    await expect(page.getByText(layoffSignal.signal)).toHaveCount(0);
    await expect(page.locator(".compass-readout-title")).toContainText("Northstar Labs");
    await expect(page.getByTestId("compass-stability-signal")).toContainText("42 / 100");

    await page.getByRole("button", { name: "Watch this company" }).click();
    await expect(page.getByRole("button", { name: "Watching in workspace" })).toBeVisible();
    expect(watchRequests.at(-1)).toMatchObject({
      company: secondCompany.name,
      signal: secondCompany.signal,
    });
  });

  test("returns a signed-out user to Compass after authentication", async ({ page }) => {
    await installCompassFixtures(page);
    await page.goto("/compass");
    await page.getByRole("button", { name: "Save snapshot" }).click();
    await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Fcompass/);
    await page.getByTestId("button-e2e-sign-in").click();
    await expect(page).toHaveURL(/\/compass\/?$/);
  });

  test("keeps Compass useful when the salary source fails independently", async ({ page }) => {
    await installCompassFixtures(page, { failSource: "salary" });
    await page.goto("/compass");
    await expect(page.getByText("Partial evidence. One or more source requests failed.", { exact: false })).toBeVisible();
    await expect(page.getByText("Salary benchmark · Retry")).toBeVisible();
    await expect(page.getByText("Salary benchmark unavailable")).toBeVisible();
    await expect(page.getByText("Acme Corp needs one question")).toHaveCount(0);
    await page.getByRole("button", { name: "Salary benchmark · Retry" }).click();
    await expect(page.getByText("Salary benchmark · Retry")).toHaveCount(0);
    await expect(page.getByText("Software engineer money has a range")).toHaveCount(0);
    await expect(page.getByText("New hiring is concentrated in revenue teams.")).toHaveCount(0);
  });

  test("withholds unverified company rows when the company source fails independently", async ({ page }) => {
    await installCompassFixtures(page, { failSource: "company" });
    await page.goto("/compass");

    await expect(page.getByText("Partial evidence. One or more source requests failed.", { exact: false })).toBeVisible();
    await expect(page.getByText("Company signal · Retry")).toBeVisible();
    await expect(page.getByText("Company evidence unavailable")).toBeVisible();
    await expect(page.getByTestId("compass-stability-signal")).toHaveCount(0);
    await expect(page.getByText("Choose a company for the radar")).toBeVisible();
    await expect(page.getByText("Software engineer money has a range")).toHaveCount(0);
    await expect(page.getByText("New hiring is concentrated in revenue teams.")).toHaveCount(0);
    await expect(page.getByTestId("compass-company").locator("option", { hasText: "Acme Corp" })).toHaveCount(0);
  });

  test("preserves salary and company reads when the layoff source fails independently", async ({ page }) => {
    await installCompassFixtures(page, { failSource: "layoff" });
    await page.goto("/compass");

    await expect(page.getByText("Partial evidence. One or more source requests failed.", { exact: false })).toBeVisible();
    await expect(page.getByText("Layoff radar · Retry")).toBeVisible();
    await expect(page.getByText("Layoff radar unavailable")).toBeVisible();
    await expect(page.getByText("The layoff source did not respond. Retry before treating this employer-specific risk as known.")).toBeVisible();
    await expect(page.getByTestId("compass-company").locator("option", { hasText: "Acme Corp" })).toHaveCount(0);
    await expect(page.getByText("Software engineer money has a range")).toHaveCount(0);
    await expect(page.getByText("Hiring has slowed in two teams.")).toHaveCount(0);
  });

  test("preserves Compass context across failed save and watch actions", async ({ page }) => {
    test.fixme(true, "Requires an approved signed-in QA session and owner-reviewed company evidence; the E2E auth shim cannot verify production authorization.");
    await signInForTest(page);
    await installCompassFixtures(page, { failAction: "save" });
    await page.goto("/compass");
    await page.getByRole("button", { name: "Save snapshot" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Could not save this read" })).toContainText("Could not save this read");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("button", { name: "Snapshot saved" })).toBeVisible();

    await page.reload();
    await installCompassFixtures(page, { failAction: "watchlist" });
    await page.getByTestId("compass-company").selectOption({ label: "Acme Corp" });
    await page.getByRole("button", { name: "Watch this company" }).click();
    await expect(page.getByRole("status")).toContainText("Could not add this company");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("button", { name: "Watching in workspace" })).toBeVisible();
  });

  test("offers a retry when the workspace decision list fails", async ({ page }) => {
    await signInForTest(page);
    await installCompassFixtures(page, { failWorkspace: true });
    await page.goto("/workspace");
    await page.getByTestId("tab-decisions").click();
    await expect(page.getByText("Could not load decisions.")).toBeVisible();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("No decisions recorded yet.")).toBeVisible();
  });

  test("calculates user-entered planning tools and keeps the Career Reality Index self-reported", async ({ page }) => {
    await page.goto("/salary-drop");
    await expect(page.getByTestId("result-salary-drop")).toContainText("Monthly estimated take-home change");
    await expect(page.getByTestId("result-salary-drop")).toContainText("0% variable realized");
    await expect(page.getByTestId("result-salary-drop")).toContainText("50% realized");
    await expect(page.getByTestId("result-salary-drop")).toContainText("100% realized");
    await page.getByTestId("input-new-ctc").fill("3000000");
    await expect(page.getByTestId("result-salary-drop")).toContainText("+₹");

    await page.goto("/escape-plan");
    await expect(page.getByTestId("escape-plan-next-action")).toContainText("Write the target role, location, and non-negotiables in one sentence.");
    await page.getByTestId("input-weekly-hours").fill("6");
    await expect(page.getByTestId("summary-escape-plan")).toContainText("48 hours available across 8 weeks");
    await page.getByTestId("button-task-0").click();
    await expect(page.getByTestId("escape-plan-readiness")).toContainText("1 of 5 actions marked complete");
    await expect(page.getByTestId("escape-plan-next-action")).toContainText("Collect three measurable outcomes from recent work.");

    await page.goto("/career-reality-index");
    await expect(page.getByRole("status")).toContainText("Answer all four signals");
    await expect(page.getByTestId("result-career-index")).not.toContainText("/ 100");
    await expect(page.getByTestId("result-career-index")).not.toContainText("The uncomfortable truth");
    await page.getByTestId("input-index-pay").selectOption("Satisfied");
    await page.getByTestId("input-index-stability").selectOption("Not satisfied");
    await page.getByTestId("input-index-optionality").selectOption("Not satisfied");
    await page.getByTestId("input-index-ai").selectOption("Neutral");
    await expect(page.getByTestId("result-career-index")).toContainText("Company confidence, Ability to move");
    await expect(page.getByTestId("result-career-index")).toContainText("company confidence Not satisfied");
    await expect(page.getByRole("link", { name: "Check employer evidence" })).toHaveAttribute("href", "/companies");
    await page.getByTestId("input-index-stability").selectOption("Satisfied");
    await page.getByTestId("input-index-optionality").selectOption("Satisfied");
    await page.getByTestId("input-index-ai").selectOption("Not satisfied");
    await expect(page.getByTestId("index-response-summary")).toContainText(/Company confidence\s*Satisfied/);
    await expect(page.getByTestId("index-response-summary")).toContainText(/Ability to move\s*Satisfied/);
    await expect(page.getByTestId("index-response-summary")).toContainText(/AI readiness\s*Not satisfied/);
    await expect(page.getByTestId("result-career-index")).toContainText("AI readiness for a closer look");
    await expect(page.getByRole("link", { name: "Assess task-level AI changes" })).toHaveAttribute("href", "/ai");
    await expect(page.getByTestId("result-career-index")).not.toContainText("/ 100");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ai");
    await expect(page.getByTestId("ai-pulse-selector")).toContainText("No role-level score is published.");
    await expect(page.getByTestId("ai-pulse-selector")).not.toContainText("/ 100");
    await expect(page.getByTestId("ai-pulse-selector")).not.toContainText("noindex");
    await page.getByTestId("ai-sample-role-2").click();
    await expect(page.getByTestId("ai-sample-role-2")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("ai-pulse-selector")).toContainText("Ask who sets constraints, selects a direction, and validates the result with users.");
    const aiTaskInput = page.getByTestId("input-ai-task-name");
    await expect(aiTaskInput).toHaveAttribute("maxlength", "180");
    await aiTaskInput.fill("Approve a high-value payment");
    await expect(page.getByTestId("ai-task-length")).toHaveText("28 / 180 characters");
    await page.getByTestId("input-ai-repeatability").selectOption({ label: "Context-heavy" });
    await page.getByTestId("input-ai-error-impact").selectOption({ label: "High" });
    await page.getByTestId("input-ai-human-review").selectOption({ label: "No" });
    await expect(page.getByTestId("ai-task-readout")).toContainText("Keep a person accountable");
    await expect(page.getByTestId("ai-task-readout")).toContainText("verify every consequential output");
    await expect(page.getByTestId("ai-task-readout")).not.toContainText("/ 100");
    expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth)).toBe(true);
  });

  test("turns the Escape Plan checklist into an accessible completion loop", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await captureAnalytics(page);
    await page.goto("/escape-plan");

    const progress = page.getByRole("progressbar", { name: "Checklist actions marked complete" });
    await expect(progress).toHaveAttribute("aria-valuenow", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "5");
    await expect(page.getByTestId("escape-plan-progress")).toHaveText("0 / 5");
    await expect(page.getByTestId("escape-plan-readiness")).toContainText("0 of 5 actions marked complete.");

    await page.getByTestId("input-weekly-hours").fill("6");
    await expect(page.getByTestId("summary-escape-plan")).toContainText("hours available across");
    await page.getByTestId("input-weekly-hours").press("Tab");
    expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth)).toBe(true);

    for (let index = 0; index < 5; index += 1) {
      await page.getByTestId(`button-task-${index}`).click();
      await expect(progress).toHaveAttribute("aria-valuenow", `${index + 1}`);
    }

    await expect(page.getByTestId("escape-plan-progress")).toHaveText("5 / 5");
    await expect(page.getByTestId("escape-plan-readiness")).toContainText("5 of 5 actions marked complete.");
    await expect(page.getByTestId("escape-plan-next-action")).toContainText("Review which facts are confirmed and which questions remain open");
    for (let index = 0; index < 5; index += 1) {
      await expect(page.getByTestId(`button-task-${index}`)).toHaveAttribute("aria-pressed", "true");
    }

    const events = await page.evaluate(() => (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ?? []);
    const payload = JSON.stringify(events);
    expect(payload).toContain("escape_plan_completed");
    expect(payload).not.toContain("Write the role you want in one sentence");
  });

  test("keeps Escape Plan progress in page state and clears it on refresh", async ({ page }) => {
    await captureAnalytics(page);
    await page.goto("/escape-plan");
    await page.evaluate(() => window.localStorage.removeItem("careerreality.escape-plan.v1"));
    await page.reload();

    await page.getByTestId("input-escape-goal").selectOption("More money");
    await page.getByTestId("input-escape-weeks").selectOption("12 weeks");
    await page.getByTestId("input-weekly-hours").fill("6");
    await page.getByTestId("button-task-0").click();
    await page.getByTestId("button-task-1").click();
    await expect(page.getByTestId("escape-plan-progress")).toHaveText("2 / 5");

    await page.reload();
    await expect(page.getByTestId("input-escape-goal")).not.toHaveValue("More money");
    await expect(page.getByTestId("input-escape-weeks")).not.toHaveValue("12 weeks");
    await expect(page.getByTestId("input-weekly-hours")).toHaveValue("4");
    await expect(page.getByTestId("escape-plan-progress")).toHaveText("0 / 5");
    await expect(page.getByTestId("button-task-0")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("button-task-1")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("escape-plan-readiness")).toContainText("0 of 5 actions marked complete.");

    for (let index = 0; index < 5; index += 1) {
      await page.getByTestId(`button-task-${index}`).click();
    }
    await expect(page.getByTestId("escape-plan-progress")).toHaveText("5 / 5");

    const completedEvents = async () => {
      const events = await page.evaluate(() => (window as Window & { __e2eEvents?: Array<{ name: string }> }).__e2eEvents ?? []);
      return events.filter((event) => event.name === "escape_plan_completed");
    };
    expect((await completedEvents()).length).toBe(1);

    await page.reload();
    await expect(page.getByTestId("escape-plan-progress")).toHaveText("0 / 5");
    expect((await completedEvents()).length).toBe(1);
  });

  test("keeps self-reported Career Reality Index answers out of analytics", async ({ page }) => {
    await captureAnalytics(page);
    await page.goto("/career-reality-index");
    await page.getByTestId("input-index-pay").selectOption("Not satisfied");
    await page.getByTestId("input-index-stability").selectOption("Not satisfied");
    const eventsBeforeComplete = await page.evaluate(() => (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ?? []);
    expect(JSON.stringify(eventsBeforeComplete)).not.toContain("career_index_diagnosis_shown");
    await page.getByTestId("input-index-optionality").selectOption("Satisfied");
    await page.getByTestId("input-index-ai").selectOption("Neutral");
    await expect(page.getByTestId("result-career-index")).toContainText("You flagged Current pay, Company confidence for a closer look.");

    const events = await page.evaluate(() => (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ?? []);
    const payload = JSON.stringify(events);
    expect(payload).not.toContain("Not satisfied");
    expect(payload).not.toContain("Neutral");
    expect(payload).not.toContain("Pay power");
    expect(payload).not.toContain("Company stability");
    expect(payload).not.toContain("/ 100");
  });

  test("keeps the CTC calculator independent of the public salary feed", async ({ page }) => {
    const salaryRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/public/salary-benchmarks")) salaryRequests.push(request.url());
    });
    await page.goto("/salary-calculator");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("live-evidence")).toHaveCount(0);
    expect(salaryRequests).toHaveLength(0);
  });

  test("recomputes the Compass read from personal CTC inputs without a combined score", async ({ page }) => {
    await page.goto("/compass");

    await page.getByTestId("compass-offer-ctc").fill("1800000");
    await expect(page.locator(".compass-readout")).toContainText("₹18.00L annual CTC");
    await expect(page.locator(".compass-readout")).toContainText("−₹4.00L annual CTC");
    await expect(page.locator(".compass-readout")).toContainText("no combined score");

    await page.getByTestId("compass-role").selectOption({ label: "Product manager" });
    await page.getByTestId("compass-experience").selectOption({ label: "3–5 years" });
    await expect(page.getByTestId("compass-role")).toHaveValue("Product manager");
    await expect(page.getByTestId("compass-experience")).toHaveValue("3–5 years");
  });

  test("saves Career Reality Index reflections without leaking inputs to analytics", async ({ page }) => {
    await signInForTest(page);
    await captureAnalytics(page);
    await installApiFixtures(page);
    await page.goto("/career-reality-index");

    for (const name of ["pay", "stability", "optionality", "ai"]) {
      await page.getByTestId(`input-index-${name}`).selectOption("Super satisfied");
    }
    await expect(page.getByTestId("result-career-index")).toContainText("Your answers are positive; test one assumption.");
    await page.getByRole("button", { name: "Save to workspace" }).click();
    await expect(page.getByRole("button", { name: "Saved to workspace" })).toBeVisible();
    await page.getByRole("link", { name: "Open private workspace" }).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await page.getByTestId("tab-decisions").click();
    await expect(page.getByText("Career Reality Check: Your answers are positive; test one assumption.")).toBeVisible();

    const events = await page.evaluate(() => (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ?? []);
    const payload = JSON.stringify(events);
    expect(payload).not.toContain("Pay 90");
    expect(payload).not.toContain("Personalized index");
    expect(payload).not.toContain("/ 100");
    expect(payload).toContain("career_index_saved");
  });

  test("keeps the personalized Career Reality Index usable on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signInForTest(page);
    await captureAnalytics(page);
    await installApiFixtures(page);
    await page.goto("/career-reality-index");

    const viewportFits = () =>
      page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth);
    await expect.poll(viewportFits).toBe(true);

    for (const name of ["pay", "stability", "optionality", "ai"]) {
      await page.getByTestId(`input-index-${name}`).selectOption("Neutral");
    }
    await expect(page.getByTestId("result-career-index")).toContainText("Response-specific reflection · self-reported");

    const inputs = {
      pay: page.getByTestId("input-index-pay"),
      stability: page.getByTestId("input-index-stability"),
      optionality: page.getByTestId("input-index-optionality"),
      ai: page.getByTestId("input-index-ai"),
    };
    for (const input of Object.values(inputs)) {
      await expect(input).toBeVisible();
    }

    await expect(page.getByTestId("index-response-summary")).toContainText("Current pay");
    await expect(page.getByTestId("index-response-summary")).toContainText("Neutral");

    await inputs.pay.selectOption("Not satisfied");
    await inputs.stability.selectOption("Super satisfied");
    await inputs.optionality.selectOption("Satisfied");
    await inputs.ai.selectOption("Super satisfied");

    await expect(inputs.pay).toHaveValue("Not satisfied");
    await expect(inputs.stability).toHaveValue("Super satisfied");
    await expect(inputs.optionality).toHaveValue("Satisfied");
    await expect(inputs.ai).toHaveValue("Super satisfied");
    await expect(page.getByTestId("career-index-score")).toHaveCount(0);
    await expect(page.getByTestId("career-index-confidence")).toHaveCount(0);
    await expect(page.getByTestId("index-response-summary")).toContainText("Not satisfied");
    await expect.poll(viewportFits).toBe(true);

    const saveButton = page.getByRole("button", { name: "Save to workspace" });
    await saveButton.scrollIntoViewIfNeeded();
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page.getByRole("button", { name: "Saved to workspace" })).toBeVisible();

    const events = await page.evaluate(() => (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ?? []);
    const typedEvents = events as Array<{ name: string; data?: Record<string, unknown> }>;
    const safeKeys = new Set([
      "signal",
      "response_band",
      "diagnosis_type",
      "route",
      "catalog_slug",
      "content_kind",
      "confidence_band",
    ]);
    for (const event of typedEvents) {
      if (!event.name.startsWith("career_index_")) continue;
      for (const key of Object.keys(event.data ?? {})) {
        expect(safeKeys.has(key), `Unexpected Career Reality Index analytics dimension: ${key}`).toBe(true);
      }
    }
    const savedEvent = typedEvents.find((event) => event.name === "career_index_saved");
    expect(savedEvent?.data).toMatchObject({
      content_kind: "risk",
    });
    expect(savedEvent?.data).not.toHaveProperty("confidence_band");
    expect(savedEvent?.data.route).toMatch(/^\/career-reality-index\/?$/);
    const payload = JSON.stringify(typedEvents.filter((event) => event.name.startsWith("career_index_")));
    expect(payload).not.toContain("63 / 100");
    expect(payload).not.toContain("Current pay");
  });

  test("keeps the Career Reality Index usable across narrow and tablet viewports", async ({ page }) => {
    await signInForTest(page);
    await captureAnalytics(page);
    await installApiFixtures(page);

    const viewports = [
      { label: "extra-narrow phone", width: 320, height: 844 },
      { label: "tablet portrait", width: 768, height: 1024 },
      { label: "tablet landscape", width: 1024, height: 768 },
    ] as const;

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/career-reality-index");

      const viewportFits = await page.evaluate(
        () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth,
      );
      expect(viewportFits, `${viewport.label} should not overflow horizontally`).toBe(true);

      for (const name of ["pay", "stability", "optionality", "ai"]) {
        await expect(page.getByTestId(`input-index-${name}`), `${viewport.label} should show ${name} input`).toBeVisible();
      }
      for (const name of ["pay", "stability", "optionality", "ai"]) {
        await page.getByTestId(`input-index-${name}`).selectOption("Neutral");
      }
      await expect(page.getByTestId("index-response-summary")).toBeVisible();
      await expect(page.getByTestId("result-career-index")).toContainText("You left Current pay, Company confidence, Ability to move, AI readiness as open questions.");
      await expect(page.getByTestId("result-career-index")).not.toContainText("/ 100");

      const saveButton = page.getByRole("button", { name: "Save to workspace" });
      await saveButton.scrollIntoViewIfNeeded();
      await expect(saveButton, `${viewport.label} should show the save action`).toBeVisible();
      await saveButton.click();
      await expect(page.getByRole("button", { name: "Saved to workspace" })).toBeVisible();
    }

    const events = await page.evaluate(() => (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ?? []);
    const typedEvents = events as Array<{ name: string; data?: Record<string, unknown> }>;
    const safeKeys = new Set([
      "signal",
      "response_band",
      "diagnosis_type",
      "route",
      "catalog_slug",
      "content_kind",
      "confidence_band",
    ]);
    for (const event of typedEvents) {
      if (!event.name.startsWith("career_index_")) continue;
      for (const key of Object.keys(event.data ?? {})) {
        expect(safeKeys.has(key), `Unexpected Career Reality Index analytics dimension: ${key}`).toBe(true);
      }
    }
    const payload = JSON.stringify(typedEvents.filter((event) => event.name.startsWith("career_index_")));
    expect(payload).not.toContain("Not satisfied");
    expect(payload).not.toContain("Neutral");
    expect(payload).not.toContain("Super satisfied");
    expect(payload).not.toContain("Personalized index");
    expect(payload).not.toContain("You left Current pay, Company confidence, Ability to move, AI readiness as open questions.");
  });

  test("preserves the Career Reality Index visual hierarchy across viewports", async ({ page }) => {
    const viewports = [
      { name: "320", width: 320, height: 844 },
      { name: "768", width: 768, height: 1024 },
      { name: "1024", width: 1024, height: 768 },
    ] as const;

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/career-reality-index");
      await expect(page.getByTestId("result-career-index")).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await expect(page).toHaveScreenshot(`career-reality-index-${viewport.name}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        maxDiffPixelRatio: 0.005,
        scale: "css",
      });
    }
  });
});