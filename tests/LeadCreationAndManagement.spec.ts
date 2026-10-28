import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LeadsPage } from '../pages/LeadPage';
import { generateUser } from '../utils/dataGenerator';

 test.describe('Lead Creation & Management', () => {
  test('Create lead and update status', async ({ page }) => {
    const homePage = new HomePage(page);
    const leadsPage = new LeadsPage(page);

    // Already logged in via storageState
    await homePage.goto();
    await homePage.isLoaded();

    const user = generateUser()
    // Create new lead
    const leadData = {
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      leadSource: 'Web',
      salutation: 'Mr.',
    };

    await homePage.searchFor('Sales');
    // Open lead page
    await leadsPage.openLeadsTab();
    // create lead 
    await leadsPage.createLead(leadData);
    // wait for lead detail page
    await leadsPage.waitForLeadDetail(leadData);
    
    // Validate Lead ID is 18-char
    const leadId = await leadsPage.getLeadId();
    if (!leadId) {
      throw new Error('Lead ID was not found in the current URL.');
    }
    expect(leadId.length).toBe(18);

    // Validate correct data in details view
    await leadsPage.openDetailsTab();
    const displayedCompany = await leadsPage.getLeadFieldValue('Company');
    expect(displayedCompany).toContain(leadData.company);
    
    const displayedName = await leadsPage.getLeadFieldValue('Name');
    const expectedName = `${leadData.salutation} ${leadData.firstName} ${leadData.lastName}`;
    expect(displayedName.trim()).toBe(expectedName);

    // Update lead status
    const newStatus = 'Closed - Converted';
    await leadsPage.changeStatus(newStatus);
  });
});