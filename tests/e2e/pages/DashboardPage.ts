import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage - Page Object for Dashboard
 * 
 * Handles:
 * - Dashboard navigation
 * - User menu interactions
 * - Logout functionality
 * - Analytics overview
 * - Quick action buttons
 */
export class DashboardPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly analyticsCard: Locator;
  readonly productsCard: Locator;
  readonly ordersCard: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.pageTitle = page.locator('h1, [data-testid="page-title"]');
    this.userMenu = page.locator('[data-testid="user-menu"], button:has-text("Profile"), button[aria-label="User menu"]');
    this.logoutButton = page.locator('button:has-text("Logout"), button:has-text("Abmelden"), a:has-text("Logout")');
    this.analyticsCard = page.locator('[data-testid="analytics-card"], .analytics-overview');
    this.productsCard = page.locator('[data-testid="products-card"], .products-overview');
    this.ordersCard = page.locator('[data-testid="orders-card"], .orders-overview');
    this.navigationMenu = page.locator('nav, [role="navigation"]');
  }

  /**
   * Navigate to dashboard page
   */
  async navigate() {
    await this.goto('/dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string> {
    return await this.getTextContent(this.pageTitle);
  }

  /**
   * Check if user is on dashboard
   */
  async isOnDashboard(): Promise<boolean> {
    const url = await this.getCurrentUrl();
    return url.includes('/dashboard');
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.clickElement(this.userMenu);
  }

  /**
   * Logout user
   */
  async logout() {
    await this.openUserMenu();
    await this.clickElement(this.logoutButton);
  }

  /**
   * Navigate to specific section via menu
   */
  async navigateTo(section: string) {
    const menuItem = this.page.locator(`a:has-text("${section}"), button:has-text("${section}")`);
    await this.clickElement(menuItem);
  }

  /**
   * Check if analytics card is visible
   */
  async hasAnalyticsCard(): Promise<boolean> {
    return await this.isVisible(this.analyticsCard);
  }

  /**
   * Check if products card is visible
   */
  async hasProductsCard(): Promise<boolean> {
    return await this.isVisible(this.productsCard);
  }

  /**
   * Check if orders card is visible
   */
  async hasOrdersCard(): Promise<boolean> {
    return await this.isVisible(this.ordersCard);
  }

  /**
   * Wait for logout redirect
   */
  async waitForLogoutRedirect(expectedUrl: string = '/login') {
    await this.page.waitForURL(`**${expectedUrl}`, { timeout: 10000 });
  }
}
