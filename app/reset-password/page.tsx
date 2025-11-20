'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token || !email) {
        setIsValid(false);
        setValidating(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/password-reset/validate?token=${token}&email=${encodeURIComponent(
            email
          )}`
        );
        const data = await response.json();
        setIsValid(data.valid);
      } catch (err) {
        setIsValid(false);
      } finally {
        setValidating(false);
      }
    }

    validateToken();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successfully. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <p className="text-gray-600">Validating reset link...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Invalid or expired link
          </h1>
          <p className="text-gray-600 mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter a new password for <span className="font-medium">{email}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-8 rounded-lg shadow-sm border"
        >
          {message && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}

