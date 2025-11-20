'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';

const statusSteps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'pending', label: 'Order Placed', icon: <Package className="h-5 w-5" /> },
  { status: 'processing', label: 'Processing', icon: <Clock className="h-5 w-5" /> },
  { status: 'shipped', label: 'Shipped', icon: <Truck className="h-5 w-5" /> },
  { status: 'delivered', label: 'Delivered', icon: <CheckCircle className="h-5 w-5" /> },
  { status: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-5 w-5" /> },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/order-number/${orderNumber}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIndex = (status: OrderStatus) => {
    return statusSteps.findIndex((step) => step.status === status);
  };

  const handleCancel = async () => {
    if (!order) return;
    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
      });
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Unable to cancel order.');
      }
    } catch (err) {
      setError('Failed to cancel order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find an order with that number.</p>
          <Link
            href="/products"
            className="inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Order Number: {order.orderNumber}</p>
          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Timeline */}
          <div className="lg:col-span-2">
            <div className="border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
              <div className="space-y-4">
                {statusSteps
                  .filter((step) => step.status !== 'cancelled' || isCancelled)
                  .map((step, index) => {
                    const stepIndex = statusSteps.findIndex((s) => s.status === step.status);
                    const isActive = stepIndex <= currentStatusIndex;
                    const isCurrent = step.status === order.status;

                    return (
                      <div key={step.status} className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                            isActive
                              ? 'bg-gray-900 border-gray-900 text-white'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}
                        >
                          {step.icon}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm font-medium ${
                                isActive ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          {isCurrent && order.updatedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Updated: {formatDate(order.updatedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {order.trackingNumber && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">Tracking Number</p>
                  <p className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                    {order.trackingNumber}
                  </p>
                </div>
              )}

              {order.estimatedDelivery && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Estimated Delivery</p>
                  <p className="text-sm text-gray-600">{formatDate(order.estimatedDelivery)}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.variant.material}
                        {item.variant.size && ` • Size ${item.variant.size}`}
                      </p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Shipping Address</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Order Date</p>
                  <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {['pending', 'processing'].includes(order.status) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="block w-full rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Cancel order
                </button>
              )}

              <Link
                href="/products"
                className="block w-full text-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

