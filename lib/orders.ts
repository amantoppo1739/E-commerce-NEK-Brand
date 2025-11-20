import { Order, OrderStatus } from '@/types/order';

// Mock orders storage - In production, use a database
let mockOrders: Order[] = [];

export function createOrder(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
  const newOrder: Order = {
    ...order,
    id: String(mockOrders.length + 1),
    orderNumber: `NEK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockOrders.push(newOrder);
  return newOrder;
}

export function getOrderById(id: string): Order | null {
  return mockOrders.find((o) => o.id === id) || null;
}

export function getOrderByOrderNumber(orderNumber: string): Order | null {
  return mockOrders.find((o) => o.orderNumber === orderNumber) || null;
}

export function getOrdersByUserId(userId: string): Order[] {
  return mockOrders.filter((o) => o.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAllOrders(): Order[] {
  return [...mockOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateOrderStatus(id: string, status: OrderStatus, trackingNumber?: string): Order | null {
  const order = mockOrders.find((o) => o.id === id);
  if (!order) return null;

  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }

  return order;
}

export function getOrderStats() {
  const total = mockOrders.length;
  const pending = mockOrders.filter((o) => o.status === 'pending').length;
  const processing = mockOrders.filter((o) => o.status === 'processing').length;
  const shipped = mockOrders.filter((o) => o.status === 'shipped').length;
  const delivered = mockOrders.filter((o) => o.status === 'delivered').length;
  const totalRevenue = mockOrders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    total,
    pending,
    processing,
    shipped,
    delivered,
    totalRevenue,
  };
}

