import { NextRequest, NextResponse } from 'next/server';
import { storeBug, getBugs } from '@/lib/session-manager';

// POST - Store a new bug
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errorMessage, stackTrace, severity, elementId, demo, userAgent, screenshot } = body;

    // Get subdomain from header (set by middleware)
    const subdomain = request.headers.get('X-Client-Subdomain');

    if (!subdomain) {
      // Try to get from request body or URL
      const urlSubdomain = new URL(request.url).searchParams.get('subdomain');
      const bodySubdomain = body.subdomain;

      if (!urlSubdomain && !bodySubdomain) {
        return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
      }
    }

    const actualSubdomain = subdomain || body.subdomain;

    // Validate required fields
    if (!errorMessage || !severity || !demo) {
      return NextResponse.json(
        { error: 'Missing required fields: errorMessage, severity, demo' },
        { status: 400 }
      );
    }

    // Store the bug
    const bug = await storeBug({
      subdomain: actualSubdomain,
      errorMessage,
      stackTrace,
      severity,
      elementId,
      demo,
      userAgent,
      screenshot,
    });

    return NextResponse.json({
      success: true,
      bug: {
        id: bug.id,
        timestamp: bug.timestamp,
      },
    });
  } catch (error) {
    console.error('Error storing bug:', error);
    return NextResponse.json({ error: 'Failed to store bug' }, { status: 500 });
  }
}

// GET - Retrieve bugs for a subdomain
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain') || request.headers.get('X-Client-Subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    const bugs = await getBugs(subdomain);

    return NextResponse.json({
      success: true,
      bugs,
      count: bugs.length,
    });
  } catch (error) {
    console.error('Error retrieving bugs:', error);
    return NextResponse.json({ error: 'Failed to retrieve bugs' }, { status: 500 });
  }
}
