import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * E2E Tests für Authentication Flow
 * 
 * Testet:
 * - Successful Login
 * - Failed Login (wrong credentials)
 * - Logout
 * - Session persistence
 * - Password visibility toggle
 */

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  // Test credentials (adjust based on your test environment)
  const validCredentials = {
    email: 'test@example.com',
    password: 'Test123!',
  };

  const invalidCredentials = {
    email: 'wrong@example.com',
    password: 'WrongPassword',
  };

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should display login form', async () => {
    await loginPage.navigate();
    
    expect(await loginPage.emailInput.isVisible()).toBeTruthy();
    expect(await loginPage.passwordInput.isVisible()).toBeTruthy();
    expect(await loginPage.loginButton.isVisible()).toBeTruthy();
  });

  test('should not submit empty form', async () => {
    await loginPage.navigate();
    
    // Try to submit without filling fields
    await loginPage.clickElement(loginPage.loginButton);
    
    // Should still be on login page
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  });

  test('should show error for invalid credentials', async () => {
    await loginPage.navigate();
    await loginPage.login(invalidCredentials.email, invalidCredentials.password);
    
    // Wait for error message
    const hasError = await loginPage.hasErrorMessage();
    expect(hasError).toBeTruthy();
    
    // Should still be on login page
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  });

  test('should toggle password visibility', async () => {
    await loginPage.navigate();
    await loginPage.fillField(loginPage.passwordInput, 'TestPassword');
    
    // Password should be hidden initially
    let isVisible = await loginPage.isPasswordVisible();
    expect(isVisible).toBeFalsy();
    
    // Toggle visibility
    await loginPage.togglePasswordVisibility();
    
    // Password should now be visible
    isVisible = await loginPage.isPasswordVisible();
    expect(isVisible).toBeTruthy();
  });

  test('should successfully login with valid credentials', async () => {
    await loginPage.navigate();
    await loginPage.login(validCredentials.email, validCredentials.password);
    
    // Should redirect to dashboard
    await loginPage.waitForLoginSuccess('/dashboard');
    
    // Should be on dashboard page
    const isOnDashboard = await dashboardPage.isOnDashboard();
    expect(isOnDashboard).toBeTruthy();
  });

  test('should remember login with "Remember Me"', async () => {
    await loginPage.navigate();
    await loginPage.login(validCredentials.email, validCredentials.password, true);
    
    // Wait for successful login
    await loginPage.waitForLoginSuccess('/dashboard');
    
    // Reload page
    await dashboardPage.reload();
    
    // Should still be logged in
    const isOnDashboard = await dashboardPage.isOnDashboard();
    expect(isOnDashboard).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginPage.navigate();
    await loginPage.login(validCredentials.email, validCredentials.password);
    await loginPage.waitForLoginSuccess('/dashboard');
    
    // Logout
    await dashboardPage.logout();
    
    // Should redirect to login page
    await dashboardPage.waitForLogoutRedirect('/login');
    
    // Should be on login page
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  });

  test('should not access dashboard without login', async ({ page, context }) => {
    // Clear all cookies to ensure we're logged out
    await context.clearCookies();
    
    // Try to access dashboard directly
    await dashboardPage.navigate();
    
    // Should redirect to login
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  });

  test('should maintain session across page reload', async () => {
    // Login
    await loginPage.navigate();
    await loginPage.login(validCredentials.email, validCredentials.password);
    await loginPage.waitForLoginSuccess('/dashboard');
    
    // Reload page
    await dashboardPage.reload();
    await dashboardPage.waitForPageLoad();
    
    // Should still be on dashboard
    const isOnDashboard = await dashboardPage.isOnDashboard();
    expect(isOnDashboard).toBeTruthy();
  });

  test('should validate email format', async () => {
    await loginPage.navigate();
    
    // Enter invalid email format
    await loginPage.fillField(loginPage.emailInput, 'invalid-email');
    await loginPage.fillField(loginPage.passwordInput, 'SomePassword');
    await loginPage.clickElement(loginPage.loginButton);
    
    // Should show validation error or prevent submission
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  });
});

test.describe('Login Page UI', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should display all UI elements', async () => {
    expect(await loginPage.emailInput.isVisible()).toBeTruthy();
    expect(await loginPage.passwordInput.isVisible()).toBeTruthy();
    expect(await loginPage.loginButton.isVisible()).toBeTruthy();
  });

  test('should have correct page title', async () => {
    const title = await loginPage.getTitle();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should focus email input on load', async () => {
    const isFocused = await loginPage.emailInput.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });
});
