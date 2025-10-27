import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('Missing Redis credentials in environment variables');
}

interface AdminUser {
  email: string;
  passwordHash: string;
  totpSecret?: string;
  totpEnabled: boolean;
}

// POST - Login with email/password
export async function POST(request: NextRequest) {
  try {
    const { email, password, totpToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Get admin user
    const userData = await redis.get(`admin:${email}`);
    if (!userData) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user: AdminUser =
      typeof userData === 'string' ? JSON.parse(userData) : (userData as AdminUser);

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if 2FA is enabled
    if (user.totpEnabled) {
      if (!totpToken) {
        return NextResponse.json(
          { requiresTOTP: true, message: '2FA token required' },
          { status: 200 }
        );
      }

      // Verify TOTP
      const verified = speakeasy.totp.verify({
        secret: user.totpSecret || '',
        encoding: 'base32',
        token: totpToken,
        window: 2,
      });

      if (!verified) {
        return NextResponse.json({ error: 'Invalid 2FA token' }, { status: 401 });
      }
    }

    // Generate session token
    const sessionToken = Buffer.from(
      `${email}:${Date.now()}:${Math.random().toString(36)}`
    ).toString('base64');

    // Store session
    await redis.setex(`admin-session:${sessionToken}`, 3600 * 8, email); // 8 hours

    return NextResponse.json({
      success: true,
      sessionToken,
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      }, 
      { status: 500 }
    );
  }
}

// DELETE - Logout
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token');

    if (sessionToken) {
      await redis.del(`admin-session:${sessionToken}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
