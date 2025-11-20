'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const categories = ['Necklaces', 'Rings', 'Earrings', 'Bracelets'];
const materials = ['14K Gold', '18K Gold', 'Platinum', 'White Gold', 'Yellow Gold', 'Rose Gold'];

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(searchParams.get('material'));
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '');
  const [inStock, setInStock] = useState<boolean>(searchParams.get('inStock') === 'true');
  const [search, setSearch] = useState<string>(searchParams.get('q') || '');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedCategory) params.set('category', selectedCategory);
    else params.delete('category');

    if (selectedMaterial) params.set('material', selectedMaterial);
    else params.delete('material');

    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');

    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');

    if (inStock) params.set('inStock', 'true');
    else params.delete('inStock');

    if (debouncedSearch) params.set('q', debouncedSearch);
    else params.delete('q');

    const newUrl = `/products?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedCategory, selectedMaterial, minPrice, maxPrice, inStock, debouncedSearch, router, searchParams]);

  useEffect(() => {
    const category = searchParams.get('category');
    const material = searchParams.get('material');
    const min = searchParams.get('minPrice') || '';
    const max = searchParams.get('maxPrice') || '';
    const stock = searchParams.get('inStock') === 'true';
    const query = searchParams.get('q') || '';

    setSelectedCategory(category);
    setSelectedMaterial(material);
    setMinPrice(min);
    setMaxPrice(max);
    setInStock(stock);
    setSearch(query);
  }, [searchParams]);

  return (
    <aside className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-semibold text-gray-900">Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-900">Category</label>
        <div className="mt-3 space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedCategory === category}
                onChange={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              {category}
            </label>
          ))}
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="text-xs text-gray-500 underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-900">Material</label>
        <div className="mt-3 space-y-2">
          {materials.map((material) => (
            <label key={material} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="material"
                value={material}
                checked={selectedMaterial === material}
                onChange={() => setSelectedMaterial(selectedMaterial === material ? null : material)}
                className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              {material}
            </label>
          ))}
          <button
            type="button"
            onClick={() => setSelectedMaterial(null)}
            className="text-xs text-gray-500 underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-900">Price Range</label>
        <div className="mt-3 flex gap-3">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="inStock"
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
          In stock only
        </label>
      </div>
    </aside>
  );
}

