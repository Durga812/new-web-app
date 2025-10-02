'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getGuestCart, clearGuestCart } from '@/lib/guest-cart';
import { mergeAndSyncCart } from '@/app/actions/cart';
import { toast } from 'sonner';

export function useCartSync() {
  const { isSignedIn, isLoaded } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    // Only run this logic once the user's status is loaded
    if (!isLoaded) return;

    // Check if the user has just signed in and we haven't synced yet
    if (isSignedIn && !hasSynced) {
      const guestCart = getGuestCart();

      // If there's a guest cart, start the merge process
      if (guestCart.length > 0 && !isSyncing) {
        setIsSyncing(true);
        console.log('User signed in. Merging guest cart with database...');

        const handleMerge = async () => {
          try {
            const result = await mergeAndSyncCart(guestCart);
            if (result.success) {
              // IMPORTANT: Clear the local cart only after successful merge
              clearGuestCart();
              
              if (result.added && result.added > 0) {
                toast.success(`${result.added} item(s) from your previous session were added to your cart.`);
              }
              
              // Optional: trigger a refresh of the cart UI state
              window.dispatchEvent(new Event('cartUpdated'));
              
              setHasSynced(true);
            } else {
              toast.error('Could not sync your cart. Please try again.');
              console.error('Cart sync error:', result.error);
            }
          } catch (error) {
            console.error('Cart sync failed:', error);
            toast.error('An error occurred while syncing your cart.');
          } finally {
            setIsSyncing(false);
          }
        };

        handleMerge();
      } else if (guestCart.length === 0) {
        // No guest cart to sync, mark as synced
        setHasSynced(true);
      }
    }

    // Reset sync status when user signs out
    if (!isSignedIn && hasSynced) {
      setHasSynced(false);
    }
  }, [isSignedIn, isLoaded, isSyncing, hasSynced]);

  return { isSyncing };
}
