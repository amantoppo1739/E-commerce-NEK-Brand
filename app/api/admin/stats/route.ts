import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as any)?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get order stats
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      paidOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'processing' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.findMany({
        where: { paymentStatus: 'paid' },
        select: { total: true },
      }),
    ]);

    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // Get product stats
    const [productCount, variants] = await Promise.all([
      prisma.product.count(),
      prisma.productVariant.findMany({
        select: { inventory: true },
      }),
    ]);

    const totalInventory = variants.reduce((sum, v) => sum + v.inventory, 0);

    return NextResponse.json({
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        totalRevenue: revenue,
      },
      products: {
        total: productCount,
        totalInventory,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

