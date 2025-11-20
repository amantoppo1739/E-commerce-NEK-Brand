"use client";

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Search,
  Package,
  CreditCard,
  Truck,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';

type AdminOrder = Order & {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  itemCount?: number;
};

type OrdersResponse = {
  data: AdminOrder[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  metrics: {
    totalOrders: number;
    paidRevenue: number;
    statusCounts: Record<string, number>;
    paymentCounts: Record<string, number>;
  };
};

const STATUS_OPTIONS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_OPTIONS: Array<{ value: 'all' | 'pending' | 'paid' | 'failed'; label: string }> = [
  { value: 'all', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AdminOrdersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '10',
    });
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);

    try {
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to load orders.');
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setActionLoading(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await response.json();
      if (!response.ok) {
        throw new Error(updated.error || 'Failed to update order.');
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((order) => (order.id === orderId ? updated : order)),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const metrics = data?.metrics;
  const orders = data?.data ?? [];

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);
    params.set('format', 'csv');
    params.set('pageSize', '1000');
    window.open(`/api/admin/orders?${params.toString()}`, '_blank');
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="mt-2 text-gray-600">Track fulfillment, payments, and customer communication.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {metrics && (
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total orders" value={metrics.totalOrders.toString()} icon={<Package className="h-5 w-5 text-gray-600" />} />
            <MetricCard
              label="Paid revenue"
              value={formatPrice(metrics.paidRevenue)}
              icon={<CreditCard className="h-5 w-5 text-gray-600" />}
            />
            <MetricCard
              label="Ready to ship"
              value={(metrics.statusCounts.processing || 0).toString()}
              helper="Processing status"
              icon={<Truck className="h-5 w-5 text-gray-600" />}
            />
            <MetricCard
              label="Delivered"
              value={(metrics.statusCounts.delivered || 0).toString()}
              helper="Completed orders"
              icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            />
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="sr-only" htmlFor="order-search">
              Search orders
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="order-search"
                type="text"
                placeholder="Search order number, customer name, or email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
          <Select
            label="Order status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as OrderStatus | 'all');
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          <Select
            label="Payment status"
            value={paymentFilter}
            onChange={(value) => {
              setPaymentFilter(value as 'all' | 'pending' | 'paid' | 'failed');
              setPage(1);
            }}
            options={PAYMENT_OPTIONS}
          />
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">No orders match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span>Order</span>
                      <span className="text-gray-900">{order.orderNumber}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed {formatDate(order.createdAt)} – {order.itemCount ?? order.items.length} items
                    </p>
                    {order.trackingNumber && (
                      <p className="text-xs text-gray-500">Tracking #{order.trackingNumber}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentBadge status={order.paymentStatus} />
                    <StatusBadge status={order.status} />
                    <button
                      onClick={() => handleStatusUpdate(order.id, order.status === 'processing' ? 'shipped' : 'processing')}
                      disabled={actionLoading === order.id}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {actionLoading === order.id ? 'Updating…' : order.status === 'processing' ? 'Mark shipped' : 'Mark processing'}
                    </button>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                      View details
                    </Link>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Customer</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{order.user?.email ?? order.shippingAddress.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Payment method</p>
                    <p className="text-sm text-gray-700 capitalize">{order.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Last updated</p>
                    <p className="text-sm text-gray-700">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-600">
              Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1}-
              {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(data.pagination.totalPages, prev + 1))}
                disabled={page === data.pagination.totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  helper,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gray-100 p-2">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          {helper && <p className="text-xs text-gray-500">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: Order['paymentStatus'] }) {
  const map: Record<Order['paymentStatus'], string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

