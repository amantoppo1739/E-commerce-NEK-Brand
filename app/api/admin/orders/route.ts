import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Address } from '@/types/order';
import { prisma } from '@/lib/prisma';
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

function buildOrderWhere(searchParams: URLSearchParams) {
  const where: Record<string, any> = {};
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const paymentStatus = searchParams.get('paymentStatus');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (status && status !== 'all') {
    where.status = status;
  }

  if (paymentStatus && paymentStatus !== 'all') {
    where.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      const parsed = new Date(startDate);
      if (!Number.isNaN(parsed.valueOf())) {
        where.createdAt.gte = parsed;
      }
    }
    if (endDate) {
      const parsed = new Date(endDate);
      if (!Number.isNaN(parsed.valueOf())) {
        where.createdAt.lte = parsed;
      }
    }
  }

  if (search) {
    const term = search.trim();
    where.OR = [
      { orderNumber: { contains: term, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { email: { contains: term, mode: 'insensitive' } },
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  return where;
}

function toCsvValue(value: any) {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: Request) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const where = buildOrderWhere(searchParams);
    const format = searchParams.get('format');
    const isCsv = format === 'csv';

    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSizeParam = Number(searchParams.get('pageSize') ?? (isCsv ? '1000' : '10'));
    const pageSize = isCsv
      ? Math.max(1, Math.min(5000, Number.isNaN(pageSizeParam) ? 1000 : pageSizeParam))
      : Math.max(5, Math.min(50, Number.isNaN(pageSizeParam) ? 10 : pageSizeParam));
    const skip = (page - 1) * pageSize;

    const [orders, total, revenueAgg, statusBuckets, paymentBuckets] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { ...where, paymentStatus: 'paid' },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where,
      }),
      prisma.order.groupBy({
        by: ['paymentStatus'],
        _count: { paymentStatus: true },
        where,
      }),
    ]);

    const formattedOrders = orders.map((order) => ({
      ...order,
      shippingAddress: order.shippingAddress as Address | null,
      billingAddress: order.billingAddress as Address | null,
      itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
    }));

    const metrics = {
      totalOrders: total,
      paidRevenue: revenueAgg._sum.total ?? 0,
      statusCounts: statusBuckets.reduce<Record<string, number>>((acc, bucket) => {
        acc[bucket.status] = bucket._count.status;
        return acc;
      }, {}),
      paymentCounts: paymentBuckets.reduce<Record<string, number>>((acc, bucket) => {
        acc[bucket.paymentStatus] = bucket._count.paymentStatus;
        return acc;
      }, {}),
    };

    if (isCsv) {
      const headers = [
        'Order Number',
        'Customer Name',
        'Customer Email',
        'Status',
        'Payment Status',
        'Total',
        'Items',
        'Tracking Number',
        'Created At',
        'Updated At',
      ];

      const rows = formattedOrders.map((order) => {
        const customerName = `${order.shippingAddress?.firstName ?? ''} ${
          order.shippingAddress?.lastName ?? ''
        }`.trim();
        return [
          toCsvValue(order.orderNumber),
          toCsvValue(customerName),
          toCsvValue(order.shippingAddress?.email ?? order.user?.email ?? ''),
          toCsvValue(order.status),
          toCsvValue(order.paymentStatus),
          toCsvValue(order.total),
          toCsvValue(order.itemCount ?? order.items.length),
          toCsvValue(order.trackingNumber ?? ''),
          toCsvValue(order.createdAt.toISOString()),
          toCsvValue(order.updatedAt.toISOString()),
        ].join(',');
      });

      const csv = [headers.map(toCsvValue).join(','), ...rows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="orders-export-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      data: formattedOrders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      metrics,
      filters: {
        statuses: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        paymentStatuses: ['pending', 'paid', 'failed'],
      },
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

