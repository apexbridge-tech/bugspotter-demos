import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session-manager';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';

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

// Session duration: 2 hours + 1 minute
const SESSION_DURATION_MS = (2 * 60 * 60 + 60) * 1000; // 2 hours 1 minute in milliseconds
const SESSION_DURATION_SECONDS = 2 * 60 * 60 + 60; // 2 hours 1 minute in seconds

interface BugSpotterProject {
  id: string;
  name: string;
  apiKey: string;
  apiKeyId: string;
}

/**
 * Authenticate with BugSpotter API and get JWT token
 */
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

interface DemoSessionData {
  subdomain: string;
  company: string;
  email: string;
  userId: string;
  userPassword: string;
  magicLink?: string;
  projects: BugSpotterProject[];
  createdAt: number;
  expiresAt: number;
}

async function createBugSpotterProjects(
  company: string,
  sessionId: string,
  authToken: string
): Promise<BugSpotterProject[]> {
  const demoSites = [
    { name: 'KazBank', slug: 'kazbank' },
    { name: 'TalentFlow', slug: 'talentflow' },
    { name: 'QuickMart', slug: 'quickmart' },
  ];

  const projects: BugSpotterProject[] = [];

  for (const site of demoSites) {
    // Create project
    const projectResponse = await fetch(`${BUGSPOTTER_API}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: `${company} - ${site.name} (Demo ${sessionId})`,
        settings: {
          tier: 'free',
          retention: {
            bugReportRetentionDays: 7,
          },
        },
      }),
    });

    if (!projectResponse.ok) {
      const error = await projectResponse.text();
      throw new Error(`Failed to create project ${site.name}: ${error}`);
    }

    const projectData = await projectResponse.json();
    const projectId = projectData.data.id;

    // Create API key for the project
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const apiKeyRequestBody = {
      name: `${company} ${site.name} Demo Key`,
      type: 'production' as const,
      permission_scope: 'custom' as const,
      permissions: ['create_reports', 'upload_files'] as const,
      allowed_projects: [projectId],
      allowed_origins: [baseUrl],
      rate_limit_per_minute: 100,
      rate_limit_per_hour: 5000,
      rate_limit_per_day: 50000,
      expires_at: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    };

    console.log(`[BugSpotter] Creating API key for ${site.name} (project: ${projectId})`);
    console.log('[BugSpotter] API Key Request URL:', `${BUGSPOTTER_API}/api/v1/api-keys`);
    console.log('[BugSpotter] API Key Request Body:', JSON.stringify(apiKeyRequestBody, null, 2));

    const apiKeyResponse = await fetch(`${BUGSPOTTER_API}/api/v1/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(apiKeyRequestBody),
    });

    console.log(
      '[BugSpotter] API Key Response Status:',
      apiKeyResponse.status,
      apiKeyResponse.statusText
    );

    if (!apiKeyResponse.ok) {
      const error = await apiKeyResponse.text();
      console.error('[BugSpotter] API Key Error Response:', error);
      throw new Error(`Failed to create API key for ${site.name}: ${error}`);
    }

    const apiKeyData = await apiKeyResponse.json();

    projects.push({
      id: projectId,
      name: `${company} - ${site.name}`,
      apiKey: apiKeyData.data.api_key,
      apiKeyId: apiKeyData.data.key_details.id,
    });
  }

  return projects;
}

