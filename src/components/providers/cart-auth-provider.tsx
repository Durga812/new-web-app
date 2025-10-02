'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useCartStore } from '@/stores/cart-store';

/**
 * CartAuthProvider synchronizes the user's authentication status with the cart store.
 * This ensures the cart knows whether to use localStorage or the database.
 */
export function CartAuthProvider() {
  const { isSignedIn, isLoaded } = useUser();
  const { setAuthenticated, syncCartFromStorage } = useCartStore();

  useEffect(() => {
    if (isLoaded) {
      setAuthenticated(!!isSignedIn);
      
      // If not signed in, sync from storage on initial load
      if (!isSignedIn) {
        syncCartFromStorage();
      }
    }
  }, [isSignedIn, isLoaded, setAuthenticated, syncCartFromStorage]);

  return null;
}
