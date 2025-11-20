import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from '@/components/ProductDetailClient';
import BackLink from '@/components/BackLink';
import type { Product } from '@/types/product';

interface ProductPageProps {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
      },
    });

    if (!product) return null;

  // Convert to Product type format
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    slug: product.slug,
    featured: product.featured,
    images: product.images,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size || undefined,
      material: v.material,
      price: v.price,
      inventory: v.inventory,
      sku: v.sku,
    })),
  };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export const dynamic = 'force-dynamic'; // Force dynamic rendering to avoid build-time DB access
export const dynamicParams = true; // Allow dynamic params that weren't generated at build time

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <BackLink label="Back to products" fallbackHref="/products" className="mb-6 inline-flex" />
        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}

