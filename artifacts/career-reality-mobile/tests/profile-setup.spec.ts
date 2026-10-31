// This test is executed by the web artifact's Playwright dependency.
// @ts-nocheck
import playwright from '../../career-reality/node_modules/@playwright/test';

const { expect, test } = playwright;

const brief = {
  headline: 'The market is rewarding visible ownership.',
  diagnosis: 'Your role has useful demand, but the next move needs evidence you can defend.',
  nextMove: 'Create one visible proof point and test it against three real roles this month.',
  freshness: 'Updated today',
  confidence: 'High',
  evidence: [
    {
      label: 'Role demand',
      value: 'Strong',
      source: 'Hiring index',
      freshness: 'Updated today',
      confidence: 'High',
    },
    {
      label: 'Company signal',
      value: 'Selective hiring',
      source: 'Public company signals',
      freshness: 'Updated today',
      confidence: 'Medium',
    },
  ],
};

function json(route: any, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installProfileMissingFixture(page: any) {
  await page.addInitScript(() => {
    window.localStorage.setItem('career-reality-e2e-auth', 'signed-in');
  });
  await page.route('**/api/**', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    const isBriefRequest = path === '/api/career/brief' && request.method() === 'GET';
    const isAskRequest = path === '/api/career/ask' && request.method() === 'POST';
    if (isBriefRequest || isAskRequest) {
      return json(route, {
        code: 'CAREER_PROFILE_NOT_CONFIGURED',
        error: 'Career profile setup is required before a brief can be generated',
      }, 404);
    }
    if (path === '/api/career/actions' && request.method() === 'GET') {
      return json(route, []);
    }
    return route.continue();
  });
}

async function installProfileCompletionFixture(page: any) {
  const syncedProfiles: Array<Record<string, string>> = [];
  const resumeUploadRequests: string[] = [];

  await page.addInitScript(() => {
    window.localStorage.setItem('career-reality-e2e-auth', 'signed-in');
  });
  await page.route('**/api/**', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/resume/intelligence' && request.method() === 'POST') {
      resumeUploadRequests.push(path);
      return json(route, { error: 'Resume processing is unavailable.' }, 404);
    }
    if (path === '/api/career/brief' && request.method() === 'GET') {
      return syncedProfiles.length > 0
        ? json(route, brief)
        : json(route, {
          code: 'CAREER_PROFILE_NOT_CONFIGURED',
          error: 'Career profile setup is required before a brief can be generated',
        }, 404);
    }
    if (path === '/api/career/profile' && request.method() === 'PUT') {
      const input = request.postDataJSON() as Record<string, string>;
      syncedProfiles.push(input);
      return json(route, input);
    }
    if (path === '/api/career/actions' && request.method() === 'GET') {
      return json(route, []);
    }
    return route.continue();
  });

  return { syncedProfiles, resumeUploadRequests };
}

test('explains profile setup on Home instead of showing a market conclusion', async ({ page }) => {
  await installProfileMissingFixture(page);
  await page.goto('/(tabs)/?e2e-auth=signed-in');

  const setup = page.getByTestId('home-profile-setup-needed');
  await expect(setup).toBeVisible();
  await expect(setup.getByText('Set up your career context')).toBeVisible();
  await expect(setup.getByRole('button', { name: 'Build my brief' })).toBeVisible();
  await expect(page.getByText('Your brief will answer')).toBeVisible();
});

test('explains profile setup in Plan and keeps current market moves hidden', async ({ page }) => {
  await installProfileMissingFixture(page);
  await page.goto('/(tabs)/plan?e2e-auth=signed-in');

  const setup = page.getByTestId('plan-profile-setup-needed');
  await expect(setup).toBeVisible();
  await expect(setup.getByText('Build the brief before you plan the move')).toBeVisible();
  await expect(setup.getByRole('button', { name: 'Build my brief' })).toBeVisible();
  await expect(page.getByTestId('plan-market-change-section')).toHaveCount(0);
});

test('explains profile setup in Copilot after the first personal-read request', async ({ page }) => {
  await installProfileMissingFixture(page);
  await page.goto('/copilot');

  const setup = page.getByTestId('copilot-profile-setup-needed');
  await expect(setup).toBeVisible();
  await expect(setup.getByText('Build your brief before asking for a personal read')).toBeVisible();
  await expect(setup.getByRole('button', { name: 'Build my brief' })).toBeVisible();
});

test('completes onboarding, syncs the profile, and unlocks the personal brief', async ({ page }) => {
  const { syncedProfiles, resumeUploadRequests } = await installProfileCompletionFixture(page);
  await page.goto('/(tabs)/?e2e-auth=signed-in');

  await page.getByTestId('home-profile-setup-needed').getByRole('button', { name: 'Build my brief' }).click();
  await expect(page.getByText('Start with the real you.')).toBeVisible();
  await page.getByPlaceholder('Shiv').fill('Asha');
  await page.getByPlaceholder('Working full-time in data engineering').fill('Working full-time in platform engineering');
  await page.getByTestId('button-onboarding-next').click();

  await expect(page.getByText('Give your market a location.')).toBeVisible();
  await page.getByPlaceholder('Company name or “independent”').fill('Northstar Labs');
  await page.getByPlaceholder('Bengaluru').fill('Pune');
  await page.getByTestId('button-onboarding-next').click();

  await expect(page.getByText('What would make this worth it?')).toBeVisible();
  await page.getByPlaceholder('Senior Data Engineer').fill('Senior Platform Engineer');
  await page.getByPlaceholder('₹31.5L or “prefer not to say”').fill('₹34L');
  await page.getByPlaceholder('8 years').fill('7 years');
  await page.getByPlaceholder('Staff Data Engineer').fill('Staff Platform Engineer');
  await page.getByTestId('button-onboarding-next').click();

  await expect(page.getByText('Continue without a resume.')).toBeVisible();
  await expect(page.getByTestId('text-resume-upload-paused')).toContainText('No resume is sent from this screen.');
  await expect(page.getByTestId('button-attach-resume')).toHaveCount(0);
  await page.getByTestId('button-onboarding-next').click();

  await expect.poll(() => syncedProfiles).toHaveLength(1);
  expect(resumeUploadRequests).toHaveLength(0);
  await expect(page.getByTestId('home-profile-setup-needed')).toHaveCount(0);
  const liveBrief = page.getByText(brief.diagnosis).last();
  await liveBrief.scrollIntoViewIfNeeded();
  await expect(liveBrief).toBeVisible();
  expect(syncedProfiles[0]).toMatchObject({
    name: 'Asha',
    situation: 'Working full-time in platform engineering',
    company: 'Northstar Labs',
    city: 'Pune',
    role: 'Senior Platform Engineer',
    ctc: '₹34L',
    experience: '7 years',
    target: 'Staff Platform Engineer',
  });

  await page.goto('/(tabs)/plan?e2e-auth=signed-in');
  await expect(page.getByTestId('plan-profile-setup-needed')).toHaveCount(0);
  await expect(page.getByText('Turn signals into moves.')).toBeVisible();

  await page.goto('/copilot?e2e-auth=signed-in');
  await expect(page.getByTestId('copilot-profile-setup-needed')).toHaveCount(0);
  await expect(page.getByText('Try a prompt')).toBeVisible();
  await expect(page.getByText('Senior Platform Engineer · Pune')).toBeVisible();
});