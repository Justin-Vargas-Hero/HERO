import { NextResponse } from 'next/server';
import { serverCache } from '@/lib/market-data/server-cache';
import { ALL_SYMBOLS } from '@/data/symbol-database';

// Get tradeable stocks from ALL_SYMBOLS (exclude cryptos for batch quotes)
const STOCK_SYMBOLS = ALL_SYMBOLS
  .filter(symbol => symbol.exchange !== 'CRYPTO' && !symbol.symbol.includes('/'))
  .map(symbol => symbol.symbol);

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

    // Skip market_movers API (currently not returning data) and use batch quotes for stocks
    console.log('Using fallback market movers with ALL_SYMBOLS stocks');

    // For efficiency, we'll batch requests - TwelveData allows multiple symbols in one request
    // Reduce batch size to avoid API limits and improve reliability
    const popularSymbols = STOCK_SYMBOLS.slice(0, 30); // Reduced to 30 for better reliability

    // Get batch quotes for stocks
    const symbolsStr = popularSymbols.join(',');
    console.log('Fetching symbols:', symbolsStr);
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

    // Check for API errors
    if (quotesData.code || quotesData.status === 'error') {
      console.error('TwelveData API Error:', quotesData.message || quotesData);
      throw new Error(`API Error: ${quotesData.message || 'Unknown error'}`);
    }

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