import { expect, test } from "./fixtures";

test.describe("homepage entry points", () => {
  test("opens the CTC calculator without carrying salary inputs in the URL", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-below-fold-trigger").scrollIntoViewIfNeeded();

    await expect(page.getByTestId("form-home-ctc")).toContainText("does not collect or pass salary amounts");
    await expect(page.getByTestId("button-home-calculator")).toHaveAttribute("href", "/salary-calculator");
    await page.getByTestId("button-home-calculator").click();

    await expect(page).toHaveURL(/\/salary-calculator\/?$/);
    await expect(page.getByRole("heading", { name: "The offer says CTC. Your budget needs cash." })).toBeVisible();
    await expect(page.getByTestId("input-annualCtc")).toHaveValue("2000000");
    await expect(page).not.toHaveURL(/ctc=|city=/i);
  });
});