import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const isAdmin = (session.user as any)?.role === 'admin';
  if (!isAdmin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(
  _request: Request,
  { params }: { params: { orderId: string } }
) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error loading admin order:', error);
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  try {
    const payload = await request.json();

    const updated = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status: payload.status ?? undefined,
        paymentStatus: payload.paymentStatus ?? undefined,
        trackingNumber: payload.trackingNumber ?? null,
        estimatedDelivery: payload.estimatedDelivery
          ? new Date(payload.estimatedDelivery)
          : undefined,
        adminNotes: payload.adminNotes ?? undefined,
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating admin order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

