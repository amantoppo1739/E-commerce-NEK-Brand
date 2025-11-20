import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));
  const priceDisplay =
    minPrice === maxPrice
      ? formatPrice(minPrice)
      : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.featured && (
          <span className="absolute top-2 left-2 rounded-full bg-gray-900 px-2 py-1 text-xs font-medium text-white">
            Featured
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{product.category}</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">{priceDisplay}</p>
      </div>
    </Link>
  );
}

