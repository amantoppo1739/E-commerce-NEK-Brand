# Database Connection Retry & Resilience Guide

## Overview

This guide explains how the application handles database connection issues, including connection resilience for serverless environments.

## Problem: Connection Timeouts

Managed PostgreSQL services (like Neon) may close idle connections after periods of inactivity to conserve resources. In serverless environments, connections are short-lived, but retry logic ensures reliability.

## Solution: Automatic Retry Logic

The application now includes automatic retry logic that handles connection errors gracefully.

## Implementation

### 1. Connection Retry Helper (`lib/prisma.ts`)

The `withRetry` function automatically retries failed database operations:
- **Max retries:** 3 attempts (configurable)
- **Backoff strategy:** Exponential (1s, 2s, 4s)
- **Error detection:** Automatically detects connection errors (P1001, PrismaClientInitializationError)

### 2. Database Helper Utilities (`lib/db-helpers.ts`)

Convenience functions for common database operations:

#### `dbOperation()`
Execute any database operation with automatic retry:

```typescript
import { dbOperation } from '@/lib/db-helpers';

const products = await dbOperation(async (prisma) => {
  return await prisma.product.findMany();
});
```

#### `safeQuery()`
Returns a result object instead of throwing:

```typescript
import { safeQuery } from '@/lib/db-helpers';

const result = await safeQuery(async (prisma) => {
  return await prisma.product.findMany();
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### `handleDatabaseError()`
Standardized error handling for API routes:

```typescript
import { handleDatabaseError } from '@/lib/db-helpers';

try {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
} catch (error) {
  const dbError = handleDatabaseError(error);
  return NextResponse.json(dbError, { 
    status: dbError.retryable ? 503 : 500 
  });
}
```

## Usage Examples

### Example 1: Basic API Route with Retry

```typescript
import { NextResponse } from 'next/server';
import { prisma, withDatabaseRetry } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await withDatabaseRetry(async (prisma) => {
      return await prisma.product.findMany();
    });
    
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### Example 2: Using db-helpers

```typescript
import { NextResponse } from 'next/server';
import { dbOperation, handleDatabaseError } from '@/lib/db-helpers';

export async function GET() {
  try {
    const products = await dbOperation(async (prisma) => {
      return await prisma.product.findMany({
        where: { featured: true },
      });
    });
    
    return NextResponse.json(products);
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      dbError,
      { status: dbError.retryable ? 503 : 500 }
    );
  }
}
```

### Example 3: Safe Query Pattern

```typescript
import { NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db-helpers';

export async function GET() {
  const result = await safeQuery(async (prisma) => {
    return await prisma.product.findMany();
  });

  if (!result.success) {
    return NextResponse.json(
      result.error,
      { status: result.error.retryable ? 503 : 500 }
    );
  }

  return NextResponse.json(result.data);
}
```

## Connection String Configuration

Your connection string already includes parameters to minimize disconnection issues:

```
postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Key parameters:**
- `pgbouncer=true` - Uses connection pooling
- `connection_limit=1` - Limits connections per serverless function (prevents connection exhaustion)
- `sslmode=require` - Ensures secure connections

## Serverless Considerations

In serverless environments (like Vercel):
- Each function invocation gets a fresh connection
- Connections are automatically closed after the function completes
- The 10-minute timeout is less of an issue because connections are short-lived
- Retry logic handles any connection issues that do occur

## Best Practices

1. **Use retry helpers for critical operations:**
   ```typescript
   await withDatabaseRetry(async (prisma) => {
     // Critical database operation
   });
   ```

2. **Handle connection errors gracefully:**
   ```typescript
   try {
     // Database operation
   } catch (error) {
     const dbError = handleDatabaseError(error);
     // Return appropriate error response
   }
   ```

3. **Don't maintain long-lived connections:**
   - In serverless, each request gets a fresh connection
   - Don't try to keep connections alive across requests

4. **Monitor connection errors:**
   - Check Vercel logs for connection error patterns
   - Use the debug endpoint: `/api/debug/db-connection`

## Testing

Test the retry logic by temporarily breaking the connection:

```typescript
// In development, you can test retry logic
import { testDatabaseConnection } from '@/lib/prisma';

const result = await testDatabaseConnection();
console.log(result);
```

## Troubleshooting

If you still experience connection issues:

1. **Check connection string format:**
   - Visit `/api/debug/db-connection` to see diagnostics

2. **Verify database is active:**
   - Check Neon dashboard for project status

3. **Check Vercel logs:**
   - Look for connection error patterns
   - Verify environment variables are set correctly

4. **Test locally:**
   ```bash
   npm run db:test
   ```

## Summary

- ✅ Automatic retry on connection errors (3 attempts with exponential backoff)
- ✅ Graceful error handling with standardized error responses
- ✅ Connection string optimized for serverless (connection_limit=1)
- ✅ Helper utilities for common patterns
- ✅ Works seamlessly with existing Prisma code

The retry logic is transparent - your existing code will automatically benefit from connection resilience!

