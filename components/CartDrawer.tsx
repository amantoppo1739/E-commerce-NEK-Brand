'use client';

import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, getSubtotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const shippingEstimate = 15.99;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(variantId, newQuantity);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="text-sm font-medium text-gray-900 hover:underline"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex gap-4 border-b pb-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.variant.material}
                        {item.variant.size && ` • Size ${item.variant.size}`}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {formatPrice(item.variant.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.variant.id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.variant.id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.variant.id)}
                          className="ml-auto p-1 text-gray-400 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Promo code</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="SUMMER25"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400"
                  >
                    Apply
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Coupon functionality coming soon.
                </p>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Estimated shipping</span>
                <span>{formatPrice(shippingEstimate)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-medium text-gray-900">
                <span>Subtotal</span>
                <span>{formatPrice(getSubtotal() + shippingEstimate)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full rounded-md bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Checkout
              </Link>
              <Link
                href="/products"
                onClick={onClose}
                className="block w-full text-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

