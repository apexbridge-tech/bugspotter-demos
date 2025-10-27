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

interface BugEvent {
  id: string;
  subdomain: string;
  timestamp: number;
  errorMessage: string;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  elementId?: string;
  demo: 'kazbank' | 'talentflow' | 'quickmart';
  userAgent?: string;
}

// GET - List all bugs across all sessions
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

    // Get all bug list keys
    const bugKeys = await redis.keys('bugs:*');

    if (!bugKeys || bugKeys.length === 0) {
      return NextResponse.json({ success: true, bugs: [], count: 0 });
    }

    // Get all bugs from all sessions
    const allBugs: BugEvent[] = [];

    for (const key of bugKeys) {
      const bugs = await redis.lrange(key, 0, -1);
      if (bugs && bugs.length > 0) {
        const parsedBugs = bugs.map((bug) =>
          typeof bug === 'string' ? JSON.parse(bug) : (bug as BugEvent)
        );
        allBugs.push(...parsedBugs);
      }
    }

    // Sort by newest first
    allBugs.sort((a, b) => b.timestamp - a.timestamp);

    // Get statistics
    const stats = {
      total: allBugs.length,
      critical: allBugs.filter((b) => b.severity === 'critical').length,
      high: allBugs.filter((b) => b.severity === 'high').length,
      medium: allBugs.filter((b) => b.severity === 'medium').length,
      low: allBugs.filter((b) => b.severity === 'low').length,
      byDemo: {
        kazbank: allBugs.filter((b) => b.demo === 'kazbank').length,
        talentflow: allBugs.filter((b) => b.demo === 'talentflow').length,
        quickmart: allBugs.filter((b) => b.demo === 'quickmart').length,
      },
    };

    return NextResponse.json({
      success: true,
      bugs: allBugs,
      count: allBugs.length,
      stats,
    });
  } catch (error) {
    console.error('Error fetching all bugs:', error);
    return NextResponse.json({ error: 'Failed to fetch bugs' }, { status: 500 });
  }
}
