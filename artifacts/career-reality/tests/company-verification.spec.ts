import { expect, test } from "./fixtures";

test("company checks respond to entries without storing or sending them", async ({ page }) => {
  const marker = "private-input-check.invalid";
  const leakedRequests: string[] = [];
  page.on("request", (request) => {
    const requestContent = `${request.url()} ${request.postData() ?? ""}`;
    if (requestContent.includes(marker)) leakedRequests.push(requestContent);
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/companies/", { waitUntil: "domcontentloaded" });
  const mobileLayout = await page.locator(".cv-layout").evaluate((layout) => ({
    width: layout.clientWidth,
    scrollWidth: layout.scrollWidth,
    contentWidth: layout.querySelector(".cv-main-column")?.getBoundingClientRect().width ?? 0,
  }));
  expect(mobileLayout.scrollWidth).toBeLessThanOrEqual(mobileLayout.width + 1);
  expect(mobileLayout.contentWidth).toBeLessThanOrEqual(mobileLayout.width + 1);
  const breadcrumbSize = await page.getByRole("navigation", { name: "Breadcrumb" }).evaluate((nav) => ({
    width: nav.clientWidth,
    scrollWidth: nav.scrollWidth,
    currentText: nav.querySelector('[aria-current="page"]')?.textContent,
  }));
  expect(breadcrumbSize.scrollWidth).toBeLessThanOrEqual(breadcrumbSize.width + 1);
  expect(breadcrumbSize.currentText).toBe("Employer check");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Employer check" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check the employer behind the offer.");
  await expect(page.getByRole("table").last()).not.toContainText(/workspace|automated fetch|TLS\/network|HTTP 200/i);
  await expect(page.getByText("Swipe horizontally to see all columns.")).toHaveCount(2);
  await expect(page.getByText("Swipe horizontally to see all columns.").first()).toBeVisible();
  const domainStatus = page.getByTestId("status-domain-check");
  const initialDomainStatus = await domainStatus.innerText();

  await page.getByTestId("input-officialDomain").fill(marker);
  await page.getByTestId("input-recruiterDomain").fill("gmail.com");
  await expect(domainStatus).not.toHaveText(initialDomainStatus);

  await page.getByTestId("input-cinLlpIn").fill("not-a-company-id");
  await expect(page.getByTestId("status-identifier-shape")).toBeVisible();
  await expect(page.getByTestId("status-identifier-shape")).not.toContainText(/MCA verified/i);
  await page.getByTestId("input-cinLlpIn").fill("U74140TN2011PTC082268");
  const identifierStatus = page.getByTestId("status-identifier-shape");
  await expect(identifierStatus).toContainText("Local format helper");
  await expect(identifierStatus).toContainText("Local pattern match");
  await expect(identifierStatus).toContainText("No suitable MCA-published reference defining CIN segment meanings");
  await expect(identifierStatus).not.toContainText(/industry-code|state-code|company-type segment|serial segment/i);

  const browserState = await page.evaluate(() => ({
    url: location.href,
    localStorage: JSON.stringify(Object.entries(localStorage)),
    sessionStorage: JSON.stringify(Object.entries(sessionStorage)),
  }));
  expect(browserState.url).not.toContain(marker);
  expect(browserState.localStorage).not.toContain(marker);
  expect(browserState.sessionStorage).not.toContain(marker);
  expect(leakedRequests).toEqual([]);

  await page.getByTestId("button-clear-all").click();
  await expect(page.getByTestId("input-officialDomain")).toHaveValue("");
  await expect(page.getByTestId("input-recruiterDomain")).toHaveValue("");
  await expect(page.getByTestId("input-cinLlpIn")).toHaveValue("");
});
