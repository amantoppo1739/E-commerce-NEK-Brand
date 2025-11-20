import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * Diagnostic endpoint to check email service status
 * GET /api/email-diagnostic
 */
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      RESEND_API_KEY: process.env.RESEND_API_KEY 
        ? `✅ Set (${process.env.RESEND_API_KEY.substring(0, 10)}...)` 
        : '❌ Missing',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'Using default: NEK <onboarding@resend.dev>',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
    },
    testResults: null,
    recommendations: [],
  };

  // Check if API key is set
  if (!process.env.RESEND_API_KEY) {
    diagnostics.recommendations.push({
      issue: 'RESEND_API_KEY is missing',
      solution: 'Add RESEND_API_KEY to your .env.local file',
      link: 'https://resend.com/api-keys',
    });
    return NextResponse.json(diagnostics, { status: 200 });
  }

  // Try to send a test email to the user's account
  // We'll use a test email to see what happens
  const testEmail = 'amantoppo1739@gmail.com'; // User's Resend account email
  
  try {
    console.log('🔍 Running email diagnostic test...');
    const result = await sendEmail({
      to: testEmail,
      subject: 'Email Service Diagnostic Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Service Diagnostic</h2>
          <p>If you receive this email, your email service is working correctly!</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    diagnostics.testResults = {
      success: result.success,
      error: result.error,
      message: result.success 
        ? '✅ Test email sent successfully! Check your inbox (and spam folder).'
        : '❌ Failed to send test email. See error details below.',
    };

    if (!result.success) {
      if (result.error?.includes('only send testing emails')) {
        diagnostics.recommendations.push({
          issue: 'Resend test domain restriction',
          solution: 'You can only send to your own email (amantoppo1739@gmail.com) with test domain',
          note: 'This is expected behavior. To send to any email, verify a domain.',
        });
      } else if (result.error?.includes('API key')) {
        diagnostics.recommendations.push({
          issue: 'Invalid API key',
          solution: 'Get a new API key from https://resend.com/api-keys',
          steps: [
            '1. Go to https://resend.com/api-keys',
            '2. Create a new API key',
            '3. Update RESEND_API_KEY in .env.local',
            '4. Restart your dev server',
          ],
        });
      } else if (result.error?.includes('rate limit') || result.error?.includes('quota')) {
        diagnostics.recommendations.push({
          issue: 'Rate limit exceeded',
          solution: 'You\'ve reached Resend\'s free tier limit (3,000 emails/month)',
          link: 'https://resend.com/dashboard',
        });
      } else {
        diagnostics.recommendations.push({
          issue: 'Unknown error',
          solution: 'Check the error message above',
          error: result.error,
        });
      }
    }
  } catch (error: any) {
    diagnostics.testResults = {
      success: false,
      error: error.message || 'Unknown error',
      message: '❌ Error during diagnostic test',
    };
    diagnostics.recommendations.push({
      issue: 'Exception thrown',
      solution: 'Check server logs for details',
      error: error.message,
    });
  }

  return NextResponse.json(diagnostics, { status: 200 });
}

