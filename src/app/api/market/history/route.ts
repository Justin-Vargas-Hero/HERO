import { NextResponse } from 'next/server';
import { getTwelveDataClient } from '@/lib/market-data/TwelveDataClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '5min';
    const outputsize = searchParams.get('outputsize') || '78'; // ~6.5 hours of 5min data
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        const client = getTwelveDataClient();
        const data = await client.getTimeSeries(symbol, interval, parseInt(outputsize), startDate, endDate);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch historical data' },
            { status: 500 }
        );
    }
}