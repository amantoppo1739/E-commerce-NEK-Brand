'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X, Upload, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, ProductStatus } from '@/types/product';
import { MAX_PRODUCT_IMAGES } from '@/lib/constants/inventory';

type VariantForm = {
  id?: string;
  localId: string;
  size?: string;
  material: string;
  price: string;
  inventory: string;
  sku: string;
  image?: string;
};

type DrawerMode = 'create' | 'edit';

interface ProductDrawerProps {
  open: boolean;
  mode: DrawerMode;
  product?: Product;
  onClose: () => void;
  onSaved: () => void;
  categoryOptions: string[];
  onCategoryCreated?: (category: string) => void;
}

const generateLocalId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 9);

const defaultVariant = (): VariantForm => ({
  localId: generateLocalId(),
  material: '',
  price: '',
  inventory: '0',
  sku: '',
  image: '',
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export function ProductDrawer({
  open,
  mode,
  product,
  onClose,
  onSaved,
  categoryOptions,
  onCategoryCreated,
}: ProductDrawerProps) {
  const [formValues, setFormValues] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    featured: false,
    status: 'ACTIVE' as ProductStatus,
    images: [] as string[],
  });
  const [variants, setVariants] = useState<VariantForm[]>([defaultVariant()]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(categoryOptions);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState('');

  useEffect(() => {
    setAvailableCategories(categoryOptions);
  }, [categoryOptions]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && product) {
        setFormValues({
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          featured: product.featured,
          status: (product.status ?? 'ACTIVE') as ProductStatus,
          images: product.images ?? [],
        });
        setVariants(
          product.variants.map((variant) => ({
            id: variant.id,
            localId: generateLocalId(),
            size: variant.size ?? undefined,
            material: variant.material,
            price: variant.price.toString(),
            inventory: variant.inventory.toString(),
            sku: variant.sku,
            image: variant.image ?? '',
          }))
        );
        if (!categoryOptions.includes(product.category)) {
          setAvailableCategories((prev) =>
            prev.includes(product.category) ? prev : [...prev, product.category]
          );
        }
        setDeletedVariantIds([]);
      } else {
        resetForm();
      }
      setError(null);
      setSuccessMessage(null);
      setSlugStatus('idle');
      setSlugManuallyEdited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, mode]);

  const resetForm = () => {
    setFormValues({
      name: '',
      slug: '',
      description: '',
      category: availableCategories[0] ?? '',
      featured: false,
      status: 'ACTIVE',
      images: [],
    });
    setVariants([defaultVariant()]);
    setDeletedVariantIds([]);
  };

  const canAddMoreImages = formValues.images.length < MAX_PRODUCT_IMAGES;

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategorySelect = (value: string) => {
    handleFieldChange('category', value);
  };

  const handleCategorySubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      return;
    }
    if (!availableCategories.includes(trimmed)) {
      const updatedCategories = [...availableCategories, trimmed].sort((a, b) =>
        a.localeCompare(b)
      );
      setAvailableCategories(updatedCategories);
      onCategoryCreated?.(trimmed);
    }
    handleFieldChange('category', trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleNameChange = (value: string) => {
    handleFieldChange('name', value);
    if (!slugManuallyEdited) {
      handleFieldChange('slug', slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    const formatted = slugify(value);
    setSlugManuallyEdited(true);
    setSlugStatus('idle');
    handleFieldChange('slug', formatted);
  };

  const handleSlugBlur = async () => {
    if (!formValues.slug) {
      return;
    }
    setSlugStatus('checking');
    try {
      const response = await fetch('/api/admin/products/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: formValues.slug, excludeId: product?.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check slug');
      }
      setSlugStatus(data.available ? 'available' : 'taken');
    } catch (err) {
      console.error(err);
      setSlugStatus('idle');
    }
  };

  const handleVariantChange = (localId: string, field: keyof VariantForm, value: string) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.localId === localId
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      )
    );
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, defaultVariant()]);
  };

  const removeVariant = (localId: string) => {
    setVariants((prev) => {
      const target = prev.find((variant) => variant.localId === localId);
      if (target?.id) {
        setDeletedVariantIds((ids) => [...ids, target.id!]);
      }
      return prev.filter((variant) => variant.localId !== localId);
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    let remainingSlots = MAX_PRODUCT_IMAGES - formValues.images.length;
    if (remainingSlots <= 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (remainingSlots <= 0) break;
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/admin/products/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }
        setFormValues((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
        remainingSlots -= 1;
      } catch (err) {
        console.error(err);
        setError('Failed to upload one or more images. Please try again.');
      }
    }

    setUploading(false);
  };

  const handleImageUrlAdd = () => {
    if (!pendingImageUrl.trim()) return;
    if (!canAddMoreImages) return;
    setFormValues((prev) => ({
      ...prev,
      images: [...prev.images, pendingImageUrl.trim()],
    }));
    setPendingImageUrl('');
  };

  const removeImage = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setFormValues((prev) => {
      const nextImages = [...prev.images];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= nextImages.length) {
        return prev;
      }
      [nextImages[index], nextImages[targetIndex]] = [nextImages[targetIndex], nextImages[index]];
      return { ...prev, images: nextImages };
    });
  };

  const parsedVariants = useMemo(() => {
    return variants.map((variant) => ({
      id: variant.id,
      size: variant.size?.trim() || undefined,
      material: variant.material.trim(),
      price: Number(variant.price),
      inventory: Number(variant.inventory),
      sku: variant.sku.trim(),
      image: variant.image?.trim() || undefined,
    }));
  }, [variants]);

  const validatePayload = () => {
    if (!formValues.name.trim()) {
      setError('Name is required.');
      return false;
    }
    if (!formValues.slug.trim()) {
      setError('Slug is required.');
      return false;
    }
    if (!formValues.category.trim()) {
      setError('Category is required.');
      return false;
    }
    if (!formValues.description.trim()) {
      setError('Description is required.');
      return false;
    }
    if (!formValues.images.length) {
      setError('Add at least one product image.');
      return false;
    }
    if (!parsedVariants.length) {
      setError('Add at least one variant.');
      return false;
    }
    for (const variant of parsedVariants) {
      if (!variant.material) {
        setError('Each variant requires a material.');
        return false;
      }
      if (!variant.sku) {
        setError('Each variant requires a SKU.');
        return false;
      }
      if (Number.isNaN(variant.price)) {
        setError('Variant prices must be valid numbers.');
        return false;
      }
      if (Number.isNaN(variant.inventory)) {
        setError('Variant inventory must be a number.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validatePayload()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formValues.name.trim(),
        slug: formValues.slug.trim(),
        description: formValues.description.trim(),
        category: formValues.category.trim(),
        featured: formValues.featured,
        status: formValues.status,
        images: formValues.images,
        variants: parsedVariants,
      };

      if (mode === 'edit' && deletedVariantIds.length) {
        payload.deleteVariantIds = deletedVariantIds;
      }

      const endpoint =
        mode === 'edit' && product
          ? `/api/admin/products/${product.id}`
          : '/api/admin/products';

      const response = await fetch(endpoint, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setSuccessMessage(mode === 'edit' ? 'Product updated!' : 'Product created!');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Product' : 'Create Product'}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === 'edit'
                ? 'Update product details, variants, images, and inventory.'
                : 'Add a new product to your catalog.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          id="product-drawer-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-8"
        >
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Basics</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  value={formValues.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  value={formValues.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  onBlur={handleSlugBlur}
                  required
                />
                {slugStatus === 'checking' && <p className="text-xs text-gray-500">Checking slug...</p>}
                {slugStatus === 'taken' && (
                  <p className="text-xs text-red-600">This slug is already in use.</p>
                )}
                {slugStatus === 'available' && (
                  <p className="text-xs text-green-600">Slug is available.</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Category</label>
              {availableCategories.length > 0 ? (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  value={formValues.category}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  value={formValues.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  placeholder="Enter category"
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              {!isAddingCategory ? (
                <button
                  type="button"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  onClick={() => setIsAddingCategory(true)}
                >
                  + Add new category
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="New category name"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleCategorySubmit()}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  value={formValues.status}
                  onChange={(e) => handleFieldChange('status', e.target.value as ProductStatus)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                rows={4}
                value={formValues.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="featured"
                type="checkbox"
                checked={formValues.featured}
                onChange={(e) => handleFieldChange('featured', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="featured" className="text-sm text-gray-700">
                Mark as featured product
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Images</h3>
              <p className="text-xs text-gray-500">
                {formValues.images.length}/{MAX_PRODUCT_IMAGES} used
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {formValues.images.map((image, index) => (
                <div key={image} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-1 py-0.5 text-xs text-white">
                    <button
                      type="button"
                      className="p-1 disabled:opacity-50"
                      onClick={() => moveImage(index, 'left')}
                      disabled={index === 0}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="p-1 disabled:opacity-50"
                      onClick={() => moveImage(index, 'right')}
                      disabled={index === formValues.images.length - 1}
                    >
                      ›
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-600 shadow"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {canAddMoreImages && (
              <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 p-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  Upload images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => handleImageUpload(event.target.files)}
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Paste image URL"
                      value={pendingImageUrl}
                      onChange={(e) => setPendingImageUrl(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleImageUrlAdd}
                      className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                      disabled={!pendingImageUrl}
                    >
                      Add
                    </button>
                  </div>
                  {uploading && <p className="text-xs text-gray-500">Uploading...</p>}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                + Add variant
              </button>
            </div>
            <div className="space-y-4">
              {variants.map((variant) => (
                <div key={variant.localId} className="rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Variant {variant.material || variant.sku || ''}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.localId)}
                      className="text-sm text-red-600 hover:text-red-700"
                      disabled={variants.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Material</label>
                      <input
                        type="text"
                        value={variant.material}
                        onChange={(e) => handleVariantChange(variant.localId, 'material', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Size</label>
                      <input
                        type="text"
                        value={variant.size ?? ''}
                        onChange={(e) => handleVariantChange(variant.localId, 'size', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">SKU</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(variant.localId, 'sku', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Price (USD)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(variant.localId, 'price', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Inventory</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.inventory}
                        onChange={(e) => handleVariantChange(variant.localId, 'inventory', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        required
                      />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <label className="text-xs font-medium text-gray-600">Variant Image</label>
                      {formValues.images.length > 0 && (
                        <select
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          value={variant.image && formValues.images.includes(variant.image) ? variant.image : ''}
                          onChange={(e) => handleVariantChange(variant.localId, 'image', e.target.value)}
                        >
                          <option value="">Use product default</option>
                          {formValues.images.map((image) => (
                            <option key={`${variant.localId}-${image}`} value={image}>
                              {image}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="url"
                        placeholder="Or paste a custom image URL"
                        value={variant.image ?? ''}
                        onChange={(e) => handleVariantChange(variant.localId, 'image', e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                      {variant.image && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span>Preview:</span>
                          <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={variant.image} alt={`${variant.sku} preview`} className="h-full w-full object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </form>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-drawer-form"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            disabled={isSubmitting || uploading}
          >
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </div>
    </div>
  );
}

