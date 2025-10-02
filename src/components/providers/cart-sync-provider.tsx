'use client';

import { useCartSync } from '@/hooks/use-cart-sync';

/**
 * CartSyncProvider is a client component that runs the useCartSync hook.
 * It handles merging the guest cart with the authenticated user's cart upon login.
 * This component doesn't render anything—it just runs the sync logic.
 */
export function CartSyncProvider() {
  useCartSync();
  return null;
}
