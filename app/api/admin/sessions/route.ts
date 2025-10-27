import { NextRequest, NextResponse } from 'next/server';
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

// GET - List all sessions
export async function GET(request: NextRequest) {
  try {
    // Check for session token
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    const redis = getRedis();
    const email = await redis.get(`admin-session:${sessionToken}`);
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get all session keys
    const sessionKeys = await redis.keys('session:*');

    if (!sessionKeys || sessionKeys.length === 0) {
      return NextResponse.json({ success: true, sessions: [], count: 0 });
    }

    // Get all session data
    const sessions = await Promise.all(
      sessionKeys.map(async (key) => {
        const data = await redis.get(key);
        return typeof data === 'string' ? JSON.parse(data) : data;
      })
    );

    return NextResponse.json({
      success: true,
      sessions: sessions.filter(Boolean),
      count: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// DELETE - Delete a specific session
export async function DELETE(request: NextRequest) {
  try {
    // Check for session token
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    const redis = getRedis();
    const email = await redis.get(`admin-session:${sessionToken}`);
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    await Promise.all([redis.del(`session:${subdomain}`), redis.del(`bugs:${subdomain}`)]);

    return NextResponse.json({
      success: true,
      message: `Session ${subdomain} deleted`,
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
