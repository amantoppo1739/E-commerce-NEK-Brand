import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl
    ? dbUrl.replace(/:[^:@]+@/, ':****@') // Mask password
    : 'Not set';

  const result = await testDatabaseConnection();
  const host = dbUrl?.match(/@([^:]+):/)?.[1] || 'unknown';
  const isNeon = dbUrl?.includes('neon.tech') || false;
  const hasSsl = dbUrl?.includes('sslmode') || false;

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: result.message,
      databaseUrl: maskedUrl,
      host,
      connectionType: isNeon ? 'Neon' : 'Unknown',
      hasSsl,
    });
  } else {
    const errorResult = result as any;
    return NextResponse.json(
      {
        success: false,
        message: errorResult.message,
        error: errorResult.error,
        databaseUrl: maskedUrl,
        host,
        connectionType: isNeon ? 'Neon' : 'Unknown',
        hasSsl,
        suggestions: errorResult.suggestions || [],
        diagnostics: errorResult.diagnostics || {},
        code: errorResult.error?.code,
      },
      { status: 500 }
    );
  }
}

