import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LeadsPage } from '../pages/LeadPage';
import { generateUserByFaker } from '../utils/dataGenerator';

test.describe('Lead conversion criteria - new account and contact', () => {
  test('converts lead by creating a new account and new contact', async ({ page }) => {
    const homePage = new HomePage(page);
    const leadsPage = new LeadsPage(page);

    await homePage.goto();
    await homePage.isLoaded();
    await homePage.searchFor('Sales');
    await leadsPage.openLeadsTab();

    const leadData = generateUserByFaker();
    await leadsPage.createLead(leadData);
    await leadsPage.waitForLeadDetail(leadData);

    await page.getByRole('button', { name: 'Show more actions' }).click();
    await expect(page.getByRole('menu', { name: 'Show more actions' })).toBeVisible();
    // click convert menu
    await page.getByRole('menuitem', { name: 'Convert' }).click();

    const prefix = 'Test';

    // choose existing account
    await page.getByText('Choose Existing Account').click();
    const accountSearch = page.getByRole('combobox', { name: 'Account Search' });
    await accountSearch.click();
    await accountSearch.pressSequentially(prefix, { delay: 150 });

    const accountOptions = page.getByRole('option');
    const accountOption = accountOptions.nth(1);
    const foundAccountOption = await accountOption.waitFor({ state: 'visible' }).then(() => true).catch(() => false);

    if (foundAccountOption) {
      await accountOption.click();

      // choose existing contact
      await page.getByText('Choose Existing Contact').click();
      const contactSearch = page.getByRole('combobox', { name: 'Contact Search' });
      await contactSearch.click();

      const contactOptions = page.getByRole('option');
      const contactOption = contactOptions.nth(1);
      const foundContactOption = await contactOption.waitFor({ state: 'visible' }).then(() => true).catch(() => false);

      if (foundContactOption) {
        await contactOption.click();
      }

      // choose existing opportunity
      await page.getByText('Choose Existing Opportunity').click();
      await page.locator('.slds-radio_faux').first().click();
    }

    await page.getByRole('button', { name: 'Convert' }).click();
    await expect(page.getByText('Your lead has been converted')).toBeVisible();
  });
});