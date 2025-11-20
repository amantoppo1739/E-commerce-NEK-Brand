'use client';

import { useCallback, useEffect, useState, type ReactNode, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Undo2,
  RefreshCw,
  Search,
  Package,
  TrendingUp,
  AlertTriangle,
  Minus,
  Plus as PlusIcon,
  ExternalLink,
  X,
} from 'lucide-react';
import { Product, ProductStatus } from '@/types/product';
import { ProductDrawer } from '@/components/admin/ProductDrawer';
import { LOW_INVENTORY_THRESHOLD } from '@/lib/constants/inventory';

type AdminProduct = Product & {
  minPrice: number;
  maxPrice: number;
  totalInventory: number;
  lowInventory: boolean;
};

type ProductsResponse = {
  data: AdminProduct[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  metrics: {
    totalProducts: number;
    featuredProducts: number;
    totalInventory: number;
    lowInventoryProducts: number;
    priceRange: { min: number; max: number };
  };
  filters: {
    categories: string[];
  };
};

const PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

export default function AdminProductsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ARCHIVED' | 'all'>('ACTIVE');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    product?: AdminProduct | null;
  }>({
    open: false,
    mode: 'create',
    product: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [previewProduct, setPreviewProduct] = useState<AdminProduct | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: PAGE_SIZE.toString(),
    });
    if (searchQuery) params.set('search', searchQuery);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (featuredFilter !== 'all') params.set('featured', featuredFilter);
    params.set('status', statusFilter);

    try {
      const response = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to load products.');
      }
      setData(json);
      setCategoryOptions(json.filters?.categories ?? []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, categoryFilter, featuredFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetFilters = () => {
    setCategoryFilter('all');
    setFeaturedFilter('all');
    setStatusFilter('ACTIVE');
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleArchive = async (productId: string) => {
    if (!confirm('Archive this product? You can restore it later.')) {
      return;
    }
    setActionLoading(productId);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to archive product.');
      }
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to archive product.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (productId: string, status: ProductStatus) => {
    setActionLoading(productId);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to update status.');
      }
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update product status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInventoryAdjustment = async (productId: string, variantId: string, delta: number) => {
    const key = `${productId}-${variantId}`;
    setInventoryLoading(key);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryAdjustments: [{ variantId, delta }] }),
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to adjust inventory.');
      }
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust inventory.');
    } finally {
      setInventoryLoading(null);
    }
  };

  const openCreateDrawer = () =>
    setDrawerState({
      open: true,
      mode: 'create',
      product: null,
    });

  const openEditDrawer = (product: AdminProduct) =>
    setDrawerState({
      open: true,
      mode: 'edit',
      product,
    });

  const closeDrawer = () =>
    setDrawerState((prev) => ({
      ...prev,
      open: false,
    }));

  const handleDrawerSaved = () => {
    fetchProducts();
  };

  const handleCategoryCreated = (category: string) => {
    setCategoryOptions((prev) => {
      if (prev.includes(category)) {
        return prev;
      }
      return [...prev, category].sort((a, b) => a.localeCompare(b));
    });
  };

  const handleFilterCategorySubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      return;
    }
    handleCategoryCreated(trimmed);
    setCategoryFilter(trimmed);
    setAddingCategory(false);
    setNewCategoryName('');
  };

  const openPreview = (product: AdminProduct) => {
    setPreviewProduct(product);
  };

  const closePreview = () => {
    setPreviewProduct(null);
  };

  const metrics = data?.metrics;
  const products = data?.data ?? [];

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-2 text-gray-600">Search, edit, and manage inventory.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchProducts}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Package className="h-5 w-5 text-gray-600" />}
            label="Total products"
            value={metrics ? metrics.totalProducts.toString() : '--'}
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5 text-gray-600" />}
            label="Total inventory"
            value={metrics ? `${metrics.totalInventory.toLocaleString()} units` : '--'}
          />
          <MetricCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            label="Low inventory"
            value={metrics ? metrics.lowInventoryProducts.toString() : '--'}
            helper={`≤ ${LOW_INVENTORY_THRESHOLD} units`}
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5 text-gray-600" />}
            label="Price range"
            value={
              metrics
                ? `${formatCurrency(metrics.priceRange.min)} - ${formatCurrency(metrics.priceRange.max)}`
                : '--'
            }
          />
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as 'ACTIVE' | 'ARCHIVED' | 'all');
              setPage(1);
            }}
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Archived', value: 'ARCHIVED' },
              { label: 'All', value: 'all' },
            ]}
          />
          <div className="space-y-2">
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
              options={[
                { label: 'All categories', value: 'all' },
                ...categoryOptions.map((category) => ({ label: category, value: category })),
              ]}
            />
            {addingCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="New category"
                />
                <button
                  type="button"
                  onClick={handleFilterCategorySubmit as any}
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingCategory(false);
                    setNewCategoryName('');
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                onClick={() => setAddingCategory(true)}
              >
                + Add category
              </button>
            )}
          </div>
          <Select
            label="Featured"
            value={featuredFilter}
            onChange={(value) => {
              setFeaturedFilter(value as 'all' | 'true' | 'false');
              setPage(1);
            }}
            options={[
              { label: 'All products', value: 'all' },
              { label: 'Featured', value: 'true' },
              { label: 'Not featured', value: 'false' },
            ]}
          />
          <div className="md:col-span-4">
            <label className="sr-only" htmlFor="product-search">
              Search products
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="product-search"
                type="text"
                placeholder="Search by name, slug, SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 text-right">
          <button
            onClick={resetFilters}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Reset filters
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <p className="text-gray-600">No products found. Try adjusting your filters.</p>
            <button
              onClick={openCreateDrawer}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Create your first product
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                          <StatusBadge status={(product.status ?? 'ACTIVE') as ProductStatus} />
                          {product.featured && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">/{product.slug}</p>
                        <p className="text-sm text-gray-600">Category: {product.category}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openPreview(product)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          Quick view
                        </button>
                        <Link
                          href={`/products/${product.slug}`}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View page
                        </Link>
                        <button
                          onClick={() => openEditDrawer(product)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        {product.status === 'ARCHIVED' ? (
                          <button
                            onClick={() => handleStatusUpdate(product.id, 'ACTIVE')}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            disabled={actionLoading === product.id}
                          >
                            <Undo2 className="h-4 w-4" />
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(product.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            disabled={actionLoading === product.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            Archive
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <Stat
                        label="Price range"
                        value={`${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`}
                      />
                      <Stat
                        label="Total inventory"
                        value={`${product.totalInventory} units`}
                        highlight={product.lowInventory}
                      />
                      <Stat label="Variants" value={`${product.variants.length}`} />
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Variants & inventory
                      </p>
                      <div className="mt-3 space-y-3">
                        {product.variants.map((variant) => {
                          const key = `${product.id}-${variant.id}`;
                          const isAdjusting = inventoryLoading === key;
                          return (
                            <div
                              key={variant.id}
                              className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {variant.material} {variant.size ? `• Size ${variant.size}` : ''}
                                </p>
                                <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-4">
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(variant.price)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleInventoryAdjustment(product.id, variant.id, -1)}
                                    disabled={isAdjusting || variant.inventory <= 0}
                                    className="rounded-full border border-gray-300 p-1 text-gray-600 hover:bg-white disabled:opacity-50"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <div
                                    className={`min-w-[70px] rounded-full px-3 py-1 text-center text-xs font-semibold ${
                                      variant.inventory <= LOW_INVENTORY_THRESHOLD
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-white text-gray-900'
                                    }`}
                                  >
                                    {variant.inventory} in stock
                                  </div>
                                  <button
                                    onClick={() => handleInventoryAdjustment(product.id, variant.id, 1)}
                                    disabled={isAdjusting}
                                    className="rounded-full border border-gray-300 p-1 text-gray-600 hover:bg-white disabled:opacity-50"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-600">
              Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1}-
              {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of{' '}
              {data.pagination.total}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(data.pagination.totalPages, prev + 1))}
                disabled={page === data.pagination.totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductDrawer
        open={drawerState.open}
        mode={drawerState.mode}
        product={drawerState.product ?? undefined}
        onClose={closeDrawer}
        onSaved={handleDrawerSaved}
        categoryOptions={categoryOptions}
        onCategoryCreated={handleCategoryCreated}
      />
      {previewProduct && <ProductPreviewDialog product={previewProduct} onClose={closePreview} />}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gray-100 p-2">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          {helper && <p className="text-xs text-gray-500">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const isActive = status !== 'ARCHIVED';
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
      }`}
    >
      {isActive ? 'Active' : 'Archived'}
    </span>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function ProductPreviewDialog({
  product,
  onClose,
}: {
  product: AdminProduct;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images ?? [];
  const activeImage = images[activeIndex] ?? images[0];

  useEffect(() => {
    setActiveIndex(0);
  }, [product.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <div className="relative h-64 w-full overflow-hidden rounded-xl border bg-gray-50">
              {activeImage ? (
                <Image src={activeImage} alt={product.name} fill className="object-cover" sizes="100%" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-16 w-16 overflow-hidden rounded-md border ${
                      index === activeIndex ? 'ring-2 ring-gray-900' : ''
                    }`}
                  >
                    <Image src={image} alt={`${product.name} thumbnail`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{product.category}</p>
              <h3 className="text-2xl font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.slug}</p>
            </div>
            <p className="text-sm text-gray-600">{product.description.slice(0, 320)}{product.description.length > 320 ? '…' : ''}</p>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variants</p>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="text-sm text-gray-700">
                    <span className="font-medium">{variant.material}</span>
                    {variant.size ? ` • Size ${variant.size}` : ''} — {formatCurrency(variant.price)} ({variant.inventory}{' '}
                    in stock)
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                onClick={onClose}
              >
                View product page
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
