"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Truck, CheckCircle2, CreditCard } from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';

type AdminOrder = Order & {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${params.id}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to load order.');
      }
      setOrder(json);
      setTrackingNumber(json.trackingNumber || '');
      setNotes(json.adminNotes ?? '');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [fetchOrder, params.id]);

  const updateOrder = async (updates: Partial<AdminOrder>) => {
    if (!order) return;
    setStatusUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update order.');
      }
      setOrder(json);
    } catch (error) {
      console.error(error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    updateOrder({ 
      status: newStatus, 
      trackingNumber: trackingNumber || undefined, 
      adminNotes: notes 
    });
  };

  const handleNotesSave = () => {
    updateOrder({ adminNotes: notes });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Order not found</h1>
          <Link
            href="/admin/orders"
            className="inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Order</p>
            <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">Placed {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Fulfillment timeline</h2>
              <StatusTimeline status={order.status} />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Order items</h2>
                <p className="text-sm text-gray-500">{order.items.length} total</p>
              </div>
              <div className="mt-4 space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.product.id}-${index}`}
                    className="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.variant.material}
                        {item.variant.size ? ` · Size ${item.variant.size}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">SKU: {item.variant.sku}</p>
                      <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Shipping information</h2>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <AddressBlock title="Shipping address" address={order.shippingAddress} />
                <AddressBlock title="Billing address" address={order.billingAddress} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
                <SummaryRow label="Shipping" value={formatPrice(order.shipping)} />
                <SummaryRow label="Tax" value={formatPrice(order.tax)} />
                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Payment & tracking</h2>
              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Payment method</p>
                  <p className="font-medium capitalize">{order.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">
                    Tracking number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onBlur={() => updateOrder({ trackingNumber: trackingNumber || undefined })}
                    placeholder="Enter tracking"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">
                    Update status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                    disabled={statusUpdating}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
                  >
                    {STATUS_FLOW.concat(['cancelled']).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Internal notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Add context for your team (customers will not see these notes)"
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <button
                onClick={handleNotesSave}
                className="mt-3 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Save notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-gray-700">
      <span>{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatusTimeline({ status }: { status: OrderStatus }) {
  const activeIndex = STATUS_FLOW.indexOf(status === 'cancelled' ? 'pending' : status);
  return (
    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
      {STATUS_FLOW.map((step, index) => {
        const isActive = index <= activeIndex;
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                isActive ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-400'
              }`}
            >
              {index === 0 && <Package className="h-4 w-4" />}
              {index === 1 && <CreditCard className="h-4 w-4" />}
              {index === 2 && <Truck className="h-4 w-4" />}
              {index === 3 && <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 capitalize">{step}</p>
              <p className="text-xs text-gray-500">{isActive ? 'Completed' : 'Awaiting update'}</p>
            </div>
            {index < STATUS_FLOW.length - 1 && (
              <div className="hidden h-px flex-1 bg-gray-200 md:block" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddressBlock({
  title,
  address,
}: {
  title: string;
  address: Order['shippingAddress'];
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {address.firstName} {address.lastName}
      </p>
      <p className="text-sm text-gray-600">{address.addressLine1}</p>
      {address.addressLine2 && <p className="text-sm text-gray-600">{address.addressLine2}</p>}
      <p className="text-sm text-gray-600">
        {address.city}, {address.state} {address.zipCode}
      </p>
      <p className="text-sm text-gray-600">{address.country}</p>
      <p className="mt-2 text-sm text-gray-500">{address.phone}</p>
      <p className="text-sm text-gray-500">{address.email}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: Order["paymentStatus"] }) {
  const map: Record<Order['paymentStatus'], string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status]}`}>
      {status} payment
    </span>
  );
}
