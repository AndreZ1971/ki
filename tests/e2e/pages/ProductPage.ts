import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ProductPage - Page Object for Product Management
 * 
 * Handles product creation, editing, and management workflows
 */
export class ProductPage extends BasePage {
  // WooProductCreate page selectors
  readonly productNameInput: Locator;
  readonly productDescriptionTextarea: Locator;
  readonly productPriceInput: Locator;
  readonly productCategorySelect: Locator;
  readonly productTypeSelect: Locator;
  readonly createButton: Locator;
  readonly backButton: Locator;
  readonly errorMessage: Locator;
  readonly successToast: Locator;
  readonly validationErrors: Locator;

  // AutoProductCreator page selectors
  readonly productCountSelect: Locator;
  readonly categorySelect: Locator;
  readonly optimizationSelect: Locator;
  readonly createAutoProductsButton: Locator;
  readonly creationResult: Locator;

  constructor(page: Page) {
    super(page);

    // WooProductCreate selectors
    this.productNameInput = page.locator('input[type="text"]').first();
    this.productDescriptionTextarea = page.locator('textarea');
    this.productPriceInput = page.locator('input[type="number"]').first();
    this.productCategorySelect = page.locator('select').nth(0);
    this.productTypeSelect = page.locator('select').nth(1);
    this.createButton = page.locator('button:has-text("In WooCommerce erstellen")');
    this.backButton = page.locator('button:has-text("← Zurück")');
    this.errorMessage = page.locator('.error-message, .validation-errors');
    this.successToast = page.locator('.toast.success, .toast-success');
    this.validationErrors = page.locator('.validation-errors .error-item');

    // AutoProductCreator selectors
    this.productCountSelect = page.locator('select').first();
    this.categorySelect = page.locator('select').nth(1);
    this.optimizationSelect = page.locator('select').nth(2);
    this.createAutoProductsButton = page.locator('button:has-text("Produkte erstellen")');
    this.creationResult = page.locator('.result-section, .creation-result');
  }

  /**
   * Navigate to WooProductCreate page
   */
  async navigateToWooCreate() {
    await this.goto('/products/woo-create');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to AutoProductCreator page
   */
  async navigateToAutoCreator() {
    await this.goto('/products/auto-creator');
    await this.waitForPageLoad();
  }

  /**
   * Fill product form with data
   */
  async fillProductForm(productData: {
    name: string;
    description?: string;
    price: number;
    category: string;
    type?: string;
  }) {
    await this.fillField(this.productNameInput, productData.name);
    
    if (productData.description) {
      await this.fillField(this.productDescriptionTextarea, productData.description);
    }
    
    await this.fillField(this.productPriceInput, productData.price.toString());
    await this.productCategorySelect.selectOption(productData.category);
    
    if (productData.type) {
      await this.productTypeSelect.selectOption(productData.type);
    }
  }

  /**
   * Create a product
   */
  async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    category: string;
    type?: string;
  }) {
    await this.fillProductForm(productData);
    await this.clickElement(this.createButton);
  }

  /**
   * Check if success toast is visible
   */
  async hasSuccessToast(): Promise<boolean> {
    return await this.isVisible(this.successToast);
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Get validation error texts
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = await this.validationErrors.all();
    return Promise.all(errors.map(error => error.textContent().then(text => text || '')));
  }

  /**
   * Configure auto product creation
   */
  async configureAutoCreation(config: {
    count: number;
    category: string;
    optimization: string;
  }) {
    await this.productCountSelect.selectOption(config.count.toString());
    await this.categorySelect.selectOption(config.category);
    await this.optimizationSelect.selectOption(config.optimization);
  }

  /**
   * Start auto product creation
   */
  async startAutoCreation() {
    await this.clickElement(this.createAutoProductsButton);
  }

  /**
   * Wait for creation result to appear
   */
  async waitForCreationResult(timeout: number = 30000) {
    await this.waitForElement(this.creationResult, timeout);
  }

  /**
   * Get creation result text
   */
  async getCreationResultText(): Promise<string> {
    return await this.getTextContent(this.creationResult);
  }

  /**
   * Click quick template button (WordPress Theme, Plugin, Template)
   */
  async selectQuickTemplate(templateType: 'theme' | 'plugin' | 'template') {
    const templateButtons = {
      theme: 'button:has-text("WordPress Theme")',
      plugin: 'button:has-text("WordPress Plugin")',
      template: 'button:has-text("Vorlage")'
    };
    
    await this.page.locator(templateButtons[templateType]).click();
  }

  /**
   * Verify product form is empty/reset
   */
  async isFormEmpty(): Promise<boolean> {
    const nameValue = await this.productNameInput.inputValue();
    const priceValue = await this.productPriceInput.inputValue();
    
    return nameValue === '' && (priceValue === '' || priceValue === '0');
  }
}
