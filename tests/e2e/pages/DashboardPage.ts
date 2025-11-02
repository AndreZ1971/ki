import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly dashboardTitle: Locator;
  readonly logoutButton: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTitle = page.locator('h1');
    this.logoutButton = page.locator('button:has-text("Logout")');
    this.userMenu = page.locator('.user-menu');
  }

  async navigate() {
    await this.page.goto('/dashboard');
  }

  async isDashboardVisible(): Promise<boolean> {
    return await this.dashboardTitle.isVisible();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
