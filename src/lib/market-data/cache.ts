/**
 * Client-side Market Data Cache Manager
 * Coordinates with server-side caching and manages subscriptions
 */

interface CachedData {
  data: any;
  timestamp: number;
}

interface PendingRequest {
  symbol: string;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

class MarketDataCache {
  private static instance: MarketDataCache;
  private cache: Map<string, CachedData> = new Map();
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private lastFetch: Map<string, number> = new Map();
  
  // Client-side cooldowns (to prevent too frequent requests to our own server)
  private readonly MIN_REQUEST_INTERVAL = 5000; // 5 seconds minimum between same requests
  private readonly CLIENT_CACHE_TTL = 30000; // 30 seconds client cache
  
  private constructor() {
    // Clean up old entries periodically (every 5 minutes)
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  static getInstance(): MarketDataCache {
    if (!MarketDataCache.instance) {
      MarketDataCache.instance = new MarketDataCache();
    }
    return MarketDataCache.instance;
  }

  /**
   * Get quote from server (server handles caching)
   */
  async getQuote(symbol: string): Promise<any> {
    const upperSymbol = symbol.toUpperCase();
    const cached = this.cache.get(upperSymbol);
    const now = Date.now();
    const lastFetch = this.lastFetch.get(upperSymbol) || 0;
    
    // Use client cache if fresh enough and not requesting too frequently
    if (cached && (now - cached.timestamp) < this.CLIENT_CACHE_TTL && 
        (now - lastFetch) < this.MIN_REQUEST_INTERVAL) {
      return cached.data;
    }
    
    // Check if there's already a pending request for this symbol
    const pending = this.pendingRequests.get(upperSymbol);
    if (pending) {
      // Join the existing request
      return new Promise((resolve, reject) => {
        pending.push({ symbol: upperSymbol, resolve, reject });
      });
    }
    
    // Start a new request
    return this.fetchQuote(upperSymbol);
  }

  /**
   * Get multiple quotes efficiently from server
   */
  async getBatchQuotes(symbols: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const toFetch: string[] = [];
    const now = Date.now();
    
    // Check client cache first
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase();
      const cached = this.cache.get(upperSymbol);
      const lastFetch = this.lastFetch.get(upperSymbol) || 0;
      
      if (cached && (now - cached.timestamp) < this.CLIENT_CACHE_TTL && 
          (now - lastFetch) < this.MIN_REQUEST_INTERVAL) {
        results.set(upperSymbol, cached.data);
      } else {
        toFetch.push(upperSymbol);
      }
    }
    
    // Fetch missing quotes
    if (toFetch.length > 0) {
      const freshData = await this.fetchBatchQuotes(toFetch);
      freshData.forEach((data, symbol) => {
        results.set(symbol, data);
      });
    }
    
    return results;
  }

  /**
   * Get market movers from server (server handles 1-hour cache)
   */
  async getMarketMovers(): Promise<any> {
    const cacheKey = 'MARKET_MOVERS';
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    const lastFetch = this.lastFetch.get(cacheKey) || 0;
    
    // Use client cache for 5 minutes to reduce server load
    if (cached && (now - cached.timestamp) < 5 * 60 * 1000 && 
        (now - lastFetch) < this.MIN_REQUEST_INTERVAL) {
      return cached.data;
    }
    
    // Check for pending request
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return new Promise((resolve, reject) => {
        pending.push({ symbol: cacheKey, resolve, reject });
      });
    }
    
    // Fetch fresh data
    return this.fetchMarketMovers();
  }

