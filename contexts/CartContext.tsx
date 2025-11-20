'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product, ProductVariant } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('nek-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const syncServerCart = async (cartItems: CartItem[]) => {
    try {
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product.id,
            variantId: item.variant.id,
            quantity: item.quantity,
          })),
        }),
      });
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const handleAuthChange = async () => {
      if (isAuthenticated) {
        try {
          const localCart = localStorage.getItem('nek-cart');
          if (localCart) {
            const parsed = JSON.parse(localCart);
            await syncServerCart(parsed);
            localStorage.removeItem('nek-cart');
          }
          const response = await fetch('/api/cart');
          if (response.ok) {
            const data = await response.json();
            setItems(
              data.map((item: any) => ({
                cartItemId: item.id,
                product: item.product,
                variant: item.variant,
                quantity: item.quantity,
              }))
            );
          }
        } catch (error) {
          console.error('Error loading server cart:', error);
        }
      } else {
        const savedCart = localStorage.getItem('nek-cart');
        if (savedCart) {
          try {
            setItems(JSON.parse(savedCart));
          } catch (error) {
            console.error('Error loading cart from localStorage:', error);
          }
        } else {
          setItems([]);
        }
      }
    };

    handleAuthChange();
  }, [isAuthenticated, mounted]);

  const updateCartState = (updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prevItems) => {
      const updatedItems = updater(prevItems);
      if (isAuthenticated) {
        syncServerCart(updatedItems);
      }
      if (mounted) {
        localStorage.setItem('nek-cart', JSON.stringify(updatedItems));
      }
      return updatedItems;
    });
  };

  const addToCart = (product: Product, variant: ProductVariant, quantity = 1) => {
    updateCartState((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id && item.variant.id === variant.id
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id && item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, { product, variant, quantity }];
    });
  };

  const removeFromCart = (itemId: string) => {
    updateCartState((prevItems) => prevItems.filter((item) => item.variant.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    updateCartState((prevItems) =>
      prevItems.map((item) =>
        item.variant.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    updateCartState(() => []);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.variant.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

