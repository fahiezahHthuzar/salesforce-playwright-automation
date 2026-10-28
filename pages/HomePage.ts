import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly appLauncher: Locator;
  readonly searchAppsInput: Locator;

  constructor(page: Page) {
    super(page);
    this.appLauncher = page.getByRole('button', { name: 'App Launcher' });
    this.searchAppsInput = page.getByRole('combobox', { name: 'Search apps and items...' });
  }

  async isLoaded(): Promise<void> {
    await this.appLauncher.waitFor();
  }

 
  async searchFor(keyword: string) {
    await this.appLauncher.click();
    await this.searchAppsInput.pressSequentially(keyword, { delay: 150 });
    await this.page
      .getByRole('option', { name: 'Sales', exact: true })
      .click();
  }


}
