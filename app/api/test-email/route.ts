import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify email service configuration
 * GET /api/test-email?to=your-email@example.com
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');

    if (!to) {
      return NextResponse.json(
        {
          error: 'Email address required',
          usage: 'GET /api/test-email?to=your-email@example.com',
        },
        { status: 400 }
      );
    }

    // Check environment variables
    const config = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'Using default: NEK <onboarding@resend.dev>',
    };

    const result = await sendEmail({
      to,
      subject: 'Test Email from NEK E-commerce',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Service Test</h2>
          <p>If you're reading this, your email service is working correctly!</p>
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>RESEND_API_KEY: ${config.RESEND_API_KEY}</li>
            <li>RESEND_FROM_EMAIL: ${config.RESEND_FROM_EMAIL}</li>
          </ul>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    // Check for Resend domain verification error
    const isDomainError = result.error?.includes('verify a domain') || 
                         result.error?.includes('only send testing emails');
    
    let message = '';
    if (result.success) {
      message = 'Test email sent successfully! Check your inbox.';
    } else if (isDomainError) {
      message = `⚠️ Resend Limitation: When using the test domain (onboarding@resend.dev), you can only send emails to your own verified email address (the one you signed up with Resend). To send to other addresses, verify a domain in Resend dashboard.`;
    } else {
      message = 'Failed to send test email. Check the error details below.';
    }

    return NextResponse.json({
      success: result.success,
      message,
      error: result.error,
      config,
      note: isDomainError 
        ? '💡 Tip: Use your own email address (the one you signed up with Resend) for testing, or verify a domain to send to any address.'
        : null,
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        message: 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}

