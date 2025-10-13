import { NextResponse } from 'next/server';
import { serverCache } from '@/lib/market-data/server-cache';

// NYSE stocks to track for market movers fallback - expanded list
const NYSE_STOCKS = [
  // Financials
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'USB',
  'PNC', 'TFC', 'COF', 'BK', 'STT', 'TRV', 'MET', 'PRU', 'AIG', 'CB',
  'CME', 'ICE', 'SPGI', 'MCO', 'MSCI',
  // Healthcare
  'JNJ', 'PFE', 'ABBV', 'MRK', 'LLY', 'TMO', 'ABT', 'BMY', 'CVS', 'CI',
  'HUM', 'MDT', 'ELV', 'SYK', 'BSX',
  // Tech/Industrials
  'V', 'MA', 'IBM', 'GE', 'CAT', 'BA', 'MMM', 'HON', 'UPS', 'RTX',
  'LMT', 'DE', 'NOC', 'GD', 'EMR',
  // Consumer
  'PG', 'HD', 'DIS', 'WMT', 'PEP', 'KO', 'MCD', 'NKE', 'SBUX', 'TGT',
  'LOW', 'TJX', 'YUM', 'CL', 'EL',
  // Energy & Telecom
  'CVX', 'XOM', 'COP', 'SLB', 'EOG', 'PSX', 'VLO', 'MPC', 'OXY', 'HAL',
  'VZ', 'T', 'TMUS',
  // Healthcare/Pharma
  'UNH', 'JNJ', 'PFE', 'ABBV', 'MRK', 'LLY', 'TMO', 'ABT', 'BMY', 'AMGN',
  // More large caps
  'BRK.B', 'PM', 'UNP', 'NEE', 'LIN', 'DHR', 'SO', 'DUK', 'D', 'AEP',
  'F', 'GM', 'TSLA', 'NIO', 'RIVN'
];

export async function GET() {
  const cacheKey = 'market:movers';

  try {
    // Check cache first
    const cached = serverCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
        source: 'server-cache'
      });
    }

    // Check if request is already pending
    if (serverCache.isPending(cacheKey)) {
      try {
        const data = await serverCache.addPending(cacheKey);
        return NextResponse.json({
          ...data,
          cached: true,
          source: 'pending-request'
        });
      } catch (error) {
        console.error('Pending request failed:', error);
      }
    }

    // Skip market_movers API (currently not returning data) and use batch quotes for NYSE stocks
    console.log('Using fallback market movers with NYSE stocks');

    // Get batch quotes for NYSE stocks
    const symbolsStr = NYSE_STOCKS.join(',');
    const quotesResponse = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbolsStr}&apikey=${process.env.TWELVEDATA_API_KEY}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!quotesResponse.ok) {
      throw new Error(`Failed to fetch batch quotes: ${quotesResponse.status}`);
    }

    const quotesData = await quotesResponse.json();

    // Transform batch quotes to array format
    const stocksArray: any[] = [];

    // Handle both single and multiple quotes response format
    if (Array.isArray(quotesData)) {
      stocksArray.push(...quotesData);
    } else if (typeof quotesData === 'object') {
      // TwelveData returns an object with symbol keys for batch requests
      Object.entries(quotesData).forEach(([symbol, data]: [string, any]) => {
        if (data && typeof data === 'object' && !data.code) {
          stocksArray.push({
            ...data,
            symbol: symbol
          });
        }
      });
    }

    // Filter out invalid entries and transform
    const validStocks = stocksArray
      .filter(stock =>
        stock &&
        stock.symbol &&
        stock.close !== undefined &&
        stock.percent_change !== undefined &&
        !stock.code // Filter out error responses
      )
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        price: parseFloat(stock.close || stock.price || 0),
        change: parseFloat(stock.change || 0),
        percent_change: parseFloat(stock.percent_change || 0),
        volume: parseInt(stock.volume || 0)
      }));

    // Sort and categorize - showing top 10 for each category
    const gainers = validStocks
      .filter(stock => stock.percent_change > 0)
      .sort((a, b) => b.percent_change - a.percent_change)
      .slice(0, 10);

    const losers = validStocks
      .filter(stock => stock.percent_change < 0)
      .sort((a, b) => a.percent_change - b.percent_change)
      .slice(0, 10);

    const most_active = validStocks
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    const transformed = {
      gainers,
      losers,
      most_active
    };

    // Cache the transformed data with 30-minute cooldown for fallback data
    serverCache.set(cacheKey, transformed, 'movers');

    // Resolve any pending requests
    serverCache.resolvePending(cacheKey, transformed);

    return NextResponse.json({
      ...transformed,
      cached: false,
      source: 'fallback-batch-quotes'
    });

  } catch (error) {
    console.error('Error fetching market movers:', error);

    // Reject pending requests
    serverCache.rejectPending(cacheKey, error);

    // Try to return stale cached data if available
    const staleCache = serverCache.get(cacheKey);
    if (staleCache) {
      return NextResponse.json({
        ...staleCache,
        cached: true,
        stale: true,
        source: 'stale-cache'
      });
    }

    return NextResponse.json(
      { gainers: [], losers: [], most_active: [] },
      { status: 500 }
    );
  } finally {
    serverCache.clearPending(cacheKey);
  }
}