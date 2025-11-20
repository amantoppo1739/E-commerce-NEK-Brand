import { z } from 'zod';
import { MAX_PRODUCT_IMAGES } from '@/lib/constants/inventory';

export const productVariantInputSchema = z.object({
  id: z.string().cuid().optional(),
  size: z
    .string()
    .trim()
    .max(50)
    .optional()
    .or(z.literal('').optional())
    .transform((val) => (val ? val : undefined)),
  material: z.string().trim().min(1).max(120),
  price: z.number().min(0),
  inventory: z.number().int().min(0),
  sku: z.string().trim().min(1).max(120),
  image: z.string().url().optional().or(z.literal('').transform(() => undefined)),
});

const baseProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes.'),
  description: z.string().trim().min(10),
  category: z.string().trim().min(2).max(80),
  featured: z.boolean().optional().default(false),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  images: z.array(z.string().url()).min(1).max(MAX_PRODUCT_IMAGES),
  variants: z.array(productVariantInputSchema).min(1).max(25),
});

export const createProductSchema = baseProductSchema;

export const inventoryAdjustmentSchema = z.object({
  variantId: z.string().cuid(),
  delta: z.number().int(),
});

export const updateProductSchema = baseProductSchema
  .partial()
  .extend({
    images: baseProductSchema.shape.images.optional(),
    variants: z.array(productVariantInputSchema).optional(),
    deleteVariantIds: z.array(z.string().cuid()).optional(),
    inventoryAdjustments: z.array(inventoryAdjustmentSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.variants && !data.inventoryAdjustments && !data.deleteVariantIds) {
        return true;
      }
      return true;
    },
    {
      message: 'Provide at least one change to update the product.',
      path: ['root'],
    }
  );

export const slugCheckSchema = z.object({
  slug: baseProductSchema.shape.slug,
  excludeId: z.string().cuid().optional(),
});

export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;

