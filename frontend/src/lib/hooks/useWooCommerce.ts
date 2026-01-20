// frontend/src/lib/hooks/useWooCommerce.ts
import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

interface ShopMetrics {
  totalSales: number;
  todaySales: number;
  totalOrders: number;
  todayOrders: number;
  totalCustomers: number;
  todayCustomers: number;
  totalProducts: number;
  conversionRate: number;
  lastUpdated: string;
}

interface ApiResponse {
  success: boolean;
  data?: ShopMetrics;
  error?: string;
}

export const useWooCommerce = () => {
  const [metrics, setMetrics] = useState<ShopMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchShopMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!API_URL) {
        throw new Error('Backend URL is not configured. Please check your environment variables.');
      }

      const response = await fetch(`${API_URL}/api/analytics/metrics/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        throw new Error(result.error || 'Unknown API error occurred');
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchShopMetrics();
  }, [fetchShopMetrics]);

  useEffect(() => {
    fetchShopMetrics();
    
    // Auto-refresh every 30 seconds only if no error
    const interval = setInterval(() => {
      if (!error) {
        fetchShopMetrics();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchShopMetrics, error]);

  // Calculate additional derived metrics
  const derivedMetrics = metrics ? {
    ...metrics,
    salesGrowth: metrics.todaySales > 0 ? ((metrics.todaySales / metrics.totalSales) * 100).toFixed(1) : '0',
    orderGrowth: metrics.todayOrders > 0 ? ((metrics.todayOrders / metrics.totalOrders) * 100).toFixed(1) : '0',
    customerGrowth: metrics.todayCustomers > 0 ? ((metrics.todayCustomers / metrics.totalCustomers) * 100).toFixed(1) : '0',
    isDataFresh: Date.now() - new Date(metrics.lastUpdated).getTime() < 60000 // Data is fresh if less than 1 minute old
  } : null;

  return { 
    metrics: derivedMetrics, 
    loading, 
    error,
    refetch
  };
};

// Additional hook for specific metric types
export const useWooCommerceMetrics = {
  useSales: () => {
    const { metrics, loading, error } = useWooCommerce();
    return {
      sales: metrics ? {
        total: metrics.totalSales,
        today: metrics.todaySales,
        growth: metrics.salesGrowth
      } : null,
      loading,
      error
    };
  },
  
  useOrders: () => {
    const { metrics, loading, error } = useWooCommerce();
    return {
      orders: metrics ? {
        total: metrics.totalOrders,
        today: metrics.todayOrders,
        growth: metrics.orderGrowth
      } : null,
      loading,
      error
    };
  },
  
  useCustomers: () => {
    const { metrics, loading, error } = useWooCommerce();
    return {
      customers: metrics ? {
        total: metrics.totalCustomers,
        today: metrics.todayCustomers,
        growth: metrics.customerGrowth
      } : null,
      loading,
      error
    };
  },
  
  useConversion: () => {
    const { metrics, loading, error } = useWooCommerce();
    return {
      conversion: metrics ? metrics.conversionRate : null,
      loading,
      error
    };
  }
};