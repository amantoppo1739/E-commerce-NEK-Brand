import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">NEK</h3>
            <p className="text-sm text-gray-600">
              Luxury jewelry crafted with precision and passion.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/products?category=Necklaces" className="hover:text-gray-900">
                  Necklaces
                </Link>
              </li>
              <li>
                <Link href="/products?category=Rings" className="hover:text-gray-900">
                  Rings
                </Link>
              </li>
              <li>
                <Link href="/products?category=Earrings" className="hover:text-gray-900">
                  Earrings
                </Link>
              </li>
              <li>
                <Link href="/products?category=Bracelets" className="hover:text-gray-900">
                  Bracelets
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-gray-900">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-900">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-gray-900">
                  Shipping
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/privacy" className="hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} NEK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

