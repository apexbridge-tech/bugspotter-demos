import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const BUGSPOTTER_API = process.env.BUGSPOTTER_API_URL || 'https://demo.api.bugspotter.io';
const BUGSPOTTER_ADMIN_EMAIL = process.env.BUGSPOTTER_ADMIN_EMAIL;
const BUGSPOTTER_ADMIN_PASSWORD = process.env.BUGSPOTTER_ADMIN_PASSWORD;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured');
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

async function getBugSpotterAuthToken(): Promise<string> {
  if (!BUGSPOTTER_ADMIN_EMAIL || !BUGSPOTTER_ADMIN_PASSWORD) {
    throw new Error('BUGSPOTTER_ADMIN_EMAIL and BUGSPOTTER_ADMIN_PASSWORD not configured');
  }

  const response = await fetch(`${BUGSPOTTER_API}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: BUGSPOTTER_ADMIN_EMAIL,
      password: BUGSPOTTER_ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to authenticate with BugSpotter: ${error}`);
  }

  const data = await response.json();
  return data.data.access_token;
}

async function deleteProject(projectId: string, authToken: string): Promise<void> {
  const response = await fetch(`${BUGSPOTTER_API}/api/v1/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete project ${projectId}: ${error}`);
  }
}

async function deleteUser(userId: string, authToken: string): Promise<void> {
  const response = await fetch(`${BUGSPOTTER_API}/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete user ${userId}: ${error}`);
  }
}

async function deleteApiKey(apiKeyId: string, authToken: string): Promise<void> {
  const response = await fetch(`${BUGSPOTTER_API}/api/v1/api-keys/${apiKeyId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete API key ${apiKeyId}: ${error}`);
  }
}

// GET - List all sessions
export async function GET(request: NextRequest) {
  try {
    // Check for session token
    const sessionToken = request.headers.get('x-session-token');
    console.log('[Sessions API] Session token received:', !!sessionToken);
    console.log('[Sessions API] Session token value:', sessionToken);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    const redis = getRedis();
    const redisKey = `admin-session:${sessionToken}`;
    console.log('[Sessions API] Looking up Redis key:', redisKey);
    const email = await redis.get(redisKey);
    console.log('[Sessions API] Email from Redis:', email);
    console.log('[Sessions API] Email type:', typeof email);
    if (!email) {
      console.log('[Sessions API] Session not found in Redis');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get all session keys (demo sessions are stored as demo-session:*)
    const sessionKeys = await redis.keys('demo-session:*');

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

    console.log(`[Admin Delete] Deleting session: ${subdomain}`);

    // Get metadata for BugSpotter cleanup
    const metadata = await redis.get<{
      userId: string;
      email: string;
      projectIds: string[];
      apiKeyIds: string[];
    }>(`bugspotter-metadata:${subdomain}`);

    if (metadata) {
      console.log(`[Admin Delete] Found metadata, cleaning up BugSpotter resources...`);
      try {
        // Get BugSpotter auth token
        const authToken = await getBugSpotterAuthToken();

        // Delete all projects
        for (const projectId of metadata.projectIds) {
          try {
            console.log(`[Admin Delete] Deleting project: ${projectId}`);
            await deleteProject(projectId, authToken);
          } catch (error) {
            console.error(`[Admin Delete] Failed to delete project ${projectId}:`, error);
            // Continue with other deletions even if one fails
          }
        }

        // Delete all API keys
        if (metadata.apiKeyIds) {
          for (const apiKeyId of metadata.apiKeyIds) {
            try {
              console.log(`[Admin Delete] Deleting API key: ${apiKeyId}`);
              await deleteApiKey(apiKeyId, authToken);
            } catch (error) {
              console.error(`[Admin Delete] Failed to delete API key ${apiKeyId}:`, error);
              // Continue with other deletions even if one fails
            }
          }
        }

        // Delete user
        try {
          console.log(`[Admin Delete] Deleting user: ${metadata.userId}`);
          await deleteUser(metadata.userId, authToken);
        } catch (error) {
          console.error(`[Admin Delete] Failed to delete user ${metadata.userId}:`, error);
        }

        console.log(`[Admin Delete] ✅ BugSpotter cleanup complete`);
      } catch (error) {
        console.error(`[Admin Delete] BugSpotter cleanup failed:`, error);
        // Continue with Redis cleanup even if BugSpotter cleanup fails
      }
    } else {
      console.log(`[Admin Delete] No metadata found, skipping BugSpotter cleanup`);
    }

    // Delete Redis data
    await Promise.all([
      redis.del(`demo-session:${subdomain}`),
      redis.del(`bugs:${subdomain}`),
      redis.srem('bugspotter-tracked-sessions', subdomain),
      redis.del(`bugspotter-metadata:${subdomain}`),
    ]);

    console.log(`[Admin Delete] ✅ Session deleted: ${subdomain}`);

    return NextResponse.json({
      success: true,
      message: `Session ${subdomain} deleted`,
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
