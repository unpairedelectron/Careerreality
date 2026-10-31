// This test is executed by the web artifact's Playwright dependency.
// @ts-nocheck
import playwright from '../../career-reality/node_modules/@playwright/test';

const { expect, test } = playwright;

const refreshedAt = '2026-09-08T08:00:00.000Z';
const dueDate = new Date().toISOString().slice(0, 10);
const futureDate = '2099-01-15';

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

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installPlanFixtures(page: any, options: { briefFailures?: number } = {}) {
  const actions: Array<Record<string, unknown>> = [];
  let briefFailuresRemaining = options.briefFailures ?? 0;

  await page.route('**/api/**', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/career/brief' && request.method() === 'GET') {
      if (briefFailuresRemaining > 0) {
        briefFailuresRemaining -= 1;
        return json(route, { error: 'Career brief unavailable' }, 503);
      }
      return json(route, brief);
    }
    if (path === '/api/career/actions' && request.method() === 'GET') {
      return json(route, actions);
    }
    if (path === '/api/career/actions' && request.method() === 'POST') {
      const input = request.postDataJSON() as {
        title: string;
        body: string;
        source: string;
        dueDate: string;
        marketChangeId?: string;
      };
      const action = {
        id: 'market-action-1',
        ...input,
        kind: 'brief',
        status: 'open',
        createdAt: refreshedAt,
        completedAt: null,
      };
      actions.push(action);
      return json(route, action, 201);
    }
    if (path.startsWith('/api/career/actions/') && request.method() === 'PATCH') {
      const input = request.postDataJSON() as { status?: string; dueDate?: string };
      const action = actions.find((candidate) => candidate.id === path.split('/').pop());
      if (!action) return json(route, { error: 'Career action not found' }, 404);
      Object.assign(action, input);
      action.completedAt = input.status === 'completed' ? refreshedAt : null;
      return json(route, action);
    }
    return route.continue();
  });

}

test('hides stale market moves while unavailable, then restores fresh moves and deduplication after retry', async ({ page }) => {
  await installPlanFixtures(page, { briefFailures: 1 });
  await page.goto('/(tabs)/plan?e2e-auth=signed-in');

  const unavailableState = page.getByTestId('plan-market-unavailable');
  await expect(unavailableState).toBeVisible();
  await expect(unavailableState.getByText('The market read is unavailable.')).toBeVisible();
  await expect(unavailableState.getByRole('button', { name: 'Retry market read' })).toBeVisible();
  await expect(page.getByTestId('plan-market-change-section')).toHaveCount(0);
  await expect(page.getByText('Add this move to Plan')).toHaveCount(0);

  await unavailableState.getByRole('button', { name: 'Retry market read' }).click();
  await expect(page.getByTestId('plan-market-change-section')).toBeVisible();
  await expect(page.getByTestId('market-move-role-demand')).toBeVisible();
  await expect(page.getByTestId('market-move-company-signal')).toBeVisible();

  await page.getByTestId('market-move-role-demand').getByText('Add this move to Plan').click();
  await expect(page.getByTestId('market-move-role-demand').getByText('In your plan')).toBeVisible();
  await expect(page.getByTestId('market-move-role-demand').getByText('Add this move to Plan')).toHaveCount(0);
  await expect(page.getByTestId('plan-action-card-market-action-1')).toHaveCount(1);
});

test('keeps one market move and exposes complete, skip, reopen, and snooze states', async ({ page }) => {
  await installPlanFixtures(page);
  await page.goto('/(tabs)/plan?e2e-auth=signed-in');

  await expect(page.getByText('Market read → next moves')).toBeVisible();
  await expect(page.getByTestId('market-move-role-demand')).toBeVisible();
  await expect(page.getByTestId('market-move-company-signal')).toBeVisible();

  await page.getByTestId('market-move-role-demand').getByText('Add this move to Plan').click();
  await expect(page.getByTestId('plan-action-card-market-action-1')).toBeVisible();
  await expect(page.getByText('Needs attention')).toBeVisible();
  await expect(page.getByText('1 open')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('plan-action-card-market-action-1')).toHaveCount(1);
  await expect(page.getByTestId('market-move-role-demand').getByText('In your plan')).toBeVisible();

  await page.getByTestId('button-plan-action-market-action-1').click();
  await expect(page.getByText('Closed loop')).toBeVisible();
  await expect(page.getByText('1 closed')).toBeVisible();
  await expect(page.getByTestId('button-plan-action-market-action-1').getByText('Completed')).toBeVisible();

  await page.getByTestId('button-plan-action-market-action-1').click();
  await page.getByTestId('button-plan-skip-market-action-1').click();
  await expect(page.getByTestId('button-plan-action-market-action-1').getByText('Skipped')).toBeVisible();
  await expect(page.getByText('1 closed')).toBeVisible();

  await page.getByTestId('button-plan-action-market-action-1').click();
  await page.getByTestId('button-plan-snooze-market-action-1').click();
  const snoozeInput = page.getByTestId('input-plan-snooze-date-market-action-1');
  await expect(snoozeInput).toBeVisible();
  await snoozeInput.fill(futureDate);
  const confirmSnooze = page.getByTestId('button-plan-snooze-confirm-market-action-1');
  await confirmSnooze.click();
  await expect(page.getByText('Upcoming')).toBeVisible();
  await expect(page.getByText('1 scheduled')).toBeVisible();
  await expect(page.getByTestId('button-plan-action-market-action-1')).toHaveAttribute('aria-label', /due Thu, 15 Jan/);
  await expect(page.getByTestId('plan-action-card-market-action-1')).toHaveCount(1);
});