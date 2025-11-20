import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 Password reset requested for email:', normalizedEmail);
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      console.log('✅ User found, generating password reset token...');
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });

      await prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          token,
          expires,
        },
      });

      console.log('📧 Sending password reset email to:', normalizedEmail);
      sendPasswordResetEmail(normalizedEmail, token)
        .then((result) => {
          if (result.success) {
            console.log('✅ Password reset email sent successfully to:', normalizedEmail);
          } else {
            console.error('❌ Failed to send password reset email:', result.error);
            // Check if it's a domain restriction issue
            if (result.error?.includes('only send testing emails') || result.error?.includes('verify a domain')) {
              console.error('💡 Resend Limitation: Using test domain - can only send to your own email address');
              console.error('   To send to any email, verify a domain at: https://resend.com/domains');
            }
          }
        })
        .catch((error) => {
          console.error('❌ Error sending password reset email:', error);
        });
    } else {
      console.log('⚠️ User not found for email:', normalizedEmail);
      console.log('   (This is normal - we return success to prevent email enumeration)');
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message:
        'If an account exists for that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

