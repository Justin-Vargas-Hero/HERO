'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Activity, DollarSign, BarChart, Info, Star, ExternalLink } from 'lucide-react';
import { TickerSymbol } from '@/data/ticker-database';
import { useMarketQuote } from '@/hooks/useMarketData';
import { formatPrice, formatVolume, getPriceChangeColor } from '@/hooks/useMarketData';
import Link from 'next/link';

interface TickerModalProps {
  ticker: TickerSymbol;
  quote: any;
  open: boolean;
  onClose: () => void;
}

export default function TickerModal({ ticker, quote: initialQuote, open, onClose }: TickerModalProps) {
  const [isWatchlist, setIsWatchlist] = useState(false);
  
  // Fetch real-time quote with polling
  const { quote, loading, error } = useMarketQuote(ticker.symbol, {
    enabled: open,
    pollInterval: 10000 // Update every 10 seconds
  });

  // Use initial quote if real-time not loaded yet
  const displayQuote = quote || initialQuote;

  // Check if ticker is in watchlist
  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
    setIsWatchlist(watchlist.includes(ticker.symbol));
  }, [ticker.symbol]);

  // Toggle watchlist
  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
    if (isWatchlist) {
      const updated = watchlist.filter((s: string) => s !== ticker.symbol);
      localStorage.setItem('hero_watchlist', JSON.stringify(updated));
      setIsWatchlist(false);
    } else {
      const updated = [...watchlist, ticker.symbol];
      localStorage.setItem('hero_watchlist', JSON.stringify(updated));
      setIsWatchlist(true);
    }
  };

  if (!open) return null;

  // Calculate additional metrics
  const marketCap = displayQuote?.price && displayQuote?.volume 
    ? displayQuote.price * displayQuote.volume * 0.1 // Rough estimate
    : null;
  
  const isPositive = displayQuote?.change >= 0;
  const changeIcon = isPositive ? TrendingUp : TrendingDown;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeBg = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-background/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold">{ticker.symbol}</h2>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    ticker.exchange === 'CRYPTO' 
                      ? 'bg-orange-500/10 text-orange-500'
                      : ticker.exchange === 'NASDAQ'
                      ? 'bg-purple-500/10 text-purple-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {ticker.exchange}
                  </span>
                </div>
                <p className="text-muted-foreground">{ticker.name}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleWatchlist}
                  className={`p-2 rounded-lg transition-colors ${
                    isWatchlist 
                      ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <Star className="h-5 w-5" fill={isWatchlist ? 'currentColor' : 'none'} />
                </button>
                <Link
                  href={`/ticker/${ticker.symbol}`}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Price Display */}
            {displayQuote && (
              <div className="mt-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold">
                    {formatPrice(displayQuote.price)}
                  </span>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${changeBg}`}>
                    {React.createElement(changeIcon, { className: `h-4 w-4 ${changeColor}` })}
                    <span className={`font-semibold ${changeColor}`}>
                      {isPositive && '+'}{displayQuote.change.toFixed(2)}
                    </span>
                    <span className={`text-sm ${changeColor}`}>
                      ({isPositive && '+'}{displayQuote.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load market data</p>
              <p className="text-sm mt-1">Please try again later</p>
            </div>
          ) : !displayQuote ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading market data...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Activity className="h-4 w-4" />
                    <span>Open</span>
                  </div>
                  <p className="font-semibold">{formatPrice(displayQuote.open)}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>High</span>
                  </div>
                  <p className="font-semibold">{formatPrice(displayQuote.high)}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>Low</span>
                  </div>
                  <p className="font-semibold">{formatPrice(displayQuote.low)}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <BarChart className="h-4 w-4" />
                    <span>Volume</span>
                  </div>
                  <p className="font-semibold">{formatVolume(displayQuote.volume)}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Session Data</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Previous Close</span>
                      <span className="font-medium">{formatPrice(displayQuote.previousClose)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Day Range</span>
                      <span className="font-medium">
                        {formatPrice(displayQuote.low)} - {formatPrice(displayQuote.high)}
                      </span>
                    </div>
                    {displayQuote.currency && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Currency</span>
                        <span className="font-medium">{displayQuote.currency}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/ticker/${ticker.symbol}`}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center block text-sm font-medium"
                    >
                      View Full Chart
                    </Link>
                    <button className="w-full px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium">
                      Add to Portfolio
                    </button>
                    <button className="w-full px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium">
                      Set Price Alert
                    </button>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="mt-4 text-center text-xs text-muted-foreground">
                Last updated: {new Date(displayQuote.timestamp).toLocaleString()}
                {loading && <span className="ml-2">(Refreshing...)</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-import React for createElement
import React from 'react';