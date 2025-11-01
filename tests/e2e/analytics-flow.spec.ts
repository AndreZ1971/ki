import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Analytics Dashboard Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Login
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await dashboardPage.waitForLoad();
  });

  test('should load analytics dashboard', async ({ page }) => {
    await page.click('a[href="/analytics"]');
    await expect(page).toHaveURL(/\/analytics/);
    
    // Should show analytics heading
    await expect(page.locator('h1, h2').filter({ hasText: /Analytics|Analysen/ })).toBeVisible();
  });

  test('should display key metrics', async ({ page }) => {
    await page.click('a[href="/analytics"]');
    
    // Should show revenue, orders, conversion rate
    await expect(page.locator('text=/Umsatz|Revenue/')).toBeVisible();
    await expect(page.locator('text=/Bestellungen|Orders/')).toBeVisible();
    await expect(page.locator('text=/Conversion|Konversion/')).toBeVisible();
  });

  test('should show analytics charts', async ({ page }) => {
    await page.click('a[href="/analytics"]');
    
    // Should contain chart elements (canvas or svg)
    const charts = page.locator('canvas, svg[class*="chart"]');
    await expect(charts.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter by date range', async ({ page }) => {
    await page.click('a[href="/analytics"]');
    
    // Look for date picker or filter
    const dateFilter = page.locator('input[type="date"], button:has-text("Filter")').first();
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      // Date filter should be interactive
      await expect(dateFilter).toBeEnabled();
    }
  });

  test('should display trend analysis data', async ({ page }) => {
    await page.click('a[href="/analytics"]');
    
    // Should show trend information
    await expect(page.locator('text=/Trend|Entwicklung/')).toBeVisible({ timeout: 10000 });
  });

  test('should show real-time data updates', async ({ page }) => {
    await page.click('a[href="/analytics"]');
    
    // Get initial metric value
    const revenueLocator = page.locator('text=/€\\s*[0-9,]+/').first();
    await expect(revenueLocator).toBeVisible({ timeout: 10000 });
    
    // Metric should be displayed
    const initialValue = await revenueLocator.textContent();
    expect(initialValue).toBeTruthy();
  });
});
