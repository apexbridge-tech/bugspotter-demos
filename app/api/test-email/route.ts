import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * Diagnostic endpoint to test email sending in production
 *
 * Usage: POST /api/test-email
 * Body: { "email": "test@example.com", "secret": "your_admin_secret" }
 */
export async function POST(request: NextRequest) {
  console.log('\n========================================');
  console.log('[EmailTest] Starting email diagnostic test');
  console.log('========================================');

  try {
    const body = await request.json();
    const { email, secret } = body;

    // Security check - require admin secret
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      console.log('[EmailTest] ❌ Unauthorized - invalid secret');
      return NextResponse.json({ error: 'Unauthorized - invalid admin secret' }, { status: 401 });
    }

    if (!email || !email.includes('@')) {
      console.log('[EmailTest] ❌ Invalid email format');
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    console.log('[EmailTest] 📧 Testing email to:', email);

    // Check environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@bugspotter.io';

    console.log('[EmailTest] Environment check:');
    console.log(`  RESEND_API_KEY: ${resendApiKey ? '✅ Set' : '❌ Missing'}`);
    if (resendApiKey) {
      console.log(`    - Length: ${resendApiKey.length}`);
      console.log(`    - Starts with: ${resendApiKey.substring(0, 10)}...`);
      console.log(`    - Valid format: ${resendApiKey.startsWith('re_') ? '✅ Yes' : '❌ No'}`);
    }
    console.log(`  RESEND_FROM_EMAIL: ${fromEmail}`);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'local',
      resendApiKeyConfigured: !!resendApiKey,
      resendApiKeyFormat: resendApiKey ? resendApiKey.startsWith('re_') : false,
      resendApiKeyLength: resendApiKey?.length || 0,
      fromEmail,
      recipientEmail: email,
    };

    if (!resendApiKey || resendApiKey === 'your_resend_api_key_here') {
      console.log('[EmailTest] ❌ RESEND_API_KEY not configured properly');
      return NextResponse.json(
        {
          success: false,
          error: 'RESEND_API_KEY not configured',
          diagnostics,
          suggestions: [
            'Check that RESEND_API_KEY is set in Vercel environment variables',
            'Verify the API key is valid at https://resend.com/api-keys',
            'Make sure the key starts with "re_"',
            'Redeploy after updating environment variables',
          ],
        },
        { status: 500 }
      );
    }

    // Try to send test email
    console.log('[EmailTest] Initializing Resend client...');
    const resend = new Resend(resendApiKey);
    console.log('[EmailTest] ✅ Resend client initialized');

    console.log('[EmailTest] Sending test email...');
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `🧪 BugSpotter Email Diagnostic - ${new Date().toLocaleString()}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Diagnostic Test</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 40px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #10b981; margin-bottom: 20px;">✅ Email System Working!</h1>
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      This diagnostic test email was successfully sent from your production environment.
      Your email configuration is working correctly!
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin-top: 30px;">
      <h2 style="font-size: 16px; color: #065f46; margin-bottom: 10px;">✅ What This Means:</h2>
      <p style="color: #065f46; font-size: 14px; margin: 0;">
        If you're receiving this email, it means:
      </p>
      <ul style="color: #065f46; font-size: 14px; margin-top: 10px;">
        <li>RESEND_API_KEY is correctly configured</li>
        <li>Domain is properly verified in Resend</li>
        <li>Email sending functionality is working</li>
      </ul>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 4px; margin-top: 20px;">
      <h2 style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">📋 Test Details:</h2>
      <table style="width: 100%; color: #6b7280; font-size: 14px;">
        <tr>
          <td style="padding: 5px 0;"><strong>From:</strong></td>
          <td style="padding: 5px 0;">${fromEmail}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>To:</strong></td>
          <td style="padding: 5px 0;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Timestamp:</strong></td>
          <td style="padding: 5px 0;">${new Date().toISOString()}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Environment:</strong></td>
          <td style="padding: 5px 0;">${process.env.VERCEL_ENV || 'unknown'}</td>
        </tr>
      </table>
    </div>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
      BugSpotter Demo System Email Diagnostic © 2025
    </p>
  </div>
</body>
</html>
      `,
    });

    console.log('[EmailTest] ✅ Email sent successfully!');
    console.log('[EmailTest] Resend response:', JSON.stringify(result, null, 2));
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      diagnostics,
      resendResponse: result,
      instructions: `Check your inbox at ${email} (also check spam folder)`,
    });
  } catch (error) {
    console.error('[EmailTest] ❌ Error sending test email');
    console.error(
      '[EmailTest] Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      '[EmailTest] Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error('[EmailTest] Full error:', error);
    console.log('========================================\n');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test email',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        suggestions: [
          'Verify domain is verified in Resend dashboard (https://resend.com/domains)',
          'Check API key is valid at https://resend.com/api-keys',
          'Ensure "from" email domain matches verified domain',
          'Check Resend account status and limits',
          'Review Resend dashboard for failed sends',
        ],
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Email diagnostic endpoint',
    usage:
      'POST /api/test-email with body: { "email": "test@example.com", "secret": "your_admin_secret" }',
    purpose: 'Test email sending functionality in production',
  });
}
