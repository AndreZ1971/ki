// services/chatbotFunctionCaller.ts - Smart Intent-based Function Caller für Chatbot
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { getConfig } from '@config';

interface FunctionCallResult {
  functionName: string;
  result: any;
  timestamp: number;
  isLive: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // time-to-live in ms
}

// Cache für häufige Anfragen (5 Minuten TTL)
const functionCache = new Map<string, CacheEntry>();
const cacheTTL = 5 * 60 * 1000; // 5 Minuten

// Query-Pattern Recognition
const queryPatterns = {
  productCount: /(wieviele|wie viele|anzahl|how many|count|anz).*(produkte?|artikel|items?|stück|sortiment)/i,
  categoryCount: /(wieviele|wie viele|anzahl|how many).*(kategorien|categories|cats?)/i,
  totalRevenue: /(wie viel|wieviel|how much).*(umsatz|revenue|sales|erlös)/i,
  topProducts: /(beste|top|meist|best|most).*(produkte?|artikel|verkauft|sold|bestseller)/i,
  totalCustomers: /(wieviele|wie viele|anzahl).*(kunden|customers|benutzer|users)/i,
  lowStockProducts: /(welche|which).*(produkte?|artikel).*(lagerbestand|stock|lagern|wenig|low)/i,
  totalOrders: /(wieviele|wie viele|anzahl).*(bestellungen|orders|verkäufe|sales)/i,
  shopMetrics: /(dashboard|überblick|overview|kennzahlen|metrics|zahlen)/i,
};

// WooCommerce Client
const getWooConfig = () => {
  const config = getConfig();
  const woo = config.woocommerce || {};
  return {
    url: woo.url || '',
    consumerKey: woo.consumerKey || '',
    consumerSecret: woo.consumerSecret || '',
    version: 'wc/v3' as const
  };
};

// ============= FUNCTION IMPLEMENTATIONS =============

async function getProductCount(): Promise<FunctionCallResult> {
  try {
    const wooCommerce = new WooCommerceRestApi(getWooConfig());
    const response = await wooCommerce.get('products', { per_page: 1 });
    const totalProducts = response.headers['x-wp-total'] || 0;
    
    return {
      functionName: 'productCount',
      result: {
        count: parseInt(totalProducts),
        message: `${totalProducts} Produkte im Shop`
      },
      timestamp: Date.now(),
      isLive: true
    };
  } catch (error) {
    console.error('❌ productCount error:', error);
    return {
      functionName: 'productCount',
      result: { error: 'Produkte konnten nicht abgerufen werden' },
      timestamp: Date.now(),
      isLive: false
    };
  }
}

async function getCategoryCount(): Promise<FunctionCallResult> {
  try {
    const wooCommerce = new WooCommerceRestApi(getWooConfig());
    const response = await wooCommerce.get('products/categories', { per_page: 1 });
    const totalCategories = response.headers['x-wp-total'] || 0;
    
    return {
      functionName: 'categoryCount',
      result: {
        count: parseInt(totalCategories),
        message: `${totalCategories} Produktkategorien`
      },
      timestamp: Date.now(),
      isLive: true
    };
  } catch (error) {
    console.error('❌ categoryCount error:', error);
    return {
      functionName: 'categoryCount',
      result: { error: 'Kategorien konnten nicht abgerufen werden' },
      timestamp: Date.now(),
      isLive: false
    };
  }
}

async function getTopProducts(limit = 5): Promise<FunctionCallResult> {
  try {
    const wooCommerce = new WooCommerceRestApi(getWooConfig());
    const response = await wooCommerce.get('products', {
      per_page: limit,
      orderby: 'rating',
      order: 'desc'
    });
    
    const topProducts = (response.data as any[]).map((p: any) => ({
      name: p.name,
      rating: p.average_rating || 0,
      sales: p.total_sales || 0
    }));
    
    return {
      functionName: 'topProducts',
      result: {
        products: topProducts,
        message: `Top ${limit} Produkte: ${topProducts.map(p => p.name).join(', ')}`
      },
      timestamp: Date.now(),
      isLive: true
    };
  } catch (error) {
    console.error('❌ topProducts error:', error);
    return {
      functionName: 'topProducts',
      result: { error: 'Top-Produkte konnten nicht abgerufen werden' },
      timestamp: Date.now(),
      isLive: false
    };
  }
}

async function getTotalCustomers(): Promise<FunctionCallResult> {
  try {
    const wooCommerce = new WooCommerceRestApi(getWooConfig());
    const response = await wooCommerce.get('customers', { per_page: 1 });
    const totalCustomers = response.headers['x-wp-total'] || 0;
    
    return {
      functionName: 'totalCustomers',
      result: {
        count: parseInt(totalCustomers),
        message: `${totalCustomers} registrierte Kunden`
      },
      timestamp: Date.now(),
      isLive: true
    };
  } catch (error) {
    console.error('❌ totalCustomers error:', error);
    return {
      functionName: 'totalCustomers',
      result: { error: 'Kundenzahl konnte nicht abgerufen werden' },
      timestamp: Date.now(),
      isLive: false
    };
  }
}

