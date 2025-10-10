import { TwelveDataClient } from './TwelveDataClient';
import { EventEmitter } from 'events';

interface MarketDataSubscription {
  userId: string;
  symbols: Set<string>;
  connectionId: string;
  lastActivity: number;
}

interface MarketNews {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  symbols: string[];
  publishedAt: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface MarketEvent {
  id: string;
  symbol: string;
  eventType: 'earnings' | 'dividend' | 'split' | 'ipo';
  eventDate: Date;
  details: Record<string, any>;
}

/**
 * Server-side market data orchestrator
 * Manages efficient data distribution to multiple users
 */
export class MarketDataService extends EventEmitter {
  private twelveDataClient: TwelveDataClient;
  private subscriptions: Map<string, MarketDataSubscription> = new Map();
  private symbolSubscribers: Map<string, Set<string>> = new Map();
  private newsCache: Map<string, MarketNews[]> = new Map();
  private eventsCache: Map<string, MarketEvent[]> = new Map();
  private readonly NEWS_CACHE_TTL = 300000; // 5 minutes
  private lastNewsUpdate: number = 0;

  constructor() {
    super();
    this.twelveDataClient = new TwelveDataClient(process.env.TWELVEDATA_API_KEY!);
    this.setupEventListeners();
    this.startCleanupInterval();
  }

  /**
   * Subscribe user to market data updates
   */
  subscribe(userId: string, connectionId: string, symbols: string[]): void {
    const upperSymbols = symbols.map(s => s.toUpperCase());
    
    // Create or update subscription
    const existing = this.subscriptions.get(connectionId);
    if (existing) {
      // Add new symbols to existing subscription
      upperSymbols.forEach(symbol => existing.symbols.add(symbol));
      existing.lastActivity = Date.now();
    } else {
      this.subscriptions.set(connectionId, {
        userId,
        symbols: new Set(upperSymbols),
        connectionId,
        lastActivity: Date.now()
      });
    }

    // Track symbol -> subscriber mapping
    upperSymbols.forEach(symbol => {
      if (!this.symbolSubscribers.has(symbol)) {
        this.symbolSubscribers.set(symbol, new Set());
      }
      this.symbolSubscribers.get(symbol)!.add(connectionId);
    });

    // Subscribe to real-time updates (stub - real-time not implemented yet)
    // TODO: Implement real-time WebSocket connection
    // this.twelveDataClient.subscribeRealtime(upperSymbols, userId);

    // Send initial quotes
    this.sendInitialQuotes(connectionId, upperSymbols, userId);
  }

  /**
   * Unsubscribe user from updates
   */
  unsubscribe(connectionId: string, symbols?: string[]): void {
    const subscription = this.subscriptions.get(connectionId);
    if (!subscription) return;

    const symbolsToUnsubscribe = symbols 
      ? symbols.map(s => s.toUpperCase())
      : Array.from(subscription.symbols);

    // Remove from symbol mapping
    symbolsToUnsubscribe.forEach(symbol => {
      const subscribers = this.symbolSubscribers.get(symbol);
      if (subscribers) {
        subscribers.delete(connectionId);
        if (subscribers.size === 0) {
          this.symbolSubscribers.delete(symbol);
          // Only unsubscribe from data source if no other users need it
          // TODO: Implement real-time unsubscribe
          // this.twelveDataClient.unsubscribe([symbol], subscription.userId);
        }
      }
      subscription.symbols.delete(symbol);
    });

    // Remove subscription if no symbols left
    if (subscription.symbols.size === 0) {
      this.subscriptions.delete(connectionId);
    }
  }

  /**
   * Get quote with intelligent caching
   */
  async getQuote(symbol: string, userId: string) {
    return this.twelveDataClient.getQuote(symbol);
  }

  /**
   * Get multiple quotes efficiently
   */
  async getBatchQuotes(symbols: string[], userId: string) {
    return this.twelveDataClient.getBatchQuotes(symbols);
  }

