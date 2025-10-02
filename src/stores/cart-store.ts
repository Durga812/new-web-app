"use client";

import { create } from "zustand";
import type { CartItem } from "@/types/cart";
import { 
  getGuestCart, 
  addToGuestCart, 
  removeFromGuestCart, 
  clearGuestCart,
  type GuestCartItem 
} from "@/lib/guest-cart";
import { 
  addToAuthenticatedCart, 
  removeFromAuthenticatedCart, 
  clearAuthenticatedCart,
  getAuthenticatedCart
} from "@/app/actions/cart";

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setAuthenticated: (isAuth: boolean) => void;
  loadCart: () => Promise<void>;
  syncCartFromStorage: () => void;
};

/**
 * Converts a CartItem to GuestCartItem format for storage
 */
function toGuestCartItem(item: CartItem): GuestCartItem {
  return {
    productId: item.productId,
    productType: item.type,
    pricingKey: item.pricingKey || 'price3',
    price: item.price,
    validityDuration: item.validityDuration || 365,
    validityType: item.validityType || 'days',
    title: item.title,
    imageUrl: item.imageUrl,
    accessPeriodLabel: item.accessPeriodLabel,
    includedCourseIds: item.includedCourseIds,
    category: item.category,
    comparedPrice: item.comparedPrice,
  };
}

/**
 * Converts a GuestCartItem to CartItem format for display
 */
function fromGuestCartItem(item: GuestCartItem): CartItem {
  return {
    id: item.productId, // Use productId as the id
    productId: item.productId,
    type: item.productType,
    title: item.title || '',
    price: item.price,
    pricingKey: item.pricingKey,
    validityDuration: item.validityDuration,
    validityType: item.validityType,
    imageUrl: item.imageUrl,
    accessPeriodLabel: item.accessPeriodLabel,
    includedCourseIds: item.includedCourseIds,
    category: item.category,
    comparedPrice: item.comparedPrice,
  };
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isOpen: false,
  isAuthenticated: false,
  isLoading: false,
  
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
  
  setAuthenticated: (isAuth: boolean) => {
    const currentAuth = get().isAuthenticated;
    
    // Only update if authentication status actually changed
    if (currentAuth !== isAuth) {
      set({ isAuthenticated: isAuth });
      
      // Load cart when authentication status changes
      // Use setTimeout to avoid race conditions with Clerk's state updates
      setTimeout(() => {
        get().loadCart();
      }, 100);
    }
  },
  
  /**
   * Sync cart from localStorage (for guest users on page load)
   */
  syncCartFromStorage: () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated && typeof window !== 'undefined') {
      try {
        const guestCart = getGuestCart();
        const items = guestCart.map(fromGuestCartItem);
        set({ items });
        console.log(`Synced ${items.length} items from localStorage`);
      } catch (error) {
        console.error('Failed to sync cart from storage:', error);
        // Clear corrupted data and start fresh
        set({ items: [] });
      }
    }
  },
  
  /**
   * Load cart based on authentication status
   */
  loadCart: async () => {
    const { isAuthenticated } = get();
    set({ isLoading: true });
    
    try {
      if (isAuthenticated) {
        // Load from database for authenticated users
        console.log('Loading cart from database for authenticated user');
        const dbCart = await getAuthenticatedCart();
        const items: CartItem[] = dbCart.map(dbItem => ({
          id: dbItem.product_id,
          productId: dbItem.product_id,
          type: dbItem.product_type,
          title: '', // Will need to be populated from product data
          price: Number(dbItem.price),
          pricingKey: dbItem.pricing_key,
          validityDuration: dbItem.validity_duration,
          validityType: dbItem.validity_type,
        }));
        set({ items });
        console.log(`Loaded ${items.length} items from database`);
      } else {
        // Load from localStorage for guest users
        console.log('Loading cart from localStorage for guest user');
        get().syncCartFromStorage();
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Don't clear the cart on error, just log it
      // The user might have items in their local state that shouldn't be lost
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Add item to cart (guest or authenticated)
   */
  addItem: async (item: CartItem) => {
    const { isAuthenticated } = get();
    
    if (isAuthenticated) {
      // Add to database for authenticated users
      const guestItem = toGuestCartItem(item);
      const result = await addToAuthenticatedCart(guestItem);
      
      if (result.success) {
        // Update local state
        set(state => {
          const existingIndex = state.items.findIndex(existing => existing.productId === item.productId);
          const items = existingIndex >= 0
            ? state.items.map(existing => (existing.productId === item.productId ? { ...existing, ...item } : existing))
            : [...state.items, item];
          return { items };
        });
        
        // Dispatch custom event for other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } else {
        console.error('Failed to add item to authenticated cart:', result.error);
        throw new Error(result.error || 'Failed to add item');
      }
    } else {
      // Add to localStorage for guest users
      const guestItem = toGuestCartItem(item);
      addToGuestCart(guestItem);
      
      // Update local state
      set(state => {
        const existingIndex = state.items.findIndex(existing => existing.productId === item.productId);
        const items = existingIndex >= 0
          ? state.items.map(existing => (existing.productId === item.productId ? { ...existing, ...item } : existing))
          : [...state.items, item];
        return { items };
      });
    }
  },
  
  /**
   * Remove item from cart (guest or authenticated)
   */
  removeItem: async (productId: string) => {
    const { isAuthenticated } = get();
    
    if (isAuthenticated) {
      // Remove from database for authenticated users
      const result = await removeFromAuthenticatedCart(productId);
      
      if (result.success) {
        // Update local state
        set(state => ({ items: state.items.filter(item => item.productId !== productId) }));
        
        // Dispatch custom event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } else {
        console.error('Failed to remove item from authenticated cart:', result.error);
        throw new Error(result.error || 'Failed to remove item');
      }
    } else {
      // Remove from localStorage for guest users
      removeFromGuestCart(productId);
      
      // Update local state
      set(state => ({ items: state.items.filter(item => item.productId !== productId) }));
    }
  },
  
  /**
   * Clear entire cart (guest or authenticated)
   */
  clearCart: async () => {
    const { isAuthenticated } = get();
    
    if (isAuthenticated) {
      // Clear database for authenticated users
      const result = await clearAuthenticatedCart();
      
      if (result.success) {
        set({ items: [] });
        
        // Dispatch custom event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } else {
        console.error('Failed to clear authenticated cart:', result.error);
        throw new Error(result.error || 'Failed to clear cart');
      }
    } else {
      // Clear localStorage for guest users
      clearGuestCart();
      set({ items: [] });
    }
  },
}));