async function getLowStockProducts(threshold = 5): Promise<FunctionCallResult> {
  try {
    const wooCommerce = new WooCommerceRestApi(getWooConfig());
    const response = await wooCommerce.get('products', {
      per_page: 100,
      orderby: 'stock_quantity',
      order: 'asc'
    });
    
    const lowStockProducts = (response.data as any[])
      .filter((p: any) => p.stock_quantity !== null && p.stock_quantity <= threshold)
      .slice(0, 10)
      .map((p: any) => ({
        name: p.name,
        stock: p.stock_quantity,
        sku: p.sku
      }));
    
    return {
      functionName: 'lowStockProducts',
      result: {
        products: lowStockProducts,
        count: lowStockProducts.length,
        message: `${lowStockProducts.length} Produkte mit niedrigem Lagerbestand: ${lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ')}`
      },
      timestamp: Date.now(),
      isLive: true
    };
  } catch (error) {
    console.error('❌ lowStockProducts error:', error);
    return {
      functionName: 'lowStockProducts',
      result: { error: 'Lagerbestände konnten nicht abgerufen werden' },
      timestamp: Date.now(),
      isLive: false
    };
  }
}

async function getTotalOrders(): Promise<FunctionCallResult> {
  try {
    const wooCommerce = new WooCommerceRestApi(getWooConfig());
    const response = await wooCommerce.get('orders', { per_page: 1 });
    const totalOrders = response.headers['x-wp-total'] || 0;
    
    return {
      functionName: 'totalOrders',
      result: {
        count: parseInt(totalOrders),
        message: `${totalOrders} Gesamtbestellungen`
      },
      timestamp: Date.now(),
      isLive: true
    };
  } catch (error) {
    console.error('❌ totalOrders error:', error);
    return {
      functionName: 'totalOrders',
      result: { error: 'Bestellungen konnten nicht abgerufen werden' },
      timestamp: Date.now(),
      isLive: false
    };
  }
}

// ============= MAIN FUNCTION CALLER =============

export async function callChatbotFunction(query: string): Promise<FunctionCallResult | null> {
  const cacheKey = `query:${query.toLowerCase()}`;
  
  // Prüfe Cache
  const cached = functionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`✅ Cached result for: ${cacheKey}`);
    return cached.data;
  }

  let result: FunctionCallResult | null = null;

  // Intent Matching
  if (queryPatterns.productCount.test(query)) {
    result = await getProductCount();
  } else if (queryPatterns.categoryCount.test(query)) {
    result = await getCategoryCount();
  } else if (queryPatterns.topProducts.test(query)) {
    result = await getTopProducts();
  } else if (queryPatterns.totalCustomers.test(query)) {
    result = await getTotalCustomers();
  } else if (queryPatterns.lowStockProducts.test(query)) {
    result = await getLowStockProducts();
  } else if (queryPatterns.totalOrders.test(query)) {
    result = await getTotalOrders();
  } else if (queryPatterns.shopMetrics.test(query)) {
    // Multi-function call für Dashboard
    const [products, categories, orders, customers] = await Promise.all([
      getProductCount(),
      getCategoryCount(),
      getTotalOrders(),
      getTotalCustomers()
    ]);
    result = {
      functionName: 'shopMetrics',
      result: {
        products: products.result,
        categories: categories.result,
        orders: orders.result,
        customers: customers.result,
        message: `📊 Shop-Überblick: ${products.result.count} Produkte in ${categories.result.count} Kategorien, ${orders.result.count} Bestellungen, ${customers.result.count} Kunden`
      },
      timestamp: Date.now(),
      isLive: true
    };
  }

  // Cache speichern
  if (result) {
    functionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: cacheTTL
    });
  }

  return result;
}

// Query-History für Lernzwecke
const queryHistory: Array<{ query: string; timestamp: number; success: boolean }> = [];

export function recordQuery(query: string, success: boolean) {
  queryHistory.push({
    query,
    timestamp: Date.now(),
    success
  });
  
  // Nur letzte 1000 Queries speichern
  if (queryHistory.length > 1000) {
    queryHistory.shift();
  }
}

export function getCommonQueries(limit = 10) {
  const grouped: { [key: string]: number } = {};
  
  queryHistory.forEach(q => {
    if (q.success) {
      const normalized = q.query.toLowerCase().replace(/\d+/g, 'N');
      grouped[normalized] = (grouped[normalized] || 0) + 1;
    }
  });
  
  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

export function clearCache() {
  functionCache.clear();
  console.log('✅ Function cache cleared');
}
