'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useCartStore } from '@/lib/stores/useCartStore';
import type { CartItem } from '@/lib/stores/useCartStore';

// Merges local cart with server cart on sign-in and when coming back online.
// - Union by product_id
// - Pushes any local-only items to the server
// - Updates local store to include any server-only items
export function CartDataLoader() {
  const { isLoaded, isSignedIn } = useAuth();
  const { items: localItems, setCart } = useCartStore();
  const syncingRef = useRef(false);

  const syncCart = async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      // Only sync for signed-in users
      if (!isSignedIn) return;

      // 1) Fetch server cart
      const res = await fetch('/api/cart', { cache: 'no-store' });
      if (!res.ok) {
        // Unauthorized or server error; skip syncing gracefully
        return;
      }
      type ServerCartItem = {
        product_id: string;
        product_type: 'course' | 'bundle';
        product_slug: string;
        variant_code?: string | null;
        product_enroll_id?: string | null;
        original_price: number;
        price: number;
        currency: string;
        cart_metadata?: { title?: string; thumbnail_url?: string; category_slug?: string | null; variant_label?: string | null } | null;
      };
      const serverItems: ServerCartItem[] = await res.json();

      const localIds = new Set(localItems.map(i => i.product_id));
      const serverIds = new Set(serverItems.map((i) => i.product_id));

      // 2) Push local-only items to server
      const localOnly = localItems.filter(i => !serverIds.has(i.product_id));
      for (const item of localOnly) {
        try {
          const r = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          // Ignore conflict (already exists) and other non-fatal errors
        } catch {}
      }

      // 3) Merge: include any server-only items into local
      const serverOnly = serverItems
        .filter((i) => !localIds.has(i.product_id))
        .map((i) => ({
          product_id: i.product_id,
          product_type: i.product_type,
          product_slug: i.product_slug,
          category_slug: i.cart_metadata?.category_slug ?? undefined,
          variant_code: i.variant_code ?? undefined,
          product_enroll_id: i.product_enroll_id ?? undefined,
          variant_label: i.cart_metadata?.variant_label ?? undefined,
          title: i.cart_metadata?.title ?? i.product_slug ?? 'Item',
          original_price: i.original_price,
          price: i.price,
          currency: i.currency,
          thumbnail_url: i.cart_metadata?.thumbnail_url ?? undefined,
        }));

      const merged = serverOnly.length > 0 ? [...localItems, ...serverOnly] : localItems;
      if (serverOnly.length > 0) setCart(merged);

      // 4) After successful sync/merge, stop persisting while signed-in and
      //    clear any previously stored local snapshot to avoid duplication.
      try {
        // Stop persisting anything when signed in (persist empty items)
        useCartStore.persist?.setOptions?.({ partialize: () => ({ items: [] as CartItem[] }) });
      } catch {}
      try {
        useCartStore.getState().clearPersistedStorage();
      } catch {}
    } finally {
      syncingRef.current = false;
    }
  };

  // Run when Clerk auth is loaded/changes
  useEffect(() => {
    if (!isLoaded) return;
    // On sign-in, perform sync and merge
    if (isSignedIn) {
      void syncCart();
    }
    // On sign-out, re-enable persistence of items
    if (!isSignedIn) {
      try {
        useCartStore.persist?.setOptions?.({
          partialize: (state: { items: CartItem[] }) => ({ items: state.items }),
        });
      } catch {}
    }
  }, [isLoaded, isSignedIn]);

  // Also sync when the browser comes back online
  useEffect(() => {
    const onOnline = () => {
      if (isSignedIn) void syncCart();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [isSignedIn]);

  return null;
}
