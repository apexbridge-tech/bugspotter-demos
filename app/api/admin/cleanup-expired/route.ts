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

const BUGSPOTTER_API = process.env.BUGSPOTTER_API_URL || 'https://demo.api.bugspotter.io';
const BUGSPOTTER_ADMIN_EMAIL = process.env.BUGSPOTTER_ADMIN_EMAIL;
const BUGSPOTTER_ADMIN_PASSWORD = process.env.BUGSPOTTER_ADMIN_PASSWORD;

// JIRA Configuration
const JIRA_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_AUTH_HEADER =
  JIRA_EMAIL && JIRA_API_TOKEN
    ? `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`
    : undefined;

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

/**
 * Delete a JIRA project via the JIRA REST API
 *
 * @param projectIdOrKey - The JIRA project identifier (can be either the numeric project ID or the project key)
 * @throws {Error} When JIRA credentials are not configured, preventing orphaned resources
 * @throws {Error} When the JIRA API request fails with detailed error information
 * @returns void on successful deletion
 */
async function deleteJiraProject(projectIdOrKey: string): Promise<void> {
  if (!JIRA_URL || !JIRA_AUTH_HEADER) {
    console.warn(
      `[JIRA] ⚠️  WARNING: Cannot delete JIRA project ${projectIdOrKey} - credentials not configured!`
    );
    console.warn(
      '[JIRA] This will leave orphaned JIRA projects. Ensure JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN are set.'
    );
    throw new Error(
      `JIRA credentials not configured. Cannot delete project ${projectIdOrKey}. This may leave orphaned resources.`
    );
  }

  const response = await fetch(`${JIRA_URL}/rest/api/3/project/${projectIdOrKey}`, {
    method: 'DELETE',
    headers: {
      Authorization: JIRA_AUTH_HEADER!,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorDetails = JSON.stringify(errorJson, null, 2);
      console.error('[JIRA] Failed to delete project. Status:', response.status);
      console.error('[JIRA] Error details:', errorJson);
      if (errorJson.errorMessages) {
        console.error('[JIRA] Error messages:', errorJson.errorMessages);
      }
      if (errorJson.errors) {
        console.error('[JIRA] Field errors:', errorJson.errors);
      }
    } catch {
      console.error('[JIRA] Failed to delete project:', errorText);
    }
    throw new Error(`Failed to delete JIRA project ${projectIdOrKey}: ${errorDetails}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/secret key for security
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_CLEANUP_SECRET;

    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const redis = getRedis();

    console.log('[Cleanup] Starting Redis-synced cleanup...');
    console.log('[Cleanup] Strategy: Clean BugSpotter resources for sessions missing from Redis');

    const cleanupResults = {
      redisSessionCount: 0,
      bugspotterSessionsTracked: 0,
      orphanedSessions: 0,
      cleaned: 0,
      errors: [] as Array<{ sessionId: string; error: string }>,
    };

    // Step 1: Get all active sessions from Redis (these are still valid)
    const redisSessionKeys = await redis.keys('demo-session:*');
    const activeRedisSessionIds = new Set(
      redisSessionKeys.map((key) => key.replace('demo-session:', ''))
    );
    cleanupResults.redisSessionCount = activeRedisSessionIds.size;

    console.log(`[Cleanup] Found ${activeRedisSessionIds.size} active sessions in Redis`);

    // Step 2: Get list of sessions we've created in BugSpotter
    // We track this in a separate Redis key to know what we've created
    const trackedSessionsKey = 'bugspotter-tracked-sessions';
    const trackedSessions = (await redis.smembers(trackedSessionsKey)) || [];
    cleanupResults.bugspotterSessionsTracked = trackedSessions.length;

    console.log(`[Cleanup] Tracking ${trackedSessions.length} total BugSpotter sessions`);

    if (trackedSessions.length === 0) {
      console.log(
        '[Cleanup] No tracked sessions found. Creating tracking set for future cleanups.'
      );
      return NextResponse.json({
        success: true,
        message: 'No tracked sessions to clean. Run this after creating some demo sessions.',
        results: cleanupResults,
      });
    }

    // Step 3: Find orphaned sessions (in BugSpotter but not in Redis = expired)
    const orphanedSessionIds: string[] = [];
    for (const sessionId of trackedSessions) {
      if (!activeRedisSessionIds.has(sessionId)) {
        orphanedSessionIds.push(sessionId);
        cleanupResults.orphanedSessions++;
      }
    }

    if (orphanedSessionIds.length === 0) {
      console.log('[Cleanup] No orphaned sessions found. All sessions are still active in Redis.');
      return NextResponse.json({
        success: true,
        message: 'No expired sessions to clean up',
        results: cleanupResults,
      });
    }

    console.log(`[Cleanup] Found ${orphanedSessionIds.length} orphaned sessions to clean`);

    // Step 4: Get session metadata for cleanup (stored separately)
    const authToken = await getBugSpotterAuthToken();

    for (const sessionId of orphanedSessionIds) {
      try {
        // Get metadata for this session
        const metadataKey = `bugspotter-metadata:${sessionId}`;
        const metadata = await redis.get<{
          userId: string;
          email: string;
          projectIds: string[];
          apiKeyIds: string[];
          jiraProjectKey?: string;
          jiraProjectId?: string;
        }>(metadataKey);

        if (!metadata) {
          console.log(
            `[Cleanup] No metadata found for session ${sessionId}, removing from tracking`
          );
          await redis.srem(trackedSessionsKey, sessionId);
          continue;
        }

        console.log(`[Cleanup] Cleaning session: ${sessionId}`);
        console.log(`[Cleanup]   Email: ${metadata.email}`);
        console.log(`[Cleanup]   User ID: ${metadata.userId}`);
        console.log(`[Cleanup]   Projects: ${metadata.projectIds.length}`);
        console.log(`[Cleanup]   API Keys: ${metadata.apiKeyIds?.length || 0}`);

        // Delete all projects
        for (const projectId of metadata.projectIds) {
          try {
            console.log(`[Cleanup]   Deleting project: ${projectId}`);
            await deleteProject(projectId, authToken);
          } catch (error) {
            console.error(`[Cleanup]   Failed to delete project ${projectId}:`, error);
            cleanupResults.errors.push({
              sessionId,
              error: `Failed to delete project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        // Delete all API keys
        if (metadata.apiKeyIds) {
          for (const apiKeyId of metadata.apiKeyIds) {
            try {
              console.log(`[Cleanup]   Deleting API key: ${apiKeyId}`);
              await deleteApiKey(apiKeyId, authToken);
            } catch (error) {
              console.error(`[Cleanup]   Failed to delete API key ${apiKeyId}:`, error);
              cleanupResults.errors.push({
                sessionId,
                error: `Failed to delete API key ${apiKeyId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              });
            }
          }
        }

        // Delete user
        try {
          console.log(`[Cleanup]   Deleting user: ${metadata.email} (${metadata.userId})`);
          await deleteUser(metadata.userId, authToken);
        } catch (error) {
          console.error(`[Cleanup]   Failed to delete user ${metadata.userId}:`, error);
          cleanupResults.errors.push({
            sessionId,
            error: `Failed to delete user ${metadata.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }

        // Delete JIRA project if it exists
        const jiraRef = metadata.jiraProjectKey || metadata.jiraProjectId;
        if (jiraRef) {
          try {
            console.log(`[Cleanup]   Deleting JIRA project: ${jiraRef}`);
            await deleteJiraProject(jiraRef);
          } catch (error) {
            console.error(`[Cleanup]   Failed to delete JIRA project ${jiraRef}:`, error);
            cleanupResults.errors.push({
              sessionId,
              error: `Failed to delete JIRA project ${jiraRef}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        // Remove from tracking
        await redis.srem(trackedSessionsKey, sessionId);
        await redis.del(metadataKey);

        cleanupResults.cleaned++;
        console.log(`[Cleanup] ✅ Cleaned session: ${sessionId}`);
      } catch (error) {
        console.error(`[Cleanup] ❌ Failed to clean session ${sessionId}:`, error);
        cleanupResults.errors.push({
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('[Cleanup] Cleanup complete');
    console.log(`[Cleanup] Redis sessions: ${cleanupResults.redisSessionCount}`);
    console.log(`[Cleanup] Tracked sessions: ${cleanupResults.bugspotterSessionsTracked}`);
    console.log(`[Cleanup] Orphaned: ${cleanupResults.orphanedSessions}`);
    console.log(`[Cleanup] Cleaned: ${cleanupResults.cleaned}`);
    console.log(`[Cleanup] Errors: ${cleanupResults.errors.length}`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanupResults.cleaned} expired sessions`,
      results: cleanupResults,
    });
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
