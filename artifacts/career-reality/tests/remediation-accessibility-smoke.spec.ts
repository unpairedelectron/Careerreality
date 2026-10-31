import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import routeRegistry from "../src/data/route-registry";

const publicRoutes = [
  "/",
  "/tools",
  "/salary-calculator",
  "/compass",
  "/resignation-risk",
  "/layoff-radar",
  "/offer-comparison",
  "/salary-drop",
  "/escape-plan",
  "/career-reality-index",
  "/ai",
  "/about",
  "/editorial",
  "/corrections",
  "/methodology",
  "/sources",
  "/privacy-policy",
  "/terms",
  "/contact",
];
const toolAndGuideRoutes = routeRegistry.routes.filter(
  (route) => route.kind === "tool" || route.kind === "guide",
);

async function expectBreadcrumbFits(page: Page, path: string) {
  const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
  if (!(await breadcrumb.count())) return;
  const dimensions = await breadcrumb.evaluate((element: HTMLElement) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth, `${path} breadcrumb clips horizontally`).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

test("public routes keep a single main heading and named controls at 320px", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.ok(), `${route} should return a successful response`).toBeTruthy();
    await page.evaluate((path) => {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    }, route);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expectBreadcrumbFits(page, route);

    const audit = await page.evaluate(() => {
      const isVisibleToAssistiveTech = (element: Element) =>
        !element.closest('[aria-hidden="true"], [hidden]');
      const hasName = (element: Element) => {
        const ariaName =
          element.getAttribute("aria-label") ??
          element.getAttribute("aria-labelledby");
        if (ariaName?.trim()) return true;
        if (element instanceof HTMLInputElement) {
          return element.type === "hidden" || Boolean(element.labels?.length);
        }
        if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
          return Boolean(element.labels?.length);
        }
        if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
          return Boolean(element.textContent?.trim() || element.getAttribute("title"));
        }
        return true;
      };
      const unnamedControls = Array.from(
        document.querySelectorAll("input, textarea, select, button, a"),
      )
        .filter(isVisibleToAssistiveTech)
        .filter((element) => !hasName(element))
        .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
      const imagesWithoutAlt = Array.from(document.querySelectorAll("img"))
        .filter(isVisibleToAssistiveTech)
        .filter((image) => !image.hasAttribute("alt"))
        .map((image) => image.getAttribute("src") ?? "(unknown image)");

      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        unnamedControls,
        imagesWithoutAlt,
      };
    });

    expect(audit.scrollWidth, `${route} has horizontal overflow`).toBeLessThanOrEqual(
      audit.width + 1,
    );
    expect(audit.unnamedControls, `${route} has unnamed controls`).toEqual([]);
    expect(audit.imagesWithoutAlt, `${route} has images without alt text`).toEqual([]);
  }
});

const routeBatchSize = 8;
const toolAndGuideRouteBatches = Array.from(
  { length: Math.ceil(toolAndGuideRoutes.length / routeBatchSize) },
  (_, index) => toolAndGuideRoutes.slice(index * routeBatchSize, (index + 1) * routeBatchSize),
);

for (const [batchIndex, routes] of toolAndGuideRouteBatches.entries()) {
  test(`tool and guide routes ${batchIndex + 1} remain readable and keyboard-visible at 360px`, async ({ page, request }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    for (const route of routes) {
      const response = await request.get(route.path);
      expect(response?.ok(), `${route.path} should return a successful response`).toBeTruthy();
      await page.evaluate((path) => {
        window.history.pushState(null, "", path);
        window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
      }, route.path);
      await expect(page.getByRole("main"), route.path).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 }), route.path).toHaveCount(1);
      await expectBreadcrumbFits(page, route.path);

      const audit = await page.evaluate(() => {
        const isVisibleToAssistiveTech = (element: Element) =>
          !element.closest('[aria-hidden="true"], [hidden]');
        const hasName = (element: Element) => {
          const ariaName = element.getAttribute("aria-label") ?? element.getAttribute("aria-labelledby");
          if (ariaName?.trim()) return true;
          if (element instanceof HTMLInputElement) {
            return element.type === "hidden" || Boolean(element.labels?.length);
          }
          if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            return Boolean(element.labels?.length);
          }
          if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
            return Boolean(element.textContent?.trim() || element.getAttribute("title"));
          }
          return true;
        };
        const unnamedControls = Array.from(document.querySelectorAll("input, textarea, select, button, a"))
          .filter(isVisibleToAssistiveTech)
          .filter((element) => !hasName(element))
          .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
        return {
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          unnamedControls,
          tablesWithoutScrollRegion: Array.from(document.querySelectorAll("table")).filter((table) => {
            const region = table.closest('[role="region"]');
            if (!region) return table.scrollWidth > table.clientWidth;
            const overflowX = getComputedStyle(region).overflowX;
            return table.scrollWidth > region.clientWidth && overflowX !== "auto" && overflowX !== "scroll";
          }).length,
        };
      });

      expect(audit.scrollWidth, `${route.path} has horizontal overflow`).toBeLessThanOrEqual(audit.width + 1);
      expect(audit.unnamedControls, `${route.path} has unnamed controls`).toEqual([]);
      expect(audit.tablesWithoutScrollRegion, `${route.path} has an unreadable table`).toBe(0);

      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      await page.keyboard.press("Tab");
      const focusHasVisibleIndicator = await page.evaluate(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !active.matches(":focus-visible")) return false;
        const rect = active.getBoundingClientRect();
        const style = getComputedStyle(active);
        const hasOutline = style.outlineStyle !== "none"
          && Number.parseFloat(style.outlineWidth) > 0
          && style.outlineColor !== "rgba(0, 0, 0, 0)";
        return rect.width > 0 && rect.height > 0 && (hasOutline || style.boxShadow !== "none");
      });
      expect(focusHasVisibleIndicator, `${route.path} has no visible keyboard focus indicator`).toBe(true);
    }
  });
}
