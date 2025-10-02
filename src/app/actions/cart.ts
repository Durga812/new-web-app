'use server';

import { supabase } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { type GuestCartItem } from '@/lib/guest-cart';

type MergeResult = {
  success: boolean;
  added?: number;
  error?: string;
};

type CartItemDB = {
  id: string;
  user_id: string;
  clerk_user_id: string;
  product_id: string;
  product_type: 'course' | 'bundle';
  pricing_key: string;
  price: number;
  validity_duration: number;
  validity_type: string;
  created_at: string;
  updated_at: string;
};

/**
 * Merges a guest cart (from localStorage) with the authenticated user's database cart.
 * @param guestCartItems - An array of items from the guest cart.
 */
export async function mergeAndSyncCart(guestCartItems: GuestCartItem[]): Promise<MergeResult> {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    // 1. Fetch the user's current cart from the database using clerk_user_id
    const { data: dbCartItems, error: cartFetchError } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('clerk_user_id', clerkUserId);

    if (cartFetchError) {
      console.error('Cart fetch error:', cartFetchError);
      return { success: false, error: 'Failed to fetch existing cart.' };
    }

    const dbProductIds = new Set((dbCartItems || []).map(item => item.product_id));

    // 2. Filter out guest items that are *already* in the user's database cart
    const itemsToCreate = guestCartItems.filter(
      guestItem => !dbProductIds.has(guestItem.productId)
    );

    if (itemsToCreate.length === 0) {
      console.log('No new items to merge.');
      return { success: true, added: 0 };
    }

    // 3. Prepare the data for insertion using clerk_user_id
    const newCartData = itemsToCreate.map(item => ({
      clerk_user_id: clerkUserId,
      product_id: item.productId,
      product_type: item.productType,
      pricing_key: item.pricingKey || 'price3',
      price: item.price,
      validity_duration: item.validityDuration,
      validity_type: item.validityType,
    }));

    // 4. Insert the new items into the database
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert(newCartData);

    if (insertError) {
      console.error('Failed to merge cart:', insertError);
      return { success: false, error: 'Database operation failed.' };
    }

    // Invalidate caches for pages that display cart info
    revalidatePath('/cart');
    revalidatePath('/');

    return { success: true, added: newCartData.length };
  } catch (error) {
    console.error('Unexpected error in mergeAndSyncCart:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Fetches the authenticated user's cart from the database.
 */
export async function getAuthenticatedCart(): Promise<CartItemDB[]> {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
      throw new Error('User not authenticated.');
    }

    // Fetch cart items using clerk_user_id directly
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false });

    if (cartError) {
      throw new Error('Failed to fetch cart items.');
    }

    return cartItems || [];
  } catch (error) {
    console.error('Error fetching authenticated cart:', error);
    return [];
  }
}

/**
 * Adds an item to the authenticated user's cart in the database.
 */
export async function addToAuthenticatedCart(item: GuestCartItem): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Insert or update the cart item (upsert) using clerk_user_id
    const { error: insertError } = await supabase
      .from('cart_items')
      .upsert({
        clerk_user_id: clerkUserId,
        product_id: item.productId,
        product_type: item.productType,
        pricing_key: item.pricingKey || 'price3',
        price: item.price,
        validity_duration: item.validityDuration,
        validity_type: item.validityType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_user_id,product_id'
      });

    if (insertError) {
      console.error('Failed to add item to cart:', insertError);
      return { success: false, error: 'Failed to add item to cart.' };
    }

    revalidatePath('/cart');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error adding to authenticated cart:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Removes an item from the authenticated user's cart.
 */
export async function removeFromAuthenticatedCart(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('clerk_user_id', clerkUserId)
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Failed to remove item from cart:', deleteError);
      return { success: false, error: 'Failed to remove item from cart.' };
    }

    revalidatePath('/cart');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error removing from authenticated cart:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Clears the authenticated user's entire cart.
 */
export async function clearAuthenticatedCart(): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('clerk_user_id', clerkUserId);

    if (deleteError) {
      console.error('Failed to clear cart:', deleteError);
      return { success: false, error: 'Failed to clear cart.' };
    }

    revalidatePath('/cart');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error clearing authenticated cart:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
