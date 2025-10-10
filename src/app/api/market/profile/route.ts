import { NextResponse } from 'next/server';

// Map state abbreviations to full names
const stateMap: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const apiKey = process.env.TWELVEDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Fetch company profile from TwelveData
    const response = await fetch(
      `https://api.twelvedata.com/profile?symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to include expanded state name
    if (data && data.state && stateMap[data.state]) {
      data.stateExpanded = stateMap[data.state];
    } else if (data && data.state) {
      data.stateExpanded = data.state; // Use as-is if not found in map
    }

    // Format the response with the fields we need
    const profile = {
      sector: data.sector || null,
      industry: data.industry || null,
      employees: data.employees || null,
      website: data.website || null,
      description: data.description || null,
      ceo: data.CEO || null,
      city: data.city || null,
      state: data.stateExpanded || data.state || null,
      country: data.country || null,
      address: data.address || null,
      phone: data.phone || null
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}