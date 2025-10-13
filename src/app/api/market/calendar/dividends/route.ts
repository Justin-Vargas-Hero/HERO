import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(
      `https://api.twelvedata.com/dividends_calendar?date=${date}&apikey=${process.env.TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // TwelveData returns dividends as a direct array
    // BUT there's a bug - it returns future dividends (2027-2029) instead of today's
    // We need to filter to only show dividends for the requested date
    const events = Array.isArray(data)
      ? data
          .filter((item: any) => {
            const exDate = item.ex_date || item.ex_dividend_date;
            // Only include dividends for the requested date
            return exDate === date;
          })
          .map((item: any) => ({
            symbol: item.symbol,
            name: item.name || item.symbol, // Name might not be included
            date: item.ex_date || item.ex_dividend_date,
            amount: item.amount || item.dividend_amount,
            exchange: item.exchange,
            mic_code: item.mic_code,
            currency: item.currency || 'USD'
          }))
      : [];

    // If no dividends for today, try to get some recent ones as a fallback
    if (events.length === 0 && Array.isArray(data) && data.length > 0) {
      console.log('No dividends for requested date, TwelveData API returned future dividends');
      // Return empty array since the API data is unreliable
      return NextResponse.json([]);
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching dividends calendar:', error);
    return NextResponse.json([], { status: 500 });
  }
}