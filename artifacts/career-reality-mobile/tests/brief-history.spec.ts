// This test is executed by the web artifact's Playwright dependency.
// @ts-nocheck
import playwright from '../../career-reality/node_modules/@playwright/test';

const { expect, test } = playwright;

const brief = {
  headline: 'The market is rewarding visible ownership.',
  diagnosis: 'Your next move needs evidence you can defend.',
  nextMove: 'Create one visible proof point this month.',
  freshness: 'Updated today',
  confidence: 'High',
  evidence: [{
    label: 'Role demand',
    value: 'Strong',
    source: 'Hiring index',
    freshness: 'Updated today',
    confidence: 'High',
  }],
  whatChanged: {
    status: 'changed',
    summary: '1 material change found since the previous saved read.',
    details: [{
      category: 'evidence',
      summary: 'Role demand changed: Strong',
      source: 'Hiring index',
      freshness: 'Updated today',
    }],
  },
};

const history = {
  entries: [
    {
      id: 'read-2',
      createdAt: '2026-09-10T08:00:00.000Z',
      headline: brief.headline,
      confidence: 'High',
      evidence: [],
      change: {
        status: 'insufficient',
        summary: 'This refresh has less usable evidence than the previous read; no improvement is claimed.',
        details: [{
          category: 'evidence',
          summary: 'Role demand is no longer available in this read; this is a loss of evidence, not a positive signal.',
          source: 'Hiring index',
          freshness: 'Previous read',
        }],
      },
    },
    {
      id: 'read-1',
      createdAt: '2026-09-09T08:00:00.000Z',
      headline: 'Make the next move easier to defend.',
      confidence: 'Medium',
      evidence: [{
        label: 'Role demand',
        value: 'Strong',
        source: 'Hiring index',
        freshness: 'Updated yesterday',
        confidence: 'High',
      }],
      change: {
        status: 'initial',
        summary: 'This is the first saved career read.',
        details: [],
      },
    },
  ],
};

async function installHistoryFixture(page: any) {
  await page.addInitScript(() => {
    window.localStorage.setItem('career-reality-e2e-auth', 'signed-in');
  });
  await page.route('**/api/**', async (route: any) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/career/brief' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(brief) });
    }
    if (path === '/api/career/brief/history' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(history) });
    }
    if (path === '/api/career/actions' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.continue();
  });
}

test('opens the private read history from Home and shows provenance and evidence limits', async ({ page }) => {
  await installHistoryFixture(page);
  await page.goto('/(tabs)/?e2e-auth=signed-in');
  await page.getByTestId('button-open-brief-history').click();

  await expect(page.getByText('How your read changed', { exact: true })).toBeVisible();
  await expect(page.getByTestId('brief-history-entry-read-2')).toContainText('Not enough evidence');
  await expect(page.getByTestId('brief-history-entry-read-2')).toContainText('Hiring index · Previous read');
  await expect(page.getByTestId('brief-history-entry-read-2')).toContainText('no improvement is claimed');
  await expect(page.getByTestId('brief-history-entry-read-1')).toContainText('First read');
  await expect(page.getByTestId('brief-history-entry-read-1')).toContainText('Current evidence: Hiring index · Updated yesterday');
});

test('opens the same private history from Plan', async ({ page }) => {
  await installHistoryFixture(page);
  await page.goto('/(tabs)/plan?e2e-auth=signed-in');
  await page.getByTestId('button-open-brief-history').click();
  await expect(page.getByText('How your read changed', { exact: true })).toBeVisible();
  await expect(page.getByTestId('brief-history-entry-read-1')).toContainText('This is the first saved career read.');
});