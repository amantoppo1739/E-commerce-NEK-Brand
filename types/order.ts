import { Product, ProductVariant } from './product';

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  price: number; // Price at time of order
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  adminNotes?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin';
  addresses: Address[];
  createdAt: string;
}

