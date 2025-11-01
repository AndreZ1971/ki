import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage - Page Object for Login/Authentication
 * 
 * Handles:
 * - User login with email/password
 * - Password visibility toggle
 * - Error message display
 * - "Remember me" functionality
 * - Navigation to dashboard after successful login
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly showPasswordToggle: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Anmelden")');
    this.errorMessage = page.locator('[role="alert"], .error-message, .alert-error');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"][name="remember"]');
    this.showPasswordToggle = page.locator('button:has-text("Show"), button:has-text("Anzeigen")');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password"), a:has-text("Passwort vergessen")');
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.clickElement(this.loginButton);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return await this.getTextContent(this.errorMessage);
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility() {
    await this.clickElement(this.showPasswordToggle);
  }

  /**
   * Check if password is visible
   */
  async isPasswordVisible(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text';
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.clickElement(this.forgotPasswordLink);
  }

  /**
   * Wait for redirect after successful login
   */
  async waitForLoginSuccess(expectedUrl: string = '/dashboard') {
    await this.page.waitForURL(`**${expectedUrl}`, { timeout: 10000 });
  }

  /**
   * Check if login button is disabled
   */
  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }

  /**
   * Get email input value
   */
  async getEmailValue(): Promise<string> {
    return (await this.emailInput.inputValue()) || '';
  }

  /**
   * Get password input value
   */
  async getPasswordValue(): Promise<string> {
    return (await this.passwordInput.inputValue()) || '';
  }
}
