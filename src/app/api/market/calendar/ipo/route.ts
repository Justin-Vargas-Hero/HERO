import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(
      `https://api.twelvedata.com/ipo_calendar?date=${date}&apikey=${process.env.TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // TwelveData returns IPOs grouped by date
    // Structure: { "2024-01-01": [...], "2024-01-02": [...] }
    let events = [];

    if (typeof data === 'object' && !Array.isArray(data)) {
      // Get the IPOs for the requested date
      const dateIpos = data[date];

      if (Array.isArray(dateIpos)) {
        // Transform to our format
        events = dateIpos.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          date: date,
          exchange: item.exchange,
          price_range: item.price_range_low && item.price_range_high
            ? `$${item.price_range_low}-$${item.price_range_high}`
            : 'TBD',
          shares: item.shares,
          currency: item.currency
        }));
      }
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching IPO calendar:', error);
    return NextResponse.json([], { status: 500 });
  }
}