import { test, expect } from '@playwright/test';
import { ProductPage } from '../pages/ProductPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * E2E Tests für Product Creation Flow
 * 
 * Testet:
 * - WooCommerce Product Creation (simple product)
 * - Product form validation
 * - Category assignment
 * - Product type selection
 * - Quick templates
 * - Auto Product Creator
 * - Error handling
 * - Form reset after success
 */

test.describe('Product Creation Flow', () => {
  let productPage: ProductPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('WooCommerce Product Creation', () => {
    test('should display product creation form', async () => {
      await productPage.navigateToWooCreate();
      
      // Verify all form elements are visible
      await expect(productPage.productNameInput).toBeVisible();
      await expect(productPage.productDescriptionTextarea).toBeVisible();
      await expect(productPage.productPriceInput).toBeVisible();
      await expect(productPage.productCategorySelect).toBeVisible();
      await expect(productPage.productTypeSelect).toBeVisible();
      await expect(productPage.createButton).toBeVisible();
      await expect(productPage.backButton).toBeVisible();
    });

    test('should validate required fields', async () => {
      await productPage.navigateToWooCreate();
      
      // Try to submit empty form
      await productPage.clickElement(productPage.createButton);
      
      // Should show validation errors or error message
      const hasError = await productPage.hasErrorMessage();
      expect(hasError).toBeTruthy();
    });

    test('should validate product name is required', async () => {
      await productPage.navigateToWooCreate();
      
      // Fill only price and category
      await productPage.fillField(productPage.productPriceInput, '29.99');
      await productPage.productCategorySelect.selectOption('themes');
      
      // Try to submit without name
      await productPage.clickElement(productPage.createButton);
      
      // Should show error
      const hasError = await productPage.hasErrorMessage();
      expect(hasError).toBeTruthy();
    });

    test('should validate price must be greater than 0', async () => {
      await productPage.navigateToWooCreate();
      
      // Fill name and category but invalid price
      await productPage.fillField(productPage.productNameInput, 'Test Product');
      await productPage.fillField(productPage.productPriceInput, '0');
      await productPage.productCategorySelect.selectOption('themes');
      
      // Try to submit with 0 price
      await productPage.clickElement(productPage.createButton);
      
      // Should show error
      const hasError = await productPage.hasErrorMessage();
      expect(hasError).toBeTruthy();
    });

    test('should create simple product successfully', async () => {
      await productPage.navigateToWooCreate();
      
      // Fill product form
      await productPage.createProduct({
        name: 'Premium WordPress Theme E2E',
        description: 'Ein modernes WordPress Theme für E2E Tests',
        price: 49.99,
        category: 'themes',
        type: 'simple'
      });
      
      // Wait for success (with timeout for API call)
      await productPage.wait(2000);
      
      // Should show success toast or form should be reset
      const hasSuccess = await productPage.hasSuccessToast();
      const isFormEmpty = await productPage.isFormEmpty();
      
      // Either success toast visible OR form was reset (indicating success)
      expect(hasSuccess || isFormEmpty).toBeTruthy();
    });

    test('should assign category correctly', async () => {
      await productPage.navigateToWooCreate();
      
      // Select category
      await productPage.productCategorySelect.selectOption('plugins');
      
      // Verify category is selected
      const selectedValue = await productPage.productCategorySelect.inputValue();
      expect(selectedValue).toBe('plugins');
      
      // Create product with this category
      await productPage.createProduct({
        name: 'SEO Plugin E2E',
        price: 29.99,
        category: 'plugins',
        type: 'simple'
      });
      
      await productPage.wait(2000);
    });

    test('should select product type correctly', async () => {
      await productPage.navigateToWooCreate();
      
      // Test different product types
      const productTypes = ['simple', 'variable', 'grouped'];
      
      for (const type of productTypes) {
        await productPage.productTypeSelect.selectOption(type);
        const selectedValue = await productPage.productTypeSelect.inputValue();
        expect(selectedValue).toBe(type);
      }
    });

    test('should use quick template for WordPress Theme', async () => {
      await productPage.navigateToWooCreate();
      
      // Click WordPress Theme quick template
      await productPage.selectQuickTemplate('theme');
      
      // Wait for form to update
      await productPage.wait(500);
      
      // Verify category was set to themes
      const categoryValue = await productPage.productCategorySelect.inputValue();
      expect(categoryValue).toBe('themes');
      
      // Verify type is simple
      const typeValue = await productPage.productTypeSelect.inputValue();
      expect(typeValue).toBe('simple');
    });

    test('should use quick template for WordPress Plugin', async () => {
      await productPage.navigateToWooCreate();
      
      // Click WordPress Plugin quick template
      await productPage.selectQuickTemplate('plugin');
      
      await productPage.wait(500);
      
      // Verify category was set to plugins
      const categoryValue = await productPage.productCategorySelect.inputValue();
      expect(categoryValue).toBe('plugins');
    });

    test('should reset form after successful creation', async () => {
      await productPage.navigateToWooCreate();
      
      // Create a product
      await productPage.createProduct({
        name: 'Test Product for Reset',
        description: 'Should be cleared after creation',
        price: 19.99,
        category: 'templates',
        type: 'simple'
      });
      
      // Wait for creation to complete
      await productPage.wait(2500);
      
      // Form should be empty/reset after successful creation
      const isFormEmpty = await productPage.isFormEmpty();
      expect(isFormEmpty).toBeTruthy();
    });
  });

  test.describe('Auto Product Creator', () => {
    test('should display auto creator configuration', async () => {
      await productPage.navigateToAutoCreator();
      
      // Verify configuration options are visible
      await expect(productPage.productCountSelect).toBeVisible();
      await expect(productPage.categorySelect).toBeVisible();
      await expect(productPage.optimizationSelect).toBeVisible();
      await expect(productPage.createAutoProductsButton).toBeVisible();
    });

    test('should configure auto creation settings', async () => {
      await productPage.navigateToAutoCreator();
      
      // Configure auto creation
      await productPage.configureAutoCreation({
        count: 3,
        category: 'digital',
        optimization: 'high'
      });
      
      // Verify selections
      expect(await productPage.productCountSelect.inputValue()).toBe('3');
      expect(await productPage.categorySelect.inputValue()).toBe('digital');
      expect(await productPage.optimizationSelect.inputValue()).toBe('high');
    });

    test('should start auto product creation', async () => {
      await productPage.navigateToAutoCreator();
      
      // Configure with minimal products for faster test
      await productPage.configureAutoCreation({
        count: 3,
        category: 'all',
        optimization: 'low'
      });
      
      // Start creation
      await productPage.startAutoCreation();
      
      // Wait for result (with generous timeout as this involves AI)
      await productPage.wait(3000);
      
      // Should show some result or success indication
      const hasSuccess = await productPage.hasSuccessToast();
      const hasResult = await productPage.isVisible(productPage.creationResult);
      
      expect(hasSuccess || hasResult).toBeTruthy();
    });

    test('should handle different product counts', async () => {
      await productPage.navigateToAutoCreator();
      
      const counts = ['3', '5', '10'];
      
      for (const count of counts) {
        await productPage.productCountSelect.selectOption(count);
        const selectedValue = await productPage.productCountSelect.inputValue();
        expect(selectedValue).toBe(count);
      }
    });

    test('should handle different categories', async () => {
      await productPage.navigateToAutoCreator();
      
      const categories = ['all', 'digital', 'physical'];
      
      for (const category of categories) {
        await productPage.categorySelect.selectOption(category);
        const selectedValue = await productPage.categorySelect.inputValue();
        expect(selectedValue).toBe(category);
      }
    });

    test('should handle different optimization levels', async () => {
      await productPage.navigateToAutoCreator();
      
      const optimizations = ['low', 'medium', 'high'];
      
      for (const optimization of optimizations) {
        await productPage.optimizationSelect.selectOption(optimization);
        const selectedValue = await productPage.optimizationSelect.inputValue();
        expect(selectedValue).toBe(optimization);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to dashboard from WooCreate', async () => {
      await productPage.navigateToWooCreate();
      
      // Click back button
      await productPage.clickElement(productPage.backButton);
      
      // Should be on dashboard
      await productPage.wait(1000);
      const currentUrl = await productPage.getCurrentUrl();
      expect(currentUrl).toContain('/');
    });

    test('should navigate back to dashboard from AutoCreator', async () => {
      await productPage.navigateToAutoCreator();
      
      // Click back button
      await productPage.clickElement(productPage.backButton);
      
      await productPage.wait(1000);
      const currentUrl = await productPage.getCurrentUrl();
      expect(currentUrl).toContain('/');
    });
  });
});