  /**
   * Subscribe to updates for a symbol
   */
  subscribe(symbol: string, callback: (data: any) => void): () => void {
    const upperSymbol = symbol.toUpperCase();
    
    if (!this.subscribers.has(upperSymbol)) {
      this.subscribers.set(upperSymbol, new Set());
    }
    
    this.subscribers.get(upperSymbol)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(upperSymbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(upperSymbol);
        }
      }
    };
  }

  /**
   * Fetch quote from server
   */
  private async fetchQuote(symbol: string): Promise<any> {
    // Mark as pending
    this.pendingRequests.set(symbol, []);
    this.lastFetch.set(symbol, Date.now());
    
    try {
      const response = await fetch(`/api/market/quote?symbol=${symbol}`);
      const data = await response.json();
      
      if (data.quote) {
        // Update client cache
        this.updateCache(symbol, data.quote);
        
        // Notify subscribers
        this.notifySubscribers(symbol, data.quote);
        
        // Resolve pending requests
        const pending = this.pendingRequests.get(symbol);
        if (pending) {
          pending.forEach(p => p.resolve(data.quote));
        }
        
        return data.quote;
      }
      
      throw new Error('No quote data received');
    } catch (error) {
      // Reject pending requests
      const pending = this.pendingRequests.get(symbol);
      if (pending) {
        pending.forEach(p => p.reject(error));
      }
      throw error;
    } finally {
      this.pendingRequests.delete(symbol);
    }
  }

  /**
   * Fetch batch quotes from API
   */
  private async fetchBatchQuotes(symbols: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // Mark all as pending
    symbols.forEach(symbol => {
      if (!this.pendingRequests.has(symbol)) {
        this.pendingRequests.set(symbol, []);
      }
    });
    
    try {
      // Batch request to API
      const symbolsParam = symbols.join(',');
      const response = await fetch(`/api/market/quote?symbols=${symbolsParam}`);
      const data = await response.json();
      
      if (data.quotes) {
        data.quotes.forEach((quote: any) => {
          const symbol = quote.symbol;
          results.set(symbol, quote);
          
          // Update cache
          this.updateCache(symbol, quote);
          
          // Notify subscribers
          this.notifySubscribers(symbol, quote);
          
          // Resolve pending
          const pending = this.pendingRequests.get(symbol);
          if (pending) {
            pending.forEach(p => p.resolve(quote));
          }
        });
      }
      
      return results;
    } catch (error) {
      // Reject all pending
      symbols.forEach(symbol => {
        const pending = this.pendingRequests.get(symbol);
        if (pending) {
          pending.forEach(p => p.reject(error));
        }
      });
      throw error;
    } finally {
      symbols.forEach(symbol => {
        this.pendingRequests.delete(symbol);
      });
    }
  }

  /**
   * Fetch market movers from server
   */
  private async fetchMarketMovers(): Promise<any> {
    const cacheKey = 'MARKET_MOVERS';
    this.pendingRequests.set(cacheKey, []);
    this.lastFetch.set(cacheKey, Date.now());
    
    try {
      const response = await fetch('/api/market/movers');
      const result = await response.json();
      
      // Extract the actual data (server sends additional metadata)
      const data = result.gainers ? result : result;
      
      // Update client cache
      this.updateCache(cacheKey, data);
      
      // Resolve pending
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        pending.forEach(p => p.resolve(data));
      }
      
      return data;
    } catch (error) {
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        pending.forEach(p => p.reject(error));
      }
      throw error;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Update client cache
   */
  private updateCache(key: string, data: any): void {
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now
    });
    
    // Also update related symbols (e.g., BTC/USD -> BTC)
    if (key.includes('/')) {
      const baseSymbol = key.split('/')[0];
      this.cache.set(baseSymbol, {
        data,
        timestamp: now
      });
      this.notifySubscribers(baseSymbol, data);
    }
  }

  /**
   * Notify all subscribers of a symbol
   */
  private notifySubscribers(symbol: string, data: any): void {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber notification error:', error);
        }
      });
    }
  }

  /**
   * Clean up old cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour for client cache
    
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > maxAge) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.lastFetch.delete(key);
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    const now = Date.now();
    let freshCount = 0;
    let staleCount = 0;
    
    this.cache.forEach(entry => {
      if (now - entry.timestamp < this.CLIENT_CACHE_TTL) {
        freshCount++;
      } else {
        staleCount++;
      }
    });
    
    return {
      totalCached: this.cache.size,
      fresh: freshCount,
      stale: staleCount,
      pendingRequests: this.pendingRequests.size,
      subscribers: this.subscribers.size
    };
  }

  /**
   * Force clear cache (for debugging)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Force refresh a symbol (bypasses client cache)
   */
  async forceRefresh(symbol: string): Promise<any> {
    const upperSymbol = symbol.toUpperCase();
    this.cache.delete(upperSymbol);
    this.lastFetch.delete(upperSymbol);
    return this.fetchQuote(upperSymbol);
  }
}

export const marketDataCache = MarketDataCache.getInstance();