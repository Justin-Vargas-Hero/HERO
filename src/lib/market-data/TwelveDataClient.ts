import { EventEmitter } from 'events';

interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
  exchange?: string;
  currency?: string;
  // Pre/Post-market fields
  preMarketPrice?: number;
  preMarketChange?: number;
  preMarketChangePercent?: number;
  preMarketVolume?: number;
  preMarketTime?: string;
  postMarketPrice?: number;
  postMarketChange?: number;
  postMarketChangePercent?: number;
  postMarketVolume?: number;
  postMarketTime?: string;
  isMarketOpen?: boolean;
  // Extended hours indicator
  extendedHours?: boolean;
}

interface CachedQuote {
  data: MarketQuote;
  timestamp: number;
  expiresAt: number;
}

interface BatchRequest {
  symbols: string[];
  resolve: (value: Map<string, MarketQuote>) => void;
  reject: (error: any) => void;
}

/**
 * TwelveData client optimized for shared server-side usage
 * Uses intelligent caching and request batching to stay within rate limits
 */
export class TwelveDataClient {
  private apiKey: string;
  private cache: Map<string, CachedQuote> = new Map();
  private requestCount: number = 0;
  private resetTime: number = Date.now() + 60000;
  private readonly MAX_REQUESTS_PER_MINUTE = 600;
  private readonly CACHE_TTL = 10000; // 10 seconds for active trading hours
  private readonly CACHE_TTL_AFTER_HOURS = 60000; // 1 minute after hours
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // 100ms to collect requests
  private readonly MAX_BATCH_SIZE = 50; // TwelveData max symbols per request

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.startRateLimitReset();
    this.startCacheCleanup();
  }

  /**
   * Get a single quote with caching
   */
  async getQuote(symbol: string): Promise<MarketQuote> {
    const upperSymbol = symbol.toUpperCase();
    
    // Check cache
    const cached = this.cache.get(upperSymbol);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Fetch fresh data
    return this.fetchSingleQuote(upperSymbol);
  }

  /**
   * Get multiple quotes efficiently with batching
   */
  async getBatchQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const upperSymbols = symbols.map(s => s.toUpperCase());
    const results = new Map<string, MarketQuote>();
    const needed: string[] = [];

    // Check cache first
    upperSymbols.forEach(symbol => {
      const cached = this.cache.get(symbol);
      if (cached && Date.now() < cached.expiresAt) {
        results.set(symbol, cached.data);
      } else {
        needed.push(symbol);
      }
    });

    // If all found in cache, return immediately
    if (needed.length === 0) {
      return results;
    }

    // Batch fetch missing symbols
    const freshData = await this.batchFetch(needed);
    freshData.forEach((quote, symbol) => {
      results.set(symbol, quote);
    });

    return results;
  }

  /**
   * Batch multiple requests together for efficiency
   */
  private batchFetch(symbols: string[]): Promise<Map<string, MarketQuote>> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ symbols, resolve, reject });
      
      // Set up batch processing
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_DELAY);
      }
    });
  }

  /**
   * Process batched requests
   */
  private async processBatch(): Promise<void> {
    this.batchTimer = null;
    
    if (this.batchQueue.length === 0) return;

    // Collect all unique symbols
    const allSymbols = new Set<string>();
    const requests = [...this.batchQueue];
    this.batchQueue = [];

    requests.forEach(req => {
      req.symbols.forEach(symbol => allSymbols.add(symbol));
    });

    const symbolArray = Array.from(allSymbols);

    try {
      // Check rate limit
      if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
        // Wait for rate limit reset
        const waitTime = Math.max(0, this.resetTime - Date.now());
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Split into chunks if needed
      const chunks: string[][] = [];
      for (let i = 0; i < symbolArray.length; i += this.MAX_BATCH_SIZE) {
        chunks.push(symbolArray.slice(i, i + this.MAX_BATCH_SIZE));
      }

      const allResults = new Map<string, MarketQuote>();

      // Fetch each chunk
      for (const chunk of chunks) {
        const chunkResults = await this.fetchBatchQuotes(chunk);
        chunkResults.forEach((quote, symbol) => {
          allResults.set(symbol, quote);
        });
      }

      // Resolve all waiting requests
      requests.forEach(req => {
        const results = new Map<string, MarketQuote>();
        req.symbols.forEach(symbol => {
          const quote = allResults.get(symbol);
          if (quote) {
            results.set(symbol, quote);
          }
        });
        req.resolve(results);
      });
    } catch (error) {
      // Reject all waiting requests
      requests.forEach(req => req.reject(error));
    }
  }

  /**
   * Fetch a single quote from API
   */
  private async fetchSingleQuote(symbol: string): Promise<MarketQuote> {
    // Check rate limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = Math.max(0, this.resetTime - Date.now());
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestCount++;

    // Include pre/post-market data
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&prepost=true&apikey=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch quote');
    }

    const quote = this.formatQuote(symbol, data);
    this.updateCache(symbol, quote);
    return quote;
  }

  /**
   * Fetch multiple quotes in one API call
   */
  private async fetchBatchQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    // Check rate limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = Math.max(0, this.resetTime - Date.now());
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestCount++;

    const symbolString = symbols.join(',');
    // Include pre/post-market data
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbolString}&prepost=true&apikey=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = new Map<string, MarketQuote>();

    // Handle single symbol response
    if (symbols.length === 1) {
      if (data.status !== 'error') {
        const quote = this.formatQuote(symbols[0], data);
        results.set(symbols[0], quote);
        this.updateCache(symbols[0], quote);
      }
    } else {
      // Handle batch response
      Object.entries(data).forEach(([symbol, quoteData]: [string, any]) => {
        if (quoteData.status !== 'error') {
          const quote = this.formatQuote(symbol, quoteData);
          results.set(symbol, quote);
          this.updateCache(symbol, quote);
        }
      });
    }

    return results;
  }

  /**
   * Format raw API data into MarketQuote
   */
  private formatQuote(symbol: string, data: any): MarketQuote {
    const quote: MarketQuote = {
      symbol: symbol.toUpperCase(),
      price: parseFloat(data.close || data.price || 0),
      change: parseFloat(data.change || 0),
      changePercent: parseFloat(data.percent_change || 0),
      volume: parseInt(data.volume || 0),
      high: parseFloat(data.high || 0),
      low: parseFloat(data.low || 0),
      open: parseFloat(data.open || 0),
      previousClose: parseFloat(data.previous_close || 0),
      timestamp: Date.now(),
      exchange: data.exchange,
      currency: data.currency,
      isMarketOpen: data.is_market_open
    };

    // Add pre-market data if available
    if (data.premarket_price) {
      quote.preMarketPrice = parseFloat(data.premarket_price);
      quote.preMarketChange = parseFloat(data.premarket_change || 0);
      quote.preMarketChangePercent = parseFloat(data.premarket_percent_change || 0);
      quote.preMarketVolume = parseInt(data.premarket_volume || 0);
      quote.preMarketTime = data.premarket_time;
    }

    // Add post-market data if available
    if (data.postmarket_price) {
      quote.postMarketPrice = parseFloat(data.postmarket_price);
      quote.postMarketChange = parseFloat(data.postmarket_change || 0);
      quote.postMarketChangePercent = parseFloat(data.postmarket_percent_change || 0);
      quote.postMarketVolume = parseInt(data.postmarket_volume || 0);
      quote.postMarketTime = data.postmarket_time;
    }

    // Determine if we're in extended hours
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    // Pre-market: 4:00 AM - 9:30 AM ET (9:00 - 14:30 UTC)
    // Post-market: 4:00 PM - 8:00 PM ET (21:00 - 01:00 UTC)
    if (isWeekday) {
      if ((hour >= 9 && hour < 14.5) || (hour >= 21 || hour < 1)) {
        quote.extendedHours = true;
      }
    }

    return quote;
  }

  /**
   * Update cache with smart TTL based on market hours
   */
  private updateCache(symbol: string, quote: MarketQuote): void {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    
    // Check if market is open (rough check for US markets)
    // Mon-Fri, 14:30-21:00 UTC (9:30 AM - 4:00 PM ET)
    const isMarketHours = day >= 1 && day <= 5 && hour >= 14 && hour < 21;
    
    const ttl = isMarketHours ? this.CACHE_TTL : this.CACHE_TTL_AFTER_HOURS;
    
    this.cache.set(symbol, {
      data: quote,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Clean up expired cache entries
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      this.cache.forEach((cached, symbol) => {
        if (now > cached.expiresAt) {
          keysToDelete.push(symbol);
        }
      });
      
      keysToDelete.forEach(key => this.cache.delete(key));
    }, 60000); // Clean every minute
  }

  /**
   * Reset rate limit counter every minute
   */
  private startRateLimitReset(): void {
    setInterval(() => {
      const now = Date.now();
      if (now >= this.resetTime) {
        this.requestCount = 0;
        this.resetTime = now + 60000;
      }
    }, 1000);
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(symbol: string, interval: string = '5min', outputsize: number = 78): Promise<any> {
    // Include pre/post-market data for time series
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&prepost=true&apikey=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch time series');
    }

    return data;
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      requestCount: this.requestCount,
      rateLimitRemaining: this.MAX_REQUESTS_PER_MINUTE - this.requestCount,
      resetIn: Math.max(0, this.resetTime - Date.now()),
      queueSize: this.batchQueue.length
    };
  }

  private cacheHits = 0;
  private cacheMisses = 0;

  private calculateCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }
}

// Singleton instance
let clientInstance: TwelveDataClient | null = null;

export function getTwelveDataClient(): TwelveDataClient {
  if (!clientInstance) {
    const apiKey = process.env.TWELVEDATA_API_KEY;
    if (!apiKey) {
      throw new Error('TWELVEDATA_API_KEY not configured');
    }
    clientInstance = new TwelveDataClient(apiKey);
  }
  return clientInstance;
}