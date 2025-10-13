'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMarketQuote } from '@/hooks/useMarketData';
import { getSymbol } from '@/data/symbol-database';
import { formatPrice, formatVolume } from '@/hooks/useMarketData';
import Link from 'next/link';
import { ArrowLeft, Star, Clock, ExternalLink } from 'lucide-react';
import TradingViewChart from '@/components/market/TradingViewChart';
import { marketSyncManager } from '@/lib/market-data/sync-manager';
import { Watchlist } from '@/components/market/Watchlist';
import { formatNumber, formatCurrency } from '@/lib/utils';

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

// Time period configuration
type TimePeriod = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';

interface PeriodConfig {
  period: TimePeriod;
  interval: string;
  outputsize: number;
  label: string;
  getDateRange: () => { start: string | undefined; end: string | undefined };
}

// Helper function to format date for API (YYYY-MM-DD)
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get date range for each period (using exact time durations from now)
const getDateRange = (period: TimePeriod) => {
  const now = new Date();
  const todayStr = formatDate(now);

  switch (period) {
    case '1D':
      // Exactly 24 hours ago from now
      const oneDayAgo = new Date(now);
      oneDayAgo.setHours(now.getHours() - 24);
      return { start: formatDate(oneDayAgo), end: todayStr };
    case '5D':
      // Exactly 5 days (120 hours) ago from now
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(now.getDate() - 5);
      return { start: formatDate(fiveDaysAgo), end: todayStr };
    case '1M':
      // Exactly 30 days ago from now
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return { start: formatDate(thirtyDaysAgo), end: todayStr };
    case '3M':
      // Exactly 90 days ago from now
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      return { start: formatDate(ninetyDaysAgo), end: todayStr };
    case '6M':
      // Exactly 180 days ago from now
      const halfYearAgo = new Date(now);
      halfYearAgo.setDate(now.getDate() - 180);
      return { start: formatDate(halfYearAgo), end: todayStr };
    case 'YTD':
      // January 1st of current year to now
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { start: formatDate(yearStart), end: todayStr };
    case '1Y':
      // Exactly 365 days ago from now
      const oneYearAgo = new Date(now);
      oneYearAgo.setDate(now.getDate() - 365);
      return { start: formatDate(oneYearAgo), end: todayStr };
    case '5Y':
      // Exactly 5 years (1825 days) ago from now
      const fiveYearsAgo = new Date(now);
      fiveYearsAgo.setDate(now.getDate() - 1825);
      return { start: formatDate(fiveYearsAgo), end: todayStr };
    case 'ALL':
      // No date restrictions - get all available data
      return { start: undefined, end: undefined };
    default:
      return { start: undefined, end: undefined };
  }
};

const TIME_PERIODS: PeriodConfig[] = [
  { period: '1D', interval: '1min', outputsize: 1440, label: '1D', getDateRange: () => getDateRange('1D') },  // 24 hours * 60 minutes
  { period: '5D', interval: '5min', outputsize: 1440, label: '5D', getDateRange: () => getDateRange('5D') },  // 5 days * 24 * 60 / 5
  { period: '1M', interval: '30min', outputsize: 1440, label: '1M', getDateRange: () => getDateRange('1M') }, // 30 days * 24 * 2
  { period: '3M', interval: '1h', outputsize: 2160, label: '3M', getDateRange: () => getDateRange('3M') },    // 90 days * 24
  { period: '6M', interval: '2h', outputsize: 2160, label: '6M', getDateRange: () => getDateRange('6M') },    // 180 days * 12
  { period: 'YTD', interval: '1day', outputsize: 365, label: 'YTD', getDateRange: () => getDateRange('YTD') }, // Max 365 days
  { period: '1Y', interval: '1day', outputsize: 365, label: '1Y', getDateRange: () => getDateRange('1Y') },   // 365 days
  { period: '5Y', interval: '1week', outputsize: 260, label: '5Y', getDateRange: () => getDateRange('5Y') },  // 52 weeks * 5
  { period: 'ALL', interval: '1month', outputsize: 5000, label: 'ALL', getDateRange: () => getDateRange('ALL') } // Max available
];

