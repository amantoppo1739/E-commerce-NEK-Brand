import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        404
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href="/"
          className="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
        >
          Go back home
        </Link>
        <Link
          href="/products"
          className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
        >
          Browse products <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

