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
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    // 1. Get the current user's database ID from your `users` table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      return { success: false, error: 'User not found in the database.' };
    }

    const internalUserId = user.id;

    // 2. Fetch the user's current cart from the database
    const { data: dbCartItems, error: cartFetchError } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('user_id', internalUserId);

    if (cartFetchError) {
      console.error('Cart fetch error:', cartFetchError);
      return { success: false, error: 'Failed to fetch existing cart.' };
    }

    const dbProductIds = new Set((dbCartItems || []).map(item => item.product_id));

    // 3. Filter out guest items that are *already* in the user's database cart
    const itemsToCreate = guestCartItems.filter(
      guestItem => !dbProductIds.has(guestItem.productId)
    );

    if (itemsToCreate.length === 0) {
      console.log('No new items to merge.');
      return { success: true, added: 0 };
    }

    // 4. Prepare the data for insertion, linking to the user
    const newCartData = itemsToCreate.map(item => ({
      user_id: internalUserId,
      clerk_user_id: clerkUserId,
      product_id: item.productId,
      product_type: item.productType,
      pricing_key: item.pricingKey || 'price3',
      price: item.price,
      validity_duration: item.validityDuration,
      validity_type: item.validityType,
    }));

    // 5. Insert the new items into the database
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
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      throw new Error('User not authenticated.');
    }

    // Get the user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      throw new Error('User not found in the database.');
    }

    // Fetch cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
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
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Get the user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found in the database.' };
    }

    // Insert or update the cart item (upsert)
    const { error: insertError } = await supabase
      .from('cart_items')
      .upsert({
        user_id: user.id,
        clerk_user_id: clerkUserId,
        product_id: item.productId,
        product_type: item.productType,
        pricing_key: item.pricingKey || 'price3',
        price: item.price,
        validity_duration: item.validityDuration,
        validity_type: item.validityType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,product_id'
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
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Get the user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found in the database.' };
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
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
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Get the user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found in the database.' };
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

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
