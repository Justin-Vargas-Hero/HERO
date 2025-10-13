/**
 * Unified Tiered Cache System
 *
 * Cache Tiers:
 * 1. PERMANENT - Data that never changes (company profiles, IPO dates, etc.)
 * 2. DAILY - Data that updates daily (calendars, earnings, dividends)
 * 3. HOURLY - Data that updates hourly (market movers, news)
 * 4. FREQUENT - Data that updates frequently (5-15 minutes for historical)
 * 5. REALTIME - Data that needs quick updates (quotes - 10s market hours, 60s after)
 */

import { LRUCache } from 'lru-cache';
import fs from 'fs/promises';
import path from 'path';

export enum CacheTier {
  PERMANENT = 'permanent',    // Never expires - stored on disk
  DAILY = 'daily',            // 24 hour TTL
  HOURLY = 'hourly',          // 1 hour TTL
  FREQUENT = 'frequent',      // 5-15 minute TTL
  REALTIME = 'realtime'       // 10s-60s TTL based on market hours
}

interface CacheConfig {
  tier: CacheTier;
  ttl?: number; // Override default TTL
  refreshOnExpire?: boolean; // Auto-refresh when expired
}

interface CachedItem<T = any> {
  data: T;
  tier: CacheTier;
  timestamp: number;
  expiresAt: number | null; // null for permanent
  hits: number; // Track usage for optimization
}

class UnifiedCache {
  private static instance: UnifiedCache;

  // In-memory caches with size limits
  private permanentCache: Map<string, CachedItem> = new Map();
  private tieredCache: LRUCache<string, CachedItem>;

  // Pending requests to prevent duplicate API calls
  private pendingRequests: Map<string, Promise<any>> = new Map();

  // Disk cache directory for permanent data
  private readonly CACHE_DIR = path.join(process.cwd(), '.cache', 'market-data');

  // Default TTLs for each tier (in milliseconds)
  private readonly TTL_CONFIG = {
    [CacheTier.PERMANENT]: null,           // Never expires
    [CacheTier.DAILY]: 24 * 60 * 60 * 1000,     // 24 hours
    [CacheTier.HOURLY]: 60 * 60 * 1000,         // 1 hour
    [CacheTier.FREQUENT]: 5 * 60 * 1000,        // 5 minutes
    [CacheTier.REALTIME]: 60 * 1000             // 60 seconds (1 minute) - API limit safe
  };

  private constructor() {
    // Initialize LRU cache for non-permanent items
    this.tieredCache = new LRUCache<string, CachedItem>({
      max: 10000, // Maximum number of items
      ttl: 60 * 60 * 1000, // Default 1 hour
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    });

    // Load permanent cache from disk on startup
    this.loadPermanentCache();

    // Save permanent cache periodically
    setInterval(() => this.savePermanentCache(), 5 * 60 * 1000); // Every 5 minutes

    // Cleanup expired items periodically
    setInterval(() => this.cleanup(), 10 * 60 * 1000); // Every 10 minutes
  }

  static getInstance(): UnifiedCache {
    if (!UnifiedCache.instance) {
      UnifiedCache.instance = new UnifiedCache();
    }
    return UnifiedCache.instance;
  }

  /**
   * Get item from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Check permanent cache first
    const permanent = this.permanentCache.get(key);
    if (permanent) {
      permanent.hits++;
      return permanent.data as T;
    }

    // Check tiered cache
    const cached = this.tieredCache.get(key);
    if (cached) {
      const now = Date.now();

      // Check if expired
      if (cached.expiresAt && now > cached.expiresAt) {
        this.tieredCache.delete(key);
        return null;
      }

      cached.hits++;
      return cached.data as T;
    }

    return null;
  }

  /**
   * Set item in cache with specified tier
   */
  async set<T = any>(
    key: string,
    data: T,
    config: CacheConfig
  ): Promise<void> {
    const now = Date.now();
    const ttl = config.ttl || this.getTTL(config.tier);
    const expiresAt = ttl ? now + ttl : null;

    const item: CachedItem<T> = {
      data,
      tier: config.tier,
      timestamp: now,
      expiresAt,
      hits: 0
    };

    if (config.tier === CacheTier.PERMANENT) {
      // Store in permanent cache
      this.permanentCache.set(key, item);
      // Queue for disk save
      this.queuePermanentSave(key, item);
    } else {
      // Store in tiered cache with TTL
      this.tieredCache.set(key, item, { ttl: ttl || undefined });
    }
  }

