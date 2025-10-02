import { z } from 'zod';

// Define a schema that matches the essential fields of your DB table
const CartItemSchema = z.object({
  productId: z.string(),
  productType: z.enum(['course', 'bundle']), // Matches CartItemType
  pricingKey: z.string().default('price3'),
  price: z.number(),
  validityDuration: z.number(),
  validityType: z.string(),
  // Optional fields from CartItem type
  title: z.string().optional(),
  imageUrl: z.string().optional(),
  accessPeriodLabel: z.string().optional(),
  includedCourseIds: z.array(z.string()).optional(),
  category: z.string().optional(),
  comparedPrice: z.number().optional(),
});

// Define the schema for the entire cart stored in localStorage
const GuestCartSchema = z.array(CartItemSchema);

export type GuestCartItem = z.infer<typeof CartItemSchema>;
type GuestCart = z.infer<typeof GuestCartSchema>;

const CART_STORAGE_KEY = 'immigreat-guest-cart';

/**
 * Retrieves the guest cart from localStorage and validates its structure.
 * @returns The parsed cart array or an empty array if invalid or not found.
 */
export function getGuestCart(): GuestCart {
  if (typeof window === 'undefined') return [];
  
  try {
    const cartJson = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!cartJson) return [];

    const cartData = JSON.parse(cartJson);
    const validationResult = GuestCartSchema.safeParse(cartData);

    if (validationResult.success) {
      return validationResult.data;
    } else {
      console.error('Invalid cart data in localStorage:', validationResult.error);
      clearGuestCart(); // Clear invalid data
      return [];
    }
  } catch (error) {
    console.error('Failed to read guest cart:', error);
    return [];
  }
}

/**
 * Saves the guest cart to localStorage.
 * @param cart - The cart array to save.
 */
function saveGuestCart(cart: GuestCart): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save guest cart:', error);
  }
}

/**
 * Adds an item to the guest cart. If the item already exists (by productId), it's replaced.
 * @param item - The new cart item to add.
 */
export function addToGuestCart(item: GuestCartItem): void {
  const cart = getGuestCart();
  // Prevent duplicates by replacing if product_id already exists
  const existingItemIndex = cart.findIndex(i => i.productId === item.productId);

  if (existingItemIndex !== -1) {
    cart[existingItemIndex] = item; // Update existing item
  } else {
    cart.push(item);
  }
  saveGuestCart(cart);
}

/**
 * Removes an item from the guest cart.
 * @param productId - The ID of the product to remove.
 */
export function removeFromGuestCart(productId: string): void {
  let cart = getGuestCart();
  cart = cart.filter(item => item.productId !== productId);
  saveGuestCart(cart);
}

/**
 * Clears the entire guest cart from localStorage.
 */
export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
}
