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
    const events = Array.isArray(data)
      ? data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name || item.symbol, // Name might not be included
          date: item.ex_date || item.ex_dividend_date,
          amount: item.amount || item.dividend_amount,
          exchange: item.exchange,
          mic_code: item.mic_code
        }))
      : [];

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching dividends calendar:', error);
    return NextResponse.json([], { status: 500 });
  }
}