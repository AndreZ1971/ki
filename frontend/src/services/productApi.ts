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
   PaymentSuccessMetrics,
   IssueDetectionResult,
   UserPaymentPreferences,
   DeliveryOptimizationResult,
   EmergencyAnalysisResult,
   ExpansionStrategyResult,
   ContextGenerationResult
 } from '../types/product';

  export interface WooSyncResult {
    products: number;
    orders: number;
    customers: number;
    lastSync: string;
    durationMs: number;
    type: 'full' | 'products' | 'orders' | 'customers';
  }

/**
 * Generischer API Request Handler mit Error Handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
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
    productType?: 'simple' | 'virtual' | 'downloadable';
    optimization: 'low' | 'medium' | 'high';
    seoOptimized?: boolean;
    keywords?: string;
    mlMarketAnalysis?: boolean;
    specializationPrompt?: string;
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

  /**
   * KI-Kontext-Generator
   */
  generateContext: async (data: {
    contextType: 'technical' | 'marketing' | 'educational' | 'creative';
    topic: string;
    targetAudience?: string;
    detailLevel?: 'basic' | 'medium' | 'detailed' | 'expert';
    tone?: 'neutral' | 'friendly' | 'authoritative' | 'playful';
  }): Promise<ApiResponse<ContextGenerationResult>> => {
    return apiRequest<ContextGenerationResult>('/api/ai/context/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

};

// ==================== REQUEST DEDUPLICATION ====================
const pendingRequests = new Map<string, Promise<any>>();

function dedupRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, promise);
  return promise;
}

// ==================== CATEGORIES ====================

