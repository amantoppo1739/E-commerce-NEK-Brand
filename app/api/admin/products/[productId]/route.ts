import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ProductStatus } from '@prisma/client';
import {
  updateProductSchema,
  inventoryAdjustmentSchema,
} from '@/lib/validators/adminProduct';

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

export async function GET(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: { variants: { orderBy: { createdAt: 'asc' } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error retrieving product:', error);
    return NextResponse.json(
      { error: 'Failed to load product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  const { productId } = params;

  try {
    const payload = await request.json();
    const result = updateProductSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 422 }
      );
    }

    const data = result.data;

    if (data.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: productId },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'Slug already exists. Please choose another.' },
          { status: 409 }
        );
      }
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name ?? undefined,
          slug: data.slug ?? undefined,
          description: data.description ?? undefined,
          category: data.category ?? undefined,
          featured: data.featured ?? undefined,
          status: (data.status as ProductStatus | undefined) ?? undefined,
          images: data.images ?? undefined,
        },
      });

      if (data.variants) {
        for (const variant of data.variants) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                size: variant.size ?? null,
                material: variant.material,
                price: variant.price,
                inventory: variant.inventory,
                sku: variant.sku,
                image: variant.image ?? null,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId,
                size: variant.size ?? null,
                material: variant.material,
                price: variant.price,
                inventory: variant.inventory,
                sku: variant.sku,
                image: variant.image ?? null,
              },
            });
          }
        }
      }

      if (data.deleteVariantIds?.length) {
        await tx.productVariant.deleteMany({
          where: {
            id: { in: data.deleteVariantIds },
            productId,
          },
        });
      }

      if (data.inventoryAdjustments?.length) {
        for (const adjustment of data.inventoryAdjustments) {
          const adjustmentResult = inventoryAdjustmentSchema.safeParse(adjustment);
          if (!adjustmentResult.success) {
            throw new Error('Invalid inventory adjustment payload');
          }

          const variant = await tx.productVariant.findFirst({
            where: { id: adjustment.variantId, productId },
          });

          if (!variant) {
            throw new Error('Variant not found for inventory adjustment');
          }

          const nextInventory = variant.inventory + adjustment.delta;
          if (nextInventory < 0) {
            throw new Error('Inventory cannot be negative');
          }

          await tx.productVariant.update({
            where: { id: variant.id },
            data: { inventory: nextInventory },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: productId },
        include: {
          variants: { orderBy: { createdAt: 'asc' } },
        },
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return adminCheck.error;
  }

  try {
    const product = await prisma.product.update({
      where: { id: params.productId },
      data: { status: ProductStatus.ARCHIVED },
      include: { variants: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error archiving product:', error);
    return NextResponse.json(
      { error: 'Failed to archive product' },
      { status: 500 }
    );
  }
}

