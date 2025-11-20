'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
  label?: string;
  fallbackHref?: string;
  className?: string;
}

export default function BackLink({
  label = 'Back',
  fallbackHref = '/',
  className = '',
}: BackLinkProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors ${className}`}
      aria-label="Go back"
    >
      <span className="rounded-full border border-gray-200 p-1">
        <ArrowLeft className="h-4 w-4" />
      </span>
      {label}
    </button>
  );
}

