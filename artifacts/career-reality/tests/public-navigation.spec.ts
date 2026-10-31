import { expect, test } from "./fixtures";
import { publicSiteMap, sitemapSections } from "../src/data/site-map";

test("public navigation survives React rendering and client-side navigation", async ({ page }) => {
  await page.goto("/");
  // This React-only footer class is absent from the generated snapshot.
  await expect(page.locator("footer.cr-public-footer")).toBeAttached();
  const navigation = page.getByRole("navigation", { name: "Public CareerReality navigation", exact: true });

  for (const route of ["/", "/about", "/tools", "/guides", "/sitemap"]) {
    if (route !== "/") {
      await navigation.locator(`a[href="${route}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${route}/?$`));
    }
    await expect(navigation).toBeVisible();
    for (const item of publicSiteMap.flatMap((section) => section.items)) {
      await expect(navigation.getByRole("link", { name: item.label, exact: true })).toHaveAttribute("href", item.href);
    }
    await expect(navigation.locator('a[href^="/workspace"], a[href^="/sign-in"], a[href^="/sign-up"], a[href^="/admin"]')).toHaveCount(0);
  }

  for (const section of sitemapSections) {
    const directorySection = page.locator("main section").filter({
      has: page.getByRole("heading", { name: section.label, exact: true }),
    });
    for (const item of section.items) {
      await expect(directorySection.locator(`a[href="${item.path}"]`)).toContainText(item.title);
    }
  }
});
