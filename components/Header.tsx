'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import CartDrawer from './CartDrawer';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'All Products' },
    { href: '/products?category=Necklaces', label: 'Necklaces' },
    { href: '/products?category=Rings', label: 'Rings' },
    { href: '/products?category=Earrings', label: 'Earrings' },
    { href: '/products?category=Bracelets', label: 'Bracelets' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                NEK
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingBag className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative group">
                  <Link
                    href={isAdmin ? '/admin' : '/account'}
                    className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <User className="h-6 w-6" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.firstName}
                    </span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded-md shadow-lg py-1 px-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <User className="h-6 w-6" />
                  <span className="hidden sm:inline text-sm font-medium">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden border-t py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    href={isAdmin ? '/admin' : '/account'}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {isAdmin ? 'Admin Dashboard' : 'My Account'}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

