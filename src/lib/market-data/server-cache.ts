/**
 * Server-side Market Data Cache Manager
 * Handles caching at the API level to prevent duplicate TwelveData API calls
 */

interface CachedData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest {
  symbol: string;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

class ServerMarketCache {
  private static instance: ServerMarketCache;
  private cache: Map<string, CachedData> = new Map();
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  
  // Cooldown periods (in milliseconds)
  private readonly QUOTE_COOLDOWN = 60 * 1000; // 1 minute for quotes
  private readonly MARKET_MOVERS_COOLDOWN = 60 * 60 * 1000; // 1 hour for market movers
  private readonly HISTORICAL_COOLDOWN = 5 * 60 * 1000; // 5 minutes for historical data
  private readonly NEWS_COOLDOWN = 15 * 60 * 1000; // 15 minutes for news
  private readonly PROFILE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours for company profiles
  
  private constructor() {
    // Cleanup old entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  static getInstance(): ServerMarketCache {
    if (!ServerMarketCache.instance) {
      ServerMarketCache.instance = new ServerMarketCache();
    }
    return ServerMarketCache.instance;
  }

  /**
   * Get cached data or null if not available/expired
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Set cache with appropriate cooldown
   */
  set(key: string, data: any, type: 'quote' | 'movers' | 'historical' | 'news' | 'profile' = 'quote'): void {
    const now = Date.now();
    let cooldown = this.QUOTE_COOLDOWN;
    
    switch(type) {
      case 'movers':
        cooldown = this.MARKET_MOVERS_COOLDOWN;
        break;
      case 'historical':
        cooldown = this.HISTORICAL_COOLDOWN;
        break;
      case 'news':
        cooldown = this.NEWS_COOLDOWN;
        break;
      case 'profile':
        cooldown = this.PROFILE_COOLDOWN;
        break;
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cooldown
    });
  }

  /**
   * Check if a request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Add a pending request
   */
  addPending(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const pending = this.pendingRequests.get(key) || [];
      pending.push({ symbol: key, resolve, reject });
      this.pendingRequests.set(key, pending);
    });
  }

  /**
   * Resolve pending requests
   */
  resolvePending(key: string, data: any): void {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      pending.forEach(req => req.resolve(data));
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Reject pending requests
   */
  rejectPending(key: string, error: any): void {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      pending.forEach(req => req.reject(error));
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear pending request
   */
  clearPending(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Batch get quotes - returns Map of symbol to quote data
   */
  getBatchQuotes(symbols: string[]): Map<string, any> {
    const results = new Map<string, any>();
    const now = Date.now();
    
    for (const symbol of symbols) {
      const key = `quote:${symbol.toUpperCase()}`;
      const cached = this.cache.get(key);
      
      if (cached && now < cached.expiresAt) {
        results.set(symbol.toUpperCase(), cached.data);
      }
    }
    
    return results;
  }

  /**
   * Set batch quotes
   */
  setBatchQuotes(quotes: Map<string, any>): void {
    quotes.forEach((data, symbol) => {
      this.set(`quote:${symbol.toUpperCase()}`, data, 'quote');
    });
  }

  /**
   * Get missing symbols from a batch
   */
  getMissingSymbols(symbols: string[]): string[] {
    const missing: string[] = [];
    const now = Date.now();
    
    for (const symbol of symbols) {
      const key = `quote:${symbol.toUpperCase()}`;
      const cached = this.cache.get(key);
      
      if (!cached || now >= cached.expiresAt) {
        missing.push(symbol);
      }
    }
    
    return missing;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      // Remove entries that have been expired for more than 1 hour
      if (now > entry.expiresAt + 60 * 60 * 1000) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;
    
    this.cache.forEach(entry => {
      if (now < entry.expiresAt) {
        activeCount++;
      } else {
        expiredCount++;
      }
    });
    
    return {
      totalCached: this.cache.size,
      active: activeCount,
      expired: expiredCount,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Clear entire cache (for debugging)
   */
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Force expire a specific key
   */
  expire(key: string): void {
    const cached = this.cache.get(key);
    if (cached) {
      cached.expiresAt = 0;
    }
  }
}

// Export singleton instance
export const serverCache = ServerMarketCache.getInstance();