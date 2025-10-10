import { NextResponse } from 'next/server';
import { serverCache } from '@/lib/market-data/server-cache';

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

    const response = await fetch(
      `https://api.twelvedata.com/market_movers/stocks?apikey=${process.env.TWELVEDATA_API_KEY}`,
      { 
        next: { revalidate: 3600 }, // Next.js cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if we got valid data
    if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
      console.error('No market movers data available');
      // Return empty arrays instead of failing
      return NextResponse.json({
        gainers: [],
        losers: [],
        most_active: []
      });
    }
    
    // Transform the data to our format
    // TwelveData returns 'last' instead of 'price' for market movers
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