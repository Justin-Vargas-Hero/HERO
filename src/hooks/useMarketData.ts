import { useState, useEffect, useCallback, useRef } from 'react';

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
  pollInterval?: number;
  enabled?: boolean;
}

interface UseMarketDataReturn {
  quotes: Map<string, MarketQuote>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  stats?: any;
}

/**
 * React hook for fetching and polling market data
 * Implements smart polling with automatic pause when tab is inactive
 */
export function useMarketData({
  symbols,
  pollInterval = 10000, // Default 10 seconds
  enabled = true
}: UseMarketDataOptions): UseMarketDataReturn {
  const [quotes, setQuotes] = useState<Map<string, MarketQuote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes(new Map());
      setLoading(false);
      return;
    }

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

  // Smart polling based on market hours
  const getSmartPollInterval = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Market hours (Mon-Fri, 9:30 AM - 4:00 PM ET)
    const isMarketHours = 
      day >= 1 && day <= 5 && 
      ((hour === 9 && now.getMinutes() >= 30) || (hour > 9 && hour < 16));
    
    // Pre-market and after-hours (4:00 AM - 9:30 AM, 4:00 PM - 8:00 PM ET)
    const isExtendedHours = 
      day >= 1 && day <= 5 && 
      ((hour >= 4 && hour < 9) || (hour === 9 && now.getMinutes() < 30) ||
       (hour >= 16 && hour < 20));
    
    if (isMarketHours) {
      return Math.min(pollInterval, 10000); // Max 10s during market hours
    } else if (isExtendedHours) {
      return Math.min(pollInterval * 2, 30000); // Max 30s during extended hours
    } else {
      return Math.min(pollInterval * 6, 60000); // Max 60s when market closed
    }
  }, [pollInterval]);

  // Handle tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (isVisibleRef.current && enabled) {
        // Tab became visible, refresh immediately
        fetchQuotes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchQuotes, enabled]);

  // Setup polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchQuotes();

    // Setup polling interval
    const poll = () => {
      if (isVisibleRef.current) {
        fetchQuotes();
      }
    };

    intervalRef.current = setInterval(poll, getSmartPollInterval());

    // Adjust interval based on market hours
    const adjustInterval = setInterval(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(poll, getSmartPollInterval());
      }
    }, 60000); // Check every minute if we need to adjust

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(adjustInterval);
    };
  }, [symbols, enabled, fetchQuotes, getSmartPollInterval]);

  return {
    quotes,
    loading,
    error,
    refresh: fetchQuotes,
    stats
  };
}

/**
 * Hook for a single quote
 */
export function useMarketQuote(symbol: string, options?: Omit<UseMarketDataOptions, 'symbols'>) {
  const { quotes, loading, error, refresh, stats } = useMarketData({
    symbols: symbol ? [symbol] : [],
    ...options
  });

  return {
    quote: quotes.get(symbol.toUpperCase()),
    loading,
    error,
    refresh,
    stats
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