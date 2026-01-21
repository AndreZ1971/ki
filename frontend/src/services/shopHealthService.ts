// services/shopHealthService.ts

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed with status ${response.status}${text ? `: ${text}` : ''}`);
  }
  return response.json() as Promise<T>;
};

export interface CacheClearResponse {
  success: boolean;
  message: string;
  clearedItems: string[];
  timestamp: string;
}

export interface PerformanceReportResponse {
  reportId: string;
  reportUrl: string;
  metrics: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  };
  recommendations: string[];
}

export interface SecurityScanResponse {
  scanId: string;
  status: 'clean' | 'warnings' | 'critical';
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  scanResults: {
    malware: boolean;
    blacklist: boolean;
    outdated: string[];
  };
}

export interface SEOAnalysisResponse {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    priority: number;
  }>;
  keywords: string[];
  backlinks: number;
}

export const shopHealthService = {
  clearCache: async (): Promise<CacheClearResponse> => {
  return request<CacheClearResponse>('/api/health/clear-cache', { method: 'POST' });
  },

  generatePerformanceReport: async (): Promise<PerformanceReportResponse> => {
  return request<PerformanceReportResponse>('/api/health/performance-report', { method: 'GET' });
  },

  runSecurityScan: async (): Promise<SecurityScanResponse> => {
  return request<SecurityScanResponse>('/api/health/security-scan', { method: 'POST' });
  },

  analyzeSEO: async (): Promise<SEOAnalysisResponse> => {
  return request<SEOAnalysisResponse>('/api/health/seo-analysis', { method: 'POST' });
  }
};