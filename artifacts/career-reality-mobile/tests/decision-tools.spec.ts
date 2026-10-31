// This test is executed by the web artifact's Playwright dependency.
// @ts-nocheck
import playwright from '../../career-reality/node_modules/@playwright/test';

const { expect, test } = playwright;

test.use({
  viewport: { width: 390, height: 844 },
});

const trustFirstSections = [
  'Here is what we know',
  'Here is what it means for you',
  'Here is what we do not know',
  'Here is what you should do next',
];

async function installDeterministicInputs(page: any) {
  await page.route('**/api/**', (route: any) => route.abort());
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
}

async function expectTrustFirstSections(page: any) {
  for (const section of trustFirstSections) {
    await expect(page.getByText(section, { exact: true })).toBeVisible();
  }
}

test('keeps relocation comparison trustworthy and changes the city readout', async ({ page }) => {
  await installDeterministicInputs(page);
  await page.goto('/relocation');

  await expect(page.getByText('A PLANNING MODEL, NOT A VERDICT')).toBeVisible();
  await expectTrustFirstSections(page);
  await expect(page.getByText('Hyderabad is modelled at ₹12k less per month than Bengaluru.')).toBeVisible();

  await page.getByTestId('button-relocation-city-mumbai').click();

  await expect(page.getByTestId('button-relocation-city-mumbai')).toBeVisible();
  await expect(page.getByText('Mumbai is modelled at ₹23k more per month than Bengaluru.')).toBeVisible();
  await expect(page.getByText('The city figures are directional planning midpoints, not a live cost-of-living feed.')).toBeVisible();
});

test('routes relocation saves to sign-in without a live market dependency', async ({ page }) => {
  await installDeterministicInputs(page);
  await page.goto('/relocation');

  await page.getByRole('button', { name: 'Sign in to save this check' }).click();

  await expect(page).toHaveURL(/\/sign-in(?:\?|$)/);
  await expect(page.getByText('Make your next move with clarity.')).toBeVisible();
});

test('keeps network intelligence trustworthy and changes the signal readout', async ({ page }) => {
  await installDeterministicInputs(page);
  await page.goto('/network-intelligence');

  await expect(page.getByText('A SIGNAL CHECK, NOT A GRAPH LOOKUP')).toBeVisible();
  await expectTrustFirstSections(page);
  await expect(page.getByText('Evidence gap', { exact: true }).first()).toBeVisible();

  await page.getByTestId('button-network-recruiter-warm').click();
  await page.getByTestId('button-network-sponsor-possible').click();
  await page.getByTestId('button-network-recency-possible').click();
  await expect(page.getByText('Path to test', { exact: true }).first()).toBeVisible();

  await page.getByTestId('button-network-connection-warm').click();

  await expect(page.getByTestId('button-network-connection-warm')).toBeVisible();
  await expect(page.getByText('Warm path', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('This tool cannot see private messages, recruiter intent, or hiring decisions.')).toBeVisible();
});

test('routes network-intelligence saves to sign-in without a live recruiter dependency', async ({ page }) => {
  await installDeterministicInputs(page);
  await page.goto('/network-intelligence');

  await page.getByRole('button', { name: 'Sign in to save this move' }).click();

  await expect(page).toHaveURL(/\/sign-in(?:\?|$)/);
  await expect(page.getByText('Make your next move with clarity.')).toBeVisible();
});

test('compares offers and tax regimes using the shared calculation assumptions', async ({ page }) => {
  await installDeterministicInputs(page);
  await page.goto('/offer-tax-tools');

  await expect(page.getByText('Compare the money, not just the headline.')).toBeVisible();
  await page.getByTestId('input-currentctc').fill('2400000');
  await page.getByTestId('input-currentfixed').fill('2200000');
  await page.getByTestId('input-offerctc').fill('2800000');
  await page.getByTestId('input-offerfixed').fill('2500000');
  await page.getByRole('button', { name: 'Calculate comparison' }).click();
  await expect(page.getByText(/Current estimated monthly take-home/)).toBeVisible();
  await expect(page.getByText(/Offer estimated monthly take-home/)).toBeVisible();

  await page.getByRole('button', { name: 'Compare tax' }).click();
  await page.getByTestId('input-grossSalary').fill('2000000');
  await page.getByTestId('input-oldRegimeDeductions').fill('150000');
  await page.getByRole('button', { name: 'Calculate comparison' }).click();
  await expect(page.getByText(/New-regime estimated annual tax/)).toBeVisible();
  await expect(page.getByText(/Old-regime estimated annual tax/)).toBeVisible();
});