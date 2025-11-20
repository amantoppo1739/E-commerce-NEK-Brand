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
  const isPooler = dbUrl?.includes('pooler.supabase.com') || false;
  const hasPgbouncer = dbUrl?.includes('pgbouncer=true') || false;
  const hasSsl = dbUrl?.includes('sslmode') || false;

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: result.message,
      databaseUrl: maskedUrl,
      host,
      connectionType: isPooler ? 'Session Pooler' : 'Direct',
      hasPgbouncer,
      hasSsl,
    });
  } else {
    return NextResponse.json(
      {
        success: false,
        message: result.message,
        error: (result as any).error,
        databaseUrl: maskedUrl,
        host,
        connectionType: isPooler ? 'Session Pooler' : 'Direct',
        hasPgbouncer,
        hasSsl,
        suggestions: (result as any).suggestions || [],
        code: (result as any).error?.code,
      },
      { status: 500 }
    );
  }
}

