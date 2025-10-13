import { NextResponse } from 'next/server';
import { serverCache } from '@/lib/market-data/server-cache';

// Popular stocks to track for market movers
// This is a fallback when the market_movers API is not available (requires paid plan)
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B',
  'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'DIS', 'MA', 'PYPL', 'BAC',
  'NFLX', 'ADBE', 'CRM', 'PFE', 'TMO', 'ABBV', 'NKE', 'MRK', 'WMT',
  'CVX', 'PEP', 'KO', 'CSCO', 'VZ', 'CMCSA', 'INTC', 'QCOM', 'TXN',
  'AMD', 'NOW', 'ORCL', 'ACN', 'MDT', 'IBM', 'GE', 'CAT', 'BA', 'MMM',
  'F', 'GM', 'T', 'MU', 'DELL', 'HPQ', 'BABA', 'SQ', 'SHOP', 'SNAP'
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

    // First, try the market_movers API (requires paid plan)
    try {
      const response = await fetch(
        `https://api.twelvedata.com/market_movers/stocks?apikey=${process.env.TWELVEDATA_API_KEY}`,
        {
          next: { revalidate: 3600 }, // Next.js cache for 1 hour
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Check if we got valid data
        if (data.values && Array.isArray(data.values) && data.values.length > 0) {
          // Transform the data to our format
          const transformStock = (item: any) => ({
            symbol: item.symbol || '',
            name: item.name || '',
            price: item.last || item.price || 0,
            change: item.change || 0,
            percent_change: item.percent_change || 0,
            volume: item.volume || 0
          });

          const transformed = {
            gainers: (data.values?.filter((item: any) => item.percent_change > 0)
              .sort((a: any, b: any) => b.percent_change - a.percent_change)
              .slice(0, 5) || []).map(transformStock),
            losers: (data.values?.filter((item: any) => item.percent_change < 0)
              .sort((a: any, b: any) => a.percent_change - b.percent_change)
              .slice(0, 5) || []).map(transformStock),
            most_active: (data.values?.sort((a: any, b: any) => b.volume - a.volume)
              .slice(0, 5) || []).map(transformStock)
          };

          // Cache the transformed data with 1-hour cooldown
          serverCache.set(cacheKey, transformed, 'movers');

          // Resolve any pending requests
          serverCache.resolvePending(cacheKey, transformed);

          return NextResponse.json({
            ...transformed,
            cached: false,
            source: 'api'
          });
        }
      }
    } catch (error) {
      console.log('Market movers API not available, using fallback method');
    }

    // Fallback: Use batch quotes for popular stocks
    console.log('Using fallback market movers with popular stocks');

    // Get batch quotes for popular stocks
    const symbolsStr = POPULAR_STOCKS.join(',');
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

    // Sort and categorize
    const gainers = validStocks
      .filter(stock => stock.percent_change > 0)
      .sort((a, b) => b.percent_change - a.percent_change)
      .slice(0, 5);

    const losers = validStocks
      .filter(stock => stock.percent_change < 0)
      .sort((a, b) => a.percent_change - b.percent_change)
      .slice(0, 5);

    const most_active = validStocks
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

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