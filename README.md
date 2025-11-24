# BugSpotter Demo System

A Next.js 15 application showcasing interactive demo environments with **real BugSpotter SDK integration** for demonstrating enterprise bug tracking and error monitoring capabilities.

## Overview

This demo system creates isolated, time-limited environments where potential customers can experience BugSpotter's bug tracking platform firsthand. Each demo session:

- ✅ Creates real BugSpotter projects, API keys, and user accounts
- ✅ Integrates the actual `@bugspotter/sdk` package
- ✅ Captures and reports bugs to a live BugSpotter instance
- ✅ Provides full access to BugSpotter's admin panel
- ✅ Automatically cleans up after session expiration (2h 1min)
- ✅ Sends credentials via email for easy access

## Features

### Demo System

- **Wildcard Subdomain Routing**: Each demo session gets a unique subdomain
- **3 Interactive Demo Sites**:
  - **KazBank** (Banking) - Transfer timeouts, PDF corruption, currency calculation errors
  - **TalentFlow** (HR) - Search crashes, upload freezes, timezone errors, email duplicates
  - **QuickMart** (E-commerce) - Cart bugs, checkout freeze, promo code failures
- **Real-Time Bug Capture**: 30% probability bug injection with realistic error messages
- **Session Management**: 2h 1min isolated sessions with Upstash Redis
- **Email Delivery**: Automated credential delivery via Resend

### BugSpotter Integration

- **Real SDK**: Uses `@bugspotter/sdk@0.2.2-alpha.5` (not simulated)
- **Live Projects**: Creates 3 actual BugSpotter projects per session
- **Production API Keys**: Generates real API keys with custom permissions
- **User Accounts**: Creates authenticated users with admin panel access
- **Auto-Cleanup**: Removes expired sessions via Redis-synced cleanup system

### Admin Panel

- **Secure Authentication**: Email/password with bcrypt hashing
- **Two-Factor Auth**: TOTP 2FA with QR code setup
- **Session Management**: View and manage all demo sessions
- **Bug Monitoring**: Track all bugs across sessions
- **8-hour Admin Sessions**: Long-lived admin access

## Tech Stack

- **Framework**: Next.js 15.0.0 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Bug Tracking**: @bugspotter/sdk 0.2.2-alpha.5
- **Database**: Upstash Redis (session storage)
- **Email**: Resend 6.4.1 (credential delivery)
- **Authentication**: Custom OAuth with bcryptjs + speakeasy (TOTP 2FA)
- **Deployment**: Vercel (recommended)

## Project Structure

```
├── app/
│   ├── [subdomain]/               # Dynamic subdomain routing
│   │   ├── layout.tsx             # Session validation wrapper
│   │   ├── page.tsx               # Session redirect handler
│   │   ├── kazbank/page.tsx       # Banking demo with SDK
│   │   ├── talentflow/page.tsx    # HR demo with SDK
│   │   ├── quickmart/page.tsx     # E-commerce demo with SDK
│   │   └── dashboard/page.tsx     # Bug visualization
│   ├── admin/
│   │   └── page.tsx               # Admin panel (sessions, bugs, 2FA)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── bugs/route.ts      # Admin bug management
│   │   │   ├── sessions/route.ts  # Admin session management
│   │   │   └── cleanup-expired/route.ts  # Cleanup endpoint
│   │   ├── auth/
│   │   │   ├── login/route.ts     # Admin authentication
│   │   │   └── 2fa/route.ts       # 2FA setup & verification
│   │   ├── demo/
│   │   │   └── create-session/route.ts  # Full session creation + BugSpotter
│   │   └── bugs/route.ts          # Bug reporting & retrieval
│   └── page.tsx                   # Main landing page
├── lib/
│   ├── session-manager.ts         # Redis session handling
│   └── bug-injector.ts            # Client-side bug injection
├── middleware.ts                  # Subdomain extraction & routing
├── BUGS.md                        # Bug reference guide
├── CLEANUP.md                     # Cleanup system documentation
└── README.md                      # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- Upstash Redis account ([create free account](https://console.upstash.com/))
- Resend account ([create free account](https://resend.com/))
- BugSpotter API access (admin credentials)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd bugspotter-demos
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy the example file
cp .env.example .env.local
```

4. Configure `.env.local`:

```env
# Required - Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Required - BugSpotter API
BUGSPOTTER_API_URL=https://demo.api.bugspotter.io
BUGSPOTTER_ADMIN_EMAIL=admin@bugspotter.io
BUGSPOTTER_ADMIN_PASSWORD=your_admin_password

# Required - Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here

# Required - Base URL (for API keys and emails)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional - Admin Panel
ADMIN_SECRET=your_random_secret_for_admin_creation

# Optional - Cleanup Endpoint Security
ADMIN_CLEANUP_SECRET=your_cleanup_secret
```

