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

  async searchFor(keyword: string): Promise<void> {
    await this.appLauncher.waitFor({ state: 'visible', timeout: 20000 });
    await this.appLauncher.click();

    await this.searchAppsInput.waitFor({ state: 'visible', timeout: 20000 });
    await this.searchAppsInput.fill(keyword);

    const appOption = this.page.getByRole('option', { name: new RegExp(keyword, 'i') }).first();
    await appOption.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    if (await appOption.isVisible().catch(() => false)) {
      await appOption.click();
    }
  }
}
