'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import { Order } from '@/types/order';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
    });
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

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. We've sent a confirmation email to{' '}
            <span className="font-medium">{order.shippingAddress.email}</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">Order Number: {order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
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

            {/* Shipping Address */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">{order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-4">
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
                  <p className="text-sm font-medium text-gray-900 mb-1">Order Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'shipped'
                        ? 'bg-purple-100 text-purple-800'
                        : order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Payment Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Order Date</p>
                  <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href={`/order-tracking/${order.orderNumber}`}
                  className="block w-full text-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Track Order
                </Link>
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
    </div>
  );
}

