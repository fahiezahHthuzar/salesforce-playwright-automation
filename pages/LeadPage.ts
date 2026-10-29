import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

type LeadData = {
  salutation?: string;
  firstName: string;
  lastName: string;
  company: string;
};

export class LeadsPage extends BasePage {
  readonly leadsTab: Locator;
  readonly leadsList: Locator;
  readonly newButton: Locator;
  readonly saveButton: Locator;
  readonly detailsTab: Locator;

  constructor(page: Page) {
    super(page);
    this.leadsTab = page.getByRole('link', { name: 'Leads' });
    this.leadsList = page.getByRole('button', { name: 'Leads List' });
    this.newButton = page.getByRole('menuitem', { name: 'New Lead' });
    this.saveButton = page.getByRole('button', { name: 'Save', exact: true });
    this.detailsTab = page.getByRole('tab', { name: 'Details' });
  }

  async openLeadsTab(): Promise<void> {
    await this.leadsTab.click();
    await this.page.waitForURL('**/lightning/o/Lead/**?filterName=**', { waitUntil: 'domcontentloaded' });
  }

  async openDetailsTab(): Promise<void> {
    await this.detailsTab.click();
    await this.page.getByText('Lead Owner').waitFor();
  }

  async createLead(lead: LeadData): Promise<void> {
    await this.leadsList.waitFor();
    await this.leadsList.click();

    await this.newButton.waitFor();
    await this.newButton.click();

    if (lead.salutation) {
      await this.page.getByRole('combobox', { name: 'Salutation' }).click();
      await this.page.getByRole('option', { name: lead.salutation }).click();
    }

    await this.page.getByRole('textbox', { name: 'First Name' }).fill(lead.firstName);
    await this.page.getByRole('textbox', { name: 'Last Name' }).fill(lead.lastName);
    await this.page.getByRole('textbox', { name: 'Company' }).fill(lead.company);

    const leadStatusCombo = this.page.getByRole('combobox', { name: 'Lead Status' });
    await leadStatusCombo.scrollIntoViewIfNeeded();

    try {
      await leadStatusCombo.click({ timeout: 1000 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Lead Status option click failed, continuing:', message);
    }

    try {
      await this.page.getByRole('option', { name: 'Working - Contacted' }).click({ timeout: 1000 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Lead Status option click failed, continuing:', message);
    }

    await this.saveButton.click();
  }

  async waitForLeadDetail(lead: LeadData): Promise<void> {
    const expectedName = `${lead.salutation ?? ''} ${lead.firstName} ${lead.lastName}`.trim();

    await this.page.waitForURL(/\/lightning\/r\/Lead\/[A-Za-z0-9]{15,18}\/view(?:[/?#]|$)/, {
      timeout: 20000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});

    await this.page.getByText(expectedName, { exact: false }).waitFor({ timeout: 20000 });
  }

  async getLeadId(): Promise<string | null> {
    const match = this.page.url().match(/\/Lead\/([A-Za-z0-9]{15,18})(?:\/|$)/);
    return match ? match[1] : null;
  }

  async getLeadFieldValue(fieldLabel: string): Promise<string> {
    const locator = this.page
      .locator('records-record-layout-item')
      .filter({ hasText: fieldLabel })
      .locator('lightning-formatted-text, lightning-formatted-name, lightning-formatted-email, lightning-formatted-phone');

    return locator.first().innerText();
  }

  async clickConvertAction(): Promise<void> {
    const actionMenu = this.page.getByRole('button', { name: 'Show more actions' });
    await actionMenu.waitFor({ state: 'visible', timeout: 20000 });
    await actionMenu.click();

    const convertAction = this.page.getByRole('menuitem', { name: /^Convert$/i });
    await convertAction.waitFor({ state: 'visible', timeout: 20000 });
    await convertAction.click();
  }

  async changeStatus(newStatus: string): Promise<void> {
    await this.page.locator('button[title="Edit Lead Status"]').click();

    await this.page.getByRole('combobox', { name: 'Status' }).click();
    await this.page.getByRole('option', { name: newStatus, exact: true }).click();

    await this.saveButton.click();
  }
}