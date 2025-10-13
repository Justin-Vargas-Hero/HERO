'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketDataCache } from '@/lib/market-data/cache';

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Popular stocks for the ticker
const TICKER_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'DIS',
  'HD', 'BAC', 'XOM', 'CVX', 'PFE', 'ABBV', 'KO', 'PEP',
  'VZ', 'T', 'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'IBM'
];

export function ScrollingTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const quotes = await marketDataCache.getBatchQuotes(TICKER_SYMBOLS);
        const items: TickerItem[] = [];

        TICKER_SYMBOLS.forEach(symbol => {
          const quote = quotes.get(symbol);
          if (quote) {
            items.push({
              symbol: symbol,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent
            });
          }
        });

        setTickerData(items);
      } catch (error) {
        console.error('Failed to fetch ticker data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTickerData();

    // Subscribe to updates
    const unsubscribers = TICKER_SYMBOLS.map(symbol => {
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

  if (loading || tickerData.length === 0) {
    return (
      <div className="w-full h-12 bg-gray-900 border-y border-gray-800">
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-gray-600 text-sm">Loading market data...</div>
        </div>
      </div>
    );
  }

  // Duplicate the array for seamless scrolling
  const duplicatedData = [...tickerData, ...tickerData];

  return (
    <div className="w-full bg-gray-900 border-y border-gray-800 overflow-hidden">
      <div className="ticker-container">
        <div className="ticker-content">
          {duplicatedData.map((item, index) => (
            <Link
              key={`${item.symbol}-${index}`}
              href={`/symbol/${item.symbol}`}
              className="ticker-item"
            >
              <span className="font-semibold text-white">{item.symbol}</span>
              <span className="mx-2 text-gray-400">${item.price.toFixed(2)}</span>
              <span className={`font-medium ${
                item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-container {
          height: 48px;
          display: flex;
          align-items: center;
          position: relative;
        }

        .ticker-content {
          display: flex;
          animation: scroll 60s linear infinite;
          white-space: nowrap;
        }

        .ticker-item {
          display: inline-flex;
          align-items: center;
          padding: 0 24px;
          height: 48px;
          border-right: 1px solid rgb(31 41 55);
          transition: background-color 0.2s;
        }

        .ticker-item:hover {
          background-color: rgba(55, 65, 81, 0.5);
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