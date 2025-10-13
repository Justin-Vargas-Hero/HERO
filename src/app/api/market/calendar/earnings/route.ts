import { NextResponse } from 'next/server';

interface EarningsEvent {
  symbol: string;
  name: string;
  date: string;
  time: string;
  estimate: number | null;
  actual: number | null;
  difference: number | null;
  surprise_prc: number | null;
  exchange: string;
  country: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const exchangeFilter = searchParams.get('exchange'); // 'US' for US exchanges, 'NYSE' for NYSE only, or null for all

  try {
    const response = await fetch(
      `https://api.twelvedata.com/earnings_calendar?date=${date}&apikey=${process.env.TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // TwelveData returns earnings grouped by date
    // Structure: { "earnings": { "2024-01-01": [...] } }
    let events: EarningsEvent[] = [];

    if (data.earnings && typeof data.earnings === 'object') {
      // Get the earnings for the requested date
      const dateEarnings = data.earnings[date];

      if (Array.isArray(dateEarnings)) {
        // Deduplicate by company name, prioritizing US exchanges
        const uniqueCompanies = new Map();

        // Priority order for exchanges (US exchanges first)
        const exchangePriority = ['NYSE', 'NASDAQ', 'NYSEAMERICAN', 'BATS', 'OTC'];

        dateEarnings.forEach((item: any) => {
          const companyName = item.name || item.symbol;
          const existing = uniqueCompanies.get(companyName);

          if (!existing) {
            uniqueCompanies.set(companyName, item);
          } else {
            // Replace if current exchange has higher priority
            const currentPriority = exchangePriority.indexOf(item.exchange) !== -1
              ? exchangePriority.indexOf(item.exchange)
              : 999;
            const existingPriority = exchangePriority.indexOf(existing.exchange) !== -1
              ? exchangePriority.indexOf(existing.exchange)
              : 999;

            if (currentPriority < existingPriority) {
              uniqueCompanies.set(companyName, item);
            }
          }
        });

        // Transform to our format
        events = Array.from(uniqueCompanies.values()).map((item: any): EarningsEvent => ({
          symbol: item.symbol,
          name: item.name || item.symbol,
          date: date,
          time: item.time || 'TBD',
          estimate: item.eps_estimate,
          actual: item.eps_actual,
          difference: item.difference,
          surprise_prc: item.surprise_prc,
          exchange: item.exchange,
          country: item.country
        }));

        // Sort by company name
        events.sort((a, b) => a.name.localeCompare(b.name));

        // Apply exchange filter if specified
        if (exchangeFilter) {
          const US_EXCHANGES = ['NYSE', 'NASDAQ', 'NYSEAMERICAN', 'BATS', 'OTC', 'NYSEARCA'];
          const NYSE_EXCHANGES = ['NYSE', 'NYSEARCA'];

          if (exchangeFilter.toUpperCase() === 'US') {
            // Filter to US exchanges only
            events = events.filter(event =>
              US_EXCHANGES.includes(event.exchange) ||
              event.country === 'United States'
            );
          } else if (exchangeFilter.toUpperCase() === 'NYSE') {
            // Filter to NYSE only
            events = events.filter(event =>
              NYSE_EXCHANGES.includes(event.exchange)
            );
          } else if (exchangeFilter.toUpperCase() === 'NASDAQ') {
            // Filter to NASDAQ only
            events = events.filter(event =>
              event.exchange === 'NASDAQ' || event.exchange === 'NASDAQGS'
            );
          } else {
            // Filter to specific exchange
            events = events.filter(event =>
              event.exchange === exchangeFilter.toUpperCase()
            );
          }
        }
      }
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json([], { status: 500 });
  }
}