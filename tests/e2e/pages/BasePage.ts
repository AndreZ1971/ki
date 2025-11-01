import { Page, Locator } from '@playwright/test';

/**
 * BasePage - Base class for all Page Objects
 * 
 * Provides common functionality for all page objects:
 * - Navigation
 * - Waiting mechanisms
 * - Common UI interactions
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(locator: Locator, timeout: number = 10000) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Click on an element with optional waiting
   */
  async clickElement(locator: Locator) {
    await locator.click();
  }

  /**
   * Fill a form field
   */
  async fillField(locator: Locator, value: string) {
    await locator.fill(value);
  }

  /**
   * Get text content of an element
   */
  async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for a specific duration (use sparingly)
   */
  async wait(milliseconds: number) {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Reload the current page
   */
  async reload() {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
}