async function createBugSpotterUser(
  email: string,
  company: string,
  adminAuthToken: string
): Promise<{ userId: string; password: string; userAuthToken: string }> {
  // Generate secure random password
  const password = `Demo${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2).toUpperCase()}!`;

  // Create user via admin endpoint
  const userResponse = await fetch(`${BUGSPOTTER_API}/api/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAuthToken}`,
    },
    body: JSON.stringify({
      email,
      name: company,
      password,
      role: 'user',
    }),
  });

  if (!userResponse.ok) {
    const error = await userResponse.text();
    throw new Error(`Failed to create user: ${error}`);
  }

  const userData = await userResponse.json();
  console.log('[BugSpotter] User creation response:', JSON.stringify(userData, null, 2));
  const userId = userData.data.id;

  // Login as the new user to get their auth token
  console.log('[BugSpotter] Logging in as new user to get their token...');
  const loginResponse = await fetch(`${BUGSPOTTER_API}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!loginResponse.ok) {
    const error = await loginResponse.text();
    throw new Error(`Failed to login as new user: ${error}`);
  }

  const loginData = await loginResponse.json();
  const userAuthToken = loginData.data.access_token;
  console.log('[BugSpotter] ✅ User token acquired');

  return { userId, password, userAuthToken };
}

async function sendDemoCredentialsEmail(
  email: string,
  company: string,
  sessionData: DemoSessionData
): Promise<void> {
  console.log('[Email] Starting sendDemoCredentialsEmail');
  console.log('[Email] Recipient:', email);
  console.log('[Email] Company:', company);
  console.log('[Email] Has projects:', sessionData.projects.length);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const dashboardUrl = `${baseUrl}/${sessionData.subdomain}/dashboard`;
  const bugspotterAdminUrl = 'https://demo.admin.bugspotter.io';

  // Always log credentials to console for debugging
  console.log('=== DEMO CREDENTIALS ===');
  console.log(`Company: ${company}`);
  console.log(`Email: ${email}`);
  console.log(`Session ID: ${sessionData.subdomain}`);
  console.log(`User Password: ${sessionData.userPassword}`);
  console.log('\nProjects & API Keys:');
  sessionData.projects.forEach((project) => {
    console.log(`  ${project.name}:`);
    console.log(`    Project ID: ${project.id}`);
    console.log(`    API Key: ${project.apiKey}`);
  });
  console.log(`\nBugSpotter Admin: ${bugspotterAdminUrl}`);
  console.log(`Demo Dashboard: ${dashboardUrl}`);
  console.log('========================\n');

  // Check Resend configuration
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@bugspotter.io';

  console.log('[Email] Resend API key configured:', !!resendApiKey);
  console.log('[Email] Resend API key length:', resendApiKey?.length || 0);
  console.log('[Email] From email:', fromEmail);

  if (!resendApiKey || resendApiKey === 'your_resend_api_key_here') {
    console.log('[Email] ❌ Resend API key not configured, skipping email send');
    return;
  }

  console.log('[Email] ✅ Resend configuration valid, proceeding with email send');

  try {
    console.log('[Email] Initializing Resend client...');
    const resend = new Resend(resendApiKey);
    console.log('[Email] Resend client initialized');

    const projectsList = sessionData.projects
      .map(
        (p) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">${p.id}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">${p.apiKey}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BugSpotter Demo Credentials</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🎉 Your BugSpotter Demo is Ready!</h1>
      <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">Welcome to ${company}</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
        Your BugSpotter demo environment has been created successfully. Below you'll find all the credentials and links you need to get started.
      </p>

      ${
        sessionData.magicLink
          ? `
      <!-- Magic Link Access (Primary) -->
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">🔐 BugSpotter Admin Access</h2>
        <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">Click the button below to securely login to BugSpotter Admin (no password required):</p>
        <a href="${sessionData.magicLink}" style="display: inline-block; margin-top: 10px; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">🔓 Login to BugSpotter Admin →</a>
        <p style="margin: 15px 0 0; color: #9ca3af; font-size: 12px;">This magic link is valid for 1 hour and can only be used once.</p>
        ${sessionData.userPassword ? `
        <details style="margin-top: 15px;">
          <summary style="cursor: pointer; color: #6b7280; font-size: 13px;">Alternative: Manual Login Credentials</summary>
          <div style="margin-top: 10px; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
            <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0; color: #6b7280; font-size: 13px;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 12px;">${sessionData.userPassword}</code></p>
          </div>
        </details>
        ` : ''}
      </div>
      `
          : sessionData.userPassword
            ? `
      <!-- BugSpotter Admin Access (Fallback) -->
      <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">🔐 BugSpotter Admin Access</h2>
        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${sessionData.userPassword}</code></p>
        <a href="${bugspotterAdminUrl}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 500;">Login to BugSpotter Admin →</a>
      </div>
      `
            : ''
      }

      <!-- Demo Dashboard -->
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">🎯 Demo Dashboard</h2>
        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Access your demo applications from the dashboard:</p>
        <a href="${dashboardUrl}" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 500;">Open Demo Dashboard →</a>
      </div>

      ${
        sessionData.projects.length > 0
          ? `
      <!-- Projects & API Keys -->
      <div style="margin: 30px 0;">
        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">📋 Your Projects & API Keys</h2>
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Project</th>
              <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Project ID</th>
              <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">API Key</th>
            </tr>
          </thead>
          <tbody>
            ${projectsList}
          </tbody>
        </table>
      </div>
      `
          : `
      <!-- Local Mode Notice -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h2 style="margin: 0 0 10px; color: #92400e; font-size: 16px; font-weight: 600;">⚠️ Running in Local Mode</h2>
        <p style="margin: 0; color: #78350f; font-size: 14px;">
          BugSpotter integration is currently unavailable. You can still explore the demo applications with simulated bugs.
        </p>
      </div>
      `
      }

      <!-- Session Info -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h2 style="margin: 0 0 10px; color: #92400e; font-size: 16px; font-weight: 600;">⏰ Session Information</h2>
        <p style="margin: 0; color: #78350f; font-size: 14px;">
          <strong>Session ID:</strong> ${sessionData.subdomain}<br>
          <strong>Valid until:</strong> ${new Date(sessionData.expiresAt).toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}<br>
          <em style="font-size: 13px;">This demo session will automatically expire after 2 hours.</em>
        </p>
      </div>

      <!-- Getting Started -->
      <div style="margin: 30px 0;">
        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">🚀 Getting Started</h2>
        <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
          <li>Login to <a href="${bugspotterAdminUrl}" style="color: #667eea; text-decoration: none;">BugSpotter Admin</a> using your credentials above</li>
          <li>Visit the <a href="${dashboardUrl}" style="color: #667eea; text-decoration: none;">Demo Dashboard</a> to explore the demo applications</li>
          <li>Interact with the demo apps to trigger bugs and see them appear in BugSpotter</li>
          <li>Explore the bug reports, session replays, and analytics in the BugSpotter admin panel</li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Need help? Contact us at <a href="mailto:support@bugspotter.io" style="color: #667eea; text-decoration: none;">support@bugspotter.io</a></p>
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 BugSpotter. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

    console.log('[Email] Preparing to send email...');
    console.log('[Email] From:', fromEmail);
    console.log('[Email] To:', email);
    console.log('[Email] Subject: 🎉 Your BugSpotter Demo Credentials -', company);

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `🎉 Your BugSpotter Demo Credentials - ${company}`,
      html: htmlContent,
    });

    console.log('[Email] ✅ Email sent successfully!');
    console.log('[Email] Resend response:', JSON.stringify(result, null, 2));
    console.log(`[Email] Message delivered to ${email}`);
  } catch (error) {
    console.error('[Email] ❌ Failed to send email via Resend');
    console.error(
      '[Email] Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error('[Email] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Email] Full error:', error);
    // Don't throw - we don't want to fail session creation if email fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    const redis = getRedis();
    const sessionData = await redis.get(`session:${subdomain}`);

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('\n========================================');
  console.log('[Session] POST /api/demo/create-session started');
  console.log('========================================');

  try {
    const body = await request.json();
    const { company, email } = body;

    console.log('[Session] Received request body:', { company, email });

    if (!company || typeof company !== 'string') {
      console.log('[Session] ❌ Validation failed: company name required');
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('[Session] ❌ Validation failed: valid email required');
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    console.log('[Session] ✅ Validation passed');

    // Validate company name length
    if (company.length < 2 || company.length > 50) {
      console.log('[Session] ❌ Validation failed: company name length invalid');
      return NextResponse.json(
        { error: 'Company name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    // Create local demo session for tracking
    console.log('[Session] Creating local session...');
    const localSession = await createSession(company);
    const sessionId = localSession.subdomain;
    console.log('[Session] ✅ Local session created:', sessionId);

    try {
      console.log('[Session] Starting BugSpotter integration...');
      // Authenticate with BugSpotter API (admin)
      console.log('[Session] Authenticating with BugSpotter API...');
      const adminAuthToken = await getBugSpotterAuthToken();
      console.log('[Session] ✅ BugSpotter admin authentication successful');

      // Create user first (so they can own the projects)
      console.log('[Session] Creating BugSpotter user...');
      const { userId, password, userAuthToken } = await createBugSpotterUser(
        email,
        company,
        adminAuthToken
      );
      console.log('[Session] ✅ User created:', userId);

      // Generate magic link for the created user
      console.log('[Session] Generating magic link...');
      const magicLinkResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userEmail: email,
          role: 'user',
        }),
      });

      let magicLink = '';
      if (magicLinkResponse.ok) {
        const magicLinkData = await magicLinkResponse.json();
        const magicToken = magicLinkData.token;
        // Point to BugSpotter admin, not our demo admin
        magicLink = `https://demo.admin.bugspotter.io/auth/magic-login?token=${magicToken}`;
        console.log('[Session] ✅ Magic link generated:', magicLink);
      } else {
        console.warn('[Session] ⚠️ Failed to generate magic link, will send credentials instead');
      }

      // Create 3 projects with user's token (making them the owner)
      console.log('[Session] Creating BugSpotter projects as user...');
      const projects = await createBugSpotterProjects(company, sessionId, userAuthToken);
      console.log(
        '[Session] ✅ Created',
        projects.length,
        'projects:',
        projects.map((p) => p.name).join(', ')
      );

      // Store complete session data
      const sessionData: DemoSessionData = {
        subdomain: sessionId,
        company,
        email,
        userId,
        userPassword: password,
        magicLink: magicLink || undefined,
        projects,
        createdAt: localSession.createdAt,
        expiresAt: localSession.expiresAt,
      };

      console.log('[Session] Storing session data in Redis...');
      const redis = getRedis();
      await redis.setex(
        `demo-session:${sessionId}`,
        SESSION_DURATION_SECONDS,
        JSON.stringify(sessionData)
      );

      // Track this session for cleanup (no TTL - we manage this manually)
      await redis.sadd('bugspotter-tracked-sessions', sessionId);

      // Store metadata separately for cleanup (with 3 hour grace period)
      const metadata = {
        userId,
        email,
        projectIds: projects.map((p) => p.id),
        apiKeyIds: projects.map((p) => p.apiKeyId),
      };
      await redis.setex(
        `bugspotter-metadata:${sessionId}`,
        SESSION_DURATION_SECONDS + 3 * 60 * 60, // +3 hours grace period
        JSON.stringify(metadata)
      );

      console.log('[Session] ✅ Session data stored in Redis with cleanup tracking');

      // Send credentials via email
      console.log('[Session] Sending credentials email...');
      await sendDemoCredentialsEmail(email, company, sessionData);
      console.log('[Session] ✅ Email sending completed');

      console.log('[Session] ✅ Session creation SUCCESS');
      console.log('========================================\n');
      return NextResponse.json({
        success: true,
        session: {
          subdomain: sessionId,
          company,
          email,
          magicLink: magicLink || undefined,
          expiresAt: localSession.expiresAt,
          projects: projects.map((p) => ({
            name: p.name,
            id: p.id,
          })),
        },
        message: 'Demo session created. Credentials sent to your email.',
      });
    } catch (bugspotterError) {
      // If BugSpotter integration fails, DO NOT send email
      console.error('[Session] ❌ BugSpotter integration failed');
      console.error('[Session] Error:', bugspotterError);
      console.log('[Session] NOT sending email due to BugSpotter failure');

      console.log('[Session] ⚠️  Session creation FAILED');
      console.log('========================================\n');
      return NextResponse.json(
        {
          success: false,
          error: 'BugSpotter integration failed',
          details: bugspotterError instanceof Error ? bugspotterError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Session] ❌ FATAL ERROR creating demo session');
    console.error(
      '[Session] Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      '[Session] Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error('[Session] Stack:', error instanceof Error ? error.stack : 'N/A');
    console.log('========================================\n');
    return NextResponse.json(
      {
        error: 'Failed to create demo session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
