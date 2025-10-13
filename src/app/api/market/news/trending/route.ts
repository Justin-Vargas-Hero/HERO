import { NextResponse } from 'next/server';
import { unifiedCache, CacheTier } from '@/lib/cache/unified-cache';

interface TrendingNewsItem {
    news_url: string;
    image_url?: string;
    title: string;
    text: string;
    source_name: string;
    date: string;
    sentiment?: string;
    tickers?: string[];
}

export async function GET() {
    try {
        const trending = await unifiedCache.getOrFetch(
            'news:trending',
            async () => {
                const apiKey = process.env.STOCKNEWS_API_KEY;
                if (!apiKey) {
                    console.warn('StockNewsAPI key not configured');
                    return [];
                }

                // Get top trending/important news
                // Use major market tickers to get general market news
                const params = new URLSearchParams({
                    token: apiKey,
                    items: '3', // Trial plan limit - can only get 3 items
                    tickers: 'AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA,SPY,QQQ,DIA' // Major stocks and indices
                    // Note: Trial plan is limited to 3 items per request
                });

                const response = await fetch(`https://stocknewsapi.com/api/v1?${params.toString()}`);

                if (!response.ok) {
                    console.error(`StockNewsAPI error: ${response.status} - ${response.statusText}`);
                    const errorBody = await response.text();
                    console.error('StockNewsAPI error details:', errorBody);
                    return [];
                }

                const data = await response.json();

                // Transform to our format with sentiment indicators
                if (data.data && Array.isArray(data.data)) {
                    return data.data.map((item: TrendingNewsItem) => ({
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
            { tier: CacheTier.FREQUENT } // Cache for 15 minutes for trending news
        );

        return NextResponse.json(trending);
    } catch (error) {
        console.error('Error fetching trending news:', error);
        return NextResponse.json([]);
    }
}