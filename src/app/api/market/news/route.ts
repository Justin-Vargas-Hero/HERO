import { NextResponse } from 'next/server';
import { unifiedCache, CacheTier, CacheKeys } from '@/lib/cache/unified-cache';

interface StockNewsItem {
    news_url: string;
    image_url?: string;
    title: string;
    text: string;
    source_name: string;
    date: string;
    sentiment?: string;
    type?: string;
    tickers?: string[];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') || 'symbol'; // 'symbol' or 'general'

    try {
        // Different cache keys for different types of news
        const cacheKey = symbol ? CacheKeys.news(symbol) : CacheKeys.marketNews();

        const news = await unifiedCache.getOrFetch(
            cacheKey,
            async () => {
                const apiKey = process.env.STOCKNEWS_API_KEY;
                if (!apiKey) {
                    console.warn('StockNewsAPI key not configured');
                    return [];
                }

                let url = 'https://stocknewsapi.com/api/v1';
                const params = new URLSearchParams({
                    token: apiKey,
                    items: '3' // Trial plan limit - upgrade for more items
                });

                if (symbol && type === 'symbol') {
                    // Get news for specific symbol
                    params.append('tickers', symbol.toUpperCase());
                } else {
                    // Get general market news using major market indices and popular stocks
                    // StockNewsAPI requires at least one ticker
                    params.append('tickers', 'SPY,QQQ,DIA,AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA');
                }

                const response = await fetch(`${url}?${params.toString()}`);

                if (!response.ok) {
                    console.error(`StockNewsAPI error: ${response.status}`);
                    return [];
                }

                const data = await response.json();

                // Transform StockNewsAPI format to our format
                if (data.data && Array.isArray(data.data)) {
                    return data.data.map((item: StockNewsItem) => ({
                        title: item.title || '',
                        description: item.text || '',
                        source: item.source_name || 'Unknown',
                        url: item.news_url || '#',
                        timestamp: item.date || new Date().toISOString(),
                        sentiment: item.sentiment || 'neutral',
                        imageUrl: item.image_url,
                        tickers: item.tickers || []
                    }));
                }

                return [];
            },
            { tier: CacheTier.HOURLY } // Cache news for 1 hour
        );

        return NextResponse.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json([]);
    }
}