// src/components/layout/CartDrawer.tsx
"use client";

import { useMemo, useState, useTransition, type MouseEvent } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { X, ShoppingCart, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useShallow } from "zustand/react/shallow";
import { courses as courseCatalog } from "@/lib/data/courses-data";
import { calculateCartDiscounts } from "@/lib/pricing/discounts";
import { createCheckoutSession } from "@/lib/stripe/create-checkout-session";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem } = useCartStore(
    useShallow(state => ({
      isOpen: state.isOpen,
      closeCart: state.closeCart,
      items: state.items,
      removeItem: state.removeItem,
    })),
  );
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const [expandedBundles, setExpandedBundles] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, startTransition] = useTransition();

  const courseTitleLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    courseCatalog.forEach(course => {
      lookup.set(course.course_id, course.title);
    });
    return lookup;
  }, []);

  const discountSummary = useMemo(() => calculateCartDiscounts(items), [items]);
  const { subtotal, qualifyingCount, discountRate, discountAmount, total, upcomingTier } = discountSummary;
  const discountPercent = Math.round(discountRate * 100);
  const discountApplied = discountAmount > 0;
  const coursesNeededForNextTier = upcomingTier ? upcomingTier.threshold - qualifyingCount : 0;
  const nextTierPercent = upcomingTier ? Math.round(upcomingTier.rate * 100) : 0;

  if (!isOpen) {
    return null;
  }

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const toggleBundle = (id: string) => {
    setExpandedBundles(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCheckout = () => {
    if (items.length === 0 || isProcessing) return;

    setErrorMessage(null);
    if (!isSignedIn) {
      setErrorMessage("Please sign in before proceeding to checkout.");
      openSignIn?.();
      return;
    }
    const payloadItems = items.map(item => ({ ...item }));

    startTransition(() => {
      void createCheckoutSession({ items: payloadItems }).catch(error => {
        console.error("Failed to start checkout", error);
        const message = error instanceof Error ? error.message : undefined;
        if (message === "You must be signed in to start checkout.") {
          setErrorMessage("Please sign in before proceeding to checkout.");
          openSignIn?.();
          return;
        }
        setErrorMessage("We couldn't start checkout. Please try again.");
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={closeCart}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={handleContainerClick}
      >
        <header className="flex items-center justify-between border-b border-amber-200 bg-amber-50/80 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your cart</h2>
            <p className="text-sm text-gray-500">
              {items.length === 0
                ? "You have no items yet."
                : `${items.length} ${items.length === 1 ? "item" : "items"} ready for checkout.`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart} aria-label="Close cart">
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
            <Button variant="outline" onClick={closeCart}>
              Continue browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {items.map(item => {
                const isBundle = item.type === "bundle";
                const bundleExpanded = expandedBundles[item.id] ?? false;
                const includedCourses = isBundle
                  ? item.includedCourseIds?.map(courseId => ({
                      id: courseId,
                      title: courseTitleLookup.get(courseId) ?? courseId,
                    }))
                  : undefined;

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                          {isBundle ? "Bundle" : "Course"}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{item.title}</h3>

                        {item.accessPeriodLabel && (
                          <p className="text-xs text-gray-600 sm:text-sm">
                            {isBundle ? "Access" : "Selected access"}
                            <span className="ml-1 font-semibold text-gray-900">{item.accessPeriodLabel}</span>
                          </p>
                        )}

                        {isBundle && includedCourses && includedCourses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleBundle(item.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-600"
                          >
                            {bundleExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {bundleExpanded ? "Hide" : "Show"} included courses
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 text-right">
                        <p className="text-base font-semibold text-amber-600 sm:text-lg">
                          {formatPrice(item.price)}
                        </p>
                        {item.comparedPrice && item.comparedPrice > item.price && (
                          <p className="text-xs font-medium text-gray-400 line-through">
                            {formatPrice(item.comparedPrice)}
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    {isBundle && bundleExpanded && includedCourses && (
                      <div className="mt-4 rounded-xl border border-white/70 bg-white/60 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Courses in this bundle
                        </p>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {includedCourses.map(course => (
                            <li key={course.id} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                              <span>{course.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <footer className="border-t border-amber-200 bg-amber-50/80 p-6">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Items subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discountApplied && (
                  <div className="flex items-center justify-between text-sm font-semibold text-emerald-600">
                    <span>
                      12-month course savings
                      <span className="ml-1 text-xs font-medium">({discountPercent}% off)</span>
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                {discountApplied
                  ? "Your discount applies automatically to eligible 12-month courses."
                  : "Add 12-month courses to unlock automatic savings."}
              </p>
              {upcomingTier && coursesNeededForNextTier > 0 && (
                <p className="mt-1 text-xs font-semibold text-amber-600 sm:text-sm">
                  Add {coursesNeededForNextTier} more 12-month course
                  {coursesNeededForNextTier === 1 ? "" : "s"} to unlock {nextTierPercent}% off.
                </p>
              )}
              <div className="mt-4 space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  aria-busy={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Proceed to checkout"}
                </Button>
                {errorMessage && (
                  <p className="text-sm font-medium text-red-600" role="alert">
                    {errorMessage}
                  </p>
                )}
                <Button variant="outline" className="w-full" onClick={closeCart}>
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
