import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createProductSchema } from '@/lib/validators/adminProduct';
import { LOW_INVENTORY_THRESHOLD } from '@/lib/constants/inventory';
import type { ProductStatus } from '@/types/product';

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  featured: boolean;
  status?: ProductStatus;
  images: string[];
  variants: Array<{
    id: string;
    price: number;
    inventory: number;
    sku: string;
    size: string | null;
    material: string;
  }>;
};

type AdminProductRow = ProductRecord & {
  minPrice: number;
  maxPrice: number;
  totalInventory: number;
  lowInventory: boolean;
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const isAdmin = (session.user as any)?.role === 'admin';
  if (!isAdmin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}

function buildProductWhere(searchParams: URLSearchParams) {
  const where: Record<string, unknown> = {};
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const status = searchParams.get('status');

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category && category !== 'all') {
    where.category = category;
  }

  if (featured === 'true') {
    where.featured = true;
  } else if (featured === 'false') {
    where.featured = false;
  }

  if (status) {
    if (status !== 'all') {
      where.status = status.toUpperCase() as ProductStatus;
    }
  } else {
    where.status = 'ACTIVE';
  }

  return where;
}

export async function GET(request: Request) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const where = buildProductWhere(searchParams);
    const prismaWhere = where as any;
    const featuredWhere = {
      ...(where as Record<string, unknown>),
      featured: true,
    };

    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSizeParam = Number(searchParams.get('pageSize') ?? '10');
    const pageSize = Math.max(5, Math.min(50, Number.isNaN(pageSizeParam) ? 10 : pageSizeParam));
    const skip = (page - 1) * pageSize;

    const [rawProducts, total, featuredCount, inventoryAggregate, rawCategories] = await Promise.all([
      prisma.product.findMany({
        where: prismaWhere,
        include: {
          variants: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where: prismaWhere }),
      prisma.product.count({ where: featuredWhere as any }),
      prisma.productVariant.aggregate({
        where: {
          product: {
            is: prismaWhere,
          },
        },
        _sum: { inventory: true },
      }),
      prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
    ]);

    const products = rawProducts as ProductRecord[];
    const categories = rawCategories as Array<{ category: string | null }>;

    const formattedProducts: AdminProductRow[] = products.map((product) => {
      const variantList = product.variants as Array<{ price: number; inventory: number }>;
      const prices = variantList.map((variant) => variant.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const totalInventory = variantList.reduce((sum, variant) => sum + variant.inventory, 0);
      const lowInventory = variantList.some((variant) => variant.inventory <= LOW_INVENTORY_THRESHOLD);

      const enriched: AdminProductRow = {
        ...product,
        minPrice,
        maxPrice,
        totalInventory,
        lowInventory,
      };

      return enriched;
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const metrics = {
      totalProducts: total,
      featuredProducts: featuredCount,
      totalInventory: inventoryAggregate._sum.inventory ?? 0,
      lowInventoryProducts: formattedProducts.filter((product) => product.lowInventory).length,
      priceRange: {
        min:
          formattedProducts.length > 0
            ? Math.min(...formattedProducts.map((product) => product.minPrice))
            : 0,
        max:
          formattedProducts.length > 0
            ? Math.max(...formattedProducts.map((product) => product.maxPrice))
            : 0,
      },
    };

    const categoryValues = categories
      .map((item) => item.category)
      .filter((category): category is string => Boolean(category));

    return NextResponse.json({
      data: formattedProducts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        categories: categoryValues,
      },
      metrics,
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  try {
    const payload = await request.json();
    const result = createProductSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 422 }
      );
    }

    const data = result.data;

    const existingSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Slug already exists. Please choose another.' },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        category: data.category,
        featured: data.featured ?? false,
        status: data.status ?? ('ACTIVE' as ProductStatus),
        images: data.images,
        variants: {
          create: data.variants.map((variant) => ({
            size: variant.size ?? null,
            material: variant.material,
            price: variant.price,
            inventory: variant.inventory,
            sku: variant.sku,
            image: variant.image ?? null,
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

