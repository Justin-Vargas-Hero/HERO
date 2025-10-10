import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(
      `https://api.twelvedata.com/earnings_calendar?date=${date}&apikey=${process.env.TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to our format
    const events = data.earnings?.map((item: any) => ({
      symbol: item.symbol,
      name: item.name,
      date: item.date,
      time: item.time,
      estimate: item.eps_estimate,
      actual: item.eps_actual,
      importance: item.importance
    })) || [];

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json([], { status: 500 });
  }
}