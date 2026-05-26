import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/constants/api';
import type { Cart, CartItem } from '@/types/api';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Cart>(ENDPOINTS.cart.get);
      set({ cart: response.data || null, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch cart';
      set({ error: message, isLoading: false });
    }
  },

  addItem: async (productId, variantId, quantity = 1) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(ENDPOINTS.cart.addItem, {
        productId,
        variantId,
        quantity,
      });
      await get().fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      set({ error: message, isLoading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.patch(ENDPOINTS.cart.updateItem(itemId), { quantity });
      await get().fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item';
      set({ error: message, isLoading: false });
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(ENDPOINTS.cart.removeItem(itemId));
      await get().fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
