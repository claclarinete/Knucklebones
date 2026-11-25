import { expect, test } from '@playwright/test';

test('o site abre no lobby e o backend está no ar', async ({ page, request }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Knucklebones Online');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const response = await request.get('http://localhost:3000/health');
  expect(await response.json()).toEqual({ status: 'ok' });
});
