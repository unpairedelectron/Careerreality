import { expect, test } from "./fixtures";

const route = "/interview-guides/data-scientist";
const questionId = "ds-separate-selection-and-final-test";
const key = "careerreality-guide-v1:data-scientist";

test("shows the public site footer on the guide directory and role page", async ({ page }) => {
  const footerNavigation = page.getByRole("navigation", { name: "Public CareerReality navigation" });
  await page.goto("/interview-guides");
  await expect(footerNavigation).toBeVisible();
  await expect(page.getByText("A career desk for India")).toBeVisible();

  await page.goto(route);
  await expect(footerNavigation).toBeVisible();
  await expect(page.getByText("A career desk for India")).toBeVisible();
});

test("persists local guide progress, supports backup, and sends no progress request", async ({ page }) => {
  const outgoing: Array<{ url: string; body: string }> = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") outgoing.push({ url: request.url(), body: request.postData() ?? "" });
  });
  await page.goto(route);
  await expect(page.getByRole("heading", { name: /Data Scientist interview guide/ })).toBeVisible();
  outgoing.length = 0;
  await page.getByTestId(`button-core-${questionId}`).click();
  await page.getByTestId(`button-complete-${questionId}`).click();
  await page.getByTestId("tab-readiness").click();
  await page.getByTestId("checkbox-readiness-foundations").check();

  const saved = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}"), key);
  expect(saved.core).toContain(questionId);
  expect(saved.completed).toContain(questionId);
  expect(saved.readiness).toContain("foundations");
  expect(outgoing).toEqual([]);

  await page.reload();
  await expect(page.getByTestId(`button-core-${questionId}`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId(`button-complete-${questionId}`)).toContainText("Revised");

  await page.getByText("Browser-only progress controls").click();
  const download = page.waitForEvent("download");
  await page.getByTestId("button-export-guide-progress").click();
  expect((await download).suggestedFilename()).toContain("data-scientist-study-progress.json");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("button-clear-guide-progress").click();
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe(JSON.stringify({ completed: [], readiness: [], core: [] }));
  await page.getByLabel("Choose study progress backup").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ version: 1, role: "data-scientist", progress: saved })),
  });
  await expect(page.getByTestId(`button-core-${questionId}`)).toHaveAttribute("aria-pressed", "true");
});

test("study toolkit, keyboard tabs, and narrow viewport remain usable", async ({ page }) => {
  await page.goto(route);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(6);
  await page.getByRole("tab", { name: /Readiness/ }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: /Study toolkit/ })).toHaveAttribute("aria-selected", "true");
  await page.getByTestId("select-study-days").selectOption("14");
  await expect(page.getByText("Day 14")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Common interview stages" })).toBeVisible();

  await page.evaluate(() => { window.print = () => { (window as any).__printCalled = true; }; });
  await page.getByTestId("button-print-pack").click();
  expect(await page.evaluate(() => Boolean((window as any).__printCalled))).toBeTruthy();

  await page.setViewportSize({ width: 640, height: 900 });
  const zoomDimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(zoomDimensions.body).toBeLessThanOrEqual(zoomDimensions.viewport + 1);

  await page.setViewportSize({ width: 320, height: 800 });
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
});
