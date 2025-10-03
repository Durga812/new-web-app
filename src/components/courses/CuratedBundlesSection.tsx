// src/components/courses/CuratedBundlesSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Search, Package, Sparkles } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useEnrollmentStore } from "@/stores/enrollment-store";

type Bundle = {
  title: string;
  slug?: string;
  bundle_slug?: string;
  bundle_id: string;
  enroll_id: string;
  included_course_ids: string[];
  type: string;
  category: string;
  series?: string;
  tags?: string[];
  pricing: {
    price: number;
    compared_price?: number;
    validity_duration: number;
    validity_type: string;
  };
  image_url?: string;
};

interface CuratedBundlesSectionProps {
  category: string;
  bundles: Bundle[];
}

const formatLabel = (value?: string) => {
  if (!value) return "";
  return value
    .split("-")
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export function CuratedBundlesSection({
  category,
  bundles,
}: CuratedBundlesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter bundles based on search
  const filteredBundles = useMemo(() => {
    if (!searchQuery) return bundles;
    
    const query = searchQuery.toLowerCase();
    return bundles.filter(bundle =>
      bundle.title.toLowerCase().includes(query) ||
      bundle.series?.toLowerCase().includes(query) ||
      bundle.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [bundles, searchQuery]);

  return (
    <section className="space-y-6">
      {/* Search Bar */}
      <div className="relative mx-auto max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bundles by title, series, or tags..."
          className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200/50"
        />
      </div>

      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 mb-3">
          <Package className="h-4 w-4 text-amber-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Curated Learning Paths
          </p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Complete {category.toUpperCase()} Bundle Packages
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Save up to 33% with expertly curated course collections
        </p>
      </header>

      {/* Results */}
      {filteredBundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <Package className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-base font-semibold text-gray-800">No bundles found</p>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery ? "Try adjusting your search query" : "Check back soon for new bundle offers"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBundles.map(bundle => (
            <BundleCard
              key={bundle.bundle_id}
              bundle={bundle}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BundleCard({
  bundle,
}: {
  bundle: Bundle;
}) {
  const totalCourses = bundle.included_course_ids.length;
  const savingsPercent = bundle.pricing.compared_price
    ? Math.round((1 - bundle.pricing.price / bundle.pricing.compared_price) * 100)
    : 0;
  const bundleHref = `/bundle/${bundle.bundle_slug || bundle.slug || bundle.bundle_id}`;

  const addItemToCart = useCartStore(state => state.addItem);
  const isInCart = useCartStore(state =>
    state.items.some(item => item.productId === bundle.bundle_id && item.type === "bundle"),
  );
  const isProductPurchased = useEnrollmentStore(state => state.isProductPurchased);
  const isEnrollPurchased = useEnrollmentStore(state => state.isEnrollPurchased);

  const bundleProductId = bundle.bundle_id?.trim();
  const bundleEnrollId = bundle.enroll_id?.trim();
  const isPurchased = useMemo(() => {
    return isProductPurchased(bundleProductId) || isEnrollPurchased(bundleEnrollId);
  }, [bundleEnrollId, bundleProductId, isEnrollPurchased, isProductPurchased]);

  const handleAddToCart = () => {
    if (isInCart || isPurchased) return;
    addItemToCart({
      id: bundle.bundle_id,
      productId: bundle.bundle_id,
      type: "bundle",
      productType: bundle.type,
      title: bundle.title,
      price: bundle.pricing.price,
      currency: "USD",
      comparedPrice: bundle.pricing.compared_price,
      imageUrl: bundle.image_url,
      accessPeriodLabel: `${bundle.pricing.validity_duration} ${formatLabel(bundle.pricing.validity_type)} access`,
      validityDuration: bundle.pricing.validity_duration,
      validityType: bundle.pricing.validity_type,
      includedCourseIds: bundle.included_course_ids,
      category: bundle.category,
      enrollId: bundle.enroll_id,
    });
  };

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
      isPurchased ? 'border-emerald-200 ring-1 ring-emerald-200' : 'border-gray-200'
    }`}>
      {/* Media & Badges */}
      <Link
        href={bundleHref}
        className="relative block h-36 overflow-hidden bg-gradient-to-br from-amber-100 via-white to-orange-100"
        aria-label={`View ${bundle.title}`}
      >
        {bundle.image_url ? (
          <Image
            src={bundle.image_url}
            alt={bundle.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-amber-400" />
              <span className="mt-2 block text-sm font-semibold text-amber-600">
                Bundle Package
              </span>
            </div>
          </div>
        )}
        {/* Status Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          {isPurchased && (
            <Badge className="h-6 border-0 bg-emerald-500/90 text-xs font-semibold text-white backdrop-blur">
              <Check className="mr-1 h-3 w-3" />
              Owned
            </Badge>
          )}
          {bundle.series && (
            <Badge variant="outline" className="h-6 border-amber-200 bg-white/80 text-xs font-semibold text-amber-700 backdrop-blur">
              {formatLabel(bundle.series)} Series
            </Badge>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          <Badge variant="outline" className="h-6 border-gray-200 bg-white/80 text-xs font-semibold text-gray-700 backdrop-blur">
            Bundle
          </Badge>
          {savingsPercent >= 30 && (
            <Badge className="h-6 border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
              <Sparkles className="mr-1 h-3 w-3" />
              Best Value
            </Badge>
          )}
        </div>

      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
          <Link
            href={bundleHref}
            className="transition-colors duration-200 hover:text-amber-600"
          >
            {bundle.title}
          </Link>
        </h3>

        {/* Bundle Details */}
        <div className="grid gap-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 sm:grid-cols-2 sm:text-sm">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Course Count</p>
            <p className="font-semibold text-gray-900">{totalCourses} courses</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Access Period</p>
            <p className="font-semibold text-gray-900">
              {bundle.pricing.validity_duration} {formatLabel(bundle.pricing.validity_type)}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-auto space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Bundle Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(bundle.pricing.price)}
                </span>
                {bundle.pricing.compared_price && (
                  <span className="text-sm font-medium text-gray-400 line-through">
                    {formatPrice(bundle.pricing.compared_price)}
                  </span>
                )}
              </div>
            </div>
            {savingsPercent > 0 && (
              <span className="text-xs font-semibold text-emerald-600">
                Save {savingsPercent}%
              </span>
            )}
          </div>
          {isPurchased && (
            <p className="text-xs font-semibold text-emerald-600">
              You have lifetime access to this bundle
            </p>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={isInCart || isPurchased}
            aria-disabled={isInCart || isPurchased}
            size="sm"
            className={`h-9 w-full text-sm font-medium transition-all ${
              isPurchased || isInCart
                ? 'cursor-not-allowed bg-gray-100 text-gray-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
            }`}
          >
            {isPurchased ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Purchased
              </>
            ) : isInCart ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Add Bundle to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
