# Demo Session Cleanup System

## Overview

The cleanup system automatically removes expired demo sessions from BugSpotter when their Redis TTL expires. This prevents resource accumulation and ensures a clean demo environment.

## How It Works

### Architecture

The system uses **Redis as the source of truth** for session expiration:

1. **Session Creation** (`POST /api/demo/create-session`):
   - Creates session in Redis with 2h 1min TTL
   - Creates BugSpotter projects, API keys, and user
   - Tracks session ID in `bugspotter-tracked-sessions` set
   - Stores cleanup metadata with 24h grace period

2. **Automatic Expiration**:
   - Redis automatically removes session data after TTL expires
   - Metadata persists for 24 hours as backup

3. **Cleanup Detection**:
   - Compares Redis sessions vs tracked sessions
   - Sessions missing from Redis = expired
   - Cleans up BugSpotter resources for orphaned sessions

### Data Storage

#### Redis Keys

| Key Pattern                       | TTL      | Purpose                                      |
| --------------------------------- | -------- | -------------------------------------------- |
| `demo-session:{sessionId}`        | 2h 1min  | Active session data                          |
| `bugspotter-tracked-sessions`     | None     | Set of all created sessions                  |
| `bugspotter-metadata:{sessionId}` | 2h 25min | Cleanup metadata (userId, projectIds, email) |

#### Session Data Structure

```typescript
interface DemoSessionData {
  subdomain: string;
  company: string;
  email: string;
  userId: string; // BugSpotter user ID
  userPassword: string;
  projects: Array<{
    id: string; // BugSpotter project ID
    name: string;
    apiKey: string;
  }>;
  createdAt: number;
  expiresAt: number;
}
```

#### Cleanup Metadata

```typescript
interface CleanupMetadata {
  userId: string; // BugSpotter user to delete
  email: string;
  projectIds: string[]; // BugSpotter projects to delete
}
```

## Cleanup Endpoint

### Endpoint

```
POST /api/admin/cleanup-expired
```

### Authentication (Optional)

Set `ADMIN_CLEANUP_SECRET` environment variable to require authentication:

```bash
curl -X POST https://your-domain.com/api/admin/cleanup-expired \
  -H "Authorization: Bearer YOUR_SECRET"
```

Without secret, endpoint is public (for development only).

### Response

```json
{
  "success": true,
  "message": "Cleaned up 3 expired sessions",
  "results": {
    "redisSessionCount": 5, // Active sessions in Redis
    "bugspotterSessionsTracked": 8, // Total tracked sessions
    "orphanedSessions": 3, // Expired sessions found
    "cleaned": 3, // Successfully cleaned
    "errors": [] // Any errors encountered
  }
}
```

### What Gets Deleted

For each expired session:

- ✅ All BugSpotter projects (via `DELETE /api/v1/projects/{id}`)
- ✅ BugSpotter user account (via `DELETE /api/v1/admin/users/{id}`)
- ✅ Associated bug reports (cascade delete with projects)
- ✅ Tracking metadata from Redis
- ⚠️ API keys expire automatically (no deletion needed)

### Error Handling

- Continues cleanup even if individual deletions fail
- Returns list of errors in response
- Failed sessions remain in tracking for retry
- Idempotent - safe to run multiple times

## Deployment Options

### 1. Manual Execution (Development)

```bash
# Local development
curl -X POST http://localhost:3001/api/admin/cleanup-expired

# Production
curl -X POST https://your-domain.com/api/admin/cleanup-expired \
  -H "Authorization: Bearer ${ADMIN_CLEANUP_SECRET}"
```

### 2. Vercel Cron Jobs (Recommended)

**Requirements:** Vercel Pro plan ($20/month)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/cleanup-expired",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Add to environment variables:

```
ADMIN_CLEANUP_SECRET=your-random-secret-here
```

Update cleanup endpoint to check Vercel cron secret:

```typescript
const cronSecret = request.headers.get('x-vercel-cron-secret');
if (cronSecret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3. GitHub Actions (Free)

Create `.github/workflows/cleanup.yml`:

```yaml
name: Cleanup Expired Sessions

on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cleanup endpoint
        run: |
          curl -X POST ${{ secrets.CLEANUP_URL }} \
            -H "Authorization: Bearer ${{ secrets.ADMIN_CLEANUP_SECRET }}" \
            -f  # Fail on HTTP error
```

**Setup:**

1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - `CLEANUP_URL`: `https://your-domain.com/api/admin/cleanup-expired`
   - `ADMIN_CLEANUP_SECRET`: Your secret token

### 4. External Cron Services

#### cron-job.org (Free)

1. Sign up at https://cron-job.org
2. Create new job:
   - URL: `https://your-domain.com/api/admin/cleanup-expired`
   - Schedule: Every 6 hours
   - Custom Headers: `Authorization: Bearer YOUR_SECRET`

#### EasyCron (Free tier)

1. Sign up at https://www.easycron.com
2. Create cron job with URL and headers
3. Set schedule: `0 */6 * * *`

#### Pipedream (Free tier)

1. Create scheduled workflow
2. Add HTTP request step
3. Configure endpoint and headers

## Best Practices

### Cleanup Frequency

**Recommended:** Every 6 hours

- Sessions expire after 2h 1min
- 6-hour interval ensures 3-4x cleanup attempts per session
- Balances cleanup speed vs API load

**Too frequent** (< 1 hour):

- Unnecessary API calls
- Higher rate limit usage

**Too infrequent** (> 12 hours):

- Resource accumulation
- Higher cleanup batch sizes

### Monitoring

Track cleanup metrics:

```bash
# Check cleanup results
curl -X POST https://your-domain.com/api/admin/cleanup-expired | jq

# Monitor specific metrics
{
  "orphanedSessions": 0,  # Should trend toward 0
  "errors": []            # Should be empty
}
```

