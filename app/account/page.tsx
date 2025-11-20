'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types/order';
import { Package, User, MapPin, LogOut } from 'lucide-react';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'profile' | 'addresses'
  >('overview');
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    isDefault: false,
  });
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    async function fetchOrders() {
      if (user?.id) {
        try {
          const response = await fetch(`/api/orders?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setOrders(data);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchOrders();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch('/api/account/addresses');
        if (response.ok) {
          const data = await response.json();
          setAddresses(data);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setAddressLoading(false);
      }
    };
    fetchAddresses();
  }, [user?.id]);

  useEffect(() => {
    if (editingAddress) {
      setAddressForm({
        firstName: editingAddress.firstName,
        lastName: editingAddress.lastName,
        email: editingAddress.email,
        phone: editingAddress.phone,
        addressLine1: editingAddress.addressLine1,
        addressLine2: editingAddress.addressLine2 || '',
        city: editingAddress.city,
        state: editingAddress.state,
        zipCode: editingAddress.zipCode,
        country: editingAddress.country,
        isDefault: editingAddress.isDefault || false,
      });
    } else {
      setAddressForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        isDefault: false,
      });
    }
  }, [editingAddress]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
    { id: 'orders', label: 'Orders', icon: <Package className="h-4 w-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin className="h-4 w-4" /> },
  ];

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        );
      }
    } catch (error) {
      console.error('Failed to cancel order', error);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        editingAddress ? `/api/account/addresses/${editingAddress.id}` : '/api/account/addresses',
        {
          method: editingAddress ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressForm),
        }
      );
      if (response.ok) {
        const savedAddress = await response.json();
        if (editingAddress) {
          setAddresses((prev) =>
            prev.map((addr) => (addr.id === savedAddress.id ? savedAddress : addr))
          );
        } else {
          setAddresses((prev) => [savedAddress, ...prev]);
        }
        setEditingAddress(null);
      }
    } catch (error) {
      console.error('Failed to add address', error);
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (response.ok) {
        const updated = await response.json();
        setAddresses((prev) =>
          prev.map((addr) => ({ ...addr, isDefault: addr.id === updated.id }))
        );
      }
    } catch (error) {
      console.error('Failed to set default address', error);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete address', error);
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.firstName}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-lg font-medium text-gray-900 mt-1">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {orders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <Link
                            key={order.id}
                            href={`/order-tracking/${order.orderNumber}`}
                            className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  Order {order.orderNumber}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {formatDate(order.createdAt)} • {order.items.length} item
                                  {order.items.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatPrice(order.total)}
                                </p>
                                <span
                                  className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                                    order.status === 'delivered'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'shipped'
                                      ? 'bg-purple-100 text-purple-800'
                                      : order.status === 'processing'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                      <Link
                        href="/products"
                        className="inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                Order {order.orderNumber}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Placed on {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatPrice(order.total)}
                              </p>
                              <span
                                className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                                  order.status === 'delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'shipped'
                                    ? 'bg-purple-100 text-purple-800'
                                    : order.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                            {order.trackingNumber && (
                              <span>Tracking: {order.trackingNumber}</span>
                            )}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                              href={`/order-tracking/${order.orderNumber}`}
                              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                            >
                              View details
                            </Link>
                            {['pending', 'processing'].includes(order.status) && (
                              <button
                                type="button"
                                onClick={() => cancelOrder(order.id)}
                                className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Cancel order
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={user.firstName}
                        readOnly
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={user.lastName}
                        readOnly
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 sm:text-sm"
                      />
                    </div>
                    {user.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={user.phone}
                          readOnly
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Address</h2>
                    <form
                      onSubmit={handleAddressSubmit}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <input
                        type="text"
                        placeholder="First name"
                        required
                        value={addressForm.firstName}
                        onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        required
                        value={addressForm.lastName}
                        onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        required
                        value={addressForm.email}
                        onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Address line 1"
                        required
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        className="md:col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Address line 2 (optional)"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        className="md:col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="ZIP code"
                        required
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        required
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        Set as default shipping address
                      </label>
                      <button
                        type="submit"
                        className="md:col-span-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        Save address
                      </button>
                    </form>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Saved addresses</h2>
                    {addressLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No saved addresses yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {addresses.map((address) => (
                          <div key={address.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-medium text-gray-900">
                                  {address.firstName} {address.lastName}
                                </p>
                                <p>{address.addressLine1}</p>
                                {address.addressLine2 && <p>{address.addressLine2}</p>}
                                <p>
                                  {address.city}, {address.state} {address.zipCode}
                                </p>
                                <p>{address.country}</p>
                                <p className="mt-2">{address.phone}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                {address.isDefault ? (
                                  <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full text-center">
                                    Default
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDefaultAddress(address.id)}
                                    className="px-2 py-1 text-xs font-semibold text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100"
                                  >
                                    Set default
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setEditingAddress(address)}
                                  className="px-2 py-1 text-xs font-semibold text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteAddress(address.id)}
                                  className="px-2 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-full hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

