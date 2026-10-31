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

const provenance = (status = 'VERIFIED', confidence = 'Medium') => ({
  status,
  sourceType: 'Official public report',
  publicationDate: '2026-09-08',
  retrievedDate: '2026-09-09',
  reviewedAt: '2026-09-10T10:00:00.000Z',
  metric: 'Annual compensation or employer signal',
  transformation: 'Published values were mapped to the requested market scope',
  methodologyName: 'Source-reported market signal',
  methodologyVersion: '1.0',
  methodologyInputs: ['Public source report'],
  methodologyCalculation: 'Use the reported value without adding missing observations',
  confidence,
  limitations: ['The source may not represent every worker or employer team'],
});

const datasetMeta = (dataset: string, sampleSize: number) => ({
  dataset,
  refreshedAt: '2026-09-09T08:00:00.000Z',
  source: 'CareerReality test fixture',
  methodology: 'Scoped deterministic fixture',
  confidence: 'High',
  sampleSize,
  coverage: 'complete',
  qualityNotes: 'Deterministic provenance fixture',
});

function json(route: any, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installHomeFixture(page: any, options: { partial?: boolean; profileMissing?: boolean; estimated?: boolean } = {}) {
  await page.addInitScript(() => {
    window.localStorage.setItem('career-reality-e2e-auth', 'signed-in');
  });
  await page.route('**/api/**', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/career/brief' && request.method() === 'GET') {
      if (options.profileMissing) {
        return json(route, {
          code: 'CAREER_PROFILE_NOT_CONFIGURED',
          error: 'Career profile setup is required before a brief can be generated',
        }, 404);
      }
      return json(route, brief);
    }
    if (path === '/api/public/salary-benchmarks' && request.method() === 'GET') {
      if (options.partial) return json(route, { error: 'No scoped benchmark returned' }, 503);
      return json(route, {
        data: [{
          id: 'salary-1',
          role: 'Senior Data Engineer',
          city: 'Bengaluru',
          experienceBand: '5–8 years',
          p25: 2400000,
          median: 3400000,
          p75: 4600000,
          sampleSize: 42,
          source: 'CareerReality benchmark',
          sourceUrl: 'https://example.test/salaries',
          confidence: 'Medium',
          provenance: provenance(options.estimated ? 'ESTIMATED' : 'VERIFIED'),
          observedAt: '2026-09-01T08:00:00.000Z',
          refreshedAt: '2026-09-09T08:00:00.000Z',
        }],
        meta: datasetMeta('salary', 42),
      });
    }
    if (path === '/api/public/companies' && request.method() === 'GET') {
      return json(route, {
        data: options.partial ? [] : [{
          id: 'company-1',
          slug: 'northstar-labs',
          name: 'Northstar Labs',
          sector: 'Technology',
          stability: 72,
          momentum: 'Selective hiring',
          signal: 'Hiring remains selective across the sector.',
          source: 'Public company signals',
          sourceUrl: 'https://example.test/companies/northstar-labs',
          confidence: 'Medium',
          provenance: provenance(),
          observedAt: '2026-09-01T08:00:00.000Z',
          refreshedAt: '2026-09-09T08:00:00.000Z',
        }],
        meta: datasetMeta('companies', options.partial ? 0 : 1),
      });
    }
    if (path === '/api/public/layoff-signals' && request.method() === 'GET') {
      return json(route, {
        data: options.partial ? [] : [{
          id: 'layoff-1',
          company: 'Northstar Labs',
          signal: 'No current layoff signal found.',
          type: 'Hiring signal',
          confidence: 'Low',
          source: 'Public layoff signals',
          sourceUrl: 'https://example.test/layoffs/northstar-labs',
          provenance: provenance('VERIFIED', 'Low'),
          observedAt: '2026-09-01T08:00:00.000Z',
          refreshedAt: '2026-09-09T08:00:00.000Z',
        }],
        meta: datasetMeta('layoffs', options.partial ? 0 : 1),
      });
    }
    if (path === '/api/career/actions' && request.method() === 'GET') {
      return json(route, []);
    }
    return route.continue();
  });
}

