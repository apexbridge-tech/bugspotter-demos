import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract subdomain from hostname
  // Expected formats:
  // - demo.bugspotter.io (main domain)
  // - {company}.demo.bugspotter.io (client-specific)
  // - localhost:3000 (development)
  // - *.vercel.app (Vercel deployment)

  let subdomain: string | null = null;

  // Handle localhost development
  if (hostname.includes('localhost')) {
    // For local development, check for subdomain in query param or skip
    subdomain = url.searchParams.get('subdomain');
  } else if (hostname.includes('vercel.app')) {
    // For Vercel deployments, don't extract subdomain - they're all single domain
    subdomain = null;
  } else {
    // Production subdomain extraction
    const parts = hostname.split('.');

    // If we have more than 2 parts (e.g., company.demo.bugspotter.io = 4 parts)
    // and it's not just "demo.bugspotter.io"
    if (parts.length >= 3 && parts[0] !== 'demo') {
      subdomain = parts[0];
    }
  }

  // Skip middleware for main domain
  if (!subdomain) {
    return NextResponse.next();
  }

  // Skip middleware for static files and Next.js internals
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rewrite path to /[subdomain]/... for dynamic routing
  const newUrl = url.clone();
  newUrl.pathname = `/${subdomain}${url.pathname}`;

  // Create response with rewrite
  const response = NextResponse.rewrite(newUrl);

  // Pass subdomain in headers for server components to access
  response.headers.set('X-Client-Subdomain', subdomain);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