5. Create an admin user (for admin panel access):

```bash
node scripts/create-admin.js admin@example.com YourSecurePassword123!
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Demo Session

1. Visit the landing page (`http://localhost:3000` or your production domain)
2. Enter company name and email address
3. Click "Start Your Demo Session"
4. **Wait for email** with credentials (usually arrives in 10-30 seconds)

### What Happens During Creation

The system performs the following automatically:

1. **Generates Session ID**: Creates unique subdomain (e.g., `acme-x7k2`)
2. **Authenticates with BugSpotter**: Gets admin JWT token
3. **Creates 3 Projects**: One for each demo site (KazBank, TalentFlow, QuickMart)
4. **Generates API Keys**: Production keys with custom permissions and rate limits
5. **Creates User Account**: BugSpotter user with auto-generated password
6. **Stores in Redis**: Session data with 2h 1min TTL
7. **Sends Email**: Complete credentials via Resend

### Email Contents

You'll receive an email with:

- **Session URL**: Direct link to your demo dashboard
- **Session Duration**: Expiration time (2 hours 1 minute)
- **BugSpotter Admin Credentials**: Email and auto-generated password
- **BugSpotter Admin URL**: Link to full BugSpotter admin panel
- **API Keys Table**: All 3 API keys for SDK integration
- **Getting Started Guide**: How to use the demo

### Local Development

Since subdomains don't work on localhost, the middleware handles routing differently:

1. Create a demo session at `http://localhost:3000`
2. Check your email for credentials
3. Access demo sites:
   - Dashboard: `http://localhost:3000/{subdomain}/dashboard`
   - KazBank: `http://localhost:3000/{subdomain}/kazbank`
   - TalentFlow: `http://localhost:3000/{subdomain}/talentflow`
   - QuickMart: `http://localhost:3000/{subdomain}/quickmart`

### Production (with subdomains)

Deploy to Vercel and configure wildcard DNS:

- Main domain: `demo.bugspotter.io`
- Demo sessions: `{company}.demo.bugspotter.io`

Each demo session gets a real subdomain with SSL certificate.

## How It Works

### 1. Session Creation Flow

```
User submits form
    ↓
Generate session ID (subdomain)
    ↓
Authenticate with BugSpotter API
    ↓
Create 3 BugSpotter projects (KazBank, TalentFlow, QuickMart)
    ↓
Generate 3 API keys (one per project)
    ↓
Create BugSpotter user account
    ↓
Store session in Redis (2h 1min TTL)
    ↓
Track session for cleanup
    ↓
Send email with all credentials
    ↓
Redirect to dashboard
```

### 2. BugSpotter SDK Integration

Each demo site initializes the real BugSpotter SDK:

```typescript
import BugSpotter from '@bugspotter/sdk';

BugSpotter.init({
  apiKey: 'bgs_your_production_key',
  endpoint: 'https://demo.api.bugspotter.io',
  projectId: 'project-uuid',
  environment: 'demo',
  enableConsoleCapture: true,
  enableNetworkCapture: true,
  enableSessionReplay: true,
});
```

### 3. Bug Injection & Capture

When users click interactive elements:

1. **BugInjector** decides if bug should trigger (30% probability)
2. Generates realistic error with stack trace
3. **BugSpotter SDK** automatically captures the error
4. Error sent to BugSpotter API with:
   - Console logs (last 50 entries)
   - Network requests
   - Browser metadata
   - Session replay data
   - Screenshot (if applicable)
5. Bug appears in both:
   - Demo dashboard (via local API)
   - BugSpotter admin panel (real backend)

### 4. Dashboard Real-Time Updates

- Polls `/api/bugs?subdomain=X` every 5 seconds
- Displays bugs from local Redis storage
- Shows severity badges, timestamps, stack traces
- Links to BugSpotter admin panel for full details

### 5. Session Expiration & Cleanup

**Automatic Expiration:**

- Redis TTL expires session after 2h 1min
- API keys also expire at same time
- Session disappears from Redis automatically

**Cleanup System:**

- Runs periodically (via cron or manual trigger)
- Detects sessions missing from Redis (expired)
- Deletes BugSpotter resources:
  - All 3 projects (cascades to bug reports)
  - User account
  - API keys (already expired)
- Removes tracking metadata from Redis

See [CLEANUP.md](./CLEANUP.md) for full cleanup documentation.

## Intentional Bugs

### KazBank (Banking)

- `#transfer-btn` - Transaction timeout after 5 seconds
- `#download-statement` - PDF corruption error
- `#convert-currency` - Calculation error on specific amounts
- `#login-submit` - 2FA validation failure
- `#mobile-menu-toggle` - Layout break on mobile menu

