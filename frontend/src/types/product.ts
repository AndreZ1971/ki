// Product Management Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  stock?: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  status?: 'draft' | 'published' | 'pending';
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  productCount: number;
  needsOptimization: boolean;
  parentId?: number;
  description?: string;
}

export interface CategorySuggestion {
  name: string;
  confidence: number;
  reason: string;
}

export interface FreebieIdea {
  title: string;
  description: string;
  conversionScore: number;
  reason: string;
}

export interface Bundle {
  id: number;
  name: string;
  products: string[];
  price: number;
  discount: number;
  active: boolean;
  description?: string;
  createdAt?: string;
}

export interface BundleIdea {
  name: string;
  products: string[];
  suggestedPrice: number;
  originalPrice: number;
  suggestedDiscount: number;
  conversionScore: number;
  reason: string;
  targetAudience: string;
  expectedRevenue: number;
}

export interface Freebie {
  id: number;
  name: string;
  type: 'ebook' | 'checklist' | 'templates' | 'guide';
  downloads: number;
  created: string;
  description?: string;
  fileUrl?: string;
}

export interface ProductCreationResult {
  success: boolean;
  message: string;
  productsCreated?: number;
  estimatedTime?: string;
  errors?: string[];
  timestamp?: string;
  products?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type UpdateType = 'prices' | 'inventory' | 'descriptions' | 'all';

export interface ProductUpdateRequest {
  type: UpdateType;
  productIds?: number[];
  changes?: Partial<Product>;
}
