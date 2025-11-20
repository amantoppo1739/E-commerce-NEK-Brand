'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(isAdmin ? '/admin' : '/account');
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      // Get user role from session after login
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        const isAdminUser = userData.role === 'admin';
        router.push(isAdminUser ? '/admin' : '/account');
      } else {
        router.push('/account');
      }
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-gray-900 hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-sm border">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-gray-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">Demo credentials:</p>
          <p>Admin: admin@nek.com / admin123</p>
          <p>User: user@example.com / any password</p>
          <p className="mt-4 text-xs text-gray-500">
            If you see the wrong view, clear your browser's localStorage and try again.
          </p>
        </div>
      </div>
    </div>
  );
}

