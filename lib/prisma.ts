import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error(
    '⚠️  DATABASE_URL is not set in your environment variables.\n' +
    'Please add it to your .env.local file.\n' +
    'For Supabase, use the connection string from Project Settings → Database'
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

/**
 * Test database connection
 * Call this to verify your database is accessible
 */
export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: 'Database connection successful' };
  } catch (error: any) {
    if (error.code === 'P1001') {
      return {
        success: false,
        message: 'Cannot reach database server',
        suggestions: [
          'Check your DATABASE_URL in .env.local is correct',
          'Your Supabase database might be paused (free tier pauses after inactivity)',
          'Go to Supabase dashboard → Settings → Database → Wake up database if paused',
          'If using pooler connection, ensure ?pgbouncer=true is in the connection string',
          'Try using the direct connection string instead of pooler',
        ],
        error: error.message,
      };
    }
    return { success: false, message: error.message, error };
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