async function applyLargeSystemText(page: any) {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('[dir="auto"]').forEach((element) => {
      const computed = window.getComputedStyle(element);
      const fontSize = Number.parseFloat(computed.fontSize);
      const lineHeight = Number.parseFloat(computed.lineHeight);
      if (Number.isFinite(fontSize)) element.style.setProperty('font-size', `${fontSize * 1.45}px`, 'important');
      if (Number.isFinite(lineHeight)) element.style.setProperty('line-height', `${lineHeight * 1.45}px`, 'important');
    });
  });
}

async function expectComputedColor(locator: any, color: string) {
  await expect(locator).toHaveCSS('color', color);
}

test.use({
  viewport: { width: 390, height: 844 },
});

test('leads with a grounded read before the market detail', async ({ page }) => {
  await installHomeFixture(page);
  await page.goto('/(tabs)/?e2e-auth=signed-in');

  await expect(page.getByTestId('home-career-intelligence')).toContainText(brief.headline);
  await expect(page.getByText('WHAT THIS MEANS', { exact: true })).toBeVisible();
  await expect(page.getByText(brief.nextMove).first()).toBeVisible();
  await expect(page.getByText('₹24L — ₹46L')).toBeVisible();
  await expect(page.getByText('Evidence and method').first()).toBeVisible();
  await expect(page.getByText('source retrieved 2026-09-09').first()).toBeVisible();
  await expect(page.getByText('No company conclusion yet')).toBeVisible();
  await expect(page.getByText('Public stability signal')).toHaveCount(0);
  await expect(page.getByText('COMPANY WATCH', { exact: true })).toBeVisible();

  const meaningTop = await page.getByText('WHAT THIS MEANS', { exact: true }).boundingBox();
  const evidenceTop = await page.getByText('KNOWN EVIDENCE', { exact: true }).boundingBox();
  expect(meaningTop?.y).toBeLessThan(evidenceTop?.y ?? Number.POSITIVE_INFINITY);
});

test('keeps estimated salary evidence contextual and out of CTC comparisons', async ({ page }) => {
  await installHomeFixture(page, { estimated: true });
  await page.goto('/(tabs)/?e2e-auth=signed-in');

  await expect(page.getByText('Estimated · context only').first()).toBeVisible();
  await expect(page.getByText('Estimated evidence is context only and is excluded from decision scores.')).toBeVisible();
  await expect(page.getByText('not compared', { exact: false }).first()).toBeVisible();
  await expect(page.getByTestId('home-market-current-marker')).toHaveCount(0);
});

test('shows citation and method on the dedicated Market salary screen', async ({ page }) => {
  await installHomeFixture(page);
  await page.goto('/(tabs)/market?e2e-auth=signed-in');

  await expect(page.getByText('Evidence and method').first()).toBeVisible();
  await expect(page.getByText('Published 2026-09-08 · retrieved 2026-09-09 · reviewed 2026-09-10T10:00:00.000Z')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open cited market-data source' })).toBeVisible();
  await expect(page.getByTestId('salary-range-current-marker')).toHaveCount(1);
});

test('explains why company scores are withheld when source rows exist', async ({ page }) => {
  await installHomeFixture(page);
  await page.goto('/(tabs)/market?e2e-auth=signed-in');
  await page.getByTestId('market-tab-company').click();

  await expect(page.getByText('No scoped company signal')).toBeVisible();
  await expect(page.getByText(/company scores and rankings are withheld until a versioned methodology is approved/u)).toBeVisible();
  await expect(page.getByText('Public stability signal')).toHaveCount(0);
});

test('keeps partial market data useful without inventing a conclusion', async ({ page }) => {
  await installHomeFixture(page, { partial: true });
  await page.goto('/(tabs)/?e2e-auth=signed-in');

  await expect(page.getByText('Market range unavailable')).toBeVisible();
  await expect(page.getByText('Unknown is kept visible')).toBeVisible();
  await expect(page.getByText('No company conclusion yet')).toBeVisible();
  await expect(page.getByText('The source did not return a usable benchmark. This is an unknown, not a negative compensation conclusion.')).toBeVisible();
});

test('makes proof-point and Plan actions visible and reversible', async ({ page }) => {
  await installHomeFixture(page);
  await page.goto('/(tabs)/?e2e-auth=signed-in');

  await page.getByText('Add one proof point', { exact: true }).click();
  await expect(page.getByText('Write down one outcome where you aligned another team, changed a decision, or moved a measurable result.')).toBeVisible();

  await page.getByTestId('button-save-plan').click();
  await expect(page.getByText('Saved to Plan', { exact: true })).toBeVisible();
  await page.getByTestId('button-save-plan').click();
  await expect(page.getByText('Expected impact · High', { exact: true })).toBeVisible();

  await page.getByTestId('button-open-promotion-readiness').click();
  await expect(page.getByText('Open decision tool', { exact: false })).toBeVisible();
});

const smallDeviceProfiles = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'Galaxy S9+', width: 320, height: 658 },
];

