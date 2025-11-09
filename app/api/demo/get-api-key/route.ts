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

interface DemoSessionData {
  subdomain: string;
  company: string;
  email: string;
  userId: string;
  userPassword: string;
  projects: Array<{
    id: string;
    name: string;
    apiKey: string;
  }>;
  createdAt: number;
  expiresAt: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const demo = searchParams.get('demo');

    console.log('[get-api-key] Request:', { sessionId, demo });

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (!demo || !['kazbank', 'talentflow', 'quickmart'].includes(demo)) {
      return NextResponse.json(
        { error: 'demo must be one of: kazbank, talentflow, quickmart' },
        { status: 400 }
      );
    }

    const redis = getRedis();
    const sessionKey = `demo-session:${sessionId}`;
    console.log('[get-api-key] Looking for session key:', sessionKey);
    
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      console.log('[get-api-key] Session not found');
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session: DemoSessionData =
      typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

    console.log('[get-api-key] Session found, projects:', session.projects?.length);

    // Find the project for this demo
    const project = session.projects?.find((p) =>
      p.name.toLowerCase().includes(demo.toLowerCase())
    );

    if (!project || !project.apiKey) {
      console.log('[get-api-key] No project found for demo:', demo);
      return NextResponse.json({ error: `No API key found for ${demo}` }, { status: 404 });
    }

    console.log('[get-api-key] API key found for:', project.name);

    return NextResponse.json({
      success: true,
      apiKey: project.apiKey,
      projectId: project.id,
      projectName: project.name,
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch API key',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
