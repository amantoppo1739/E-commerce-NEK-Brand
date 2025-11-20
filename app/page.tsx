import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';

export const revalidate = 3600; // Revalidate every hour (ISR)

async function getFeaturedProducts() {
  return await prisma.product.findMany({
    where: { featured: true },
    include: {
      variants: true,
    },
    take: 6,
  });
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  
  // Get one product per category for category section
  const categories = ['Necklaces', 'Rings', 'Earrings', 'Bracelets'];
  const categoryProducts = await Promise.all(
    categories.map((category) =>
      prisma.product.findFirst({
        where: { category },
        include: { variants: true },
      })
    )
  );

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Luxury Jewelry Collection
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Discover our exquisite collection of handcrafted jewelry pieces,
              each meticulously designed to celebrate elegance and timeless beauty.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/products"
                className="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors"
              >
                Shop Collection
              </Link>
              <Link
                href="/products?featured=true"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
              >
                View Featured <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Collection
            </h2>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              Handpicked pieces that define luxury and elegance
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {featuredProducts.map((product) => {
              // Convert to Product type format
              const productData = {
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
              return <ProductCard key={product.id} product={productData} />;
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Shop by Category
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => {
              const categoryProduct = categoryProducts[index];
              return (
                <Link
                  key={category}
                  href={`/products?category=${category}`}
                  className="group relative overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {categoryProduct && categoryProduct.images[0] && (
                      <Image
                        src={categoryProduct.images[0]}
                        alt={category}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-semibold text-white">{category}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

