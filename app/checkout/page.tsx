'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Address } from '@/types/order';
import Link from 'next/link';
import Image from 'next/image';
import BackLink from '@/components/BackLink';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shippingAddress, setShippingAddress] = useState<Address>({
    id: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<Address>(shippingAddress);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      router.push('/products');
    }
  }, [items, router]);

  useEffect(() => {
    if (billingSameAsShipping) {
      setBillingAddress(shippingAddress);
    }
  }, [billingSameAsShipping, shippingAddress]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch('/api/account/addresses');
        if (response.ok) {
          const data = await response.json();
          setSavedAddresses(data);
          if (data.length > 0) {
            const defaultAddr = data.find((addr: Address) => addr.isDefault);
            const selected = defaultAddr || data[0];
            setSelectedAddressId(selected.id);
            setShippingAddress(selected);
            if (billingSameAsShipping) {
              setBillingAddress(selected);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch addresses', error);
      }
    };
    fetchAddresses();
  }, [isAuthenticated, billingSameAsShipping]);

  const subtotal = getSubtotal();
  const shipping =
    shippingMethod === 'express'
      ? 24.99
      : shippingMethod === 'overnight'
      ? 39.99
      : 15.99;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;
  const handleApplyCoupon = () => {
    if (!couponCode) return;
    if (couponCode.toUpperCase() === 'SAVE10') {
      setCouponApplied(true);
      setCouponMessage('Coupon applied! You saved 10%.');
    } else {
      setCouponApplied(false);
      setCouponMessage('Invalid coupon code (try SAVE10).');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderData = {
        userId: user?.id || 'guest',
        items: items.map((item) => ({
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          price: item.variant.price,
        })),
        shippingAddress,
        billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
        subtotal,
        shipping,
        tax,
        total,
        status: 'pending' as const,
        paymentMethod,
        paymentStatus: 'paid' as const,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        clearCart();
        router.push(`/order-confirmation/${order.orderNumber}`);
      } else {
        setError('Failed to place order. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-4">
          <BackLink label="Back to cart" fallbackHref="/products" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {!isAuthenticated && (
          <div className="mb-6 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <Link href="/login" className="font-medium underline">
                Sign in
              </Link>{' '}
              to save your information for faster checkout next time.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-2 lg:gap-x-12">
          {/* Left Column - Forms */}
          <div className="space-y-8">
            {/* Shipping Address */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
              {savedAddresses.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Saved addresses</p>
                <div className="space-y-3">
                  {savedAddresses.map((address) => (
                    <label
                      key={address.id}
                      className={`w-full border rounded-lg p-3 text-sm cursor-pointer flex items-start gap-3 ${
                        selectedAddressId === address.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        className="mt-1"
                        checked={selectedAddressId === address.id}
                        onChange={() => {
                          setSelectedAddressId(address.id);
                          setShippingAddress(address);
                          if (billingSameAsShipping) {
                            setBillingAddress(address);
                          }
                        }}
                      />
                      <div>
                        <span className="font-medium text-gray-900">
                          {address.firstName} {address.lastName}
                        </span>
                        <p className="text-xs text-gray-600">
                          {address.addressLine1}, {address.city}, {address.state} {address.zipCode}
                        </p>
                      </div>
                    </label>
                  ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setShippingAddress({
                          id: '',
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          email: user?.email || '',
                          phone: '',
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          country: 'United States',
                        });
                      }}
                      className="text-xs font-semibold text-gray-600 underline"
                    >
                      Use a different address
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First name</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.firstName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last name</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.lastName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.addressLine1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apartment, suite, etc. (optional)
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.zipCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Shipping method</label>
                  <div className="mt-3 space-y-3">
                    {[
                      { id: 'standard', label: 'Standard (4-7 business days)', amount: 15.99 },
                      { id: 'express', label: 'Express (2-3 business days)', amount: 24.99 },
                      { id: 'overnight', label: 'Overnight', amount: 39.99 },
                    ].map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                          shippingMethod === option.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={option.id}
                            checked={shippingMethod === option.id}
                            onChange={() => setShippingMethod(option.id)}
                            className="h-4 w-4 text-gray-900 focus:ring-gray-900"
                          />
                          <span>{option.label}</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatPrice(option.amount)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="billing-same"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <label htmlFor="billing-same" className="ml-2 text-sm text-gray-700">
                  Billing address same as shipping
                </label>
              </div>

              {!billingSameAsShipping && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h2>
                  {/* Similar fields for billing address */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First name</label>
                      <input
                        type="text"
                        required
                        value={billingAddress.firstName}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, firstName: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last name</label>
                      <input
                        type="text"
                        required
                        value={billingAddress.lastName}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, lastName: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      required
                      value={billingAddress.addressLine1}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, addressLine1: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        required
                        value={billingAddress.city}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, city: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        required
                        value={billingAddress.state}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, state: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ZIP</label>
                      <input
                        type="text"
                        required
                        value={billingAddress.zipCode}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, zipCode: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-2">
                <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Credit Card</span>
                </label>
                <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">PayPal</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="mt-10 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.variant.material}
                        {item.variant.size && ` • Size ${item.variant.size}`}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.variant.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-900">Promo code</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="SAVE10"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`mt-1 text-xs ${couponApplied ? 'text-green-600' : 'text-red-600'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>
              <div className="border-t space-y-2 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Discount (10%)</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-medium pt-2 border-t">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(total)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