  /**
   * Get or fetch data with caching
   */
  async getOrFetch<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const request = fetcher()
      .then(async (data) => {
        // Cache the result
        await this.set(key, data, config);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Batch get multiple items
   */
  async getBatch<T = any>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    for (const key of keys) {
      const data = await this.get<T>(key);
      if (data !== null) {
        results.set(key, data);
      }
    }

    return results;
  }

  /**
   * Get missing keys from a batch
   */
  async getMissingKeys(keys: string[]): Promise<string[]> {
    const missing: string[] = [];

    for (const key of keys) {
      const data = await this.get(key);
      if (data === null) {
        missing.push(key);
      }
    }

    return missing;
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<void> {
    this.permanentCache.delete(key);
    this.tieredCache.delete(key);

    // Also remove from disk if permanent
    try {
      const filePath = path.join(this.CACHE_DIR, `${key}.json`);
      await fs.unlink(filePath);
    } catch {
      // File might not exist
    }
  }

  /**
   * Invalidate entries by pattern
   */
  async invalidatePattern(pattern: RegExp): Promise<void> {
    // Clear from permanent cache
    for (const key of this.permanentCache.keys()) {
      if (pattern.test(key)) {
        this.permanentCache.delete(key);
      }
    }

    // Clear from tiered cache
    for (const key of this.tieredCache.keys()) {
      if (pattern.test(key)) {
        this.tieredCache.delete(key);
      }
    }
  }

  /**
   * Get appropriate TTL based on tier and market hours
   */
  private getTTL(tier: CacheTier): number | null {
    if (tier === CacheTier.PERMANENT) return null;

    if (tier === CacheTier.REALTIME) {
      // Adjust based on market hours
      const now = new Date();
      const hour = now.getUTCHours();
      const day = now.getUTCDay();

      // Check if market is open (rough check for US markets)
      // Mon-Fri, 14:30-21:00 UTC (9:30 AM - 4:00 PM ET)
      const isMarketHours = day >= 1 && day <= 5 && hour >= 14 && hour < 21;

      // 60 seconds (1 minute) during market hours, 5 minutes after hours
      // This respects API rate limits while keeping data reasonably fresh
      return isMarketHours ? 60 * 1000 : 5 * 60 * 1000;
    }

    return this.TTL_CONFIG[tier];
  }

  /**
   * Load permanent cache from disk
   */
  private async loadPermanentCache(): Promise<void> {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });

      const files = await fs.readdir(this.CACHE_DIR);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.CACHE_DIR, file), 'utf-8');
            const item = JSON.parse(content) as CachedItem;
            const key = file.replace('.json', '');
            this.permanentCache.set(key, item);
          } catch (error) {
            console.error(`Failed to load cache file ${file}:`, error);
          }
        }
      }

      console.log(`Loaded ${this.permanentCache.size} permanent cache entries from disk`);
    } catch (error) {
      console.error('Failed to load permanent cache:', error);
    }
  }

  /**
   * Save permanent cache to disk
   */
  private async savePermanentCache(): Promise<void> {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });

      for (const [key, item] of this.permanentCache.entries()) {
        const filePath = path.join(this.CACHE_DIR, `${key}.json`);
        await fs.writeFile(filePath, JSON.stringify(item));
      }
    } catch (error) {
      console.error('Failed to save permanent cache:', error);
    }
  }

  /**
   * Queue item for permanent save (debounced)
   */
  private saveQueue: Map<string, CachedItem> = new Map();
  private saveTimer: NodeJS.Timeout | null = null;

  private queuePermanentSave(key: string, item: CachedItem): void {
    this.saveQueue.set(key, item);

    if (this.saveTimer) clearTimeout(this.saveTimer);

    this.saveTimer = setTimeout(async () => {
      for (const [k, i] of this.saveQueue.entries()) {
        try {
          await fs.mkdir(this.CACHE_DIR, { recursive: true });
          const filePath = path.join(this.CACHE_DIR, `${k}.json`);
          await fs.writeFile(filePath, JSON.stringify(i));
        } catch (error) {
          console.error(`Failed to save cache entry ${k}:`, error);
        }
      }
      this.saveQueue.clear();
    }, 1000); // Save after 1 second of inactivity
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    // Only clean tiered cache (permanent never expires)
    for (const [key, item] of this.tieredCache.entries()) {
      if (item.expiresAt && now > item.expiresAt + 60 * 60 * 1000) {
        // Remove if expired for more than 1 hour
        this.tieredCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    const stats: any = {
      permanent: {
        count: this.permanentCache.size,
        topHits: []
      },
      tiered: {
        count: this.tieredCache.size,
        capacity: this.tieredCache.max
      },
      pending: this.pendingRequests.size
    };

    // Get top 5 most accessed permanent items
    const permanentItems = Array.from(this.permanentCache.entries())
      .sort((a, b) => b[1].hits - a[1].hits)
      .slice(0, 5);

    stats.permanent.topHits = permanentItems.map(([key, item]) => ({
      key,
      hits: item.hits
    }));

    return stats;
  }

  /**
   * Clear all caches (for debugging)
   */
  async clearAll(): Promise<void> {
    this.permanentCache.clear();
    this.tieredCache.clear();
    this.pendingRequests.clear();

    // Clear disk cache
    try {
      const files = await fs.readdir(this.CACHE_DIR);
      for (const file of files) {
        await fs.unlink(path.join(this.CACHE_DIR, file));
      }
    } catch {
      // Directory might not exist
    }
  }
}

// Export singleton instance
export const unifiedCache = UnifiedCache.getInstance();

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
  // Quotes
  quote: (symbol: string) => `quote:${symbol.toUpperCase()}`,

  // Company profiles (permanent)
  profile: (symbol: string) => `profile:${symbol.toUpperCase()}`,

  // Historical data
  history: (symbol: string, interval: string, period: string) =>
    `history:${symbol.toUpperCase()}:${interval}:${period}`,

  // News
  news: (symbol: string) => `news:${symbol.toUpperCase()}`,
  marketNews: () => 'news:market',

  // Market movers
  movers: () => 'market:movers',

  // Calendar events
  earnings: (date: string) => `calendar:earnings:${date}`,
  dividends: (date: string) => `calendar:dividends:${date}`,
  ipos: (date: string) => `calendar:ipos:${date}`,

  // Symbol database (permanent)
  symbolDB: () => 'symbols:database',
  symbolSearch: (query: string) => `symbols:search:${query.toLowerCase()}`
};