import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured');
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

interface InjectorConfig {
  enabled: boolean;
  probability: number;
  lastUpdated: number;
}

const DEFAULT_CONFIG: InjectorConfig = {
  enabled: true,
  probability: 30,
  lastUpdated: Date.now(),
};

// GET - Retrieve injector configuration
export async function GET(request: NextRequest) {
  try {
    const redis = getRedis();
    const config = await redis.get('injector:config');

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        success: true,
        config: DEFAULT_CONFIG,
      });
    }

    const parsedConfig: InjectorConfig =
      typeof config === 'string' ? JSON.parse(config) : (config as InjectorConfig);

    return NextResponse.json({
      success: true,
      config: parsedConfig,
    });
  } catch (error) {
    console.error('Error fetching injector config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration', config: DEFAULT_CONFIG },
      { status: 500 }
    );
  }
}

// PUT - Update injector configuration
export async function PUT(request: NextRequest) {
  try {
    // Check for session token (admin only)
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redis = getRedis();

    // Verify admin session
    const email = await redis.get(`admin-session:${sessionToken}`);
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, probability } = body;

    // Validate inputs
    if (typeof enabled !== 'boolean' || typeof probability !== 'number') {
      return NextResponse.json(
        { error: 'Invalid configuration format' },
        { status: 400 }
      );
    }

    if (probability < 0 || probability > 100) {
      return NextResponse.json(
        { error: 'Probability must be between 0 and 100' },
        { status: 400 }
      );
    }

    const config: InjectorConfig = {
      enabled,
      probability,
      lastUpdated: Date.now(),
    };

    // Store configuration in Redis (no expiration)
    await redis.set('injector:config', JSON.stringify(config));

    return NextResponse.json({
      success: true,
      config,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating injector config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
