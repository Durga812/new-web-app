// src/components/layout/CartDrawer.tsx
"use client"

import type { MouseEvent } from "react";
import { X, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  type: "course" | "bundle";
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export function CartDrawer({ isOpen, onClose, items, onRemove }: CartDrawerProps) {
  const subtotal = items.reduce(
    (total, item) => total + item.price * Math.max(1, item.quantity),
    0,
  );

  if (!isOpen) {
    return null;
  }

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={handleContainerClick}
      >
        <header className="flex items-center justify-between border-b border-amber-200 bg-amber-50/80 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
            <p className="text-sm text-gray-500">
              {items.length === 0
                ? "You have no items yet."
                : `${items.length} ${items.length === 1 ? "item" : "items"} ready for checkout.`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close cart">
            <X className="h-5 w-5" />
          </Button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Your cart is empty</p>
              <p className="text-sm text-gray-500">Browse courses and add them to see them here.</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Continue browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-amber-700">
                        {item.type}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">Quantity: {Math.max(1, item.quantity)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-amber-600">
                        {formatPrice(item.price * Math.max(1, item.quantity))}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <footer className="border-t border-amber-200 bg-amber-50/80 p-6">
              <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Taxes and discounts are calculated during checkout.
              </p>
              <div className="mt-4 space-y-3">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Proceed to checkout
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Keep shopping
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
