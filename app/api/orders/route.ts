import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Users can only see their own orders, admins can see all
    const isAdmin = (session.user as any)?.role === 'admin';
    const targetUserId = isAdmin && userId ? userId : (session.user as any)?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: targetUserId,
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
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
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderData = await request.json();
    const userId = (session.user as any)?.id || orderData.userId || 'guest';

    // Generate order number
    const orderNumber = `NEK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        total: orderData.total,
        status: orderData.status || 'pending',
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus || 'pending',
        items: {
          create: orderData.items.map((item: any) => ({
            productId: item.product.id,
            variantId: item.variant.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    // Update inventory
    for (const item of orderData.items) {
      await prisma.productVariant.update({
        where: { id: item.variant.id },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Send confirmation email
    if (orderData.shippingAddress?.email) {
      sendOrderConfirmationEmail(
        orderData.shippingAddress.email,
        orderNumber,
        orderData.total
      )
        .then((result) => {
          if (!result.success) {
            console.error('Failed to send order confirmation email:', result.error);
          }
        })
        .catch((error) => {
          console.error('Error sending order confirmation email:', error);
        });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
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
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

