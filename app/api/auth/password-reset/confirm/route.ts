import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, token, password } = await request.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, token, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        email: email.toLowerCase().trim(),
      },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { email: record.email },
      }),
    ]);

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

