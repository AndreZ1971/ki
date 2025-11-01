import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Email Marketing Flow', () => {
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

  test('should navigate to email marketing job', async ({ page }) => {
    // Navigate to Jobs page
    await page.click('a[href="/jobs"]');
    await expect(page).toHaveURL(/\/jobs/);
    
    // Check if Email Marketing Automation job is visible
    await expect(page.locator('text=Email Marketing Automation')).toBeVisible();
  });

  test('should display email marketing job details', async ({ page }) => {
    await page.click('a[href="/jobs"]');
    
    // Click on Email Marketing Automation
    await page.click('text=Email Marketing Automation');
    
    // Should show job description
    await expect(page.locator('text=Automatisierte E-Mail-Kampagnen')).toBeVisible();
  });

  test('should trigger email campaign generation', async ({ page }) => {
    await page.click('a[href="/jobs"]');
    
    // Find and click run button for Email Marketing
    const emailJobCard = page.locator('text=Email Marketing Automation').locator('..');
    await emailJobCard.locator('button:has-text("Start")').click();
    
    // Should show success message
    await expect(page.locator('text=Job gestartet')).toBeVisible({ timeout: 10000 });
  });

  test('should show campaign results after execution', async ({ page }) => {
    await page.click('a[href="/jobs"]');
    
    // Trigger job
    const emailJobCard = page.locator('text=Email Marketing Automation').locator('..');
    await emailJobCard.locator('button:has-text("Start")').click();
    
    // Wait for completion
    await expect(page.locator('text=Job abgeschlossen')).toBeVisible({ timeout: 30000 });
    
    // Should show results (number of emails sent)
    await expect(page.locator('text=/\\d+ E-Mails gesendet/')).toBeVisible();
  });

  test('should display campaign types', async ({ page }) => {
    await page.click('a[href="/jobs"]');
    await page.click('text=Email Marketing Automation');
    
    // Should show campaign types
    await expect(page.locator('text=Welcome Email')).toBeVisible();
    await expect(page.locator('text=Newsletter')).toBeVisible();
    await expect(page.locator('text=Product Recommendation')).toBeVisible();
  });

  test('should show DSGVO compliance information', async ({ page }) => {
    await page.click('a[href="/jobs"]');
    await page.click('text=Email Marketing Automation');
    
    // Should mention DSGVO
    await expect(page.locator('text=/DSGVO|Datenschutz/')).toBeVisible();
    await expect(page.locator('text=/Abmeldung|Unsubscribe/')).toBeVisible();
  });
});