export default function SymbolPage() {
  const params = useParams();
  const { data: session } = useSession();
  const userTimezone = session?.user?.timezone || 'UTC'; // Default to UTC for non-logged in users

  const symbolCode = decodeURIComponent(params?.symbol as string);
  const symbolData = getSymbol(symbolCode);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');
  const [loadingChart, setLoadingChart] = useState(false);
  
  const { quote, loading, error, refresh, nextUpdateIn } = useMarketQuote(symbolCode, {
    enabled: !!symbolCode,
    syncUpdates: true // Update only at :00 seconds
  });

  // Fetch company profile from API (skip for crypto pairs)
  useEffect(() => {
    if (!symbolCode) return;

    // Skip profile fetch for crypto pairs (they don't have company profiles)
    if (symbolCode.includes('/')) {
      setProfileLoading(false);
      setCompanyProfile(null);
      return;
    }

    setProfileLoading(true);
    fetch(`/api/market/profile/${encodeURIComponent(symbolCode)}`)
      .then(res => res.json())
      .then(data => {
        // Check if data exists and is not an error
        if (data && data.status !== 'error' && !data.error) {
          setCompanyProfile(data);
        } else {
          setCompanyProfile(null);
        }
      })
      .catch(err => {
        console.log('Profile not available for this symbol');
        setCompanyProfile(null);
      })
      .finally(() => setProfileLoading(false));
  }, [symbolCode]);

  // Check if current symbol is in watchlist
  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
    setIsWatchlist(watchlist.includes(symbolCode));
  }, [symbolCode]);

  // Fetch historical data based on selected period
  useEffect(() => {
    if (!symbolCode) return;

    const periodConfig = TIME_PERIODS.find(p => p.period === selectedPeriod) || TIME_PERIODS[0];

    const fetchHistoricalData = () => {
      setLoadingChart(true);

      // Build the API URL
      let url = `/api/market/history?symbol=${encodeURIComponent(symbolCode)}&interval=${periodConfig.interval}&outputsize=${periodConfig.outputsize}`;

      // Only use date ranges for daily/weekly/monthly intervals
      // For intraday intervals (1min, 5min, 30min, 1h, 2h), just use outputsize to get the most recent data
      const useDataRange = !['1min', '5min', '30min', '1h', '2h'].includes(periodConfig.interval);

      if (useDataRange) {
        const dateRange = periodConfig.getDateRange();
        if (dateRange.start) {
          url += `&start_date=${dateRange.start}`;
        }
        if (dateRange.end) {
          url += `&end_date=${dateRange.end}`;
        }
      }

      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.values) {
            // Check if this is crypto (Digital Currency) or has no exchange timezone
            const isCrypto = data.meta?.type === 'Digital Currency' ||
                           symbolCode.includes('/') ||
                           !data.meta?.exchange_timezone;

            // Note: Pre-market and after-hours data may have gaps when there's no trading activity
            // This is normal behavior for stock markets during low-volume periods
            const formatted = data.values.map((item: any, index: number) => {
              let date: Date;

              // ALL times are displayed in the user's selected timezone
              // TwelveData provides data in different formats:
              // - Crypto: UTC times without timezone indicator
              // - Stocks: Exchange timezone (e.g., ET for US markets)

              if (isCrypto) {
                // Crypto times are in UTC
                date = new Date(item.datetime + 'Z');
              } else {
                // Stock times are in exchange timezone
                const exchangeTz = data.meta?.exchange_timezone || 'America/New_York';

                // Check if datetime contains time component
                const hasTime = item.datetime.includes(':');

                if (exchangeTz === 'America/New_York') {
                  // US markets use ET (UTC-4 in summer, UTC-5 in winter)
                  if (hasTime) {
                    // Intraday data has time (e.g., "2025-10-13 09:30:00")
                    // October 2025 is EDT (UTC-4)
                    date = new Date(item.datetime.replace(' ', 'T') + '-04:00');
                  } else {
                    // Daily/weekly/monthly data has only date (e.g., "2025-10-13")
                    // Set to market close time (4 PM ET)
                    date = new Date(item.datetime + 'T16:00:00-04:00');
                  }
                } else {
                  // For other exchanges, assume UTC
                  if (hasTime) {
                    date = new Date(item.datetime.replace(' ', 'T') + 'Z');
                  } else {
                    date = new Date(item.datetime + 'T00:00:00Z');
                  }
                }
              }

              // The chart library (lightweight-charts) expects Unix timestamps
              // These are automatically displayed in the user's local browser timezone
              // To display in the user's selected timezone, we'll need to adjust the chart library settings

              // Only add seconds offset for intraday intervals to prevent duplicate timestamps
              if (['1min', '5min', '15min', '30min'].includes(periodConfig.interval)) {
                date.setSeconds(date.getSeconds() + index);
              }

              return {
                time: Math.floor(date.getTime() / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseInt(item.volume) || 0  // Handle undefined volume for crypto
              };
            }).reverse()
              .sort((a: any, b: any) => a.time - b.time);

            // For minute intervals on stocks, fill in gaps during market hours
            // This prevents jarring jumps in the chart due to low-volume periods
            if (!isCrypto && periodConfig.interval === '1min' && formatted.length > 1) {
              const filledData: any[] = [];
              let lastPrice = formatted[0];

              for (let i = 0; i < formatted.length; i++) {
                const current = formatted[i];
                const next = formatted[i + 1];

                filledData.push(current);

                // If there's a gap of more than 60 seconds, fill it
                if (next && (next.time - current.time) > 60) {
                  const gapMinutes = Math.floor((next.time - current.time) / 60) - 1;

                  // Only fill reasonable gaps (less than 30 minutes)
                  // Larger gaps are likely market close/open boundaries
                  if (gapMinutes > 0 && gapMinutes < 30) {
                    for (let j = 1; j <= gapMinutes; j++) {
                      filledData.push({
                        time: current.time + (j * 60),
                        open: current.close,
                        high: current.close,
                        low: current.close,
                        close: current.close,
                        volume: 0  // No volume for filled gaps
                      });
                    }
                  }
                }
              }

              setHistoricalData(filledData);
            } else {
              setHistoricalData(formatted);
            }
          }
          setLoadingChart(false);
        })
        .catch(err => {
          console.error('Failed to fetch historical data:', err);
          setLoadingChart(false);
        });
    };

    // Initial fetch
    fetchHistoricalData();

    // Subscribe to synchronized updates based on interval
    // Only subscribe to real-time updates for intraday intervals
    let unsubscribe = () => {};
    const currentInterval = periodConfig.interval;

    // Only sync for intraday intervals (1min, 5min, 30min, 1h, 2h)
    const shouldSync = ['1min', '5min', '30min', '1h', '2h'].includes(currentInterval);

    if (shouldSync) {
      unsubscribe = marketSyncManager.subscribe(`symbol-history-${symbolCode}-${selectedPeriod}`, () => {
        console.log(`Symbol history sync update triggered for ${currentInterval} interval`);
        fetchHistoricalData();
      });
    }

    return () => {
      unsubscribe();
    };
  }, [symbolCode, selectedPeriod]);

  // Fetch news - synchronized at :00 seconds
  useEffect(() => {
    if (!symbolCode) return;

    const fetchNews = () => {
      fetch(`/api/market/news?symbol=${encodeURIComponent(symbolCode)}`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setNews(data.slice(0, 5));
          }
        })
        .catch(err => console.error('Failed to fetch news:', err));
    };

    // Initial fetch
    fetchNews();

    // Subscribe to synchronized updates at :00 seconds
    const unsubscribe = marketSyncManager.subscribe(`symbol-news-${symbolCode}`, () => {
      console.log('Symbol news sync update triggered');
      fetchNews();
    });

    return () => {
      unsubscribe();
    };
  }, [symbolCode]);


  // Toggle watchlist
  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('hero_watchlist') || '[]');
    if (isWatchlist) {
      const updated = watchlist.filter((s: string) => s !== symbolCode);
      localStorage.setItem('hero_watchlist', JSON.stringify(updated));
      setIsWatchlist(false);
    } else {
      const updated = [...watchlist, symbolCode];
      localStorage.setItem('hero_watchlist', JSON.stringify(updated));
      setIsWatchlist(true);
    }
    // Trigger a custom event to update the watchlist component
    window.dispatchEvent(new Event('watchlistUpdated'));
  };

  if (!symbolData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-manrope mb-4">Symbol Not Found</h1>
          <p className="text-gray-600 mb-6 font-inter">The symbol "{symbolCode}" is not in our database.</p>
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
        <Link href="/market" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-3 font-inter">
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
                    <h1 className="text-2xl font-manrope font-semibold">{symbolData.symbol}</h1>
                    <span className="text-lg text-gray-600 font-inter">{cleanCompanyName(symbolData.name)}</span>
                  </div>
                  {quote && (
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-manrope font-semibold">{formatCurrency(quote.price, quote.price > 10000 ? 0 : 2)}</span>
                      <span className={`text-lg font-inter ${getPriceColor(quote.change)}`}>
                        {isPositive && '+'}{formatNumber(Math.abs(quote.change), 2)} ({isPositive && '+'}{quote.changePercent.toFixed(2)}%)
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-manrope font-semibold">Price Chart</h2>

                {/* Time Period Toggles */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {TIME_PERIODS.map((period) => (
                    <button
                      key={period.period}
                      onClick={() => setSelectedPeriod(period.period)}
                      className={`px-3 py-1.5 text-sm font-inter rounded-md transition-colors ${
                        selectedPeriod === period.period
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-600 hover:text-black'
                      }`}
                      disabled={loadingChart}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingChart ? (
                <div className="flex items-center justify-center" style={{ height: 400 }}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500 font-inter">Loading chart data...</p>
                  </div>
                </div>
              ) : (
                <TradingViewChart
                  symbol={symbolData.symbol}
                  type="candle"
                  height={400}
                  realTimePrice={quote?.price}
                  data={historicalData}
                  interval={TIME_PERIODS.find(p => p.period === selectedPeriod)?.interval}
                  timezone={userTimezone}
                />
              )}
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
                    <p className="text-sm font-inter">{formatCurrency(quote.high, quote.high > 10000 ? 0 : 2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Low today</p>
                    <p className="text-sm font-inter">{formatCurrency(quote.low, quote.low > 10000 ? 0 : 2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Open price</p>
                    <p className="text-sm font-inter">{formatCurrency(quote.open, quote.open > 10000 ? 0 : 2)}</p>
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
                    <p className="text-sm font-inter">{formatCurrency(quote.previousClose, quote.previousClose > 10000 ? 0 : 2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-inter">Day range</p>
                    <p className="text-sm font-inter">{formatCurrency(quote.low, quote.low > 10000 ? 0 : 2)} - {formatCurrency(quote.high, quote.high > 10000 ? 0 : 2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
              <h2 className="text-lg font-manrope font-semibold mb-4">About {symbolData.symbol}</h2>
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
              <h2 className="text-lg font-manrope font-semibold mb-4">Latest {symbolData.symbol} News</h2>
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
                  <p>No news available for {symbolData.symbol}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Watchlist */}
          <div className="col-span-3">
            <div className="sticky top-4">
              <Watchlist />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}