import { NextRequest, NextResponse } from 'next/server';
import { getTwelveDataClient } from '@/lib/market-data/TwelveDataClient';
import { unifiedCache, CacheTier, CacheKeys } from '@/lib/cache/unified-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const symbols = searchParams.get('symbols');
    
    // Single symbol request
    if (symbol) {
      const upperSymbol = symbol.trim().toUpperCase();

      // Use unified cache with real-time tier for quotes
      const quote = await unifiedCache.getOrFetch(
        CacheKeys.quote(upperSymbol),
        async () => {
          const client = getTwelveDataClient();
          return await client.getQuote(upperSymbol);
        },
        { tier: CacheTier.REALTIME }
      );

      return NextResponse.json({
        quote,
        cached: false,
        source: 'unified-cache'
      });

    }
    
    // Multiple symbols request (batch)
    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => s);

      if (symbolList.length > 50) {
        return NextResponse.json({ error: 'Maximum 50 symbols per request' }, { status: 400 });
      }

      // Get cached quotes
      const cacheKeys = symbolList.map(s => CacheKeys.quote(s));
      const cachedQuotes = await unifiedCache.getBatch(cacheKeys);
      const missingKeys = await unifiedCache.getMissingKeys(cacheKeys);

      // Map back to symbols
      const missingSymbols = missingKeys.map(key => key.replace('quote:', ''));

      // Fetch missing symbols
      if (missingSymbols.length > 0) {
        try {
          const client = getTwelveDataClient();
          const freshQuotes = await client.getBatchQuotes(missingSymbols);

          // Cache fresh quotes
          for (const [symbol, quote] of freshQuotes.entries()) {
            await unifiedCache.set(
              CacheKeys.quote(symbol),
              quote,
              { tier: CacheTier.REALTIME }
            );
            cachedQuotes.set(CacheKeys.quote(symbol), quote);
          }
        } catch (error) {
          console.error('Failed to fetch missing quotes:', error);
        }
      }

      // Convert back to array format
      const quotesArray = symbolList
        .map(symbol => {
          const quote = cachedQuotes.get(CacheKeys.quote(symbol));
          return quote ? { symbol, ...quote } : null;
        })
        .filter(q => q !== null);

      return NextResponse.json({
        quotes: quotesArray,
        cached: missingSymbols.length === 0,
        source: 'unified-cache',
        timestamp: Date.now(),
        stats: unifiedCache.getStats()
      });
    }
    
    return NextResponse.json({ error: 'Symbol or symbols parameter required' }, { status: 400 });
    
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}