import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { loginToSalesforce } from '../utils/salesforceLogin';

test('Validate successful login', async ({ page }) => {
  await loginToSalesforce(page);

  const homePage = new HomePage(page);
  const storagePath = 'storage/storageState.json';

  if (!fs.existsSync(storagePath)) {
    await page.context().storageState({ path: storagePath });
  }

  const storageState = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
  const cookieCount = Array.isArray(storageState.cookies) ? storageState.cookies.length : 0;

  console.log('Loaded cookies from storageState.json:', cookieCount);
  expect(cookieCount).toBeGreaterThan(0);

  await homePage.goto();
  await homePage.isLoaded();
});