Set up alerts if:

- `errors.length > 0` (deletions failing)
- `orphanedSessions > 50` (cleanup not running)

### Security

1. **Always set `ADMIN_CLEANUP_SECRET`** in production
2. Use strong random token: `openssl rand -hex 32`
3. Store in environment variables, not code
4. Rotate secret periodically
5. Use HTTPS only for cleanup endpoint

### Error Recovery

If cleanup fails:

- Metadata persists for 24h (grace period)
- Next cleanup run will retry
- Manual intervention: Check BugSpotter admin panel
- Delete orphaned resources manually if needed

### Testing

```bash
# 1. Create test session
curl -X POST http://localhost:3001/api/demo/create-session \
  -H "Content-Type: application/json" \
  -d '{"company":"Test","email":"test@example.com"}'

# 2. Wait for expiration (or delete from Redis manually)
redis-cli DEL demo-session:test-abcd

# 3. Run cleanup
curl -X POST http://localhost:3001/api/admin/cleanup-expired

# 4. Verify deletion in BugSpotter admin panel
```

## Troubleshooting

### Session not cleaning up

**Check:**

1. Is session expired in Redis? `redis-cli GET demo-session:SESSION_ID`
2. Is session tracked? `redis-cli SMEMBERS bugspotter-tracked-sessions`
3. Does metadata exist? `redis-cli GET bugspotter-metadata:SESSION_ID`
4. Check cleanup logs for errors

**Fix:**

- Run cleanup manually to see error details
- Verify BugSpotter admin credentials in env vars
- Check BugSpotter API authentication

### Cleanup fails with 401 Unauthorized

**Issue:** BugSpotter admin credentials invalid

**Fix:**

1. Verify `BUGSPOTTER_ADMIN_EMAIL` and `BUGSPOTTER_ADMIN_PASSWORD`
2. Test login: `curl -X POST https://demo.api.bugspotter.io/api/v1/auth/login -d '{"email":"...","password":"..."}'`
3. Update environment variables

### Cleanup fails with 404 Not Found

**Issue:** Project or user already deleted

**Fix:**

- This is expected for manual deletions
- Error is logged but cleanup continues
- Session removed from tracking

### High error rate

**Check:**

1. BugSpotter API availability
2. Rate limits (Admin endpoints have high limits)
3. Network connectivity
4. Admin token expiration

**Fix:**

- Add retry logic with exponential backoff
- Implement batch size limits
- Add delay between deletions

## Advanced Configuration

### Custom Session Duration

Update in `app/api/demo/create-session/route.ts`:

```typescript
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours
const SESSION_DURATION_SECONDS = 4 * 60 * 60; // 4 hours
```

**Note:** Also update metadata grace period:

```typescript
SESSION_DURATION_SECONDS + 24 * 60 * 60; // +24h grace
```

### Batch Processing

For high-volume cleanups, add rate limiting:

```typescript
for (const sessionId of orphanedSessionIds) {
  await cleanupSession(sessionId);
  await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
}
```

### Dry Run Mode

Test cleanup without deleting:

```typescript
// Add query parameter support
const url = new URL(request.url);
const dryRun = url.searchParams.get('dry_run') === 'true';

if (!dryRun) {
  await deleteProject(projectId, authToken);
}
```

Usage:

```bash
curl -X POST "http://localhost:3001/api/admin/cleanup-expired?dry_run=true"
```

## Environment Variables

| Variable                    | Required    | Purpose                     |
| --------------------------- | ----------- | --------------------------- |
| `UPSTASH_REDIS_REST_URL`    | Yes         | Redis connection URL        |
| `UPSTASH_REDIS_REST_TOKEN`  | Yes         | Redis authentication token  |
| `BUGSPOTTER_API_URL`        | Yes         | BugSpotter API endpoint     |
| `BUGSPOTTER_ADMIN_EMAIL`    | Yes         | Admin account for deletions |
| `BUGSPOTTER_ADMIN_PASSWORD` | Yes         | Admin password              |
| `ADMIN_CLEANUP_SECRET`      | Recommended | Cleanup endpoint auth token |
| `CRON_SECRET`               | Optional    | Vercel cron authentication  |

## Performance

### Cleanup Speed

- **Average:** ~500ms per session
- **Factors:**
  - Network latency to BugSpotter API
  - Number of projects per session (typically 3)
  - Database deletion speed

### Resource Usage

- **Memory:** Minimal (<10MB)
- **CPU:** Low (I/O bound)
- **Network:** ~10KB per session (API calls)

### Scaling

- **Sessions/hour:** Unlimited (cleanup is async)
- **Batch size:** No hard limit
- **Concurrent cleanup:** Single job at a time (cron)

## Migration Guide

### From Manual Cleanup

If you were tracking sessions differently:

1. **One-time migration:**

```typescript
// Get all existing sessions
const sessions = await redis.keys('demo-session:*');

// Add to tracking
for (const key of sessions) {
  const sessionId = key.replace('demo-session:', '');
  await redis.sadd('bugspotter-tracked-sessions', sessionId);

  // Extract and store metadata
  const data = await redis.get(key);
  const metadata = {
    userId: data.userId,
    email: data.email,
    projectIds: data.projects.map((p) => p.id),
  };
  await redis.setex(`bugspotter-metadata:${sessionId}`, 24 * 60 * 60, JSON.stringify(metadata));
}
```

2. **Deploy new cleanup endpoint**
3. **Test with dry run**
4. **Enable scheduled cleanup**

## Support

For issues or questions:

- Check logs: `vercel logs` or application logs
- Review BugSpotter admin panel
- Verify Redis data: `redis-cli` commands
- Test cleanup manually with detailed logging

## License

Same as parent project.
