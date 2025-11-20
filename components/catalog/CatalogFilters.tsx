'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import FilterSidebar from './FilterSidebar';

export default function CatalogFilters() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="hidden lg:block lg:sticky lg:top-24">
        <FilterSidebar />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:text-gray-800"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterSidebar />
            </div>
            <div className="border-t px-5 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
              >
                View products
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

