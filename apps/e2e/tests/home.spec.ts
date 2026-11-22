import { expect, test } from './fixtures.ts';

test('home page shows API status and the items chart', async ({ page, capture }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  await expect(page.getByText('API ok')).toBeVisible();
  await expect(page.getByText('Database up')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Items per day' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Items created per day' })).toBeVisible();

  await capture('home');
});
