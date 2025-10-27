import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session-manager';
import { Redis } from '@upstash/redis';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured');
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    const redis = getRedis();
    const sessionData = await redis.get(`session:${subdomain}`);

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company } = body;

    if (!company || typeof company !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Validate company name length
    if (company.length < 2 || company.length > 50) {
      return NextResponse.json(
        { error: 'Company name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    // Create new demo session
    const session = await createSession(company);

    return NextResponse.json({
      success: true,
      session: {
        subdomain: session.subdomain,
        company: session.company,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating demo session:', error);
    return NextResponse.json({ error: 'Failed to create demo session' }, { status: 500 });
  }
}
