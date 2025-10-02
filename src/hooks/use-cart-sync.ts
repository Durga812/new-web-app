'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { getGuestCart, clearGuestCart } from '@/lib/guest-cart';
import { mergeAndSyncCart } from '@/app/actions/cart';
import { toast } from 'sonner';

const MAX_RETRIES = 2;

export function useCartSync() {
  const { isSignedIn, isLoaded } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const retryCount = useRef(0);
  const hasShownError = useRef(false);

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
              retryCount.current = 0;
              hasShownError.current = false;
            } else {
              // Retry logic
              if (retryCount.current < MAX_RETRIES) {
                retryCount.current += 1;
                console.log(`Cart sync failed. Retry ${retryCount.current}/${MAX_RETRIES}`);
                setIsSyncing(false);
                // Will retry on next effect run
              } else {
                // Max retries reached, show error only once
                if (!hasShownError.current) {
                  toast.error('Could not sync your cart. Please refresh the page.');
                  hasShownError.current = true;
                }
                console.error('Cart sync error (max retries reached):', result.error);
                setHasSynced(true); // Stop trying
              }
            }
          } catch (error) {
            console.error('Cart sync failed:', error);
            
            // Retry logic for exceptions
            if (retryCount.current < MAX_RETRIES) {
              retryCount.current += 1;
              console.log(`Cart sync exception. Retry ${retryCount.current}/${MAX_RETRIES}`);
              setIsSyncing(false);
            } else {
              // Max retries reached, show error only once
              if (!hasShownError.current) {
                toast.error('An error occurred while syncing your cart. Please refresh the page.');
                hasShownError.current = true;
              }
              setHasSynced(true); // Stop trying
            }
          } finally {
            if (retryCount.current >= MAX_RETRIES || hasSynced) {
              setIsSyncing(false);
            }
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
      retryCount.current = 0;
      hasShownError.current = false;
    }
  }, [isSignedIn, isLoaded, isSyncing, hasSynced]);

  return { isSyncing };
}
