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

export interface FraudAnalysis {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendation: string;
  confidence: number;
  reasoning: string;
  analyzedAt: string;
}

export interface AmountSuggestion {
  amount: number;
  reason: string;
  conversionScore: number;
  targetAudience: string;
  psychologicalEffect: string;
}

export interface UxAuditResult {
  expectedLift: number; // 0-1
  quickWins: string[];
  issues: string[];
  recommendedFlow: string;
}

export interface PaymentTestScenario {
  title: string;
  riskLevel: 'low' | 'medium' | 'high';
  priority: 'P1' | 'P2' | 'P3';
  successProbability: number; // 0-1
  steps: string[];
  focusArea: string;
  expectedImpact: string;
}

export interface TestDiagnosis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  rootCauses: string[];
  fixes: string[];
  recommendedOwners: string[];
}

export interface PaymentSuccessMetrics {
  total: number;
  valid: number;
  successRate: number; // 0-1
  avgConfidence: number; // 0-1
  byFeature: Record<string, number>;
  lastEvent: string | null;
}

export interface PaymentVerificationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
}

export interface PaymentVerificationResult {
  valid: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendedAction: 'approve' | 'manual-review' | 'reject';
  reasoning: string;
  checks: PaymentVerificationCheck[];
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
