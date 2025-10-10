'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Activity, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatPrice, formatVolume } from '@/hooks/useMarketData';
import { MarketWatchlist } from '@/components/market/MarketWatchlist';
import { marketDataCache } from '@/lib/market-data/cache';

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent_change: number;
  volume: number;
}

interface CalendarEvent {
  symbol: string;
  name: string;
  date: string;
  time?: string;
  estimate?: string;
  actual?: string;
  amount?: string;
  yield?: string;
  price_range?: string;
  exchange?: string;
}

export default function HomePage() {
  const [marketMovers, setMarketMovers] = useState<{
    gainers: MarketMover[];
    losers: MarketMover[];
    most_active: MarketMover[];
  }>({ gainers: [], losers: [], most_active: [] });
  const [earnings, setEarnings] = useState<CalendarEvent[]>([]);
  const [dividends, setDividends] = useState<CalendarEvent[]>([]);
  const [ipos, setIPOs] = useState<CalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'active'>('gainers');
  const [loading, setLoading] = useState(true);
  const [indices, setIndices] = useState<any[]>([]);

  // Fetch major indices using the cache
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        // Use ETFs and convert to index values
        const primarySymbols = ['SPY', 'QQQ', 'DIA', 'BTC/USD', 'ETH/USD'];
        
        let quotes = await marketDataCache.getBatchQuotes(primarySymbols);
        
        const indicesData = primarySymbols.map((sym) => {
          const quote = quotes.get(sym.toUpperCase());
          
          // Convert ETF prices to actual index values
          let price = quote?.price || 0;
          let change = quote?.change || 0;
          
          if (sym === 'SPY' && price > 0) {
            // SPY is approximately 1/10th of S&P 500 index
            price = price * 10;
            change = change * 10;
          } else if (sym === 'QQQ' && price > 0) {
            // QQQ trades at roughly 1/37.5 of NASDAQ
            price = price * 37.5;
            change = change * 37.5;
          } else if (sym === 'DIA' && price > 0) {
            // DIA trades at roughly 1/100th of DOW
            price = price * 100;
            change = change * 100;
          }
          
          const displaySymbol = sym === 'SPY' ? 'S&P' :
                              sym === 'QQQ' ? 'NASDAQ' :
                              sym === 'DIA' ? 'DOW' :
                              sym.replace('/USD', '');
          const displayName = sym === 'SPY' ? 'S&P 500' :
                            sym === 'QQQ' ? 'NASDAQ' :
                            sym === 'DIA' ? 'DOW' :
                            sym === 'BTC/USD' ? 'Bitcoin' :
                            'Ethereum';
          
          return {
            symbol: displaySymbol,
            name: displayName,
            price: price,
            change: change,
            changePercent: quote?.changePercent || 0
          };
        });
        
        setIndices(indicesData);
      } catch (error) {
        console.error('Failed to fetch indices:', error);
      }
    };
    
    // Initial fetch
    fetchIndices();
    
    // Subscribe to updates for indices
    const unsubscribers = ['SPY', 'QQQ', 'DIA', 'BTC/USD', 'ETH/USD'].map(symbol => {
      return marketDataCache.subscribe(symbol, (data) => {
        setIndices(prev => prev.map(index => {
          let price = data.price || index.price;
          let change = data.change || index.change;
          
          // Apply multipliers for ETFs
          if (symbol === 'SPY' && index.symbol === 'S&P') {
            price = price * 10;
            change = change * 10;
          } else if (symbol === 'QQQ' && index.symbol === 'NASDAQ') {
            price = price * 37.5;
            change = change * 37.5;
          } else if (symbol === 'DIA' && index.symbol === 'DOW') {
            price = price * 100;
            change = change * 100;
          }
          
          const mappedSymbol = symbol === 'SPY' ? 'S&P' :
                              symbol === 'QQQ' ? 'NASDAQ' :
                              symbol === 'DIA' ? 'DOW' :
                              symbol.replace('/USD', '');
                              
          if (index.symbol === mappedSymbol || 
              (symbol.includes('/') && index.symbol === symbol.split('/')[0])) {
            return {
              ...index,
              price: price,
              change: change,
              changePercent: data.changePercent || index.changePercent
            };
          }
          return index;
        }));
      });
    });
    
    // Set up periodic refresh (respects cooldown)
    const interval = setInterval(fetchIndices, 60000);
    
    return () => {
      clearInterval(interval);
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Fetch market movers using cache (1-hour cooldown)
  useEffect(() => {
    const loadMarketMovers = async () => {
      setLoading(true);
      try {
        const data = await marketDataCache.getMarketMovers();
        setMarketMovers(data);
      } catch (error) {
        console.error('Failed to load market movers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMarketMovers();
    
    // Refresh every 5 minutes (cache will enforce 1-hour cooldown)
    const interval = setInterval(loadMarketMovers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch calendar events
  useEffect(() => {
    const loadCalendarEvents = async () => {
      try {
        const [earningsRes, dividendsRes, ipoRes] = await Promise.all([
          fetch('/api/market/calendar/earnings'),
          fetch('/api/market/calendar/dividends'),
          fetch('/api/market/calendar/ipo')
        ]);
        
        const [earningsData, dividendsData, ipoData] = await Promise.all([
          earningsRes.json(),
          dividendsRes.json(),
          ipoRes.json()
        ]);
        
        setEarnings(earningsData.slice(0, 3));
        setDividends(dividendsData.slice(0, 3));
        setIPOs(ipoData.slice(0, 3));
      } catch (error) {
        console.error('Failed to load calendar events:', error);
      }
    };
    
    loadCalendarEvents();
  }, []);

  const getActiveData = () => {
    switch (activeTab) {
      case 'gainers':
        return marketMovers.gainers;
      case 'losers':
        return marketMovers.losers;
      case 'active':
        return marketMovers.most_active;
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        
        {/* Market Indices */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {indices.map((index) => {
            const isCrypto = index.symbol === 'BTC' || index.symbol === 'ETH';
            const isIndex = index.symbol === 'S&P' || index.symbol === 'NASDAQ' || index.symbol === 'DOW';
            
            const formatIndexPrice = (price: number) => {
              // Don't show $0.00 if we don't have data
              if (price === 0) return '--';
              
              if (isCrypto) {
                // Crypto always gets $ sign
                return price > 1000 
                  ? `${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  : `${price.toFixed(2)}`;
              }
              
              if (isIndex) {
                // Indices ALSO get $ sign with commas
                return `${price.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}`;
              }
              
              return formatPrice(price);
            };
            
            const formatIndexChange = (change: number, percent: number) => {
              // Don't show change if we don't have data
              if (index.price === 0) return '--';
              
              const sign = change >= 0 ? '+' : '-';
              const changeStr = `${sign}${Math.abs(change).toFixed(2)}`;
              // No +/- on percentage when shown with dollar amount
              const percentStr = `(${Math.abs(percent).toFixed(2)}%)`;
              return `${changeStr} ${percentStr}`;
            };
            
            return (
              <div key={index.symbol} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div>
                  <p className="text-xs font-inter text-gray-500">{index.name}</p>
                  <p className="text-lg font-manrope font-semibold mt-1">
                    ${formatIndexPrice(index.price)}
                  </p>
                  <div className={`mt-1 text-sm font-inter ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatIndexChange(index.change, index.changePercent)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Market Movers */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-manrope font-semibold flex items-center">
                    <Activity className="mr-2 text-gray-600" size={18} />
                    Market Movers
                  </h2>
                  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('gainers')}
                      className={`px-3 py-1 rounded-md text-sm font-inter transition-colors ${
                        activeTab === 'gainers'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Gainers
                    </button>
                    <button
                      onClick={() => setActiveTab('losers')}
                      className={`px-3 py-1 rounded-md text-sm font-inter transition-colors ${
                        activeTab === 'losers'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Losers
                    </button>
                    <button
                      onClick={() => setActiveTab('active')}
                      className={`px-3 py-1 rounded-md text-sm font-inter transition-colors ${
                        activeTab === 'active'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Most Active
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : getActiveData().length > 0 ? (
                  <div className="space-y-1">
                    {getActiveData().map((stock) => {
                      const price = stock.price || 0;
                      const percentChange = stock.percent_change || 0;
                      const symbol = stock.symbol || 'N/A';
                      const name = stock.name || '';
                      
                      return (
                        <Link
                          key={symbol}
                          href={`/ticker/${symbol}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-manrope font-semibold text-sm">{symbol}</p>
                              <p className="text-xs font-inter text-gray-500">{name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-inter text-sm font-medium">${price.toFixed(2)}</p>
                            <p className={`text-xs font-inter ${
                              percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm font-inter">
                    <p>No market movers available</p>
                    <p className="text-xs mt-1">Data will appear when market is active</p>
                  </div>
                )}
              </div>
            </div>

            {/* Market Calendar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
              <div className="p-5">
                <h2 className="text-lg font-manrope font-semibold flex items-center mb-4">
                  <Calendar className="mr-2 text-gray-600" size={18} />
                  Today's Events
                </h2>

                <div className="space-y-4">
                  {/* Earnings */}
                  {earnings.length > 0 && (
                    <div>
                      <h3 className="text-xs font-manrope font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Earnings Reports
                      </h3>
                      <div className="space-y-2">
                        {earnings.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="text-blue-600" size={16} />
                              <div>
                                <p className="font-inter text-sm font-medium">{item.symbol}</p>
                                <p className="text-xs font-inter text-gray-600">{item.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-inter font-medium">{item.time || 'TBD'}</p>
                              {item.estimate && (
                                <p className="text-xs font-inter text-gray-500">Est: ${item.estimate}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dividends */}
                  {dividends.length > 0 && (
                    <div>
                      <h3 className="text-xs font-manrope font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Ex-Dividend
                      </h3>
                      <div className="space-y-2">
                        {dividends.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="text-green-600" size={16} />
                              <div>
                                <p className="font-inter text-sm font-medium">{item.symbol}</p>
                                <p className="text-xs font-inter text-gray-600">{item.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-inter font-medium">${item.amount || '-'}</p>
                              {item.yield && (
                                <p className="text-xs font-inter text-gray-500">Yield: {item.yield}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IPOs */}
                  {ipos.length > 0 && (
                    <div>
                      <h3 className="text-xs font-manrope font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        IPO Listings
                      </h3>
                      <div className="space-y-2">
                        {ipos.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="text-purple-600" size={16} />
                              <div>
                                <p className="font-inter text-sm font-medium">{item.symbol}</p>
                                <p className="text-xs font-inter text-gray-600">{item.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-inter font-medium">{item.price_range || 'TBD'}</p>
                              {item.exchange && (
                                <p className="text-xs font-inter text-gray-500">{item.exchange}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {earnings.length === 0 && dividends.length === 0 && ipos.length === 0 && (
                    <p className="text-sm font-inter text-gray-500 text-center py-4">
                      No market events scheduled for today
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Watchlist */}
          <div>
            <MarketWatchlist />
          </div>
        </div>
      </div>
    </div>
  );
}