import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract subdomain from hostname
  // Expected formats:
  // - demo.bugspotter.io (main domain)
  // - {demo}-{session}.demo.bugspotter.io (e.g., kazbank-acme-demo.demo.bugspotter.io)
  // - localhost:3000 (development)
  // - *.vercel.app (Vercel deployment)

  let fullSubdomain: string | null = null;
  let demo: string | null = null;
  let session: string | null = null;

  // Handle localhost development
  if (hostname.includes('localhost')) {
    // For local development, check for subdomain in query param or skip
    const subdomainParam = url.searchParams.get('subdomain');
    if (subdomainParam) {
      fullSubdomain = subdomainParam;
      // Parse demo-session format
      const match = subdomainParam.match(/^(kazbank|talentflow|quickmart)-(.+)$/);
      if (match) {
        demo = match[1];
        session = match[2];
      }
    }
  } else if (hostname.includes('vercel.app')) {
    // For Vercel deployments, don't extract subdomain - they're all single domain
    fullSubdomain = null;
  } else {
    // Production subdomain extraction
    const parts = hostname.split('.');

    // If we have more than 2 parts (e.g., kazbank-acme-demo.demo.bugspotter.io = 4 parts)
    // and it's not just "demo.bugspotter.io"
    if (parts.length >= 3 && parts[0] !== 'demo') {
      fullSubdomain = parts[0];
      
      // Parse {demo}-{session} format (e.g., kazbank-acme-demo)
      const demoMatch = fullSubdomain.match(/^(kazbank|talentflow|quickmart)-(.+)$/);
      if (demoMatch) {
        demo = demoMatch[1];
        session = demoMatch[2];
      } else {
        // If no demo prefix, this is just a session ID (e.g., alex-g5po.demo.bugspotter.io)
        // This format is used for dashboard access
        session = fullSubdomain;
        demo = null; // No specific demo, this is for dashboard/multi-demo access
      }
    }
  }

  // Skip middleware for main domain or invalid format
  if (!fullSubdomain || !session) {
    return NextResponse.next();
  }

  // For API routes, just pass headers without rewriting
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    const response = NextResponse.next();
    
    // Still set headers for API routes so they can access subdomain info
    if (fullSubdomain) {
      response.headers.set('X-Client-Subdomain', fullSubdomain);
      if (demo) {
        response.headers.set('X-Demo-Type', demo);
      }
      response.headers.set('X-Session-ID', session);
    }
    
    return response;
  }

  // Rewrite path to /[subdomain]/... for dynamic routing
  const newUrl = url.clone();
  newUrl.pathname = `/${fullSubdomain}${url.pathname}`;

  // Create response with rewrite
  const response = NextResponse.rewrite(newUrl);

  // Pass subdomain info in headers for server components to access
  response.headers.set('X-Client-Subdomain', fullSubdomain);
  if (demo) {
    response.headers.set('X-Demo-Type', demo);
  }
  response.headers.set('X-Session-ID', session);

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
