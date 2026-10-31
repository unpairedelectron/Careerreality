import { expect, test } from "./fixtures";
import { readFileSync } from "node:fs";

test("Compass breakdown exposes its relationship and follows keyboard activation", async ({ page }) => {
  await page.goto("/compass");
  const toggle = page.getByRole("button", { name: /^(Show|Hide) breakdown/ });
  const panel = page.locator("#compass-breakdown-panel");
  await expect(toggle).toHaveAttribute("aria-controls", "compass-breakdown-panel");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(panel).toHaveAttribute("inert", "");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect(panel).not.toHaveAttribute("inert");
  await expect(panel).toBeVisible();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(panel).toHaveAttribute("inert", "");
});

test("retired controls stay retired and the retained category buttons expose selection", async ({ page }) => {
  const editorial = readFileSync(new URL("../src/pages/public-editorial.tsx", import.meta.url), "utf8");
  expect(editorial).toContain("aria-pressed={selected === value}");
  await page.goto("/topic-clusters");
  await expect(page).toHaveURL(/\/guides\/?$/);
  await page.goto("/layoff-radar");
  await expect(page).toHaveURL(/\/layoff-runway\/?$/);
  await expect(page.getByRole("button", { name: "Report a signal" })).toHaveCount(0);
  await page.goto("/pro");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Membership is not available");
  await expect(page.getByRole("button", { name: /^(Monthly|Annual)$/ })).toHaveCount(0);
});

for (const dark of [false, true]) {
  test(`report textarea styling has a keyboard-visible ring in ${dark ? "dark" : "light"} mode`, async ({ page }) => {
    // The report route is retired. Exercise its exact retained textarea classes
    // against the real stylesheet without restoring a public reporting flow.
    const tools = readFileSync(new URL("../src/pages/public-tools.tsx", import.meta.url), "utf8");
    const classes = tools.match(/<textarea\b[\s\S]*?className="([^"]+)"/)?.[1];
    expect(classes).toBeTruthy();
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Membership is not available");
    await page.evaluate(({ classes, dark }) => {
      document.documentElement.classList.toggle("dark", dark);
      const textarea = document.createElement("textarea");
      textarea.className = classes!;
      textarea.setAttribute("aria-label", "Report focus fixture");
      document.body.appendChild(textarea);
      textarea.focus();
    }, { classes, dark });
    const field = page.getByRole("textbox", { name: "Report focus fixture" });
    await field.press("a");
    await expect(field).toBeFocused();
    const ring = await field.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        focusVisible: element.matches(":focus-visible"),
        shadow: style.boxShadow,
        ringColor: style.getPropertyValue("--tw-ring-color").trim(),
        themeRing: `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--ring").trim()})`,
      };
    });
    expect(ring.focusVisible).toBe(true);
    expect(ring.shadow).not.toBe("none");
    expect(ring.shadow).toContain("2px");
    expect(ring.ringColor).toBe(ring.themeRing);
  });
}
