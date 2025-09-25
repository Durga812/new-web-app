"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types/cart";

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    set => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
      addItem: item =>
        set(state => {
          const existingIndex = state.items.findIndex(existing => existing.id === item.id);
          const items = existingIndex >= 0
            ? state.items.map(existing => (existing.id === item.id ? { ...existing, ...item } : existing))
            : [...state.items, item];
          return { items };
        }),
      removeItem: id => set(state => ({ items: state.items.filter(item => item.id !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "immigreat-cart",
      partialize: state => ({ items: state.items }),
      storage:
        typeof window !== "undefined" ? createJSONStorage(() => window.localStorage) : undefined,
    },
  ),
);
