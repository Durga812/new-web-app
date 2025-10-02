// src/app/bundle/[bundle_slug]/BundlePricingSidebar.tsx
"use client";

import { useMemo } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/stores/cart-store";
import { useEnrollmentStore } from "@/stores/enrollment-store";
import type { BundleDetail } from "@/types/bundle-detail";

interface BundlePricingSidebarProps {
  bundle: BundleDetail;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

export default function BundlePricingSidebar({ bundle }: BundlePricingSidebarProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const isProductPurchased = useEnrollmentStore((state) => state.isProductPurchased);
  const isEnrollPurchased = useEnrollmentStore((state) => state.isEnrollPurchased);

  const isInCart = cartItems.some((item) => item.id === bundle.bundle_id);

  const isPurchased = useMemo(() => {
    return isProductPurchased(bundle.bundle_id) || isEnrollPurchased(bundle.enroll_id);
  }, [bundle.bundle_id, bundle.enroll_id, isEnrollPurchased, isProductPurchased]);

  const accessLabel = `${bundle.pricing.validity_duration} ${bundle.pricing.validity_type} access`;

  const handleAddToCart = () => {
    if (isInCart || isPurchased) return;

    addItem({
      id: bundle.bundle_id,
      productId: bundle.bundle_id,
      type: "bundle",
      productType: "bundle",
      title: bundle.title,
      price: bundle.pricing.price,
      currency: "USD",
      comparedPrice: bundle.pricing.compared_price,
      imageUrl: bundle.image_url,
      accessPeriodLabel: accessLabel,
      validityDuration: bundle.pricing.validity_duration,
      validityType: bundle.pricing.validity_type,
      includedCourseIds: bundle.includedCourseIds,
      category: bundle.category,
      enrollId: bundle.enroll_id,
    });
  };

  return (
    <Card className="overflow-hidden border-gray-200 shadow-lg">
      <div className="bg-gradient-to-b from-amber-50/30 to-white p-5">
        <h3 className="mb-3 text-base font-semibold text-gray-900">Bundle access</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{formatPrice(bundle.pricing.price)}</span>
          {bundle.pricing.compared_price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(bundle.pricing.compared_price)}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">{accessLabel}</p>
      </div>

      <div className="border-t border-gray-100 p-5">
        {isPurchased && (
          <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
            <Check className="h-3 w-3" /> Owned
          </div>
        )}

        <Button
          onClick={handleAddToCart}
          disabled={isInCart || isPurchased}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 hover:shadow-lg transition-all"
          size="lg"
        >
          {isPurchased ? (
            <>
              <Check className="mr-2 h-5 w-5" /> Owned
            </>
          ) : isInCart ? (
            <>
              <Check className="mr-2 h-5 w-5" /> Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" /> Add Bundle to Cart
            </>
          )}
        </Button>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/50 p-5 text-sm text-gray-600">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <span>Includes {bundle.includedCourseIds.length} curated courses</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <span>Immediate access to all lessons</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <span>Save compared to individual purchases</span>
          </li>
        </ul>
      </div>
    </Card>
  );
}
