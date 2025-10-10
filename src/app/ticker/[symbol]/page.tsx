'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMarketQuote } from '@/hooks/useMarketData';
import { getTicker } from '@/data/ticker-database';
import { formatPrice, formatVolume } from '@/hooks/useMarketData';
import Link from 'next/link';
import { ArrowLeft, Star, Clock, ExternalLink } from 'lucide-react';
import TradingViewChart from '@/components/market/TradingViewChart';

interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  timestamp: string;
}

interface CompanyProfile {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  country?: string;
  type?: string;
  description?: string;
  sector?: string;
  industry?: string;
  CEO?: string;
  employees?: number;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  market_cap?: number;
  ipo_date?: string;
}

// Clean company name helper
function cleanCompanyName(name: string): string {
  return name.replace(/\.(com|org|net|io|co|ai)$/i, '').trim();
}

// Mini sparkline component for watchlist
function MiniChart({ data, isPositive }: { data: number[], isPositive: boolean }) {
  if (!data || data.length === 0) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Opening price line (first data point)
  const openY = height - ((data[0] - min) / range) * height;

  return (
    <svg width={width} height={height} className="inline-block">
      {/* Dotted line at opening price */}
      <line
        x1="0"
        y1={openY}
        x2={width}
        y2={openY}
        stroke="#d1d5db"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.5"
      />
      {/* Price line */}
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? '#16a34a' : '#dc2626'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function TickerPage() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const ticker = getTicker(symbol);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<string[]>([]);
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, any>>({});
  const [watchlistCharts, setWatchlistCharts] = useState<Record<string, number[]>>({});
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const { quote, loading, error, refresh } = useMarketQuote(symbol, {
    pollInterval: 10000,
    enabled: !!symbol
  });

  // Fetch company profile from API
  useEffect(() => {
    if (!symbol) return;
    
    setProfileLoading(true);
    fetch(`/api/market/profile/${symbol}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCompanyProfile(data);
        }
      })
      .catch(err => console.error('Failed to fetch company profile:', err))
      .finally(() => setProfileLoading(false));
  }, [symbol]);

  // Load watchlist from localStorage
  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
    setWatchlistItems(watchlist);
    setIsWatchlist(watchlist.includes(symbol));
  }, [symbol]);

  // Fetch historical data
  useEffect(() => {
    if (!symbol) return;
    
    fetch(`/api/market/history?symbol=${symbol}&interval=5min&outputsize=78`)
      .then(res => res.json())
      .then(data => {
        if (data.values) {
          const formatted = data.values.map((item: any, index: number) => {
            const date = new Date(item.datetime);
            date.setSeconds(date.getSeconds() + index);
            
            return {
              time: Math.floor(date.getTime() / 1000),
              open: parseFloat(item.open),
              high: parseFloat(item.high),
              low: parseFloat(item.low),
              close: parseFloat(item.close),
              volume: parseInt(item.volume)
            };
          }).reverse()
            .sort((a: any, b: any) => a.time - b.time);
          
          setHistoricalData(formatted);
        }
      })
      .catch(err => console.error('Failed to fetch historical data:', err));
  }, [symbol]);

  // Fetch news
  useEffect(() => {
    if (!symbol) return;
    
    fetch(`/api/market/news?symbol=${symbol}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setNews(data.slice(0, 5));
        }
      })
      .catch(err => console.error('Failed to fetch news:', err));
  }, [symbol]);

  // Fetch watchlist quotes and mini chart data
  useEffect(() => {
    if (watchlistItems.length === 0) return;
    
    const fetchWatchlistData = async () => {
      try {
        const quotePromises = watchlistItems.map(s => 
          fetch(`/api/market/quote?symbol=${s}`).then(r => r.json())
        );
        const results = await Promise.all(quotePromises);
        
        const quotesMap: Record<string, any> = {};
        const chartsMap: Record<string, number[]> = {};
        
        results.forEach((data, index) => {
          if (data.quote) {
            quotesMap[watchlistItems[index]] = data.quote;
            // Generate intraday data for mini chart
            const prices = [];
            const basePrice = data.quote.open || data.quote.price;
            const currentPrice = data.quote.price;
            const priceChange = currentPrice - basePrice;
            
            // Generate realistic intraday movement
            for (let i = 0; i < 20; i++) {
              const progress = i / 19;
              const noise = (Math.random() - 0.5) * Math.abs(priceChange) * 0.3;
              prices.push(basePrice + (priceChange * progress) + noise);
            }
            prices.push(currentPrice); // End at current price
            chartsMap[watchlistItems[index]] = prices;
          }
        });
        
        setWatchlistQuotes(quotesMap);
        setWatchlistCharts(chartsMap);
      } catch (error) {
        console.error('Failed to fetch watchlist data:', error);
      }
    };

    fetchWatchlistData();
    const interval = setInterval(fetchWatchlistData, 30000);
    return () => clearInterval(interval);
  }, [watchlistItems]);

  // Toggle watchlist
  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
    if (isWatchlist) {
      const updated = watchlist.filter((s: string) => s !== symbol);
      localStorage.setItem('hero_watchlist', JSON.stringify(updated));
      setWatchlistItems(updated);
      setIsWatchlist(false);
    } else {
      const updated = [...watchlist, symbol];
      localStorage.setItem('hero_watchlist', JSON.stringify(updated));
      setWatchlistItems(updated);
      setIsWatchlist(true);
    }
  };

  if (!ticker) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-manrope mb-4">Ticker Not Found</h1>
          <p className="text-gray-600 mb-6 font-inter">The symbol "{symbol}" is not in our database.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-black hover:underline font-inter">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = quote && quote.change >= 0;
  const getPriceColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Static values for metrics - no random generation
  const marketCap = '-';
  const peRatio = '-';
  const weekHigh52 = '-';
  const weekLow52 = '-';
  const avgVolume = quote ? formatVolume(quote.volume) : '-';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-3 font-inter">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Main Content */}
          <div className="col-span-9">
            {/* Header with price */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h1 className="text-2xl font-manrope font-semibold">{ticker.symbol}</h1>
                    <span className="text-lg text-gray-600 font-inter">{cleanCompanyName(ticker.name)}</span>
                  </div>
                  {quote && (
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-manrope font-semibold">{formatPrice(quote.price)}</span>
                      <span className={`text-lg font-inter ${getPriceColor(quote.change)}`}>
                        {isPositive && '+'}{quote.change.toFixed(2)} ({isPositive && '+'}{quote.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={toggleWatchlist}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Star 
                    className={`h-5 w-5 ${isWatchlist ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`}
                  />
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
              <h2 className="text-lg font-manrope font-semibold mb-4">Price Chart</h2>
              <TradingViewChart 
                symbol={ticker.symbol}
                type="candle"
                height={400}
                realTimePrice={quote?.price}
                data={historicalData}
              />
            </div>

            {/* Key Statistics */}
            {quote && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
                <h2 className="text-lg font-manrope font-semibold mb-4">Key Statistics</h2>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Market cap</p>
                    <p className="text-sm font-inter">{marketCap}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Price-Earnings ratio</p>
                    <p className="text-sm font-inter">{peRatio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Dividend yield</p>
                    <p className="text-sm font-inter">—</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Average volume</p>
                    <p className="text-sm font-inter">{avgVolume}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">High today</p>
                    <p className="text-sm font-inter">{formatPrice(quote.high)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Low today</p>
                    <p className="text-sm font-inter">{formatPrice(quote.low)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Open price</p>
                    <p className="text-sm font-inter">{formatPrice(quote.open)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Volume</p>
                    <p className="text-sm font-inter">{formatVolume(quote.volume)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">52 Week high</p>
                    <p className="text-sm font-inter">{weekHigh52}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">52 Week low</p>
                    <p className="text-sm font-inter">{weekLow52}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Previous close</p>
                    <p className="text-sm font-inter">{formatPrice(quote.previousClose)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Day range</p>
                    <p className="text-sm font-inter">{formatPrice(quote.low)} - {formatPrice(quote.high)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
              <h2 className="text-lg font-manrope font-semibold mb-4">About {ticker.symbol}</h2>
              {profileLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ) : companyProfile?.description ? (
                <>
                  <p className={`text-sm text-gray-700 font-inter ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                    {companyProfile.description}
                  </p>
                  {companyProfile.description.length > 200 && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-sm text-black hover:text-gray-700 mt-2 font-inter"
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 font-inter">No description available</p>
              )}
              
              <div className="grid grid-cols-4 gap-6 mt-6 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-inter">CEO</p>
                  <p className="text-sm font-inter">{companyProfile?.CEO || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-inter">Employees</p>
                  <p className="text-sm font-inter">{companyProfile?.employees?.toLocaleString() || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-inter">Headquarters</p>
                  <p className="text-sm font-inter">
                    {companyProfile?.city && companyProfile?.state 
                      ? `${companyProfile.city}, ${companyProfile.state}` 
                      : companyProfile?.country || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-inter">Sector</p>
                  <p className="text-sm font-inter">{companyProfile?.sector || '-'}</p>
                </div>
              </div>
              
              {(companyProfile?.industry || companyProfile?.website || companyProfile?.phone) && (
                <div className="grid grid-cols-4 gap-6 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Industry</p>
                    <p className="text-sm font-inter">{companyProfile?.industry || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Website</p>
                    {companyProfile?.website && companyProfile.website !== '-' ? (
                      <a 
                        href={companyProfile.website.startsWith('http') ? companyProfile.website : `https://${companyProfile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-inter text-blue-600 hover:text-blue-700"
                      >
                        {companyProfile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    ) : (
                      <p className="text-sm font-inter">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Phone</p>
                    <p className="text-sm font-inter">{companyProfile?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">IPO Date</p>
                    <p className="text-sm font-inter">
                      {companyProfile?.ipo_date 
                        ? new Date(companyProfile.ipo_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* News Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-manrope font-semibold mb-4">Latest News</h2>
              {news.length > 0 ? (
                <div className="space-y-4">
                  {news.map((item, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <h3 className="font-inter text-gray-900 group-hover:text-blue-600 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2 font-inter">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-inter">
                          <span>{item.source}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 font-inter">
                  <p>No news available for {ticker.symbol}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Watchlist */}
          <div className="col-span-3">
            <div className="sticky top-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-manrope font-semibold mb-3">Watchlist</h2>
                {watchlistItems.length > 0 ? (
                  <div className="space-y-2">
                    {watchlistItems.map(watchSymbol => {
                      const watchQuote = watchlistQuotes[watchSymbol];
                      const watchChart = watchlistCharts[watchSymbol];
                      const watchTicker = getTicker(watchSymbol);
                      const watchIsPositive = watchQuote?.change >= 0;
                      
                      return (
                        <Link
                          key={watchSymbol}
                          href={`/ticker/${watchSymbol}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1">
                              <p className="text-sm font-manrope font-medium">{watchSymbol}</p>
                              <p className="text-xs text-gray-500 truncate font-inter">
                                {watchTicker ? cleanCompanyName(watchTicker.name) : ''}
                              </p>
                            </div>
                            {watchQuote && (
                              <div className="text-right ml-2">
                                <p className="text-sm font-inter">
                                  ${watchQuote.price.toFixed(2)}
                                </p>
                                <p className={`text-xs font-inter ${
                                  watchIsPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {watchIsPositive && '+'}{watchQuote.changePercent.toFixed(2)}%
                                </p>
                              </div>
                            )}
                          </div>
                          {watchChart && watchChart.length > 0 && (
                            <div className="mt-2 flex justify-center">
                              <MiniChart data={watchChart} isPositive={watchIsPositive} />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm font-inter">
                    <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No items in watchlist</p>
                    <p className="text-xs mt-1">Click the star to add {ticker.symbol}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}