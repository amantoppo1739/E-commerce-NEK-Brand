'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Package, ShoppingBag, DollarSign, TrendingUp, Users, Box } from 'lucide-react';

interface AdminStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    totalRevenue: number;
  };
  products: {
    total: number;
    totalInventory: number;
  };
}

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/login');
      return;
    }

    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [isAuthenticated, isAdmin, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your e-commerce store</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.orders.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.orders.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <Box className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.products.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inventory</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.products.totalInventory}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Status Breakdown */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.orders.pending}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processing</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.orders.processing}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Shipped</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.orders.shipped}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivered</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.orders.delivered}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/products"
                  className="block w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white text-center hover:bg-gray-800"
                >
                  Manage Products
                </Link>
                <Link
                  href="/admin/orders"
                  className="block w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 text-center hover:bg-gray-50"
                >
                  Manage Orders
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

