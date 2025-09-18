import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  product_type: 'course' | 'bundle';
  product_slug: string;
  category_slug?: string;
  variant_code?: string;
  product_enroll_id?: string;
  title: string;
  original_price: number;
  price: number;
  currency: string;
  thumbnail_url?: string;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  hasHydrated: boolean;
  
  // Actions
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  setCart: (items: CartItem[]) => void;
  clearCart: () => void;
  setHasHydrated: (value: boolean) => void;
  clearPersistedStorage: () => void;
  
  // Getters
  getItemCount: () => number;
  getTotalPrice: () => number;
  hasItem: (productId: string) => boolean;
  getDiscountTier: () => { tier: string; discount: number; minCourses: number } | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      hasHydrated: false,

      addItem: async (item: CartItem) => {
        const state = get();
        if (state.hasItem(item.product_id)) return;

        set({ isLoading: true });
        
        // Add to local state immediately
        set(state => ({ 
          items: [...state.items, item],
          isLoading: false 
        }));

        // Try to sync to database if user is signed in
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          
          if (!response.ok) {
            console.warn('Failed to sync cart to database');
          }
        } catch (error) {
          console.warn('Cart sync error:', error);
        }
      },

      removeItem: async (productId: string) => {
        set({ isLoading: true });
        
        // Remove from local state immediately
        set(state => ({ 
          items: state.items.filter(item => item.product_id !== productId),
          isLoading: false 
        }));

        // Try to sync to database
        try {
          await fetch('/api/cart', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          });
        } catch (error) {
          console.warn('Cart remove sync error:', error);
        }
      },

      setCart: (items: CartItem[]) => set({ items }),
      clearCart: () => set({ items: [] }),
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      clearPersistedStorage: () => {
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.removeItem('cart-storage');
          } catch {}
        }
      },

      getItemCount: () => get().items.length,
      
      getTotalPrice: () => {
        const { items, getDiscountTier } = get();
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        const discount = getDiscountTier();
        
        if (discount) {
          return subtotal * (1 - discount.discount / 100);
        }
        return subtotal;
      },

      hasItem: (productId: string) => {
        return get().items.some(item => item.product_id === productId);
      },

      getDiscountTier: () => {
        const courseCount = get().items.filter(item => item.product_type === 'course').length;
        
        if (courseCount >= 30) return { tier: 'tier4', discount: 30, minCourses: 30 };
        if (courseCount >= 20) return { tier: 'tier3', discount: 25, minCourses: 20 };
        if (courseCount >= 10) return { tier: 'tier2', discount: 20, minCourses: 10 };
        if (courseCount >= 5) return { tier: 'tier1', discount: 15, minCourses: 5 };
        
        return null;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
