import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and auth routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // static files with extensions
  ) {
    return NextResponse.next();
  }

  // Only apply redirect logic on production domain
  const isProductionDomain = hostname === 'hero.us.org' || hostname.endsWith('.hero.us.org');
  
  if (!isProductionDomain) {
    return NextResponse.next();
  }

  // Check if user has visited before
  const hasVisited = request.cookies.has('hero_visited');
  
  // If it's the landing page, let them through
  if (pathname === '/landing') {
    // Set the cookie so they won't be redirected again
    const response = NextResponse.next();
    if (!hasVisited) {
      response.cookies.set('hero_visited', 'true', {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        secure: true
      });
    }
    return response;
  }
  
  // If first time visitor and not on landing page, redirect to landing
  if (!hasVisited && pathname !== '/landing') {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    const response = NextResponse.redirect(url);
    // Set the cookie after redirect
    response.cookies.set('hero_visited', 'true', {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      secure: true
    });
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};