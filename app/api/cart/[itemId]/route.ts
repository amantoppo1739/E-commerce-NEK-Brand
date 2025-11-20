import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PATCH(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { quantity } = await request.json();
  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  const item = await prisma.cartItem.update({
    where: {
      id: params.itemId,
      userId: (session.user as any).id,
    },
    data: { quantity },
    include: {
      product: true,
      variant: true,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.cartItem.delete({
    where: {
      id: params.itemId,
      userId: (session.user as any).id,
    },
  });

  return NextResponse.json({ success: true });
}

