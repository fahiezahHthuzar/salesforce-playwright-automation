import { expect, test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LeadsPage } from '../pages/LeadPage';
import { generateUser } from '../utils/dataGenerator';

test.describe('Negative scenarios for Lead management', () => {
  test('shows validation errors when required lead fields are missing', async ({ page }) => {
    const homePage = new HomePage(page);
    const leadsPage = new LeadsPage(page);

    await homePage.goto();
    await homePage.isLoaded();
    await homePage.searchFor('Sales');
    await leadsPage.openLeadsTab();

    await leadsPage.leadsList.waitFor();
    await leadsPage.leadsList.click();
    await leadsPage.newButton.waitFor();
    await leadsPage.newButton.click();

    await leadsPage.saveButton.click();

    await expect(page.getByRole('heading', { name: 'We hit a snag.' })).toBeVisible();
    await expect(page.getByText('Last NameComplete this field.')).toBeVisible();
    await expect(page.getByText('CompanyComplete this field.')).toBeVisible();


    //await expect(page.getByText(/required|complete this field|missing/i)).toBeVisible();
    //await expect(page.getByRole('textbox', { name: 'First Name' })).toBeVisible();
  
  });

  test('prevents duplicate lead creation when email already exists', async ({ page }) => {
    const homePage = new HomePage(page);
    const leadsPage = new LeadsPage(page);

    const user = generateUser();
    const duplicateLead = {
      salutation: user.salutation,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      email: user.email,
    };

    await homePage.goto();
    await homePage.isLoaded();
    await homePage.searchFor('Sales');
    await leadsPage.openLeadsTab();

    await leadsPage.leadsList.waitFor();
    await leadsPage.leadsList.click();
    await leadsPage.newButton.waitFor();
    await leadsPage.newButton.click();

    await page.getByRole('textbox', { name: 'First Name' }).fill(duplicateLead.firstName);
    await page.getByRole('textbox', { name: 'Last Name' }).fill(duplicateLead.lastName);
    await page.getByRole('textbox', { name: 'Company' }).fill(duplicateLead.company);
    await page.getByRole('textbox', { name: 'Email' }).fill('tester@gmail.com');

    await leadsPage.saveButton.click();

    await leadsPage.openLeadsTab();

    await leadsPage.leadsList.waitFor();
    await leadsPage.leadsList.click();
    await leadsPage.newButton.waitFor();
    await leadsPage.newButton.click();
    await page.getByRole('textbox', { name: 'First Name' }).fill(duplicateLead.firstName);
    await page.getByRole('textbox', { name: 'Last Name' }).fill(duplicateLead.lastName);
    await page.getByRole('textbox', { name: 'Company' }).fill(duplicateLead.company);
    await page.getByRole('textbox', { name: 'Email' }).fill('tester@gmail.com');
    await leadsPage.saveButton.click();
    await expect(page.getByRole('heading', { name: 'Similar Records Exist' })).toBeVisible();
    await expect(page.getByText('This record looks like an')).toBeVisible();

  });
});
