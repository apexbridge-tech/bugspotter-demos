import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured');
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function getBugSpotterConfig() {
  if (!process.env.BUGSPOTTER_API_URL) {
    throw new Error('BUGSPOTTER_API_URL environment variable is required');
  }
  return process.env.BUGSPOTTER_API_URL;
}

function getJWTSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return process.env.JWT_SECRET;
}

/**
 * Generate a JWT magic token for BugSpotter API magic login
 * POST /api/auth/magic-link
 */
export async function POST(request: NextRequest) {
  try {
    const jwtSecret = getJWTSecret();
    
    const body = await request.json();
    const { userId, userEmail, role } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'userId and userEmail are required' },
        { status: 400 }
      );
    }

    // Generate JWT magic token with type: 'magic'
    const magicToken = jwt.sign(
      {
        sub: userId,
        email: userEmail,
        role: role || 'user',
        type: 'magic', // Required by BugSpotter API
      },
      jwtSecret,
      {
        expiresIn: '1h', // 1 hour expiry
      }
    );

    // Generate magic link URL pointing to admin page with token
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/admin?token=${magicToken}`;

    return NextResponse.json({
      success: true,
      magicLink: magicLinkUrl,
      token: magicToken,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
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
 * Validate magic token via BugSpotter API and create admin session
 * GET /api/auth/magic-link?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const bugspotterApi = getBugSpotterConfig();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Authenticate with BugSpotter API using magic login
    const response = await fetch(`${bugspotterApi}/api/v1/auth/magic-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Invalid or expired token', details: error },
        { status: 401 }
      );
    }

    const authData = await response.json();
    const accessToken = authData.data.access_token;
    const user = authData.data.user;

    // Generate admin session token for our demo system
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Store admin session in Redis (24 hours)
    const redis = getRedis();
    await redis.setex(
      `admin-session:${sessionToken}`,
      24 * 60 * 60, // 24 hours
      user.email
    );

    return NextResponse.json({
      success: true,
      sessionToken,
      user,
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
