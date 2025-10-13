'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketDataCache } from '@/lib/market-data/cache';
import { ALL_SYMBOLS } from '@/data/symbol-database';

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Priority symbols that load first for quick display
const PRIORITY_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'SPY', 'QQQ'];

// Additional symbols to load after priority symbols
const ADDITIONAL_SYMBOLS = ['JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'DIS',
  'HD', 'BAC', 'XOM', 'CVX', 'PFE', 'ABBV', 'KO', 'PEP',
  'VZ', 'T', 'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'IBM',
  'DIA', 'COIN', 'PLTR', 'SOFI', 'HOOD', 'RBLX', 'ABNB'];

// All symbols combined
const ALL_TICKER_SYMBOLS = [...PRIORITY_SYMBOLS, ...ADDITIONAL_SYMBOLS];

export function ScrollingTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        // First, fetch priority symbols for quick initial display
        const priorityQuotes = await marketDataCache.getBatchQuotes(PRIORITY_SYMBOLS);
        const items: TickerItem[] = [];

        PRIORITY_SYMBOLS.forEach(symbol => {
          const quote = priorityQuotes.get(symbol);
          if (quote) {
            items.push({
              symbol: symbol,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent
            });
          }
        });

        // Show priority symbols immediately
        if (items.length > 0) {
          setTickerData(items);
          setLoading(false);
        }

        // Then fetch additional symbols in the background
        const additionalQuotes = await marketDataCache.getBatchQuotes(ADDITIONAL_SYMBOLS);

        ADDITIONAL_SYMBOLS.forEach(symbol => {
          const quote = additionalQuotes.get(symbol);
          if (quote) {
            items.push({
              symbol: symbol,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent
            });
          }
        });

        // Update with all symbols
        setTickerData(items);
      } catch (error) {
        console.error('Failed to fetch ticker data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTickerData();

    // Subscribe to updates for all symbols
    const unsubscribers = ALL_TICKER_SYMBOLS.map(symbol => {
      return marketDataCache.subscribe(symbol, (data) => {
        setTickerData(prev => prev.map(item =>
          item.symbol === symbol
            ? { ...item, price: data.price, change: data.change, changePercent: data.changePercent }
            : item
        ));
      });
    });

    // Refresh every minute
    const interval = setInterval(fetchTickerData, 60000);

    return () => {
      clearInterval(interval);
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Show skeleton loading with animated scrolling placeholders
  if (loading || tickerData.length === 0) {
    // Create skeleton items for loading state
    const skeletonItems = Array.from({ length: 20 }, (_, i) => i);
    const duplicatedSkeleton = [...skeletonItems, ...skeletonItems];

    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="ticker-container">
          <div className="ticker-content">
            {duplicatedSkeleton.map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="ticker-item animate-pulse"
              >
                <span className="h-3 w-12 bg-gray-200 rounded"></span>
                <span className="h-3 w-16 bg-gray-200 rounded"></span>
                <span className="h-3 w-14 bg-gray-200 rounded"></span>
                <span className="ticker-spacer" />
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .ticker-container {
            height: 32px;
            display: flex;
            align-items: center;
            position: relative;
            background: white;
          }

          .ticker-content {
            display: flex;
            animation: scroll 90s linear infinite;
            white-space: nowrap;
            align-items: center;
          }

          .ticker-item {
            display: inline-flex;
            align-items: center;
            padding: 0 8px;
            height: 52px;
            gap: 12px;
          }

          .ticker-spacer {
            width: 30px;
            display: inline-block;
          }

          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .ticker-content {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  // Duplicate the array for seamless scrolling
  const duplicatedData = [...tickerData, ...tickerData];

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="ticker-container">
        <div className="ticker-content">
          {duplicatedData.map((item, index) => (
            <Link
              key={`${item.symbol}-${index}`}
              href={`/symbol/${item.symbol}`}
              className="ticker-item"
            >
              <span className="ticker-symbol">{item.symbol} </span>
              <span className="ticker-price">${item.price.toFixed(2)} </span>
              <span className={`ticker-change ${
                item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              } font-semibold text-xs`}>
                {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
              </span>
              {/* Spacer element */}
              <span className="ticker-spacer" />
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-container {
          height: 32px;
          display: flex;
          align-items: center;
          position: relative;
          background: white;
        }

        .ticker-content {
          display: flex;
          animation: scroll 90s linear infinite;
          white-space: nowrap;
          align-items: center;
        }

        .ticker-item {
          display: inline-flex;
          align-items: center;
          padding: 0 8px;
          height: 52px;
          transition: all 0.2s ease;
          cursor: pointer;
          gap: 12px;
          text-decoration: none;
        }

        .ticker-spacer {
          width: 30px;
          display: inline-block;
        }

        .ticker-item:hover {
          background-color: #f9fafb;
          border-radius: 8px;
        }

        .ticker-symbol {
          font-weight: 600;
          color: #111827;
          font-size: 13px;
        }

        .ticker-price {
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
        }

        .ticker-change {
          /* Styles moved to Tailwind classes */
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ticker-content {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}