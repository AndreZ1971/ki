import type {
  Product,
  Category,
  Bundle,
  BundleIdea,
  Freebie,
  ProductCreationResult,
  ApiResponse,
  ProductUpdateRequest,
  CategorySuggestion,
  FreebieIdea,
  FraudAnalysis,
  AmountSuggestion,
  UxAuditResult,
   PaymentTestScenario,
   TestDiagnosis,
   PaymentVerificationResult,
   PaymentSuccessMetrics
 } from '../types/product';
let API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();
// Wenn leer, nutze relativen Pfad
if (!API_BASE_URL) {
  API_BASE_URL = '';
}

/**
 * Generischer API Request Handler mit Error Handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Backend gibt bereits {success, data, error} zurück
    // Nicht nochmal wrappen!
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    };
  }
}

// ==================== PRODUCTS ====================

export const productApi = {
  /**
   * Erstellt automatisch Produkte mit AI
   */
  createAutoProducts: async (config: {
    count: number;
    category: string;
    optimization: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<ProductCreationResult>> => {
    return apiRequest<ProductCreationResult>('/api/products/auto-create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /**
   * Holt alle Produkte
   */
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    return apiRequest<Product[]>('/api/products');
  },

  /**
   * Erstellt ein neues WooCommerce Produkt
   */
  createWooProduct: async (productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    return apiRequest<Product>('/api/products/woo/create', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  /**
   * Aktualisiert WooCommerce Produkte
   */
  updateWooProducts: async (updateRequest: ProductUpdateRequest): Promise<ApiResponse<void>> => {
    return apiRequest<void>('/api/products/woo/update', {
      method: 'PUT',
      body: JSON.stringify(updateRequest),
    });
  },
};

// ==================== CATEGORIES ====================

export const categoryApi = {
  /**
   * Holt alle Kategorien
   */
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return apiRequest<Category[]>('/api/categories');
  },

  /**
   * Erstellt eine neue Kategorie
   */
  createCategory: async (categoryData: Partial<Category>): Promise<ApiResponse<Category>> => {
    return apiRequest<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  /**
   * Optimiert alle Kategorien
   */
  optimizeCategories: async (): Promise<ApiResponse<void>> => {
    return apiRequest<void>('/api/categories/optimize', {
      method: 'POST',
    });
  },

  /**
   * Holt ML-basierte Kategorie-Vorschläge
   */
  suggestCategories: async (
    payload: { title: string; description: string; maxSuggestions?: number }
  ): Promise<ApiResponse<CategorySuggestion[]>> => {
    return apiRequest<CategorySuggestion[]>('/api/categories/ml/suggest', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// ==================== BUNDLES ====================

export const bundleApi = {
  /**
   * Holt alle Bundles
   */
  getBundles: async (): Promise<ApiResponse<Bundle[]>> => {
    return apiRequest<Bundle[]>('/api/bundles');
  },

  /**
   * Erstellt ein neues Bundle
   */
  createBundle: async (bundleData: Partial<Bundle>): Promise<ApiResponse<Bundle>> => {
    return apiRequest<Bundle>('/api/bundles', {
      method: 'POST',
      body: JSON.stringify(bundleData),
    });
  },

  /**
   * Aktualisiert ein Bundle
   */
  updateBundle: async (id: number, bundleData: Partial<Bundle>): Promise<ApiResponse<Bundle>> => {
    return apiRequest<Bundle>(`/api/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bundleData),
    });
  },

  /**
   * Generiert KI-basierte Bundle-Ideen mit Performance-Scoring
   */
  generateBundleIdeas: async (filters?: {
    category?: string;
    priceRange?: string;
    targetAudience?: string;
  }): Promise<ApiResponse<BundleIdea[]>> => {
    const query = new URLSearchParams();
    if (filters?.category) query.set('category', filters.category);
    if (filters?.priceRange) query.set('priceRange', filters.priceRange);
    if (filters?.targetAudience) query.set('targetAudience', filters.targetAudience);
    return apiRequest<BundleIdea[]>(`/api/bundles/ml/generate?${query.toString()}`);
  },
};

// ==================== FREEBIES ====================

export const freebieApi = {
  /**
   * Holt alle Freebies
   */
  getFreebies: async (): Promise<ApiResponse<Freebie[]>> => {
    return apiRequest<Freebie[]>('/api/freebies');
  },

  /**
   * Erstellt ein neues Freebie
   */
  createFreebie: async (freebieData: Partial<Freebie>): Promise<ApiResponse<Freebie>> => {
    return apiRequest<Freebie>('/api/freebies', {
      method: 'POST',
      body: JSON.stringify(freebieData),
    });
  },

  /**
   * Erstellt automatisch ein optimiertes Freebie
   */
  createAutoFreebie: async (type: Freebie['type']): Promise<ApiResponse<Freebie>> => {
    return apiRequest<Freebie>('/api/freebies/auto-create', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  /**
   * Generiert KI-basierte Freebie-Ideen mit Conversion-Score
   */
  generateIdeas: async (
    type: string,
    keywords?: string
  ): Promise<ApiResponse<FreebieIdea[]>> => {
    const query = new URLSearchParams();
    query.set('type', type);
    if (keywords) query.set('keywords', keywords);
    return apiRequest<FreebieIdea[]>(`/api/freebies/ml/generate?${query.toString()}`);
  },
};

// ==================== JOB TRIGGERING ====================

export const jobApi = {
  /**
   * Triggert einen Backend Job
   */
  triggerJob: async (jobName: string, params?: any): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/jobs/trigger', {
      method: 'POST',
      body: JSON.stringify({ jobName, params }),
    });
  },
};

// ==================== PAYMENTS ====================

export const paymentApi = {
  /**
   * KI-basierte Betrugserkennung für Payments
   */
  checkFraud: async (data: {
    amount: number;
    currency: string;
    customerEmail: string;
    ipAddress?: string;
  }): Promise<ApiResponse<FraudAnalysis>> => {
    return apiRequest<FraudAnalysis>('/api/payments/ml/fraud-check', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * KI-basierte Betrags-Empfehlungen
   */
  suggestAmounts: async (filters?: {
    currency?: string;
    category?: string;
  }): Promise<ApiResponse<AmountSuggestion[]>> => {
    const query = new URLSearchParams();
    if (filters?.currency) query.set('currency', filters.currency);
    if (filters?.category) query.set('category', filters.category);
    return apiRequest<AmountSuggestion[]>(`/api/payments/ml/suggest-amounts?${query.toString()}`);
  },

  /**
   * Vorhersage der Payment-Erfolgswahrscheinlichkeit
   */
  predictSuccess: async (data: {
    amount: number;
    currency: string;
    customerEmail: string;
  }): Promise<ApiResponse<{
    successProbability: number;
    factors: string[];
    recommendation: string;
  }>> => {
    return apiRequest('/api/payments/ml/predict-success', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * UX Quick Wins & erwarteter Lift
   */
  uxCheck: async (data: {
    productName: string;
    amount: number;
    currency: string;
    flowType?: 'one-page' | 'multi-step';
  }): Promise<ApiResponse<UxAuditResult>> => {
    return apiRequest<UxAuditResult>('/api/payments/ml/ux-check', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * KI-generierter Testplan für Payments
   */
  generateTestPlan: async (data: {
    testType: string;
    target: string;
    riskTolerance?: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<PaymentTestScenario[]>> => {
    return apiRequest<PaymentTestScenario[]>('/api/payments/ml/test-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * KI-Diagnose für fehlgeschlagene Tests
   */
  diagnoseTests: async (data: {
    failureLogs: string[];
    environment?: string;
    testType?: string;
  }): Promise<ApiResponse<TestDiagnosis>> => {
    return apiRequest<TestDiagnosis>('/api/payments/ml/test-diagnose', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * KI-gestützte Payment-Verifikation & Risikoanalyse
   */
  verifyTransaction: async (data: {
     transactionId: string;
     amount: number;
     currency: string;
     customerEmail: string;
     ipAddress?: string;
     paymentMethod?: string;
     signature?: string;
     payload?: string;
     environment?: 'prod' | 'staging' | 'dev';
   }): Promise<ApiResponse<PaymentVerificationResult>> => {
     return apiRequest<PaymentVerificationResult>('/api/payments/ml/verify', {
       method: 'POST',
       body: JSON.stringify(data),
     });
   },

  /**
   * Aggregierte Payment-ML Erfolgsmetriken
   */
  successMetrics: async (timeRange: 'today' | 'week' | 'month' | 'year'): Promise<ApiResponse<PaymentSuccessMetrics>> => {
    return apiRequest<PaymentSuccessMetrics>('/api/payments/ml/success-metrics', {
      method: 'POST',
      body: JSON.stringify({ timeRange }),
    });
  },
 };
