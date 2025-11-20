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
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
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

      sendPasswordResetEmail(normalizedEmail, token).catch((error) =>
        console.error('Error sending password reset email:', error)
      );
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

