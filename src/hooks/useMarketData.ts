import { useState, useEffect, useCallback, useRef } from 'react';
import { marketSyncManager } from '@/lib/market-data/sync-manager';

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
}

interface UseMarketDataOptions {
  symbols: string[];
  enabled?: boolean;
  syncUpdates?: boolean; // Enable synchronized updates at :00 seconds
}

interface UseMarketDataReturn {
  quotes: Map<string, MarketQuote>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  stats?: any;
  nextUpdateIn?: number; // Seconds until next update
}

/**
 * React hook for fetching market data with synchronized updates
 * Updates ONLY at the top of each minute (:00 seconds) to prevent request spamming
 */
export function useMarketData({
  symbols,
  enabled = true,
  syncUpdates = true // Default to synchronized updates
}: UseMarketDataOptions): UseMarketDataReturn {
  const [quotes, setQuotes] = useState<Map<string, MarketQuote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(0);
  const isVisibleRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const subscriptionId = useRef<string>(`market-data-${Date.now()}`);

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes(new Map());
      setLoading(false);
      return;
    }

    // Prevent duplicate requests within 5 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      console.log('Skipping duplicate request - too soon');
      return;
    }
    lastFetchRef.current = now;

    try {
      const response = await fetch(
        `/api/market/quote?symbols=${symbols.join(',')}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const data = await response.json();

      // Convert array to Map
      const quotesMap = new Map<string, MarketQuote>();
      data.quotes.forEach((quote: MarketQuote) => {
        quotesMap.set(quote.symbol, quote);
      });

      setQuotes(quotesMap);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  // Handle tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      if (isVisibleRef.current && enabled) {
        // Tab became visible, check if we should refresh
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (timeSinceLastFetch > 60000) {
          // If more than 1 minute since last fetch, refresh
          fetchQuotes();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchQuotes, enabled]);

  // Setup synchronized updates
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial fetch
    fetchQuotes();

    if (syncUpdates) {
      // Subscribe to synchronized updates
      const unsubscribe = marketSyncManager.subscribe(subscriptionId.current, () => {
        // Only fetch if tab is visible
        if (isVisibleRef.current) {
          console.log('Synchronized market update triggered');
          fetchQuotes();
        }
      });

      // Update countdown timer
      const countdownInterval = setInterval(() => {
        setNextUpdateIn(marketSyncManager.getSecondsUntilNextSync());
      }, 1000);

      return () => {
        unsubscribe();
        clearInterval(countdownInterval);
      };
    }
    // If sync updates are disabled, don't setup any polling
    // User must manually call refresh()
  }, [symbols.join(','), enabled, syncUpdates, fetchQuotes]);

  return {
    quotes,
    loading,
    error,
    refresh: fetchQuotes,
    stats,
    nextUpdateIn: syncUpdates ? nextUpdateIn : undefined
  };
}

/**
 * Hook for a single quote with synchronized updates
 */
export function useMarketQuote(
  symbol: string,
  options?: {
    enabled?: boolean;
    syncUpdates?: boolean;
  }
) {
  const { quotes, loading, error, refresh, stats, nextUpdateIn } = useMarketData({
    symbols: symbol ? [symbol] : [],
    enabled: options?.enabled ?? true,
    syncUpdates: options?.syncUpdates ?? true
  });

  return {
    quote: quotes.get(symbol.toUpperCase()),
    loading,
    error,
    refresh,
    stats,
    nextUpdateIn
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(price);
}

/**
 * Format price change with +/- sign and proper commas
 */
export function formatPriceChange(change: number, includeSign: boolean = true): string {
  const sign = change > 0 ? '+' : '';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(change));

  return includeSign && change > 0 ? `${sign}$${formatted}` : `$${formatted}`;
}

/**
 * Format percent change with +/- sign
 */
export function formatPercentChange(percent: number, includeSign: boolean = true): string {
  const sign = percent > 0 ? '+' : '';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(percent));

  return includeSign && percent > 0 ? `${sign}${formatted}%` : `${formatted}%`;
}

/**
 * Format large numbers
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  return volume.toString();
}

/**
 * Get color for price change
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
}