import { NextRequest, NextResponse } from 'next/server';
import { getTwelveDataClient } from '@/lib/market-data/TwelveDataClient';
import { serverCache } from '@/lib/market-data/server-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const symbols = searchParams.get('symbols');
    
    // Single symbol request
    if (symbol) {
      const upperSymbol = symbol.trim().toUpperCase();
      const cacheKey = `quote:${upperSymbol}`;
      
      // Check cache first
      const cached = serverCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ 
          quote: cached,
          cached: true,
          source: 'server-cache'
        });
      }
      
      // Check if request is already pending
      if (serverCache.isPending(cacheKey)) {
        try {
          const data = await serverCache.addPending(cacheKey);
          return NextResponse.json({ 
            quote: data,
            cached: true,
            source: 'pending-request'
          });
        } catch (error) {
          return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
        }
      }
      
      // Fetch from API
      try {
        const client = getTwelveDataClient();
        const quote = await client.getQuote(upperSymbol);
        
        // Cache the result
        serverCache.set(cacheKey, quote, 'quote');
        
        // Resolve any pending requests
        serverCache.resolvePending(cacheKey, quote);
        
        return NextResponse.json({ 
          quote,
          cached: false,
          source: 'api'
        });
      } catch (error) {
        serverCache.rejectPending(cacheKey, error);
        throw error;
      } finally {
        serverCache.clearPending(cacheKey);
      }

    }
    
    // Multiple symbols request (batch)
    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
      
      if (symbolList.length > 50) {
        return NextResponse.json({ error: 'Maximum 50 symbols per request' }, { status: 400 });
      }
      
      // Check cache for all symbols
      const cachedQuotes = serverCache.getBatchQuotes(symbolList);
      const missingSymbols = serverCache.getMissingSymbols(symbolList);
      
      // If all are cached, return immediately
      if (missingSymbols.length === 0) {
        const quotesArray = Array.from(cachedQuotes.entries()).map(([symbol, quote]) => ({
          symbol,
          ...quote
        }));
        
        return NextResponse.json({
          quotes: quotesArray,
          cached: true,
          source: 'server-cache',
          timestamp: Date.now()
        });
      }
      
      // Fetch missing symbols
      if (missingSymbols.length > 0) {
        try {
          const client = getTwelveDataClient();
          const freshQuotes = await client.getBatchQuotes(missingSymbols);
          
          // Cache fresh quotes
          serverCache.setBatchQuotes(freshQuotes);
          
          // Merge cached and fresh quotes
          freshQuotes.forEach((quote, symbol) => {
            cachedQuotes.set(symbol, quote);
          });
        } catch (error) {
          console.error('Failed to fetch missing quotes:', error);
        }
      }
      
      const quotesArray = Array.from(cachedQuotes.entries()).map(([symbol, quote]) => ({
        symbol,
        ...quote
      }));
      
      return NextResponse.json({
        quotes: quotesArray,
        cached: missingSymbols.length === 0,
        source: missingSymbols.length === 0 ? 'server-cache' : 'mixed',
        timestamp: Date.now(),
        stats: serverCache.getStats()
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