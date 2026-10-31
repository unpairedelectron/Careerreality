import { expect, test } from "./fixtures";
import type { Page, Route } from "@playwright/test";

type AnalyticsEvent = {
  name: string;
  data?: Record<string, unknown>;
};

const analyticsStorageKey = "career-reality-e2e-events";
const approvedKeys = new Set([
  "article_results",
  "catalog_slug",
  "city",
  "confidence_band",
  "content_kind",
  "experience_band",
  "location",
  "role_category",
  "route",
  "outcome",
  "submission_mode",
  "tool",
  "tool_results",
]);
const privacyCheckedEvents = [
  "search_results_viewed",
  "tool_discovered",
];
const requiredEvents = ["search_results_viewed"];

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function captureAnalytics(page: Page, signedIn = false) {
  await page.addInitScript(
    ({ analyticsStorageKey, signedIn }) => {
      const storedEvents = JSON.parse(
        window.localStorage.getItem(analyticsStorageKey) ?? "[]",
      ) as unknown[];
      (window as Window & { __e2eEvents?: unknown[] }).__e2eEvents =
        storedEvents;
      if (signedIn) {
        window.localStorage.setItem("career-reality-e2e-auth", "signed-in");
      }
      window.umami = {
        track(name, data) {
          const events =
            ((window as Window & { __e2eEvents?: unknown[] }).__e2eEvents ??=
              []);
          events.push({ name, data });
          window.localStorage.setItem(
            analyticsStorageKey,
            JSON.stringify(events),
          );
        },
      };
    },
    { analyticsStorageKey, signedIn },
  );
}

async function readEvents(page: Page): Promise<AnalyticsEvent[]> {
  return page.evaluate(
    (analyticsStorageKey) =>
      (JSON.parse(
        window.localStorage.getItem(analyticsStorageKey) ?? "[]",
      ) as AnalyticsEvent[]) ?? [],
    analyticsStorageKey,
  );
}

function expectPrivacySafe(events: AnalyticsEvent[]) {
  const relevantEvents = events.filter((event) =>
    privacyCheckedEvents.includes(event.name),
  );
  expect(
    relevantEvents.map((event) => event.name),
    "Expected every privacy-sensitive outcome event to be captured",
  ).toEqual(expect.arrayContaining(requiredEvents));

  for (const event of relevantEvents) {
    for (const key of Object.keys(event.data ?? {})) {
      expect(
        approvedKeys.has(key),
        `Unexpected analytics dimension in ${event.name}: ${key}`,
      ).toBe(true);
    }
  }

  const payload = JSON.stringify(relevantEvents);
  expect(payload).not.toMatch(
    /salary_amount|ctc_amount|monthly_take_home|report_company|report_description|search_query|query_text|article_copy|summary/,
  );
  expect(payload).not.toContain("2400000");
  expect(payload).not.toContain("Describe the signal");
  expect(payload).not.toContain("joining-bonus-clawback-offer-letter-traps-2026");
}

test.describe("privacy-safe analytics", () => {
  test("continues the user flow when the analytics provider is missing", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.addInitScript(() => {
      delete (window as Window & { umami?: unknown }).umami;
    });

    await page.goto("/salary-calculator");
    await page.getByTestId("input-annualFixedPay").fill("1700000");
    await expect(page.getByTestId("result-salary-calculator")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("continues the user flow when the analytics provider throws", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.addInitScript(() => {
      window.umami = {
        track() {
          throw new Error("analytics provider unavailable");
        },
      };
    });

    await page.goto("/salary-calculator");
    await page.getByTestId("input-annualFixedPay").fill("1700000");
    await expect(page.getByTestId("result-salary-calculator")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("keeps calculator amounts out of URLs, storage, analytics, and requests", async ({ page }) => {
    await captureAnalytics(page);
    const requests: string[] = [];
    page.on("request", (request) => requests.push(`${request.url()} ${request.postData() ?? ""}`));
    await page.goto("/salary-calculator");
    await page.getByTestId("input-annualCtc").fill("2400000");
    await expect(page.getByTestId("result-salary-calculator")).toBeVisible();

    const browserState = await page.evaluate(() => ({
      url: window.location.href,
      localStorage: JSON.stringify(window.localStorage),
      sessionStorage: JSON.stringify(window.sessionStorage),
    }));
    const events = await readEvents(page);
    const payload = JSON.stringify({ browserState, events, requests });
    expect(browserState.url).not.toMatch(/[?&](ctc|annualCtc|salary)=/i);
    expect(payload).not.toContain("2400000");
    expect(events.some((event) => event.name === "calculator_completed")).toBe(false);
    expect(events).toContainEqual({
      name: "decision_tool_completed",
      data: { tool_id: "ctc-calculator", platform: "web" },
    });
  });

  test("captures only categorical, route, slug, count, and confidence dimensions", async ({
    page,
  }) => {
    const requestData: string[] = [];
    page.on("request", (request) =>
      requestData.push(`${request.url()}\n${request.postData() ?? ""}`),
    );
    await captureAnalytics(page, true);
    await page.goto("/salary-calculator");
    await page.getByTestId("input-annualCtc").fill("2400000");

    await page.goto("/salary-drop");
    await page.getByTestId("input-current-ctc").fill("2400000");
    await page.getByTestId("input-new-ctc").fill("2100000");
    await page.getByTestId("input-variable-pay").fill("10");
    await page.getByTestId("input-monthly-cost").fill("80000");
    await page.getByTestId("input-buffer-months").fill("6");
    await expect(page.getByTestId("result-salary-drop")).toBeVisible();
    await expect(page.getByTestId("salary-drop-private-note")).toContainText(
      "does not send a contribution, save these inputs, write them to the URL, or include them in analytics",
    );
    const salaryDropBrowserState = await page.evaluate(() => ({
      url: window.location.href,
      localStorage: JSON.stringify(window.localStorage),
      sessionStorage: JSON.stringify(window.sessionStorage),
    }));
    expect(salaryDropBrowserState.url).not.toMatch(/[?&](current-ctc|new-ctc|variable-pay|monthly-cost|buffer-months)=/i);
    expect(JSON.stringify(salaryDropBrowserState)).not.toMatch(/2400000|2100000|80000/);
    expect(requestData.join("\n")).not.toMatch(/2400000|2100000|80000/);
    await page.goto("/layoff-radar");
    await expect(page).toHaveURL(/\/layoff-runway\/?$/);
    await expect(page.getByRole("button", { name: "Report a signal" })).toHaveCount(0);

    await page.goto("/search");
    await page.getByPlaceholder(/Try CTC, tax, PF, or offer/).fill("ctc");
    await expect(page.getByText("Active tools · 1")).toBeVisible();
    await page.getByRole("link", { name: /CTC decoder/ }).click();

    const events = await readEvents(page);
    expectPrivacySafe(events);
    const allEventData = JSON.stringify(events);
    expect(allEventData).not.toMatch(/2400000|2100000|80000/);
    expect(events.some((event) => event.name === "salary_contribution_submitted")).toBe(false);
    expect(events.find((event) => event.name === "search_results_viewed")?.data).toEqual({
      route: "/search",
      article_results: 0,
      tool_results: 1,
    });
    expect(events.some((event) => event.name === "signal_report_submitted")).toBe(false);
  });
});