import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items } = await request.json();
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const userId = (session.user as any).id;
  await prisma.cartItem.deleteMany({ where: { userId } });

  if (items.length === 0) {
    return NextResponse.json({ success: true });
  }

  const mergedMap = new Map<string, { productId: string; variantId: string; quantity: number }>();
  for (const item of items) {
    const key = `${item.productId}-${item.variantId}`;
    if (mergedMap.has(key)) {
      mergedMap.get(key)!.quantity += item.quantity;
    } else {
      mergedMap.set(key, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }
  }

  await prisma.cartItem.createMany({
    data: Array.from(mergedMap.values()).map((item) => ({
      userId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  });

  return NextResponse.json({ success: true });
}