### TalentFlow (HR)

- `#search-candidates` - Crashes on "senior" keyword
- `#upload-resume` - Progress freeze at 99%
- `#schedule-interview` - Timezone conversion error
- `#send-bulk-email` - Duplicate email sending
- `#export-excel` - File corruption

### QuickMart (E-commerce)

- `#add-to-cart-1` - Double-add on rapid clicks
- `#checkout-btn` - Payment processing freeze
- `#search-products` - Crash on special characters
- `#product-image-1` - Lazy load failure
- `#apply-promo` - DEMO50 discount not applied

## API Routes

### Session Management

#### `POST /api/demo/create-session`

Create a new demo session with full BugSpotter integration.

**Request:**

```json
{
  "company": "Acme Corp",
  "email": "demo@acme.com"
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "subdomain": "acme-x7k2",
    "company": "Acme Corp",
    "email": "demo@acme.com",
    "expiresAt": 1699456789000,
    "projects": [
      { "name": "Acme Corp - KazBank", "id": "project-uuid-1" },
      { "name": "Acme Corp - TalentFlow", "id": "project-uuid-2" },
      { "name": "Acme Corp - QuickMart", "id": "project-uuid-3" }
    ]
  },
  "message": "Demo session created. Credentials sent to your email."
}
```

**What it creates:**

- 3 BugSpotter projects with custom retention (7 days)
- 3 API keys with rate limits and expiration
- 1 BugSpotter user account
- Redis session with 2h 1min TTL
- Email with all credentials

### Bug Reporting

#### `POST /api/bugs`

Report a bug (called automatically by BugInjector + BugSpotter SDK).

**Request:**

```json
{
  "errorMessage": "Transfer timed out after 5 seconds",
  "stackTrace": "Error: Transfer timeout\n  at handleTransfer...",
  "severity": "high",
  "demo": "kazbank",
  "elementId": "transfer-btn",
  "subdomain": "acme-x7k2"
}
```

#### `GET /api/bugs?subdomain=X`

Retrieve all bugs for a session.

**Response:**

```json
{
  "success": true,
  "bugs": [
    {
      "id": "bug-uuid",
      "errorMessage": "Transfer timed out after 5 seconds",
      "severity": "high",
      "demo": "kazbank",
      "timestamp": 1699456789000
    }
  ]
}
```

### Admin Endpoints

#### `POST /api/auth/login`

Admin authentication.

#### `GET /api/admin/sessions`

List all demo sessions (admin only).

#### `GET /api/admin/bugs`

List all bugs across sessions (admin only).

#### `POST /api/admin/cleanup-expired`

Clean up expired sessions from BugSpotter.

See [CLEANUP.md](./CLEANUP.md) for details.

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**

2. **Import in Vercel:**
   - Connect GitHub repository
   - Framework: Next.js
   - Root directory: `./`

3. **Configure Environment Variables:**
   Add all required variables from `.env.local`

4. **Configure Custom Domain:**

   **DNS Records (Cloudflare/Namecheap/etc):**

   ```
   Type: CNAME
   Name: demo
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: *
   Value: cname.vercel-dns.com
   ```

   **Vercel Domain Settings:**
   - Add `demo.bugspotter.io`
   - Add `*.demo.bugspotter.io` (wildcard)
   - Wait for SSL certificates to provision (~5 minutes)

5. **Update Environment:**

   ```bash
   NEXT_PUBLIC_BASE_URL=https://demo.bugspotter.io
   ```

6. **Set up Automated Cleanup (Optional):**

   Add to `vercel.json`:

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

   **Note:** Requires Vercel Pro ($20/month)

   **Alternative:** Use GitHub Actions or external cron service (see [CLEANUP.md](./CLEANUP.md))

### Other Platforms

The application works on any Node.js hosting platform that supports:

- Next.js 15
- Environment variables
- Wildcard subdomain routing

**Examples:**

- Netlify (configure DNS and environment)
- Railway (enable wildcard domains)
- Fly.io (configure DNS wildcards)

**Requirements:**

- Subdomain routing via middleware
- Environment variables configured
- Redis connection (Upstash works from anywhere)

## Environment Variables

### Required

```bash
# Upstash Redis - Session storage
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# BugSpotter API - Backend integration
BUGSPOTTER_API_URL=https://demo.api.bugspotter.io
BUGSPOTTER_ADMIN_EMAIL=admin@bugspotter.io
BUGSPOTTER_ADMIN_PASSWORD=your_admin_password

# Resend - Email delivery
RESEND_API_KEY=re_your_api_key_here

# Base URL - For API keys and email links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Optional

```bash
# Admin Panel - Create admin users
ADMIN_SECRET=your_random_secret_here

# Cleanup - Protect cleanup endpoint
ADMIN_CLEANUP_SECRET=your_cleanup_secret

