"use client";
import { useEffect } from 'react';
import { useCartStore } from '@/lib/stores/useCartStore';

export function ClearCartClient() {
  const clearCart = useCartStore((s) => s.clearCart);
  const clearPersistedStorage = useCartStore((s) => s.clearPersistedStorage);
  useEffect(() => {
    try {
      clearCart();
      clearPersistedStorage();
    } catch {}
  }, [clearCart, clearPersistedStorage]);
  return null;
}

