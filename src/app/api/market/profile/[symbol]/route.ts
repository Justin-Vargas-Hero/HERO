import { NextResponse } from 'next/server';
import { unifiedCache, CacheTier, CacheKeys } from '@/lib/cache/unified-cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  try {
    // Company profiles should be cached permanently as they rarely change
    const profile = await unifiedCache.getOrFetch(
      CacheKeys.profile(upperSymbol),
      async () => {
        // Fetch from TwelveData API
        const apiKey = process.env.TWELVEDATA_API_KEY;
        if (!apiKey) {
          throw new Error('API key not configured');
        }

        const response = await fetch(
          `https://api.twelvedata.com/profile?symbol=${upperSymbol}&apikey=${apiKey}`
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'error') {
          // Return null for symbols without profiles (like crypto pairs)
          if (data.message?.includes('not found') || upperSymbol.includes('/')) {
            return null;
          }
          throw new Error(data.message || 'Failed to fetch profile');
        }

        // Return the cleaned profile data
        return data;
      },
      { tier: CacheTier.PERMANENT }
    );

    if (profile === null) {
      return NextResponse.json(
        { error: 'Profile not available for this symbol' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}