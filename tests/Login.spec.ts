import { expect, test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('Validate successful login', async ({ page, context }) => {
  const homePage = new HomePage(page);

  // Check cookies from storageState.json are present
  const cookies = await context.cookies();
  console.log('Loaded cookies:', cookies.length);
  expect(cookies.length).toBeGreaterThan(0);

  await homePage.goto();
  await homePage.isLoaded();
});