export const categoryApi = {
  /**
   * Holt alle Kategorien (mit Deduplication)
   */
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return dedupRequest('GET_CATEGORIES', () => 
      apiRequest<Category[]>('/api/categories')
    );
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
      body: JSON.stringify({}),
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

// ==================== WOOCOMMERCE SYNC ====================

export const wooCommerceSyncApi = {
  sync: async (payload: { type: 'full' | 'products' | 'orders' | 'customers' }): Promise<ApiResponse<WooSyncResult>> => {
    return apiRequest<WooSyncResult>('/api/woocommerce/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
   * Führt echte Payment-Tests durch
   */
  runPaymentTests: async (data: {
    testType: string;
    target: string;
    riskTolerance?: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<Array<{ name: string; status: 'passed' | 'failed'; duration: string }>>> => {
    return apiRequest('/api/payments/ml/run-tests', {
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
   * KI-gestützte Issue Detection für Payment-System
   */
  detectIssues: async (data: {
    scanDepth?: 'quick' | 'standard' | 'deep';
    timeRange?: string;
  }): Promise<ApiResponse<IssueDetectionResult>> => {
    return apiRequest<IssueDetectionResult>('/api/payments/ml/detect-issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * KI-gestützte User Payment Preferences Analyse
   */
  analyzeUserPreferences: async (data: {
    customerId: string;
    customerEmail?: string;
    purchaseHistory?: Array<{
      amount: number;
      currency: string;
      paymentMethod: string;
      timestamp: string;
    }>;
  }): Promise<ApiResponse<UserPaymentPreferences>> => {
    return apiRequest<UserPaymentPreferences>('/api/payments/ml/user-preferences', {
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

  /**
   * KI-gestützte Delivery Optimization
   */
  optimizeDelivery: async (data: {
    orderId: string;
    destination: {
      country: string;
      city: string;
      postalCode: string;
    };
    items: Array<{
      productType: string;
      weight: number;
      value: number;
    }>;
    urgency?: 'standard' | 'express' | 'overnight';
  }): Promise<ApiResponse<DeliveryOptimizationResult>> => {
    return apiRequest<DeliveryOptimizationResult>('/api/payments/ml/delivery-optimization', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * KI-gestützte Emergency Analysis
   */
  analyzeEmergency: async (data: {
    issueType: string;
    description: string;
    affectedCustomers?: number;
    financialImpact?: number;
    systemsAffected?: string[];
  }): Promise<ApiResponse<EmergencyAnalysisResult>> => {
    return apiRequest<EmergencyAnalysisResult>('/api/payments/ml/emergency-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * KI-gestützte Expansion Strategy
   */
  expansionStrategy: async (data: {
    targetRegion: 'eu' | 'us' | 'asia' | 'global';
    currentRevenue?: number;
    currentMarkets?: number;
    priority?: 'speed' | 'balanced' | 'compliance-first';
  }): Promise<ApiResponse<ExpansionStrategyResult>> => {
    return apiRequest<ExpansionStrategyResult>('/api/payments/ml/expansion-strategy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Echte Fast-Payment-Verarbeitung mit Fraud-Check (keine Simulation)
   */
  processFastPayment: async (data: {
    amount: number;
    currency: string;
    customerEmail: string;
    paymentMethod?: string;
    description?: string;
  }): Promise<ApiResponse<{
    status: 'success' | 'failed' | 'error';
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    customerEmail: string;
    description: string;
    processingTime: string;
    riskScore: number;
    timestamp: string;
    reason?: string;
  }>> => {
    return apiRequest('/api/payments/ml/process-fast-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== MARKETING TEMPLATES ====================

  /**
   * Generiert ein Marketing-Template basierend auf Kategorie und Industrie
   */
  generateTemplate: async (data: {
    templateCategory: string;
    industry: string;
    customization?: string;
  }): Promise<ApiResponse<{
    template: {
      id: string;
      name: string;
      content: string;
      category: string;
      industry: string;
    };
  }>> => {
    return apiRequest('/api/marketing/templates/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Vorhersage des Engagement-Scores für Template-Content
   */
  predictEngagement: async (data: {
    templateContent: string;
    templateCategory: string;
    industry: string;
  }): Promise<ApiResponse<{
    prediction: {
      engagementScore: number;
      confidence: number;
    };
  }>> => {
    return apiRequest('/api/marketing/templates/predict-engagement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Performance-Vorhersage für Template-Content
   */
  forecastPerformance: async (data: {
    templateContent: string;
    templateCategory: string;
    industry: string;
  }): Promise<ApiResponse<{
    forecast: {
      expectedCtr: number;
      expectedConversions: number;
      revenueEstimate: number;
      confidence: number;
    };
  }>> => {
    return apiRequest('/api/marketing/templates/forecast-performance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Template-Content optimieren mit AI
   */
  optimizeTemplate: async (data: {
    templateContent: string;
    templateCategory: string;
    industry: string;
    optimizationGoal?: 'engagement' | 'conversion' | 'seo';
  }): Promise<ApiResponse<{
    optimizedContent: string;
    improvements: string[];
    score: number;
  }>> => {
    return apiRequest('/api/marketing/templates/optimize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Empfehlung der besten Template-Kategorie basierend auf Kontext
   */
  recommendCategory: async (data: {
    userIntent: string;
    industry: string;
    currentContext?: string;
  }): Promise<ApiResponse<{
    recommendedCategory: string;
    reason: string;
    alternativeCategories: string[];
  }>> => {
    return apiRequest('/api/marketing/templates/recommend-category', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== ML MARKETING ====================

  /**
   * Generiert Marketing-Ideen mit ML
   */
  generateMarketingIdeas: async (data: {
    goal: string;
    audience?: string;
    productInfo?: string;
    budget?: number;
  }): Promise<ApiResponse<{
    ideas: Array<{
      type: 'text' | 'image' | 'audience' | 'forecast';
      content: string;
      score?: number;
      reason?: string;
    }>;
  }>> => {
    return apiRequest('/api/marketing/ml/ideas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Generiert Email-Kampagne mit ML
   */
  generateEmailCampaign: async (data: {
    productName: string;
    productDesc?: string;
    targetAudience: string;
    campaignType?: 'promotional' | 'educational' | 'transactional';
  }): Promise<ApiResponse<{
    subject: string;
    preheader: string;
    body: string;
    cta: string;
  }>> => {
    return apiRequest('/api/marketing/ml/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Generiert Social Media Content mit ML
   */
  generateSocialContent: async (data: {
    topic: string;
    tone?: 'professional' | 'casual' | 'energetic';
    platforms: string[];
  }): Promise<ApiResponse<{
    posts: Array<{
      platform: string;
      content: string;
      hashtags: string[];
    }>;
  }>> => {
    return apiRequest('/api/marketing/ml/social', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Optimiert Marketing-Copy mit ML
   */
  optimizeMarketingCopy: async (data: {
    currentCopy: string;
    targetAction?: string;
    audience?: string;
  }): Promise<ApiResponse<{
    optimizedCopy: string;
    improvements: string[];
    score: number;
  }>> => {
    return apiRequest('/api/marketing/ml/optimize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Prognostiziert Campaign-Performance mit ML
   */
  forecastCampaign: async (data: {
    campaignType: string;
    budget: number;
    targetAudience: number;
    historicalCTR?: number;
    historicalROI?: number;
  }): Promise<ApiResponse<{
    expectedReach: number;
    expectedClicks: number;
    expectedConversions: number;
    projectedROI: number;
    confidence: number;
  }>> => {
    return apiRequest('/api/marketing/ml/forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== IMAGE ANALYSIS ====================

  /**
   * Vollständige Bildanalyse mit Orchestration Status
   */
  fullImageAnalysis: async (file: File): Promise<ApiResponse<{
    mode: 'real' | 'partial' | 'failed' | 'error';
    completeness: number;
    steps: Array<{
      name: string;
      status: 'success' | 'failed' | 'pending';
      mode: string;
    }>;
    data: {
      basicAnalysis: any;
      colors: any;
      enhancements: any;
      conversionImpact: any;
      audience: any;
    };
  }>> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/api/marketing/image/full-analysis`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    return response.json();
  },
};
