import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl
    ? dbUrl.replace(/:[^:@]+@/, ':****@') // Mask password
    : 'Not set';

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      databaseUrl: maskedUrl,
      host: dbUrl?.match(/@([^:]+):/)?.[1] || 'unknown',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error.message,
        databaseUrl: maskedUrl,
        host: dbUrl?.match(/@([^:]+):/)?.[1] || 'unknown',
        code: error.code,
      },
      { status: 500 }
    );
  }
}

