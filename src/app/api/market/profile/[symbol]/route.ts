import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  try {
    const response = await fetch(
      `https://api.twelvedata.com/profile?symbol=${symbol}&apikey=${process.env.TWELVEDATA_API_KEY}`,
      { 
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the profile data directly
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}