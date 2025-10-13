'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getSymbol } from '@/data/symbol-database';
import { marketSyncManager } from '@/lib/market-data/sync-manager';
import { formatNumber, formatCurrency } from '@/lib/utils';

// Clean company name helper
function cleanCompanyName(name: string): string {
  return name.replace(/\.(com|org|net|io|co|ai)$/i, '').trim();
}

// Mini sparkline component for watchlist
function MiniChart({ data, isPositive }: { data: number[], isPositive: boolean }) {
  if (!data || data.length === 0) return null;

  // Use data range for scaling to show actual movement
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100; // Wider chart
  const height = 24;

  // Create the path for the line
  const pathPoints = data.map((price, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((price - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Use single color based on whether stock is up or down for the day
  const lineColor = isPositive ? '#16a34a' : '#dc2626';

  return (
    <svg width={width} height={height} className="inline-block">
      {/* Draw the line with single color based on up/down */}
      <polyline
        points={pathPoints}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState<string[]>([]);
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, any>>({});
  const [watchlistCharts, setWatchlistCharts] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);

  // Load watchlist from localStorage
  useEffect(() => {
    const loadWatchlist = () => {
      const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
      setWatchlistItems(watchlist);
    };

    // Initial load
    loadWatchlist();

    // Listen for watchlist updates
    const handleWatchlistUpdate = () => {
      loadWatchlist();
    };

    window.addEventListener('watchlistUpdated', handleWatchlistUpdate);

    return () => {
      window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);
    };
  }, []);

  // Fetch watchlist quotes and mini chart data
  useEffect(() => {
    if (watchlistItems.length === 0) {
      setLoading(false);
      return;
    }

    const fetchWatchlistData = async () => {
      try {
        setLoading(true);

        // Calculate how many minutes to fetch based on asset type
        const now = new Date();

        // Get current time in ET (Eastern Time)
        const etOffset = -5; // ET is UTC-5 (or UTC-4 during DST)
        const utcHour = now.getUTCHours();
        const utcMinute = now.getUTCMinutes();

        // Convert to ET (rough conversion, doesn't handle DST perfectly)
        let etHour = (utcHour + etOffset + 24) % 24;
        const etMinute = utcMinute;

        // Fetch quotes for all watchlist items
        const quotePromises = watchlistItems.map(s =>
          fetch(`/api/market/quote?symbol=${encodeURIComponent(s)}`).then(r => r.json())
        );

        // Fetch intraday history for mini charts
        const historyPromises = watchlistItems.map(s => {
          // Check if it's a 24-hour asset (crypto pairs have /)
          const is24HourAsset = s.includes('/');

          let outputsize: number;
          if (is24HourAsset) {
            // For crypto: from midnight (00:00) to current time in UTC
            const utcMinutesSinceMidnight = utcHour * 60 + utcMinute;
            outputsize = Math.max(30, Math.min(utcMinutesSinceMidnight, 1440)); // Max 24 hours
          } else {
            // For stocks: from 9:30 AM ET to current time ET
            const marketOpenHour = 9;
            const marketOpenMinute = 30;

            // Calculate minutes since market open in ET
            const minutesSinceMarketOpen = (etHour - marketOpenHour) * 60 + (etMinute - marketOpenMinute);

            // If before market open, show pre-market data (last 30-60 min)
            if (minutesSinceMarketOpen < 0) {
              outputsize = 60; // Show pre-market activity
            } else if (etHour >= 16) {
              // After market close (4 PM ET), show full day
              outputsize = 390; // Full regular session
            } else {
              outputsize = Math.max(30, Math.min(minutesSinceMarketOpen, 390)); // Max 6.5 hours (regular session)
            }
          }

          return fetch(`/api/market/history?symbol=${encodeURIComponent(s)}&interval=1min&outputsize=${outputsize}`)
            .then(r => r.json())
            .catch(() => ({ values: [] }));
        });

        const [quoteResults, historyResults] = await Promise.all([
          Promise.all(quotePromises),
          Promise.all(historyPromises)
        ]);

        const quotesMap: Record<string, any> = {};
        const chartsMap: Record<string, number[]> = {};

        quoteResults.forEach((data, index) => {
          if (data.quote) {
            quotesMap[watchlistItems[index]] = data.quote;
          }
        });

        // Use REAL historical data for mini charts - NO RANDOM GENERATION
        historyResults.forEach((data, index) => {
          if (data.values && Array.isArray(data.values) && data.values.length > 0) {
            // Extract closing prices for mini chart (reverse to get chronological order)
            // Don't slice - use all the data we fetched (from midnight/market open to current)
            chartsMap[watchlistItems[index]] = data.values
              .reverse()
              .map((v: any) => parseFloat(v.close) || 0);
          } else {
            // No data available - use empty array (chart will not be shown)
            chartsMap[watchlistItems[index]] = [];
          }
        });

        setWatchlistQuotes(quotesMap);
        setWatchlistCharts(chartsMap);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch watchlist data:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchWatchlistData();

    // Subscribe to synchronized updates at :00 seconds
    const unsubscribe = marketSyncManager.subscribe('watchlist', () => {
      console.log('Watchlist sync update triggered');
      fetchWatchlistData();
    });

    return () => {
      unsubscribe();
    };
  }, [watchlistItems]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <h2 className="text-lg font-manrope font-semibold mb-3">Watchlist</h2>
        {loading && watchlistItems.length > 0 ? (
          <div className="space-y-2">
            {[...Array(Math.min(3, watchlistItems.length))].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : watchlistItems.length > 0 ? (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2 thin-scrollbar">
            {watchlistItems.map(watchSymbol => {
              const watchQuote = watchlistQuotes[watchSymbol];
              const watchChart = watchlistCharts[watchSymbol];
              const watchSymbolData = getSymbol(watchSymbol);
              const watchIsPositive = watchQuote?.change >= 0;

              return (
                <Link
                  key={watchSymbol}
                  href={`/symbol/${encodeURIComponent(watchSymbol)}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    {/* Symbol and company name - fixed width */}
                    <div className="flex-shrink-0 pr-2" style={{ minWidth: '80px' }}>
                      <p className="text-sm font-manrope font-medium">{watchSymbol}</p>
                      <p className="text-xs text-gray-500 truncate font-inter">
                        {watchSymbolData ? cleanCompanyName(watchSymbolData.name) : ''}
                      </p>
                    </div>

                    {/* Mini chart - inline in center */}
                    {watchChart && watchChart.length > 0 && (
                      <div className="flex-1 flex justify-center px-1">
                        <MiniChart
                          data={watchChart}
                          isPositive={watchIsPositive}
                        />
                      </div>
                    )}

                    {/* Price and change - fixed width right side */}
                    {watchQuote ? (
                      <div className="text-right flex-shrink-0 pl-2" style={{ minWidth: '95px' }}>
                        <p className="text-sm font-inter font-medium">
                          {formatCurrency(watchQuote.price, watchQuote.price > 10000 ? 0 : 2)}
                        </p>
                        <p className={`text-xs font-inter ${
                          watchIsPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {watchIsPositive && '+'}{formatNumber(Math.abs(watchQuote.change), 2)} ({watchIsPositive && '+'}{watchQuote.changePercent.toFixed(2)}%)
                        </p>
                      </div>
                    ) : (
                      <div className="text-right flex-shrink-0 pl-2" style={{ minWidth: '85px' }}>
                        <p className="text-sm font-inter text-gray-400">Loading...</p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm font-inter">
            <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No items in watchlist</p>
            <p className="text-xs mt-1">Search for a symbol and click the star to add</p>
          </div>
        )}
      </div>
    </div>
  );
}