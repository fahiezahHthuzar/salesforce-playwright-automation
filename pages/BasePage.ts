import type { Page } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path = ''): Promise<void> {
    await this.page.goto(path);
  }

  // no one uses this; should not be written here
  // if every page uses this function, it should live in base page
  async waitForAppLauncher(): Promise<void> {
    await this.page.getByRole('button', { name: 'App Launcher' }).waitFor();
  }
 

}