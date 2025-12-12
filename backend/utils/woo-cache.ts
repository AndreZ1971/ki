// Simple in-memory cache for WooCommerce API responses
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // in milliseconds
}

class WooCache {
  private cache = new Map<string, CacheEntry>();

  set(key: string, data: any, ttlSeconds = 60) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  remove(key: string) {
    this.cache.delete(key);
  }
}

export const wooCache = new WooCache();