for (const device of smallDeviceProfiles) {
  for (const colorScheme of ['light', 'dark']) {
    test.describe(`${device.name} ${colorScheme} Home`, () => {
      test.use({
        viewport: { width: device.width, height: device.height },
        colorScheme,
      });

      test('keeps the complete briefing readable above the tab bar', async ({ page }) => {
        await installHomeFixture(page);
        await page.goto('/(tabs)/?e2e-auth=signed-in');

        await expect(page.getByTestId('home-career-intelligence')).toContainText(brief.headline);
        await expect(page.getByText('WHAT THIS MEANS', { exact: true })).toBeVisible();
        await expect(page.getByText('KNOWN EVIDENCE', { exact: true })).toBeVisible();
        await expect(page.getByText('COMPANY WATCH', { exact: true })).toBeVisible();

    const scroll = page.getByTestId('screen-scroll');
        const sections = [
          page.getByText('Add one proof point', { exact: true }),
          page.getByText('One thing to do this week', { exact: true }),
          page.getByText('WHEN THE QUESTION CHANGES', { exact: true }),
          page.getByText('CAREER COPILOT', { exact: true }),
          page.getByText('Every conclusion is scoped to its source, freshness, confidence, and missing context. Unknown is a valid result.', { exact: true }),
        ];

        for (const section of sections) {
          await section.scrollIntoViewIfNeeded();
          await expect(section).toBeVisible();
        }

        await scroll.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
          element.dispatchEvent(new Event('scroll', { bubbles: true }));
        });

        const trustRail = sections[sections.length - 1];
        const trustRailBox = await trustRail.boundingBox();
        expect(trustRailBox).not.toBeNull();
        expect(trustRailBox!.y + trustRailBox!.height).toBeLessThanOrEqual(device.height - 84);

        if (colorScheme === 'dark') {
          const scrollColors = await scroll.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              background: style.backgroundColor,
              mediaMatches: window.matchMedia('(prefers-color-scheme: dark)').matches,
            };
          });
          expect(scrollColors.mediaMatches).toBe(true);
          expect(scrollColors.background).toBe('rgb(17, 26, 30)');
          await expect(page.getByText('Ask for the next move.', { exact: true })).toBeVisible();
        }
      });
    });
  }
}

