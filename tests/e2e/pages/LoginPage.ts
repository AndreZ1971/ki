import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberCheckbox: Locator;
  readonly errorMessage: Locator;
  readonly showPasswordButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.rememberCheckbox = page.locator('input[type="checkbox"]');
    this.errorMessage = page.locator('.error-message');
    this.showPasswordButton = page.locator('button.show-password');
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string, remember: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (remember) {
      await this.rememberCheckbox.check();
    }
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    return await this.errorMessage.textContent();
  }

  async togglePasswordVisibility() {
    await this.showPasswordButton.click();
  }

  async isPasswordVisible(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text';
  }
}
