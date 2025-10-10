import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // TwelveData news endpoint
        const response = await fetch(
            `https://api.twelvedata.com/stocks/news?symbol=${symbol}&apikey=${process.env.TWELVEDATA_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news data' },
            { status: 500 }
        );
    }
}