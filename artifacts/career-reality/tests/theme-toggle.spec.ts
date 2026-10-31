import { expect, test } from "./fixtures";

test("theme toggle switches modes and persists across navigation", async ({ page }) => {
  await page.goto("/");

  const toggle = page.getByTestId("button-theme-toggle");
  await expect(toggle).toHaveAttribute("aria-label", "Switch to dark mode");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", "Switch to light mode");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.goto("/articles");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTestId("button-theme-toggle")).toHaveAttribute("aria-label", "Switch to light mode");

  await page.goto("/article/indian-it-layoff-cycle-2026");
  const heldArticleHeading = page.getByRole("heading", { level: 1, name: "This article is not published." });
  await expect(heldArticleHeading).toBeVisible();
  const headingUsesThemeForeground = await heldArticleHeading.evaluate((element) => {
    const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
    const probe = document.createElement("span");
    probe.style.color = `hsl(${foreground})`;
    document.body.appendChild(probe);
    const expected = getComputedStyle(probe).color;
    const actual = getComputedStyle(element).color;
    probe.remove();
    return actual === expected;
  });
  expect(headingUsesThemeForeground).toBeTruthy();

  await page.getByTestId("button-theme-toggle").click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});