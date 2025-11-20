/**
 * Database helper utilities for handling connection errors and retries
 */

import { prisma, withDatabaseRetry } from './prisma';
import type { PrismaClient } from '@prisma/client';

/**
 * Execute a database operation with automatic retry on connection errors
 * This is a convenience wrapper around withDatabaseRetry
 */
export async function dbOperation<T>(
  operation: (client: PrismaClient) => Promise<T>,
  options?: {
    maxRetries?: number;
    onError?: (error: any, attempt: number) => void;
  }
): Promise<T> {
  try {
    return await withDatabaseRetry(operation, options?.maxRetries);
  } catch (error: any) {
    if (options?.onError) {
      options.onError(error, options.maxRetries || 3);
    }
    throw error;
  }
}

/**
 * Handle database connection errors in API routes
 * Returns a standardized error response for connection issues
 */
export function handleDatabaseError(error: any) {
  const isConnectionError = 
    error.code === 'P1001' ||
    error.name === 'PrismaClientInitializationError' ||
    error.message?.includes("Can't reach database server") ||
    error.message?.includes('connection');

  if (isConnectionError) {
    return {
      error: 'Database connection failed',
      message: 'Cannot reach database server. The connection may have timed out. Please try again.',
      code: 'DATABASE_CONNECTION_ERROR',
      retryable: true,
    };
  }

  return {
    error: 'Database error',
    message: error.message || 'An unexpected database error occurred',
    code: error.code || 'DATABASE_ERROR',
    retryable: false,
  };
}

/**
 * Safe database query wrapper
 * Automatically handles connection errors and retries
 */
export async function safeQuery<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  try {
    const data = await dbOperation(operation);
    return { success: true, data };
  } catch (error: any) {
    return { 
      success: false, 
      error: handleDatabaseError(error)
    };
  }
}