test('keeps the Home briefing readable with larger system text', async ({ page }) => {
  await installHomeFixture(page);
  await page.goto('/(tabs)/?e2e-auth=signed-in');
  await applyLargeSystemText(page);

  const scroll = page.getByTestId('screen-scroll');
  const overflow = await scroll.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(overflow).toBe(false);

  const proofToggle = page.getByTestId('button-toggle-proof');
  await expect(proofToggle).toHaveAccessibleName('Add one proof point');
  await proofToggle.click();
  await expect(proofToggle).toHaveAccessibleName('Hide evidence prompts');
  await expect(page.getByText('Write down one outcome where you aligned another team, changed a decision, or moved a measurable result.')).toBeVisible();
  await expect(page.getByTestId('button-save-proof-draft')).toHaveAccessibleName('Save a draft proof point');

  const promotionTrigger = page.getByTestId('button-open-promotion-readiness');
  await expect(promotionTrigger).toHaveAccessibleName('Promotion readiness');
  await promotionTrigger.click();
  await expect(page.getByTestId('decision-tool-details-promotion')).toBeVisible();
  await expect(page.getByTestId('button-open-promotion')).toHaveAccessibleName('Open Promotion readiness decision tool');
  const importantSections = [
    page.getByText('Write down one outcome where you aligned another team, changed a decision, or moved a measurable result.'),
    page.getByTestId('button-save-proof-draft'),
    page.getByTestId('button-save-plan'),
    page.getByTestId('button-open-plan'),
    page.getByTestId('button-open-copilot'),
    page.getByText('Every conclusion is scoped to its source, freshness, confidence, and missing context. Unknown is a valid result.', { exact: true }),
  ];

  for (const section of importantSections) {
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
  }

  await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  const trustRail = importantSections[importantSections.length - 1];
  const trustRailBox = await trustRail.boundingBox();
  expect(trustRailBox).not.toBeNull();
  expect(trustRailBox!.y + trustRailBox!.height).toBeLessThanOrEqual(844 - 84);
});

test.describe('fallback states with larger system text', () => {
  test.use({
    viewport: { width: 320, height: 568 },
    colorScheme: 'dark',
  });

  test('keeps profile setup readable and its primary action reachable', async ({ page }) => {
    await installHomeFixture(page, { profileMissing: true });
    await page.goto('/(tabs)/?e2e-auth=signed-in');
    await applyLargeSystemText(page);

    const scroll = page.getByTestId('screen-scroll');
    const setup = page.getByTestId('home-profile-setup-needed');
    const action = setup.getByRole('button', { name: 'Build my brief' });
    const setupTitle = setup.getByText('Set up your career context');
    const setupBody = setup.getByText('Tell us your role, location, experience, current CTC, and direction. Your resume can come later.');

    await expect(setup).toBeVisible();
    await expect(setupTitle).toBeVisible();
    await expect(setupBody).toBeVisible();
    await expect(action).toBeVisible();
    await expect(setup).toHaveCSS('background-color', 'rgb(26, 39, 43)');
    await expectComputedColor(setupTitle, 'rgb(241, 244, 238)');
    await expectComputedColor(setupBody, 'rgb(180, 193, 190)');

    const overflow = await scroll.evaluate((element) => element.scrollWidth > element.clientWidth + 1);

    expect(overflow).toBe(false);

    await action.scrollIntoViewIfNeeded();
    const actionBox = await action.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(568 - 84);
  });

  test('keeps unavailable market evidence wrapped and visible', async ({ page }) => {
    await installHomeFixture(page, { partial: true });
    await page.goto('/(tabs)/?e2e-auth=signed-in');
    await applyLargeSystemText(page);

    const scroll = page.getByTestId('screen-scroll');
    const unavailableCopy = page.getByText(
      'The source did not return a usable benchmark. This is an unknown, not a negative compensation conclusion.',
      { exact: true },
    );
    const range = page.getByTestId('home-market-range');
    const unavailableTitle = range.getByText('Market range unavailable', { exact: true });

    await expect(page.getByText('Market range unavailable', { exact: true })).toBeVisible();
    await expect(page.getByText('Unknown is kept visible', { exact: true })).toBeVisible();
    await expect(page.getByText('No company conclusion yet', { exact: true })).toBeVisible();
    await unavailableCopy.scrollIntoViewIfNeeded();
    await expect(unavailableCopy).toBeVisible();
    await expect(range).toHaveCSS('background-color', 'rgb(26, 39, 43)');
    await expectComputedColor(unavailableTitle, 'rgb(241, 244, 238)');
    await expectComputedColor(unavailableCopy, 'rgb(180, 193, 190)');

    const overflow = await scroll.evaluate((element) => element.scrollWidth > element.clientWidth + 1);

    expect(overflow).toBe(false);

    const copyBox = await unavailableCopy.boundingBox();
    expect(copyBox).not.toBeNull();
    expect(copyBox!.y + copyBox!.height).toBeLessThanOrEqual(568 - 84);
  });
});