# Vercel Cron - Automated cleanup
CRON_SECRET=vercel_cron_secret
```

### Setup Instructions

**1. Upstash Redis:**

- Create account at https://console.upstash.com/
- Create new database (free tier works)
- Copy REST URL and token

**2. BugSpotter API:**

- Get admin credentials from BugSpotter team
- Use demo API endpoint: `https://demo.api.bugspotter.io`

**3. Resend:**

- Create account at https://resend.com/
- Verify your domain (or use test mode)
- Copy API key from dashboard

**4. Base URL:**

- Development: `http://localhost:3000`
- Production: Your actual domain (e.g., `https://demo.bugspotter.io`)

## Admin Panel

### Features

- **Sessions Tab**: View and manage all active demo sessions
  - Company name, subdomain, email
  - Bug counts per session
  - Creation and expiration timestamps
  - Delete sessions manually
  - Click subdomain to view session dashboard

- **Bugs Tab**: Monitor all captured bugs across all sessions
  - Filter by severity (critical, high, medium, low)
  - Bug statistics and distribution by demo
  - Expand to see stack traces and technical details
  - View console logs and network requests

- **Security (2FA) Tab**: Manage two-factor authentication
  - Setup/enable/disable TOTP 2FA
  - QR code generation for authenticator apps
  - Backup codes (planned)

### Access

**URL:** `http://localhost:3000/admin` (or your production domain)

**Authentication:**

- Email/password (bcrypt hashed)
- Optional 2FA (TOTP via authenticator app)
- 8-hour session duration

### Initial Setup

1. **Create Admin User:**

   ```bash
   node scripts/create-admin.js admin@example.com YourSecurePassword123!
   ```

2. **Login:**
   - Navigate to `/admin`
   - Enter email and password
   - If 2FA enabled, enter 6-digit code

3. **Enable 2FA (Recommended):**
   - Go to "Security (2FA)" tab
   - Click "Setup 2FA"
   - Scan QR code with Google Authenticator/Authy
   - Enter verification code
   - 2FA now required for all logins

### Security Best Practices

- ✅ Use strong passwords (12+ characters)
- ✅ Enable 2FA immediately after first login
- ✅ Keep `ADMIN_SECRET` confidential
- ✅ Use HTTPS in production
- ✅ Regularly rotate admin passwords
- ✅ Limit admin user count (1-2 recommended)

## Troubleshooting

### Session Creation Fails

**Issue:** "BugSpotter integration failed"

**Check:**

1. `BUGSPOTTER_API_URL` is correct
2. `BUGSPOTTER_ADMIN_EMAIL` and `BUGSPOTTER_ADMIN_PASSWORD` are valid
3. BugSpotter API is accessible
4. Network connection to BugSpotter API

**Test Authentication:**

```bash
curl -X POST https://demo.api.bugspotter.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'
```

### Email Not Received

**Check:**

1. `RESEND_API_KEY` is valid
2. Email domain is verified in Resend
3. Check spam folder
4. Verify email address in request

**Test Resend:**

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "demo@bugspotter.io",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

### Bugs Not Appearing in Dashboard

**Check:**

1. Session is valid and not expired
2. BugSpotter SDK initialized correctly
3. Check browser console for errors
4. Verify API key in demo site

**Debug:**

- Open browser DevTools → Console
- Look for `[BugSpotter]` initialization logs
- Check Network tab for failed API calls

### "Session not found" Error

**Causes:**

- Session expired (> 2h 1min old)
- Redis connection issue
- Invalid subdomain

**Fix:**

- Create new session
- Check `UPSTASH_REDIS_REST_URL` and token
- Verify subdomain matches session ID

### Cleanup Not Working

See detailed troubleshooting in [CLEANUP.md](./CLEANUP.md)

### Admin Panel Login Fails

**Check:**

1. Admin user created via script
2. Password entered correctly
3. If 2FA enabled, code is current (30-second window)
4. Redis connection working

**Reset 2FA:**

```bash
node scripts/disable-2fa.js admin@example.com
```

## Documentation

- **[README.md](./README.md)**: Main setup and usage guide (this file)
- **[BUGS.md](./BUGS.md)**: Complete bug reference with all element IDs
- **[CLEANUP.md](./CLEANUP.md)**: Automated cleanup system documentation
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)**: Implementation summary
- **[ADMIN_SETUP.md](./ADMIN_SETUP.md)**: Admin panel setup guide

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support

For questions or issues:

- Check documentation files above
- Review browser console logs
- Check server logs (`vercel logs` or local terminal)
- Verify environment variables
- Test individual components (Redis, Resend, BugSpotter API)

## License

MIT

---

**Built with ❤️ for the BugSpotter demo experience**
