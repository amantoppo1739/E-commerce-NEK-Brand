'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { Product, ProductVariant } from '@/types/product';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0]
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.variants[0].size || null
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    product.variants[0].material
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  // Filter variants based on selected material and size
  const availableVariants = product.variants.filter((v) => {
    if (selectedSize && v.size !== selectedSize) return false;
    if (v.material !== selectedMaterial) return false;
    return true;
  });

  const currentVariant = availableVariants[0] || product.variants[0];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleAddToCart = () => {
    addToCart(product, currentVariant, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const uniqueSizes = Array.from(
    new Set(product.variants.map((v) => v.size).filter(Boolean))
  );
  const uniqueMaterials = Array.from(new Set(product.variants.map((v) => v.material)));

  const isInStock = currentVariant.inventory > 0;
  const disableAdd = !isInStock || quantity > currentVariant.inventory;

  return (
    <div className="relative grid grid-cols-1 gap-12 pb-28 lg:grid-cols-2 lg:pb-0">
      {/* Image Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
          <Image
            src={product.images[selectedImageIndex]}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                  selectedImageIndex === index
                    ? 'border-gray-900'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-2 text-lg text-gray-500">{product.category}</p>

        <div className="mt-6">
          <p className="text-3xl font-bold text-gray-900">
            {formatPrice(currentVariant.price)}
          </p>
          {currentVariant.inventory > 0 && currentVariant.inventory < 10 && (
            <p className="mt-2 text-sm text-amber-600">
              Only {currentVariant.inventory} left in stock
            </p>
          )}
          {!isInStock && (
            <p className="mt-2 text-sm text-red-600">Out of stock</p>
          )}
        </div>

        <div className="mt-8">
          <p className="text-base text-gray-700 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Variant Selection */}
        <div className="mt-8 space-y-6">
          {/* Material Selection */}
          {uniqueMaterials.length > 1 && (
            <div>
              <label className="text-sm font-medium text-gray-900">Material</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueMaterials.map((material) => (
                  <button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedMaterial === material
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {uniqueSizes.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-900">Size</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const sizeVariants = product.variants.filter(
                    (v) => v.size === size && v.material === selectedMaterial
                  );
                  const sizeInStock = sizeVariants.some((v) => v.inventory > 0);
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size || null)}
                      disabled={!sizeInStock}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                        !sizeInStock
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : selectedSize === size
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div>
            <label className="text-sm font-medium text-gray-900">Quantity</label>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(currentVariant.inventory, quantity + 1))
                  }
                  disabled={quantity >= currentVariant.inventory}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Max: {currentVariant.inventory} available
              </p>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={disableAdd}
            className={`hidden w-full items-center justify-center gap-2 rounded-md px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors lg:flex ${
              disableAdd
                ? 'cursor-not-allowed bg-gray-400'
                : addedToCart
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {addedToCart ? (
              <>
                <Check className="h-5 w-5" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                {isInStock ? 'Add to Cart' : 'Out of Stock'}
              </>
            )}
          </button>

          {/* Product Details */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Product Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex">
                <dt className="font-medium text-gray-500 w-24">SKU</dt>
                <dd className="text-gray-900">{currentVariant.sku}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-gray-500 w-24">Material</dt>
                <dd className="text-gray-900">{currentVariant.material}</dd>
              </div>
              {currentVariant.size && (
                <div className="flex">
                  <dt className="font-medium text-gray-500 w-24">Size</dt>
                  <dd className="text-gray-900">{currentVariant.size}</dd>
                </div>
              )}
              <div className="flex">
                <dt className="font-medium text-gray-500 w-24">Availability</dt>
                <dd className="text-gray-900">
                  {isInStock ? 'In Stock' : 'Out of Stock'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Mobile sticky add to cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-4 shadow-2xl lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(currentVariant.price)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={disableAdd}
            className={`flex-1 rounded-md px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
              disableAdd
                ? 'cursor-not-allowed bg-gray-400'
                : addedToCart
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {addedToCart ? 'Added to Cart' : isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

