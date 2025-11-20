import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { userId: true, status: true },
  });

  if (!order || order.userId !== (session.user as any).id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: 'cancelled',
      paymentStatus: 'pending',
    },
  });

  return NextResponse.json(updated);
}

