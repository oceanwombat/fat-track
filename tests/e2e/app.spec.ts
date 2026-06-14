import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end regression suite for the offline-first calorie logger.
 *
 * These mirror the manual verification done when the app was built. Each test
 * runs in a fresh browser context, so IndexedDB starts empty — no cross-test
 * state. They exercise the real UI (clicking, typing) against the production
 * build, which is where the offline/IndexedDB/sync behavior actually lives.
 */

async function logEntry(page: Page, kcal: string, description: string) {
  const before = await page.locator('.entry').count();
  await page.click('.log-button');
  await page.fill('.log-form__kcal', kcal);
  if (description) await page.fill('.log-form__desc', description);
  await page.click('.btn--primary');
  // The list re-renders by reading back from IndexedDB, so waiting for the new
  // row guarantees the write committed before the next action (e.g. reload).
  await expect(page.locator('.entry')).toHaveCount(before + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('starts empty with a zero total', async ({ page }) => {
  await expect(page.locator('.summary__value')).toHaveText('0');
  await expect(page.locator('.empty')).toBeVisible();
  await expect(page.locator('.entry')).toHaveCount(0);
});

test('logging an entry updates the total and the list', async ({ page }) => {
  await logEntry(page, '650', 'Lunch burrito');

  await expect(page.locator('.entry')).toHaveCount(1);
  await expect(page.locator('.summary__value')).toHaveText('650');
  await expect(page.locator('.entry__desc').first()).toHaveText('Lunch burrito');
  await expect(page.locator('.entry__kcal').first()).toHaveText('650');
});

test('entries are listed newest-first and the total sums them', async ({ page }) => {
  await logEntry(page, '650', 'Lunch burrito');
  await logEntry(page, '220', 'Apple');

  await expect(page.locator('.entry')).toHaveCount(2);
  await expect(page.locator('.summary__value')).toHaveText('870');
  // Reverse-chronological: the most recent entry is on top.
  await expect(page.locator('.entry__desc')).toHaveText(['Apple', 'Lunch burrito']);
});

test('new entries are marked unsynced', async ({ page }) => {
  await logEntry(page, '300', 'Snack');
  await expect(page.locator('.entry__dot')).not.toHaveClass(/entry__dot--synced/);
});

test('entries persist across a page reload (IndexedDB)', async ({ page }) => {
  await logEntry(page, '650', 'Lunch burrito');
  await logEntry(page, '220', 'Apple');

  await page.reload();

  await expect(page.locator('.entry')).toHaveCount(2);
  await expect(page.locator('.summary__value')).toHaveText('870');
  await expect(page.locator('.entry__desc')).toHaveText(['Apple', 'Lunch burrito']);
});

test('sync without a configured server fails gracefully and keeps rows queued', async ({ page }) => {
  // No VITE_SYNC_URL is set in the build, so sync must not lose or mutate data.
  await logEntry(page, '500', 'Dinner');

  await expect(page.locator('.btn--sync')).toHaveText('Sync (1)');
  await page.click('.btn--sync');

  await expect(page.locator('.sync__status')).toHaveText('Failed: No sync server configured yet');
  // The entry is still present and still unsynced.
  await expect(page.locator('.entry')).toHaveCount(1);
  await expect(page.locator('.entry__dot')).not.toHaveClass(/entry__dot--synced/);
});

test('an empty kcal value is rejected and adds nothing', async ({ page }) => {
  await page.click('.log-button');
  await page.fill('.log-form__desc', 'no calories given');
  await page.click('.btn--primary');

  // Form stays open (submit guarded) and no entry was created.
  await expect(page.locator('.log-form')).toBeVisible();
  await expect(page.locator('.entry')).toHaveCount(0);
});

test('a non-integer kcal value is blocked by native validation', async ({ page }) => {
  await page.click('.log-button');
  await page.fill('.log-form__kcal', '12.5');

  // step="1" makes 12.5 invalid; the browser blocks the form submit entirely.
  const stepMismatch = await page
    .locator('.log-form__kcal')
    .evaluate((el: HTMLInputElement) => el.validity.stepMismatch);
  expect(stepMismatch).toBe(true);

  await page.click('.btn--primary');
  await expect(page.locator('.entry')).toHaveCount(0);
});

test('a zero or negative kcal value is rejected', async ({ page }) => {
  for (const bad of ['0', '-5']) {
    await page.click('.log-button');
    await page.fill('.log-form__kcal', bad);
    await page.click('.btn--primary');
    await expect(page.locator('.entry')).toHaveCount(0);
    // min="1" makes these invalid; close the still-open form before the next case.
    if (await page.locator('.btn--ghost').isVisible()) await page.click('.btn--ghost');
  }
});

test('an entry with no description renders a placeholder', async ({ page }) => {
  await logEntry(page, '100', '');
  await expect(page.locator('.entry')).toHaveCount(1);
  await expect(page.locator('.entry__desc').first()).toHaveText('—');
  await expect(page.locator('.summary__value')).toHaveText('100');
});