test('keeps enlarged Home actions named and in keyboard reading order', async ({ page }) => {
  await installHomeFixture(page);
  await page.goto('/(tabs)/?e2e-auth=signed-in');
  await applyLargeSystemText(page);

  const proofToggle = page.getByTestId('button-toggle-proof');
  await proofToggle.click();
  const promotionTrigger = page.getByTestId('button-open-promotion-readiness');
  await promotionTrigger.click();

  const controls = [
    page.getByTestId('icon-notifications'),
    page.getByTestId('button-toggle-proof'),
    page.getByTestId('button-save-proof-draft'),
    page.getByTestId('button-save-plan'),
    page.getByTestId('button-open-plan'),
    page.getByTestId('button-open-promotion-readiness'),
    page.getByTestId('button-open-promotion'),
    page.getByTestId('button-open-manager-risk'),
    page.getByTestId('button-open-relocation'),
    page.getByTestId('button-open-network-intelligence'),
    page.getByTestId('button-open-what-if'),
    page.getByTestId('button-open-peer-benchmarks'),
    page.getByTestId('button-open-copilot'),
  ];

  const expectedNames = [
    'Notifications',
    'Hide evidence prompts',
    'Save a draft proof point',
    'Save to Plan',
    'Open Plan',
    'Promotion readiness',
    'Open Promotion readiness decision tool',
    'Manager + team risk',
    'Relocation comparison',
    'Network intelligence',
    'What-if simulations',
    'Anonymous peer benchmarks',
    'Open Career Copilot',
  ];

  const expectedFocusOrder = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid]'),
    ).filter((element) => [
      'icon-notifications',
      'button-toggle-proof',
      'button-save-proof-draft',
      'button-save-plan',
      'button-open-plan',
      'button-open-promotion-readiness',
      'button-open-promotion',
      'button-open-manager-risk',
      'button-open-relocation',
      'button-open-network-intelligence',
      'button-open-what-if',
      'button-open-peer-benchmarks',
      'button-open-copilot',
    ].includes(element.dataset.testid ?? ''));
    return elements
      .sort((left, right) =>
        left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      )
      .map((element) => element.dataset.testid ?? '');
  });
  const visitedFocusOrder: string[] = [];
  const expectedFocusSet = new Set(expectedFocusOrder);
  await controls[0].focus();
  for (let attempt = 0; attempt < 80 && visitedFocusOrder.length < expectedFocusOrder.length; attempt += 1) {
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') ?? '',
    );
    if (
      expectedFocusSet.has(activeTestId) &&
      visitedFocusOrder.at(-1) !== activeTestId
    ) {
      visitedFocusOrder.push(activeTestId);
    }
    await page.keyboard.press('Tab');
  }
  expect(visitedFocusOrder).toEqual(expectedFocusOrder);

  for (const [index, control] of controls.entries()) {
    await control.focus();
    await expect(control).toBeFocused();
    await expect(control).toBeVisible();
    await expect(control).toHaveAccessibleName(expectedNames[index]);

    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);

    if (index < controls.length - 1) {
      await page.keyboard.press('Tab');
    }
  }

  await expect(page.getByTestId('decision-tool-details-promotion')).toBeVisible();
  await expect(page.getByText('Write down one outcome where you aligned another team, changed a decision, or moved a measurable result.')).toBeVisible();
});
