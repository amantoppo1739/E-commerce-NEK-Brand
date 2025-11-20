// This route is now handled by NextAuth
// Keeping for backward compatibility but redirecting to NextAuth
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // NextAuth handles authentication at /api/auth/[...nextauth]
  return NextResponse.json(
    { error: 'Please use NextAuth endpoint' },
    { status: 400 }
  );
}

