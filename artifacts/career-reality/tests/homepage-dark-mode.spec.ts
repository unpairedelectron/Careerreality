import { expect, test } from "./fixtures";

const viewports = [
  { name: "320", width: 320, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 1200 },
] as const;

test.describe("homepage dark-mode layout", () => {
  test("keeps the landing page composed across responsive widths", async ({ page }) => {
    test.setTimeout(120_000);
    for (const [index, viewport] of viewports.entries()) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      if (index === 0) {
        await page.goto("/");
        await page.evaluate(() => window.localStorage.removeItem("career-reality-theme"));
        await page.reload();
      }

      const themeToggles = page.getByTestId("button-theme-toggle");
      await expect(themeToggles.first()).toHaveAttribute("aria-label", "Switch to dark mode");
      if (viewport.width < 1024) {
        await page.getByTestId("button-mobile-menu").click();
      }
      const visibleThemeToggle = page.getByTestId("button-theme-toggle").nth(viewport.width < 1024 ? 1 : 0);
      await expect(visibleThemeToggle).toBeVisible();
      await visibleThemeToggle.click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(visibleThemeToggle).toHaveAttribute("aria-label", "Switch to light mode");
      if (viewport.width < 1024) {
        await page.getByTestId("button-mobile-menu").click();
        await expect(page.getByTestId("button-mobile-menu")).toHaveAttribute("aria-expanded", "false");
      }

      await page.evaluate(async () => {
        await document.fonts.ready;
      });

      await expect(page.getByRole("heading", { name: /Look past the headline CTC.*Keep it yours/i })).toBeVisible();

      const viewportFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      expect(viewportFits, `${viewport.name}px homepage should not overflow horizontally in dark mode`).toBe(true);

      await expect(page).toHaveScreenshot(`homepage-dark-mode-${viewport.name}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        mask: [page.getByTestId("iframe-launch-film")],
        maxDiffPixelRatio: 0.005,
        scale: "css",
      });

      if (viewport.width < 1024) {
        await page.getByTestId("button-mobile-menu").click();
        await page.getByTestId("button-theme-toggle").nth(1).click();
        await page.getByTestId("button-mobile-menu").click();
      } else {
        await page.getByTestId("button-theme-toggle").first().click();
      }
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await page.evaluate(() => window.localStorage.removeItem("career-reality-theme"));
    }
  });
});