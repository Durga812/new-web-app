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
    originalPrice: item.price,
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

/**
 * Enriches cart items with full product data from the database
 */
async function enrichCartItems(items: CartItem[]): Promise<CartItem[]> {
  if (items.length === 0) return items;

  console.log('Starting cart enrichment for items:', items.map(i => ({ id: i.productId, type: i.type, currentTitle: i.title })));

  try {
    const products = items.map(item => ({
      id: item.productId,
      type: item.type
    }));

    const response = await fetch('/api/catalog/cart-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });

    if (!response.ok) {
      console.error('Failed to fetch product data for cart enrichment:', response.status, response.statusText);
      return items; // Return original items if enrichment fails
    }

    const data = await response.json();
    console.log('Enrichment API response:', data);
    
    const productMap = new Map();
    
    data.products?.forEach((product: { id: string; [key: string]: unknown }) => {
      productMap.set(product.id, product);
    });

    console.log('Product map created:', Array.from(productMap.keys()));

    // Enrich items with fetched data
    const enrichedItems = items.map(item => {
      const productData = productMap.get(item.productId);
      
      if (!productData) {
        console.warn(`No product data found for ${item.type} ${item.productId}, using fallbacks`);
        // Create fallback data for missing products
        return {
          ...item,
          title: item.title || `${item.type === 'course' ? 'Course' : 'Bundle'} ${item.productId}`,
          accessPeriodLabel: item.accessPeriodLabel || createAccessPeriodLabel(item.validityDuration, item.validityType),
        };
      }

      console.log(`Enriching ${item.type} ${item.productId} with:`, {
        title: productData.title,
        category: productData.category
      });

      // Create access period label based on validity
      const accessPeriodLabel = createAccessPeriodLabel(item.validityDuration, item.validityType);

      return {
        ...item,
        title: (productData.title as string) || item.title || `${item.type === 'course' ? 'Course' : 'Bundle'} ${item.productId}`,
        category: (productData.category as string) || item.category || 'General',
        includedCourseIds: (productData.includedCourseIds as string[]) || item.includedCourseIds || [],
        accessPeriodLabel: accessPeriodLabel || item.accessPeriodLabel,
        // Get compared price from pricing data if available
        comparedPrice: (productData.pricing as Record<string, { compared_price?: number }>)?.[item.pricingKey || 'price3']?.compared_price || item.comparedPrice,
      };
    });

    console.log('Enrichment completed. Results:', enrichedItems.map(i => ({ id: i.productId, type: i.type, title: i.title })));
    return enrichedItems;
  } catch (error) {
    console.error('Error enriching cart items:', error);
    // Return items with fallback enrichment
    return items.map(item => ({
      ...item,
      title: item.title || `${item.type === 'course' ? 'Course' : 'Bundle'} ${item.productId}`,
      accessPeriodLabel: item.accessPeriodLabel || createAccessPeriodLabel(item.validityDuration, item.validityType),
    }));
  }
}

/**
 * Helper function to create access period labels
 */
function createAccessPeriodLabel(validityDuration?: number, validityType?: string): string {
  if (!validityDuration || !validityType) return '';
  
  if (validityType === 'days') {
    if (validityDuration === 365) {
      return '12 months';
    } else if (validityDuration === 30) {
      return '1 month';
    } else {
      return `${validityDuration} days`;
    }
  } else {
    return `${validityDuration} ${validityType}`;
  }
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
  syncCartFromStorage: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated && typeof window !== 'undefined') {
      try {
        const guestCart = getGuestCart();
        const basicItems = guestCart.map(fromGuestCartItem);
        
        // Enrich guest cart items with product data
        if (basicItems.length > 0) {
          console.log('Enriching guest cart items with product data...');
          const enrichedItems = await enrichCartItems(basicItems);
          set({ items: enrichedItems });
          console.log(`Synced and enriched ${enrichedItems.length} items from localStorage`);
        } else {
          set({ items: [] });
          console.log('No items in localStorage to sync');
        }
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
        const basicItems: CartItem[] = dbCart.map(dbItem => ({
          id: dbItem.product_id,
          productId: dbItem.product_id,
          type: dbItem.product_type,
          title: '', // Will be enriched
          price: Number(dbItem.price),
          originalPrice: Number(dbItem.price),
          pricingKey: dbItem.pricing_key,
          validityDuration: dbItem.validity_duration,
          validityType: dbItem.validity_type,
        }));
        
        // Enrich items with full product data
        console.log('Enriching cart items with product data...');
        const enrichedItems = await enrichCartItems(basicItems);
        set({ items: enrichedItems });
        console.log(`Loaded and enriched ${enrichedItems.length} items from database`);
      } else {
        // Load from localStorage for guest users
        console.log('Loading cart from localStorage for guest user');
        await get().syncCartFromStorage();
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
        // Enrich the item before adding to state
        const enrichedItems = await enrichCartItems([item]);
        const enrichedItem = enrichedItems[0] || item;
        
        // Update local state with enriched item
        set(state => {
          const existingIndex = state.items.findIndex(existing => existing.productId === item.productId);
          const items = existingIndex >= 0
            ? state.items.map(existing => (existing.productId === item.productId ? enrichedItem : existing))
            : [...state.items, enrichedItem];
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
      
      // Update local state (guest items are already enriched when added)
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
