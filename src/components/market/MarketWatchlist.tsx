'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getTicker } from '@/data/ticker-database';

// Clean company name helper
function cleanCompanyName(name: string): string {
  return name.replace(/\.(com|org|net|io|co|ai)$/i, '').trim();
}

// Small sparkline chart component
function Sparkline({ data, open, isPositive }: { data: number[], open: number, isPositive: boolean }) {
  if (!data || data.length === 0) return null;
  
  const width = 140;
  const height = 36;
  const padding = 3;
  
  // Find min and max for scaling
  const min = Math.min(...data, open);
  const max = Math.max(...data, open);
  const range = max - min || 1;
  
  // Scale points to fit in the chart
  const points = data.map((value, index) => {
    const x = padding + ((width - 2 * padding) * index) / (data.length - 1);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  // Calculate opening price line position
  const openY = height - padding - ((open - min) / range) * (height - 2 * padding);
  
  return (
    <div className="flex items-center justify-center flex-1 px-2">
      <svg width={width} height={height} className="block">
        {/* Opening price dashed line */}
        <line
          x1={padding}
          y1={openY}
          x2={width - padding}
          y2={openY}
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.7"
        />
        {/* Price line */}
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#16a34a' : '#dc2626'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function MarketWatchlist() {
  const [watchlistItems, setWatchlistItems] = useState<string[]>([]);
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, any>>({});
  const [watchlistHistory, setWatchlistHistory] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);

  // Load watchlist from localStorage
  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
    setWatchlistItems(watchlist);
  }, []);

  // Fetch watchlist quotes and history
  useEffect(() => {
    if (watchlistItems.length === 0) {
      setLoading(false);
      return;
    }
    
    const fetchWatchlistData = async () => {
      try {
        // Fetch quotes
        const quotePromises = watchlistItems.map(s => 
          fetch(`/api/market/quote?symbol=${s}`).then(r => r.json())
        );
        
        // Fetch intraday history for sparklines (1-minute intervals)
        const historyPromises = watchlistItems.map(s =>
          fetch(`/api/market/history?symbol=${s}&interval=1min&outputsize=30`)
            .then(r => r.json())
            .catch(() => ({ values: [] }))
        );
        
        const [quoteResults, historyResults] = await Promise.all([
          Promise.all(quotePromises),
          Promise.all(historyPromises)
        ]);
        
        const quotesMap: Record<string, any> = {};
        const historyMap: Record<string, number[]> = {};
        
        quoteResults.forEach((data, index) => {
          if (data.quote) {
            quotesMap[watchlistItems[index]] = data.quote;
          }
        });
        
        historyResults.forEach((data, index) => {
          if (data.values && Array.isArray(data.values)) {
            // Extract closing prices for sparkline (reverse to get chronological order)
            historyMap[watchlistItems[index]] = data.values
              .slice(0, 30)
              .reverse()
              .map((v: any) => parseFloat(v.close) || 0);
          } else {
            // If no history, create a flat line at current price
            const currentPrice = quotesMap[watchlistItems[index]]?.price || 0;
            historyMap[watchlistItems[index]] = Array(30).fill(currentPrice);
          }
        });
        
        setWatchlistQuotes(quotesMap);
        setWatchlistHistory(historyMap);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch watchlist data:', error);
        setLoading(false);
      }
    };

    fetchWatchlistData();
    const interval = setInterval(fetchWatchlistData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [watchlistItems]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <h2 className="text-lg font-manrope font-semibold mb-3">Watchlist</h2>
        {loading && watchlistItems.length > 0 ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
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
          <div className="space-y-2">
            {watchlistItems.map(watchSymbol => {
              const watchQuote = watchlistQuotes[watchSymbol];
              const watchHistory = watchlistHistory[watchSymbol] || [];
              const watchTicker = getTicker(watchSymbol);
              const watchIsPositive = watchQuote?.change >= 0;
              
              // Calculate opening price (current price - change)
              const openingPrice = watchQuote ? watchQuote.price - watchQuote.change : 0;
              
              return (
                <Link
                  key={watchSymbol}
                  href={`/ticker/${watchSymbol}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    {/* Symbol and company name - fixed width */}
                    <div className="w-20 flex-shrink-0">
                      <p className="text-sm font-manrope font-medium">{watchSymbol}</p>
                      <p className="text-xs text-gray-500 truncate font-inter">
                        {watchTicker ? cleanCompanyName(watchTicker.name) : ''}
                      </p>
                    </div>
                    
                    {/* Sparkline - flexible center area */}
                    {watchQuote && watchHistory.length > 0 && (
                      <Sparkline 
                        data={watchHistory} 
                        open={openingPrice}
                        isPositive={watchIsPositive}
                      />
                    )}
                    
                    {/* Price and change - fixed width right side */}
                    {watchQuote ? (
                      <div className="text-right w-24 flex-shrink-0">
                        <p className="text-sm font-inter font-medium">
                          ${watchQuote.price.toFixed(2)}
                        </p>
                        <p className={`text-xs font-inter ${
                          watchIsPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {watchIsPositive ? '+' : '-'}{Math.abs(watchQuote.change).toFixed(2)} ({Math.abs(watchQuote.changePercent).toFixed(2)}%)
                        </p>
                      </div>
                    ) : (
                      <div className="text-right w-24 flex-shrink-0">
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
            <p className="text-xs mt-1">Search for a ticker and click the star to add</p>
          </div>
        )}
      </div>
    </div>
  );
}