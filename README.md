# BugSpotter Demo System

A Next.js 14 application showcasing interactive demo environments with intentional bugs for demonstrating real-time bug tracking capabilities.

## Features

- **Wildcard Subdomain Routing**: Each demo session gets a unique subdomain
- **3 Interactive Demo Sites**:
  - **KazBank** (Banking) - Transfer timeouts, PDF corruption, currency calculation errors
  - **TalentFlow** (HR) - Search crashes, upload freezes, timezone errors, email duplicates
  - **QuickMart** (E-commerce) - Cart bugs, checkout freeze, promo code failures
- **Real-Time Bug Capture**: 30% probability bug injection with realistic error messages
- **Bug Dashboard**: View all captured bugs with severity levels and details
- **Session Management**: 2-hour isolated sessions with Upstash Redis
- **Admin Panel**: Secure admin interface with OAuth and 2FA support
  - Email/password authentication with bcrypt hashing
  - Two-factor authentication (TOTP) with QR code setup
  - Session-based access control (8-hour sessions)
  - View and manage all demo sessions
  - Monitor all bugs across sessions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Upstash Redis (session & bug storage)
- **Authentication**: Custom OAuth with bcryptjs + speakeasy (TOTP 2FA)
- **Deployment**: Vercel (recommended)

## Project Structure

```
├── app/
│   ├── [subdomain]/          # Dynamic subdomain routing
│   │   ├── kazbank/          # Banking demo
│   │   ├── talentflow/       # HR demo
│   │   ├── quickmart/        # E-commerce demo
│   │   └── dashboard/        # Bug visualization
│   ├── api/
│   │   ├── demo/create-session/  # Session creation
│   │   └── bugs/             # Bug reporting & retrieval
│   └── page.tsx              # Main landing page
├── lib/
│   ├── session-manager.ts    # Redis session handling
│   └── bug-injector.ts       # Client-side bug injection
└── middleware.ts             # Subdomain extraction & routing
```

## Getting Started

### Prerequisites

- Node.js 18+
- Upstash Redis account ([create free account](https://console.upstash.com/))

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

# Add your Upstash Redis credentials
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Local Development

Since subdomains don't work on localhost, the middleware handles routing differently:

1. Visit `http://localhost:3000` to create a demo session
2. After creating a session, you'll be redirected to `http://localhost:3000/{subdomain}/dashboard`
3. Navigate to demo sites:
   - `http://localhost:3000/{subdomain}/kazbank`
   - `http://localhost:3000/{subdomain}/talentflow`
   - `http://localhost:3000/{subdomain}/quickmart`

### Production (with subdomains)

Deploy to Vercel and configure wildcard DNS:

- Main domain: `demo.bugspotter.io`
- Demo sessions: `{company}.demo.bugspotter.io`

## How It Works

### 1. Session Creation

- User enters company name on landing page
- System generates unique subdomain (e.g., `acme-x7k2`)
- Session stored in Redis with 2-hour TTL

### 2. Middleware Routing

- Extracts subdomain from hostname
- Rewrites path to `/[subdomain]/...` for routing
- Passes subdomain in `X-Client-Subdomain` header

### 3. Bug Injection

- Client-side `BugInjector` class attaches to interactive elements
- 30% probability of triggering bugs on click
- Generates realistic errors with stack traces
- Reports bugs to `/api/bugs` endpoint

### 4. Bug Dashboard

- Retrieves bugs from Redis via `/api/bugs?subdomain=X`
- Real-time polling every 5 seconds
- Shows severity, timestamps, stack traces

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

### POST `/api/demo/create-session`

Create a new demo session

```json
{
  "company": "Acme Corp"
}
```

### POST `/api/bugs`

Report a bug (called automatically by BugInjector)

```json
{
  "errorMessage": "Error description",
  "stackTrace": "Stack trace...",
  "severity": "high",
  "demo": "kazbank",
  "elementId": "transfer-btn"
}
```

### GET `/api/bugs?subdomain=X`

Retrieve all bugs for a session

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Configure custom domain with wildcard DNS:
   - `demo.bugspotter.io` → Your Vercel project
   - `*.demo.bugspotter.io` → Your Vercel project

## Environment Variables

```bash
# Required - Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Required - Admin Authentication
ADMIN_SECRET=your_random_secret_here
```

## Admin Panel Setup

### Create Admin User

Run the script to create an admin user:

```powershell
# PowerShell
node scripts/create-admin.js admin@example.com your-secure-password
```

Example:

```powershell
node scripts/create-admin.js admin@bugspotter.io MySecurePass123!
```

The script will:

- Hash the password with bcrypt
- Store the admin user in Redis
- Output confirmation with login URL

### Login to Admin Panel

Navigate to `http://localhost:3000/admin` and enter your credentials.

### Enable Two-Factor Authentication (Optional but Recommended)

1. Login to admin panel
2. Go to "Security (2FA)" tab
3. Click "Setup 2FA"
4. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
5. Enter the 6-digit code to verify and enable 2FA
6. Future logins will require both password and TOTP code

### Admin Panel Features

- **Sessions Tab**: View and manage all active demo sessions
  - See company name, subdomain, bug counts, and timestamps
  - Delete sessions manually
  - Click subdomain to view session dashboard
- **Bugs Tab**: Monitor all captured bugs across all sessions
  - Filter by severity (critical, high, medium, low)
  - View bug statistics and distribution by demo
  - Expand to see stack traces and technical details
- **Security Tab**: Manage two-factor authentication
  - Setup/enable/disable TOTP 2FA
  - QR code generation for authenticator apps

## License

MIT

## Support

For questions or issues, please open a GitHub issue.
