import ProductCard from '@/components/ProductCard';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import { prisma } from '@/lib/prisma';

interface ProductsPageProps {
  searchParams: {
    category?: string;
    featured?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    q?: string;
  };
}

async function getProducts(params: ProductsPageProps['searchParams']) {
  const where: any = {};

  if (params.category) {
    where.category = params.category;
  }

  if (params.featured === 'true') {
    where.featured = true;
  }

  const variantFilters: any = {};

  if (params.material) {
    variantFilters.material = params.material;
  }

  if (params.minPrice || params.maxPrice) {
    const min = params.minPrice ? parseFloat(params.minPrice) : 0;
    const max = params.maxPrice ? parseFloat(params.maxPrice) : undefined;

    variantFilters.price = {
      gte: min,
      ...(max ? { lte: max } : {}),
    };
  }

  if (params.inStock === 'true') {
    variantFilters.inventory = {
      gt: 0,
    };
  }

  if (Object.keys(variantFilters).length > 0) {
    where.variants = {
      some: variantFilters,
    };
  }

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
      { category: { contains: params.q, mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      variants: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return products;
}

export const revalidate = 3600;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const products = await getProducts(searchParams);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <CatalogFilters />
          </div>

          <div className="lg:col-span-3">
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {searchParams.category
                  ? `${searchParams.category}`
                  : searchParams.featured === 'true'
                  ? 'Featured Products'
                  : 'All Products'}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 rounded-lg bg-white shadow-sm">
                <p className="text-gray-500">No products found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

