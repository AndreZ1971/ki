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

export interface PaymentIssue {
  type: 'Gateway-Timeout' | 'Validation' | 'Retry' | 'Fraud' | 'Integration' | 'RateLimit' | 'Configuration' | 'Unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  affectedArea: string;
  suggestedFix: string;
  impact: string;
}

export interface UserPaymentPreferences {
  preferredPaymentMethods: string[];
  preferredCurrency: string;
  preferredLanguage: string;
  checkoutFlowRecommendation: 'one-page' | 'multi-step';
  confidence: number; // 0-1
  personalizations: {
    showSavedCards: boolean;
    suggestInstallments: boolean;
    highlightTrustBadges: boolean;
    showSecurityFeatures: boolean;
  };
  conversionOptimizations: string[];
  riskProfile: 'low' | 'medium' | 'high';
  lifetimeValue: number;
  nextBestAction: string;
  metadata: {
    customerId: string;
    totalPurchases: number;
    avgAmount: number;
    analyzedAt: string;
  };
}

export interface IssueDetectionResult {
  issues: PaymentIssue[];
  systemHealth: 'healthy' | 'degraded' | 'critical';
  overallConfidence: number; // 0-1
  recommendedActions: string[];
  scanMetadata: {
    scanDepth: string;
    timeRange: string;
    scannedEvents: number;
    currentFailureRate: number;
    timestamp: string;
  };
}

export interface DeliveryCarrier {
  name: string;
  reason?: string;
  estimatedDays: number;
  cost: number;
  reliability: number; // 0-100
}

export interface DeliveryRisk {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface DeliveryOptimizationResult {
  orderId: string;
  recommendedCarrier: DeliveryCarrier;
  alternativeCarriers: DeliveryCarrier[];
  deliveryRisks: DeliveryRisk[];
  routeOptimization: {
    fastestRoute: string;
    cheapestRoute: string;
    recommended: 'fastest' | 'cheapest' | 'balanced';
  };
  estimatedDelivery: {
    best: string;
    likely: string;
    worst: string;
  };
  specialInstructions: string[];
  confidence: number; // 0-1
  metadata: {
    destination: string;
    totalWeight: number;
    totalValue: number;
    urgency: string;
    analyzedAt: string;
  };
}

export interface EmergencyImmediateAction {
  action: string;
  owner: string;
  eta: string;
}

export interface EmergencyCommunicationTemplate {
  internal: string;
  customer: string;
  stakeholder: string;
}

export interface EmergencyAnalysisResult {
  ticketId: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedImpact: {
    customersFacing: number;
    revenueAtRisk: number;
    slaViolation: boolean;
    uptimeImpact: string;
  };
  rootCauseHypothesis: string[];
  immediateActions: EmergencyImmediateAction[];
  escalationPath: string[];
  runbookUrl: string | null;
  communicationTemplate: EmergencyCommunicationTemplate;
  slaDeadline: string | null;
  mitigationSteps: string[];
  preventionRecommendations: string[];
  confidence: number; // 0-1
  metadata: {
    issueType: string;
    affectedCustomers: number;
    financialImpact: number;
    systemsAffected: string[];
    reportedAt: string;
  };
}

export interface ContextGenerationResult {
  context: string;
  summary: string;
  keyPoints: string[];
  promptTemplate: string;
  guardrails: string[];
  metadata: {
    confidence: number;
    model: string;
    generatedAt: string;
  };
}

export interface ExpansionTimelinePhase {
  phase: string;
  durationWeeks: number;
  milestones: string[];
}

export interface ExpansionRisk {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  action: string;
}

export interface ExpansionStrategyResult {
  targetRegion: 'eu' | 'us' | 'asia' | 'global';
  marketsToEnter: Array<{ country: string; reason: string; expectedLift?: number }>;
  revenueProjection: { best: number; likely: number; worst: number };
  timeline: ExpansionTimelinePhase[];
  riskMitigation: ExpansionRisk[];
  complianceChecklist: string[];
  paymentStack: {
    psp: string[];
    paymentMethods: string[];
    fraud?: string;
  };
  localization: {
    currencies: string[];
    languages: string[];
    tax?: string;
  };
  logisticsNotes: string[];
  confidence: number;
  metadata: {
    currentRevenue: number;
    currentMarkets: number;
    priority: string;
    analyzedAt: string;
  };
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
