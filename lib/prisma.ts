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
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize for serverless environments (Vercel)
    // Connection pool settings for serverless functions
    ...(process.env.VERCEL && {
      // In serverless, we want to minimize connection overhead
      // These settings help with connection pooling
    }),
  });

/**
 * Test database connection
 * Call this to verify your database is accessible
 */
export async function testDatabaseConnection() {
  try {
    // Test with a timeout to avoid hanging
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      ),
    ]);
    return { success: true, message: 'Database connection successful' };
  } catch (error: any) {
    if (error.code === 'P1001') {
      const dbUrl = process.env.DATABASE_URL || '';
      const isPooler = dbUrl.includes('pooler.supabase.com');
      const hasPgbouncer = dbUrl.includes('pgbouncer=true');
      const hasSsl = dbUrl.includes('sslmode');
      
      return {
        success: false,
        message: 'Cannot reach database server',
        suggestions: [
          'Check your DATABASE_URL in Vercel environment variables is correct',
          'Your Supabase database might be paused (free tier pauses after inactivity)',
          'Go to Supabase dashboard → Settings → Database → Wake up database if paused',
          isPooler && !hasPgbouncer
            ? 'If using pooler connection, ensure ?pgbouncer=true is in the connection string'
            : null,
          !hasSsl
            ? 'Add &sslmode=require to your connection string for SSL/TLS'
            : null,
          'For Vercel, use Session Pooler connection string (IPv4 compatible)',
          'Connection string format: postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require',
        ].filter(Boolean),
        error: error.message,
        connectionString: dbUrl
          ? `${dbUrl.split('@')[0]}@****` // Mask password
          : 'Not set',
      };
    }
    return { success: false, message: error.message, error };
  }
}

// Store Prisma Client in global to prevent multiple instances in development
// In production (Vercel serverless), each function invocation gets a fresh instance
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // In production, ensure we disconnect on process exit to free connections
  if (typeof process !== 'undefined') {
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }
}

/**
 * Disconnect and reset Prisma client
 * Useful when DATABASE_URL changes and you need to reconnect
 */
export async function resetPrismaClient() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

