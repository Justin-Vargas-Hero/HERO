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

// Get popular stocks from ALL_SYMBOLS for the ticker
// Take a mix of different exchanges and popular stocks
const TICKER_SYMBOLS = ALL_SYMBOLS
  .filter(symbol => {
    // Include major stocks and exclude cryptos for the ticker
    const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
      'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'DIS',
      'HD', 'BAC', 'XOM', 'CVX', 'PFE', 'ABBV', 'KO', 'PEP',
      'VZ', 'T', 'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'IBM',
      'SPY', 'QQQ', 'COIN', 'PLTR', 'SOFI', 'HOOD', 'RBLX', 'ABNB'];
    return popularStocks.includes(symbol.symbol);
  })
  .map(symbol => symbol.symbol);

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
      <div className="w-full h-12 bg-white border-y border-gray-200">
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">Loading market data...</div>
        </div>
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