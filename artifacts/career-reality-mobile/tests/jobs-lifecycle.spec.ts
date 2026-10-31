import { expect, test, type Page } from '@playwright/test';

const recommendation = {
  id: 'job-1',
  title: 'Senior Data Platform Engineer',
  company: 'Northstar Labs',
  location: 'Bengaluru · Hybrid',
  remoteType: 'hybrid',
  source: 'northstar',
  sourceName: 'Northstar careers',
  provenance: [{
    source: 'northstar',
    sourceName: 'Northstar careers',
    canonicalUrl: 'https://careers.northstar.example/jobs/1',
  }],
  canonicalUrl: 'https://careers.northstar.example/jobs/1',
  applyUrl: 'https://careers.northstar.example/jobs/1/apply',
  publishedAt: '2026-09-08T09:00:00.000Z',
  lastVerifiedAt: '2026-09-09T09:00:00.000Z',
  matchScore: 86,
  matchReason: 'Role signal: data, engineer appears in this opening.',
  matchEvidence: [
    'Role signal: data, engineer appears in this opening.',
    'Location: Bengaluru is listed for this role.',
  ],
  unknowns: ['Compensation is not listed; verify the range before investing time.'],
  applicationGuidance: 'Open the canonical employer application and verify the unknowns before applying.',
};

const recommendations = {
  jobs: [recommendation],
  feeds: [{
    id: 'northstar',
    name: 'Northstar careers',
    provider: 'greenhouse',
    status: 'healthy',
    lastCheckedAt: '2026-09-09T09:00:00.000Z',
    message: 'Feed is current.',
  }],
  searchLinks: [{
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs/search/?keywords=data',
  }],
  lastRefreshedAt: '2026-09-09T09:00:00.000Z',
  nextRefreshAt: '2026-09-09T15:00:00.000Z',
  deduplication: {
    rawListings: 1,
    mergedRoles: 1,
    duplicateGroups: 0,
    byProviderClass: [{
      providerClass: 'direct_ats',
      rawListings: 1,
      mergedRoles: 1,
      duplicateGroups: 0,
    }],
  },
  profileContext: {
    role: 'Senior Data Engineer',
    level: 'staff',
    city: 'Bengaluru',
    experience: '8 years',
    compensation: '₹31.5L',
    targetDirection: 'Staff Data Engineer',
  },
};

async function installSignedInFixture(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('career-reality-e2e-auth', 'signed-in');
  });
  await page.route('**/api/career/jobs**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(recommendations) });
      return;
    }
    await route.continue();
  });
}

test('shows profile-aware recommendations with evidence, unknowns, provenance, and freshness', async ({ page }) => {
  await installSignedInFixture(page);
  await page.goto('/jobs?e2e-auth=signed-in');

  const list = page.getByTestId('jobs-recommendations');
  await expect(list).toBeVisible();
  await expect(list.getByText('Roles matched to your actual next move.')).toBeVisible();
  await expect(page.getByTestId('jobs-profile-context')).toContainText('Staff Data Engineer');
  await expect(page.getByTestId('job-card-job-1')).toContainText('Why it fits');
  await expect(page.getByTestId('job-card-job-1')).toContainText('Still unknown');
  await expect(page.getByTestId('job-card-job-1')).toContainText('Northstar careers');
  await expect(page.getByTestId('job-card-job-1')).toContainText('Verified Sep 9');
  await expect(page.getByTestId('job-card-job-1')).toContainText('Apply on employer site');
  await expect(page.getByText('These links leave CareerReality.')).toBeVisible();
});

test('removes a recommendation after the user marks it applied', async ({ page }) => {
  await installSignedInFixture(page);
  await page.route('**/api/career/jobs/job-1/apply', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobId: 'job-1',
        status: 'applied',
        actedAt: '2026-09-09T09:00:00.000Z',
        applyUrl: recommendation.applyUrl,
      }),
    });
  });
  await page.goto('/jobs?e2e-auth=signed-in');
  await page.getByTestId('button-apply-job-job-1').click();
  await expect(page.getByTestId('jobs-empty')).toBeVisible();
  await expect(page.getByTestId('jobs-empty')).toContainText('No trusted matches yet.');
});

test('removes a recommendation after the user dismisses it', async ({ page }) => {
  await installSignedInFixture(page);
  await page.route('**/api/career/jobs/job-1/dismiss', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobId: 'job-1',
        status: 'dismissed',
        actedAt: '2026-09-09T09:00:00.000Z',
        applyUrl: null,
      }),
    });
  });
  await page.goto('/jobs?e2e-auth=signed-in');
  await page.getByTestId('button-dismiss-job-job-1').click();
  await expect(page.getByTestId('jobs-empty')).toBeVisible();
});

test('gives signed-out users a clear path to personalized job matching', async ({ page }) => {
  await page.goto('/jobs');

  await expect(page.getByTestId('jobs-coming-soon')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in to get matched roles' })).toBeVisible();
  await expect(page.getByText('No scraped listings. No stale links presented as current. No generic match score.')).toBeVisible();
});