  /**
   * Fetch market news
   */
  async getMarketNews(symbols?: string[]): Promise<MarketNews[]> {
    const cacheKey = symbols ? symbols.join(',') : 'general';
    
    // Check cache
    if (Date.now() - this.lastNewsUpdate < this.NEWS_CACHE_TTL) {
      const cached = this.newsCache.get(cacheKey);
      if (cached) return cached;
    }

    // Fetch fresh news
    const params = new URLSearchParams({
      apikey: process.env.TWELVEDATA_API_KEY!,
      outputsize: '30'
    });

    if (symbols && symbols.length > 0) {
      params.append('symbol', symbols.join(','));
    }

    const response = await fetch(
      `https://api.twelvedata.com/market_movers/news?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();
    const news: MarketNews[] = data.data?.map((item: any) => ({
      id: item.uuid,
      headline: item.title,
      summary: item.description,
      source: item.source,
      url: item.url,
      symbols: item.symbols || [],
      publishedAt: new Date(item.published_at),
      sentiment: item.sentiment
    })) || [];

    // Update cache
    this.newsCache.set(cacheKey, news);
    this.lastNewsUpdate = Date.now();

    return news;
  }

  /**
   * Fetch upcoming market events (earnings, dividends, etc.)
   */
  async getMarketEvents(symbol?: string): Promise<MarketEvent[]> {
    const cacheKey = symbol || 'all';
    const cached = this.eventsCache.get(cacheKey);
    
    if (cached && cached.length > 0) {
      return cached;
    }

    const params = new URLSearchParams({
      apikey: process.env.TWELVEDATA_API_KEY!,
      type: 'earnings,dividends,splits'
    });

    if (symbol) {
      params.append('symbol', symbol);
    }

    const response = await fetch(
      `https://api.twelvedata.com/earnings_calendar?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    const data = await response.json();
    const events: MarketEvent[] = data.earnings?.map((item: any) => ({
      id: `${item.symbol}-${item.date}`,
      symbol: item.symbol,
      eventType: 'earnings',
      eventDate: new Date(item.date),
      details: {
        eps_estimate: item.eps_estimate,
        eps_actual: item.eps_actual,
        revenue_estimate: item.revenue_estimate,
        revenue_actual: item.revenue_actual,
        time: item.time
      }
    })) || [];

    // Cache for 1 hour
    this.eventsCache.set(cacheKey, events);
    setTimeout(() => this.eventsCache.delete(cacheKey), 3600000);

    return events;
  }

  /**
   * Get top movers, gainers, losers
   */
  async getMarketMovers() {
    const response = await fetch(
      `https://api.twelvedata.com/market_movers/stocks?apikey=${process.env.TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch market movers');
    }

    return response.json();
  }

  private async sendInitialQuotes(connectionId: string, symbols: string[], userId: string) {
    try {
      const quotes = await this.twelveDataClient.getBatchQuotes(symbols);
      
      // Emit initial data to the specific connection
      this.emit('initialQuotes', {
        connectionId,
        quotes: Array.from(quotes.values())
      });
    } catch (error) {
      console.error('Failed to send initial quotes:', error);
    }
  }

  private setupEventListeners() {
    // Forward quote updates from TwelveData client
    // TODO: Implement real-time quote updates
    // this.twelveDataClient.on('quote:*', (quote) => {
    //   const symbol = quote.symbol;
    //   const subscribers = this.symbolSubscribers.get(symbol);
    //   
    //   if (subscribers && subscribers.size > 0) {
    //     // Broadcast to all subscribers of this symbol
    //     this.emit('quoteUpdate', {
    //       symbol,
    //       quote,
    //       subscribers: Array.from(subscribers)
    //     });
    //   }
    // });
  }

  private startCleanupInterval() {
    // Clean up inactive subscriptions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const timeout = 600000; // 10 minutes
      
      this.subscriptions.forEach((subscription, connectionId) => {
        if (now - subscription.lastActivity > timeout) {
          console.log(`Cleaning up inactive subscription: ${connectionId}`);
          this.unsubscribe(connectionId);
        }
      });
    }, 300000);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      activeConnections: this.subscriptions.size,
      uniqueSymbols: this.symbolSubscribers.size,
      twelveDataStats: this.twelveDataClient.getStats(),
      newsCacheSize: this.newsCache.size,
      eventsCacheSize: this.eventsCache.size
    };
  }
}

// Singleton instance
let serviceInstance: MarketDataService | null = null;

export function getMarketDataService(): MarketDataService {
  if (!serviceInstance) {
    serviceInstance = new MarketDataService();
  }
  return serviceInstance;
}