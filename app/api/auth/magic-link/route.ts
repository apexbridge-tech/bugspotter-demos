import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured');
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const BUGSPOTTER_API = process.env.BUGSPOTTER_API_URL || 'https://demo.api.bugspotter.io';

// Magic link token duration: 1 hour
const MAGIC_LINK_DURATION_SECONDS = 60 * 60; // 1 hour

/**
 * Generate a secure magic link token for admin authentication
 * POST /api/auth/magic-link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials with BugSpotter API
    const response = await fetch(`${BUGSPOTTER_API}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Invalid credentials', details: error },
        { status: 401 }
      );
    }

    const data = await response.json();
    const accessToken = data.data.access_token;

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Store token with user credentials in Redis
    const redis = getRedis();
    await redis.setex(
      `magic-link:${token}`,
      MAGIC_LINK_DURATION_SECONDS,
      JSON.stringify({
        email,
        password,
        accessToken,
        createdAt: Date.now(),
      })
    );

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/admin?token=${token}`;

    return NextResponse.json({
      success: true,
      magicLink: magicLinkUrl,
      token,
      expiresAt: Date.now() + MAGIC_LINK_DURATION_SECONDS * 1000,
    });
  } catch (error) {
    console.error('Error generating magic link:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate magic link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate and consume a magic link token
 * GET /api/auth/magic-link?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const redis = getRedis();
    const data = await redis.get(`magic-link:${token}`);

    if (!data) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const tokenData = typeof data === 'string' ? JSON.parse(data) : data;

    // Delete token after use (one-time use)
    await redis.del(`magic-link:${token}`);

    // Re-authenticate with BugSpotter to get fresh token
    const response = await fetch(`${BUGSPOTTER_API}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: tokenData.email,
        password: tokenData.password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to authenticate', details: error },
        { status: 401 }
      );
    }

    const authData = await response.json();
    const accessToken = authData.data.access_token;

    // Get user data
    const userResponse = await fetch(`${BUGSPOTTER_API}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get user data' },
        { status: 500 }
      );
    }

    const userData = await userResponse.json();

    // Generate admin session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Store admin session in Redis (24 hours)
    await redis.setex(
      `admin-session:${sessionToken}`,
      24 * 60 * 60, // 24 hours
      tokenData.email
    );

    return NextResponse.json({
      success: true,
      sessionToken,
      user: userData.data,
      accessToken,
    });
  } catch (error) {
    console.error('Error validating magic link:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate magic link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
