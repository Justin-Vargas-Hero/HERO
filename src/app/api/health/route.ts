import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hero-api',
    environment: process.env.NODE_ENV,
  });
}

// Keep Lambda warm
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
