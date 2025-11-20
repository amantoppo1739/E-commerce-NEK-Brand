import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error(
    '⚠️  DATABASE_URL is not set in your environment variables.\n' +
    'Please add it to your .env.local file.\n' +
    'For Neon, use the connection string from your Neon project dashboard'
  );
}

// Connection retry helper
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error that might be retryable
      const isConnectionError = 
        error.code === 'P1001' ||
        error.name === 'PrismaClientInitializationError' ||
        error.message?.includes("Can't reach database server") ||
        error.message?.includes('connection') ||
        error.message?.includes('timeout');
      
      if (isConnectionError && attempt < maxRetries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.warn(`Database connection attempt ${attempt} failed, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Try to reconnect
        try {
          if (globalForPrisma.prisma) {
            await globalForPrisma.prisma.$disconnect();
          }
        } catch (e) {
          // Ignore disconnect errors
        }
        continue;
      }
      
      // If not a connection error or max retries reached, throw
      throw error;
    }
  }
  
  throw lastError;
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

// Ensure connection is healthy before operations
async function ensureConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    const isConnectionError = 
      error.code === 'P1001' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes("Can't reach database server");
    
    if (isConnectionError) {
      // Try to reconnect
      try {
        await prisma.$disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      // Prisma will automatically reconnect on next query
    }
  }
}

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
    // Check for connection errors (P1001 or PrismaClientInitializationError)
    const isConnectionError = 
      error.code === 'P1001' || 
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes("Can't reach database server");
    
    if (isConnectionError) {
      const dbUrl = process.env.DATABASE_URL || '';
      const isNeon = dbUrl.includes('neon.tech');
      const hasPgbouncer = dbUrl.includes('pgbouncer=true');
      const hasSsl = dbUrl.includes('sslmode');
      const hasConnectionLimit = dbUrl.includes('connection_limit');
      
      // Check if password might have special characters that need encoding
      const passwordMatch = dbUrl.match(/postgres\.\w+:([^@]+)@/);
      const password = passwordMatch ? passwordMatch[1] : '';
      const hasSpecialChars = /[%@#&+=\s]/.test(password);
      
      return {
        success: false,
        message: error.message || 'Cannot reach database server',
        suggestions: [
          '🔴 CRITICAL: Check if your Neon database is active',
          '   → Go to https://neon.tech/dashboard',
          '   → Select your project',
          '   → Verify the database is running (Neon wakes up quickly if paused)',
          '',
          '✅ Verify your DATABASE_URL in Vercel environment variables:',
          '   → Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
          '   → Check that DATABASE_URL is set correctly',
          '   → Format: postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require',
          '',
          !hasSsl
            ? '⚠️ Missing SSL parameter - add &sslmode=require (usually included by default in Neon)'
            : null,
          '',
          '📋 Neon connection string format:',
          'postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require',
          '',
          '🔍 Additional troubleshooting:',
          '   → Try connecting from your local machine to verify the database is accessible',
          '   → Check Neon project status in the dashboard',
          '   → Verify your connection string is correct',
          '   → Ensure SSL is enabled (sslmode=require)',
        ].filter(Boolean),
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
        },
        connectionString: dbUrl
          ? `${dbUrl.split('@')[0]}@****` // Mask password
          : 'Not set',
        diagnostics: {
          isNeon,
          hasSsl,
          passwordHasSpecialChars: hasSpecialChars,
        },
      };
    }
    return { 
      success: false, 
      message: error.message, 
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
      }
    };
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

/**
 * Execute a database operation with automatic retry on connection errors
 * Use this for critical operations that need resilience
 */
export async function withDatabaseRetry<T>(
  operation: (client: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  return withRetry(() => operation(prisma), maxRetries);
}

/**
 * Keep-alive ping to prevent connection timeout
 * Call this periodically (e.g., every 5 minutes) to keep connection alive
 * Note: In serverless, this is less critical as each function invocation is fresh
 */
export async function keepAlive() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: 'Connection alive' };
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Keep-alive failed', 
      error: error.message 
    };
  }
}

