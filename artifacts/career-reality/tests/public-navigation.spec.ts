import { expect, test } from "./fixtures";
import { publicSiteMap, sitemapSections } from "../src/data/site-map";
import { withTrailingSlash } from "../src/lib/internal-href";

test("public navigation survives React rendering and client-side navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("home-below-fold-trigger").scrollIntoViewIfNeeded();
  // The footer is React-only and the homepage mounts it after the section is reached.
  await expect(page.locator("footer.cr-public-footer")).toBeAttached();
  const navigation = page.getByRole("navigation", { name: "Public CareerReality navigation", exact: true });

  for (const route of ["/", "/about", "/tools", "/guides", "/sitemap"]) {
    if (route !== "/") {
      await navigation.locator(`a[href="${withTrailingSlash(route)}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${route}/?$`));
    }
    await expect(navigation).toBeVisible();
    for (const item of publicSiteMap.flatMap((section) => section.items)) {
      await expect(navigation.getByRole("link", { name: item.label, exact: true })).toHaveAttribute("href", withTrailingSlash(item.href));
    }
    await expect(navigation.locator('a[href^="/workspace"], a[href^="/sign-in"], a[href^="/sign-up"], a[href^="/admin"]')).toHaveCount(0);
  }

  for (const section of sitemapSections) {
    const directorySection = page.locator("main section").filter({
      has: page.getByRole("heading", { name: section.label, exact: true }),
    });
    for (const item of section.items) {
      await expect(directorySection.locator(`a[href="${withTrailingSlash(item.path)}"]`)).toContainText(item.title);
    }
  }
});
