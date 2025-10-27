# Admin Setup Guide

This guide walks you through setting up the admin panel with OAuth and 2FA authentication.

## Prerequisites

- Next.js development server running
- Upstash Redis configured in `.env.local`
- Node.js installed

## Step 1: Generate Security Keys

Run these commands in PowerShell to generate secure random keys:

```powershell
# Generate ADMIN_SECRET (for general admin security)
node -e "console.log('ADMIN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate ADMIN_SETUP_KEY (for initial admin registration)
node -e "console.log('ADMIN_SETUP_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

Example output:

```
ADMIN_SECRET=18c7f48dfa855b41514cb6e5b5c5adba73d9a311d0bf7adf7654ba485b1b2b59
ADMIN_SETUP_KEY=b0cc8065ffe22c88912bbec3cad5506d60dae52ea655ad567d835abe992e0139
```

## Step 2: Update Environment Variables

Add both keys to your `.env.local` file:

```bash
# Admin Access
ADMIN_SECRET=<your_generated_admin_secret>
ADMIN_SETUP_KEY=<your_generated_setup_key>
```

**Important**:

- Keep `ADMIN_SETUP_KEY` secret - it allows creating admin accounts
- After creating your admin account, you can optionally remove `ADMIN_SETUP_KEY` from production
- Never commit `.env.local` to version control

## Step 3: Create Admin Account

1. **Navigate to registration page**:

   ```
   http://localhost:3000/admin/register
   ```

2. **Fill in the form**:
   - **Setup Key**: Copy and paste the `ADMIN_SETUP_KEY` from your `.env.local`
   - **Email**: Your admin email address (e.g., `admin@example.com`)
   - **Password**: Choose a strong password (minimum 8 characters)
   - **Confirm Password**: Re-enter your password

3. **Submit**:
   - Click "Create Admin Account"
   - You should see a success message
   - You'll be redirected to the login page

## Step 4: Login to Admin Panel

1. **Navigate to admin login**:

   ```
   http://localhost:3000/admin
   ```

2. **Login with credentials**:
   - **Email**: The email you registered with
   - **Password**: Your password
   - Click "Login"

3. **First login**:
   - You'll be logged in without 2FA
   - Your session will last 8 hours
   - Session token is stored in localStorage

## Step 5: Enable Two-Factor Authentication (Recommended)

### Why Enable 2FA?

- Adds extra security layer to admin access
- Requires both password AND time-based code
- Uses industry-standard TOTP (compatible with Google Authenticator, Authy, etc.)

### Setup Process:

1. **Navigate to Security tab**:
   - After logging in, click "Security (2FA)" tab
2. **Start 2FA setup**:
   - Click "Setup 2FA" button
   - A QR code will appear

3. **Scan QR code**:
   - Open your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
   - Scan the QR code displayed on screen
   - Alternative: Manually enter the secret key shown below the QR code

4. **Verify setup**:
   - Your authenticator app will generate a 6-digit code
   - Enter the code in the verification field
   - Click "Verify & Enable"

5. **Success**:
   - You'll see "2FA enabled successfully!"
   - Future logins will require the 6-digit code

### Using 2FA on Login:

1. **Enter email and password** → Click "Login"
2. **2FA prompt appears** → Enter 6-digit code from authenticator app
3. **Click "Verify 2FA"** → You're logged in

### Disable 2FA (if needed):

1. Go to "Security (2FA)" tab
2. Click "Disable 2FA"
3. Confirm the action
4. Future logins won't require 2FA code

## Admin Panel Features

### Sessions Tab

- View all active demo sessions
- See company name, subdomain, and activity metrics
- Monitor bug counts per session
- Delete sessions manually
- Click subdomain links to view session dashboards

### Bugs Tab

- View all captured bugs across all sessions
- See bug statistics:
  - Total bugs
  - Breakdown by severity (Critical, High, Medium, Low)
  - Distribution by demo (KazBank, TalentFlow, QuickMart)
- Filter and search bugs
- Expand to view full stack traces
- Monitor in real-time (manual refresh)

### Security Tab

- Setup two-factor authentication
- View QR code for authenticator apps
- Enable/disable 2FA
- Manage security settings

## Troubleshooting

### "Invalid setup key" error

- Double-check the `ADMIN_SETUP_KEY` in `.env.local` matches what you entered
- Make sure there are no extra spaces or characters
- Restart the dev server after updating `.env.local`

### "Login failed" error

- Verify email and password are correct
- Check that the admin account was created successfully
- Try registering again if needed

### 2FA code not working

- Ensure your device time is synchronized (TOTP requires accurate time)
- Wait for a new code to generate (codes change every 30 seconds)
- Verify you scanned the correct QR code

### Session expired

- Sessions last 8 hours
- After expiration, you'll need to login again
- Session token is stored in browser localStorage

### Can't access admin panel

- Ensure the dev server is running (`npm run dev`)
- Check that all environment variables are set
- Verify Upstash Redis is configured correctly

## Security Best Practices

1. **Use strong passwords**: Minimum 8 characters, mix of letters, numbers, symbols
2. **Enable 2FA**: Adds significant security to admin access
3. **Keep keys secret**: Never commit `.env.local` to git
4. **Limit admin accounts**: Only create accounts for trusted administrators
5. **Regular logout**: Don't leave admin sessions active on shared computers
6. **Monitor access**: Check session logs regularly for unauthorized access
7. **Secure Redis**: Use Upstash's security features (TLS, restricted IPs)

## Production Deployment

When deploying to production (Vercel, etc.):

1. **Set environment variables** in your hosting platform:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ADMIN_SECRET`
   - `ADMIN_SETUP_KEY` (optional - can be removed after creating admin)

2. **Create admin account** using the registration flow

3. **Enable 2FA** immediately for production admin accounts

4. **Remove ADMIN_SETUP_KEY** from environment variables to prevent new registrations

5. **Monitor logs** for any authentication issues

## API Endpoints

The admin system uses these API routes:

- `POST /api/auth/register` - Create admin account
- `POST /api/auth/login` - Login with email/password
- `DELETE /api/auth/login` - Logout
- `POST /api/auth/2fa` - Generate 2FA QR code
- `PUT /api/auth/2fa` - Enable 2FA
- `DELETE /api/auth/2fa` - Disable 2FA
- `GET /api/admin/sessions` - Get all sessions
- `DELETE /api/admin/sessions` - Delete session
- `GET /api/admin/bugs` - Get all bugs

All admin endpoints require the `x-session-token` header with a valid session token.

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure Upstash Redis is accessible
4. Check the Next.js server logs
5. Try clearing browser localStorage and logging in again
