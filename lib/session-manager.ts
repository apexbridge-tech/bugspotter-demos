import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured');
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export interface DemoSession {
  subdomain: string;
  company: string;
  createdAt: number;
  expiresAt: number;
  events: number;
  bugs: number;
}

export interface BugEvent {
  id: string;
  subdomain: string;
  timestamp: number;
  errorMessage: string;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  elementId?: string;
  demo: 'kazbank' | 'talentflow' | 'quickmart';
  userAgent?: string;
  screenshot?: string;
}

const SESSION_TTL = parseInt(process.env.SESSION_TTL || '7200', 10); // Default: 2 hours in seconds

/**
 * Creates a new demo session with a unique subdomain
 */
export async function createSession(company: string): Promise<DemoSession> {
  // Generate a unique subdomain from company name
  const baseSubdomain = slugify(company, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const subdomain = `${baseSubdomain}-${randomSuffix}`;

  const now = Date.now();
  const session: DemoSession = {
    subdomain,
    company,
    createdAt: now,
    expiresAt: now + SESSION_TTL * 1000,
    events: 0,
    bugs: 0,
  };

  // Store session in Redis with TTL
  const redis = getRedis();
  await redis.setex(`session:${subdomain}`, SESSION_TTL, JSON.stringify(session));

  return session;
}

/**
 * Retrieves a session by subdomain
 */
export async function getSession(subdomain: string): Promise<DemoSession | null> {
  const redis = getRedis();
  const data = await redis.get(`session:${subdomain}`);

  if (!data) {
    return null;
  }

  return typeof data === 'string' ? JSON.parse(data) : (data as DemoSession);
}

/**
 * Validates that a subdomain exists and is active
 */
export async function validateSubdomain(subdomain: string): Promise<boolean> {
  const session = await getSession(subdomain);

  if (!session) {
    return false;
  }

  // Check if session is expired
  if (session.expiresAt < Date.now()) {
    await deleteSession(subdomain);
    return false;
  }

  return true;
}

/**
 * Tracks an event for a session
 */
export async function trackEvent(subdomain: string): Promise<void> {
  const session = await getSession(subdomain);

  if (!session) {
    return;
  }

  session.events += 1;

  // Update session with new event count
  const redis = getRedis();
  await redis.setex(`session:${subdomain}`, SESSION_TTL, JSON.stringify(session));
}

/**
 * Stores a bug event
 */
export async function storeBug(bug: Omit<BugEvent, 'id' | 'timestamp'>): Promise<BugEvent> {
  const bugEvent: BugEvent = {
    ...bug,
    id: uuidv4(),
    timestamp: Date.now(),
  };

  // Store bug in a list for this subdomain
  const redis = getRedis();
  await redis.lpush(`bugs:${bug.subdomain}`, JSON.stringify(bugEvent));

  // Update bug count in session
  const session = await getSession(bug.subdomain);
  if (session) {
    session.bugs += 1;
    await redis.setex(`session:${bug.subdomain}`, SESSION_TTL, JSON.stringify(session));
  }

  // Set expiration on the bugs list
  await redis.expire(`bugs:${bug.subdomain}`, SESSION_TTL);

  return bugEvent;
}

/**
 * Retrieves all bugs for a subdomain
 */
export async function getBugs(subdomain: string): Promise<BugEvent[]> {
  const redis = getRedis();
  const bugs = await redis.lrange(`bugs:${subdomain}`, 0, -1);

  if (!bugs || bugs.length === 0) {
    return [];
  }

  return bugs
    .map((bug) => (typeof bug === 'string' ? JSON.parse(bug) : (bug as BugEvent)))
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
}

/**
 * Deletes a session and all associated data
 */
export async function deleteSession(subdomain: string): Promise<void> {
  const redis = getRedis();
  await Promise.all([redis.del(`session:${subdomain}`), redis.del(`bugs:${subdomain}`)]);
}

/**
 * Extends the TTL of a session (called when user is active)
 */
export async function extendSession(subdomain: string): Promise<void> {
  const session = await getSession(subdomain);

  if (!session) {
    return;
  }

  session.expiresAt = Date.now() + SESSION_TTL * 1000;

  const redis = getRedis();
  await Promise.all([
    redis.setex(`session:${subdomain}`, SESSION_TTL, JSON.stringify(session)),
    redis.expire(`bugs:${subdomain}`, SESSION_TTL),
  ]);
}
