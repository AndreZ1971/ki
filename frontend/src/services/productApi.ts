import type {
  Product,
  Category,
  Bundle,
  Freebie,
  ProductCreationResult,
  ApiResponse,
  ProductUpdateRequest
} from '../types/product';

if (!import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL is not set!');
}
const API_BASE_URL = import.meta.env.VITE_API_URL;

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
    return apiRequest<ProductCreationResult>('/products/auto-create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /**
   * Holt alle Produkte
   */
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    return apiRequest<Product[]>('/products');
  },

  /**
   * Erstellt ein neues WooCommerce Produkt
   */
  createWooProduct: async (productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    return apiRequest<Product>('/products/woo/create', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  /**
   * Aktualisiert WooCommerce Produkte
   */
  updateWooProducts: async (updateRequest: ProductUpdateRequest): Promise<ApiResponse<void>> => {
    return apiRequest<void>('/products/woo/update', {
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
    return apiRequest<Category[]>('/categories');
  },

  /**
   * Erstellt eine neue Kategorie
   */
  createCategory: async (categoryData: Partial<Category>): Promise<ApiResponse<Category>> => {
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  /**
   * Optimiert alle Kategorien
   */
  optimizeCategories: async (): Promise<ApiResponse<void>> => {
    return apiRequest<void>('/categories/optimize', {
      method: 'POST',
    });
  },
};

// ==================== BUNDLES ====================

export const bundleApi = {
  /**
   * Holt alle Bundles
   */
  getBundles: async (): Promise<ApiResponse<Bundle[]>> => {
    return apiRequest<Bundle[]>('/bundles');
  },

  /**
   * Erstellt ein neues Bundle
   */
  createBundle: async (bundleData: Partial<Bundle>): Promise<ApiResponse<Bundle>> => {
    return apiRequest<Bundle>('/bundles', {
      method: 'POST',
      body: JSON.stringify(bundleData),
    });
  },

  /**
   * Aktualisiert ein Bundle
   */
  updateBundle: async (id: number, bundleData: Partial<Bundle>): Promise<ApiResponse<Bundle>> => {
    return apiRequest<Bundle>(`/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bundleData),
    });
  },
};

// ==================== FREEBIES ====================

export const freebieApi = {
  /**
   * Holt alle Freebies
   */
  getFreebies: async (): Promise<ApiResponse<Freebie[]>> => {
    return apiRequest<Freebie[]>('/freebies');
  },

  /**
   * Erstellt ein neues Freebie
   */
  createFreebie: async (freebieData: Partial<Freebie>): Promise<ApiResponse<Freebie>> => {
    return apiRequest<Freebie>('/freebies', {
      method: 'POST',
      body: JSON.stringify(freebieData),
    });
  },

  /**
   * Erstellt automatisch ein optimiertes Freebie
   */
  createAutoFreebie: async (type: Freebie['type']): Promise<ApiResponse<Freebie>> => {
    return apiRequest<Freebie>('/freebies/auto-create', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },
};

// ==================== JOB TRIGGERING ====================

export const jobApi = {
  /**
   * Triggert einen Backend Job
   */
  triggerJob: async (jobName: string, params?: any): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/jobs/trigger', {
      method: 'POST',
      body: JSON.stringify({ jobName, params }),
    });
  },
};
