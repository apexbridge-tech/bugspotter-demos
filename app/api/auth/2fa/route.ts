import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
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

interface AdminUser {
  email: string;
  passwordHash: string;
  totpSecret?: string;
  totpEnabled: boolean;
}

// POST - Setup 2FA
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    const redis = getRedis();
    const email = await redis.get(`admin-session:${sessionToken}`);
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user
    const userData = await redis.get(`admin:${email}`);
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user: AdminUser =
      typeof userData === 'string' ? JSON.parse(userData) : (userData as AdminUser);

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `BugSpotter Admin (${email})`,
      issuer: 'BugSpotter',
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store secret (not enabled yet)
    user.totpSecret = secret.base32;
    await redis.set(`admin:${email}`, JSON.stringify(user));

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: '2FA setup failed' }, { status: 500 });
  }
}

// PUT - Enable 2FA
export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    // Verify session
    const redis = getRedis();
    const email = await redis.get(`admin-session:${sessionToken}`);
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user
    const userData = await redis.get(`admin:${email}`);
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user: AdminUser =
      typeof userData === 'string' ? JSON.parse(userData) : (userData as AdminUser);

    if (!user.totpSecret) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Enable 2FA
    user.totpEnabled = true;
    await redis.set(`admin:${email}`, JSON.stringify(user));

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json({ error: '2FA enable failed' }, { status: 500 });
  }
}

// DELETE - Disable 2FA
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    const redis = getRedis();
    const email = await redis.get(`admin-session:${sessionToken}`);
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user
    const userData = await redis.get(`admin:${email}`);
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user: AdminUser =
      typeof userData === 'string' ? JSON.parse(userData) : (userData as AdminUser);

    // Disable 2FA
    user.totpEnabled = false;
    user.totpSecret = undefined;
    await redis.set(`admin:${email}`, JSON.stringify(user));

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: '2FA disable failed' }, { status: 500 });
  }
}
