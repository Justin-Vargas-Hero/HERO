import { NextResponse } from 'next/server';
import { unifiedCache, CacheTier, CacheKeys } from '@/lib/cache/unified-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    // Earnings calendar updates daily, so cache for 24 hours
    const events = await unifiedCache.getOrFetch(
      CacheKeys.earnings(date),
      async () => {
        const apiKey = process.env.TWELVEDATA_API_KEY;
        if (!apiKey) {
          throw new Error('API key not configured');
        }

        const response = await fetch(
          `https://api.twelvedata.com/earnings_calendar?date=${date}&apikey=${apiKey}`
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // TwelveData returns earnings grouped by date
        // Structure: { earnings: { "2024-01-01": [...], "2024-01-02": [...] } }
        if (data.earnings && typeof data.earnings === 'object') {
          // Get the earnings for the requested date
          const dateEarnings = data.earnings[date];

          if (Array.isArray(dateEarnings)) {
            // Transform to our format
            return dateEarnings.map((item: any) => ({
              symbol: item.symbol,
              name: item.name,
              date: date,
              time: item.time,
              estimate: item.eps_estimate,
              actual: item.eps_actual,
              difference: item.difference,
              surprise_prc: item.surprise_prc
            }));
          }
        }

        return [];
      },
      { tier: CacheTier.DAILY }
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json([], { status: 500 });
  }
}