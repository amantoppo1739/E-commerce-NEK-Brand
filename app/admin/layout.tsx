'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/admin/products', label: 'Products', icon: <Package className="h-5 w-5" /> },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag className="h-5 w-5" /> },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Admin Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                Admin Panel
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                View Store
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

