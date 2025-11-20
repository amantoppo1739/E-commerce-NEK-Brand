export interface ProductVariant {
  id: string;
  size?: string;
  material: string;
  price: number;
  inventory: number;
  sku: string;
  image?: string | null;
}

export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  variants: ProductVariant[];
  featured: boolean;
  slug: string;
  status?: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  cartItemId?: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

