import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    if (error.code === 'P1001') {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Cannot reach database server. Please check your database connection settings.',
          code: 'DATABASE_CONNECTION_ERROR',
          troubleshooting: [
            'Check your DATABASE_URL in .env.local is correct',
            'Your Supabase database might be paused (free tier pauses after inactivity)',
            'Go to Supabase dashboard → Settings → Database → Wake up database if paused',
            'If using pooler connection, ensure ?pgbouncer=true is in the connection string',
          ],
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

