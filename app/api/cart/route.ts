import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json([], { status: 200 });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: (session.user as any).id },
      include: {
        product: true,
        variant: true,
      },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    if (error.code === 'P1001') {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Cannot reach database server. Please check your database connection settings.',
          code: 'DATABASE_CONNECTION_ERROR',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, variantId, quantity } = await request.json();
    if (!productId || !variantId || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId_variantId: {
          userId: (session.user as any).id,
          productId,
          variantId,
        },
      },
      create: {
        userId: (session.user as any).id,
        productId,
        variantId,
        quantity,
      },
      update: {
        quantity,
      },
      include: {
        product: true,
        variant: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error updating cart:', error);
    if (error.code === 'P1001') {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Cannot reach database server. Please check your database connection settings.',
          code: 'DATABASE_CONNECTION_ERROR',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

