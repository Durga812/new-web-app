"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

type Bundle = {
  title: string;
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
  purchasedProductIds?: string[];
  purchasedEnrollIds?: string[];
}

const formatLabel = (value?: string) => {
  if (!value) return "";
  return value
    .split("-")
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatCategoryName = (value: string) => value.replace(/-/g, " ").toUpperCase();

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const createIdSet = (ids?: string[]) => {
  if (!ids) return new Set<string>();
  return new Set(
    ids
      .map(id => id.trim())
      .filter((value): value is string => value.length > 0),
  );
};

export function CuratedBundlesSection({
  category,
  bundles,
  purchasedProductIds,
  purchasedEnrollIds,
}: CuratedBundlesSectionProps) {
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Curated bundles</p>
          <h2 className="text-xl font-semibold text-gray-900">
            {bundles.length} {bundles.length === 1 ? "bundle" : "bundles"} crafted for {formatCategoryName(category)}
          </h2>
        </div>
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Layers className="h-4 w-4 text-amber-500" />
          Unlock multi-course paths with a single enrollment
        </p>
      </header>

      {bundles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-800">No curated bundles available yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Check back soon as we continue adding guided learning tracks for this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {bundles.map(bundle => (
            <BundleCard
              key={bundle.bundle_id}
              bundle={bundle}
              purchasedProductIds={purchasedProductIds}
              purchasedEnrollIds={purchasedEnrollIds}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BundleCard({
  bundle,
  purchasedProductIds,
  purchasedEnrollIds,
}: {
  bundle: Bundle;
  purchasedProductIds?: string[];
  purchasedEnrollIds?: string[];
}) {
  const totalCourses = bundle.included_course_ids.length;
  const savings = bundle.pricing.compared_price
    ? bundle.pricing.compared_price - bundle.pricing.price
    : undefined;

  const addItemToCart = useCartStore(state => state.addItem);
  const isInCart = useCartStore(state => state.items.some(item => item.id === bundle.bundle_id));
  const purchasedProductSet = useMemo(() => createIdSet(purchasedProductIds), [purchasedProductIds]);
  const purchasedEnrollSet = useMemo(() => createIdSet(purchasedEnrollIds), [purchasedEnrollIds]);
  const bundleProductId = bundle.bundle_id?.trim();
  const bundleEnrollId = bundle.enroll_id?.trim();
  const isPurchased =
    (bundleProductId ? purchasedProductSet.has(bundleProductId) : false) ||
    (bundleEnrollId ? purchasedEnrollSet.has(bundleEnrollId) : false);

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
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
        isPurchased ? "border-emerald-200" : "border-gray-100"
      }`}
    >
      <div className="flex items-center gap-2 p-4">
        {isPurchased && (
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <Check className="h-3 w-3" /> Purchased
          </Badge>
        )}
        {bundle.series && (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            {formatLabel(bundle.series)} Series
          </Badge>
        )}
        {bundle.tags?.slice(0, 2).map(tag => (
          <Badge key={tag} variant="outline" className="border-gray-200 text-gray-600">
            #{formatLabel(tag)}
          </Badge>
        ))}
      </div>

      <div className="relative mx-4 h-40 overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
        {bundle.image_url ? (
          <Image
            src={bundle.image_url}
            alt={bundle.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 via-white to-orange-100 text-amber-600">
            <span className="text-sm font-semibold">Immigreat Bundle</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
        <h3 className="text-lg font-semibold text-gray-900">{bundle.title}</h3>

        <div className="space-y-1 text-sm text-gray-600">
          <p>
            Includes <span className="font-semibold text-gray-900">{totalCourses}</span> course
            {totalCourses === 1 ? "" : "s"}
          </p>
          <p>
            {bundle.pricing.validity_duration} {formatLabel(bundle.pricing.validity_type)} access
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Bundle price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{formatPrice(bundle.pricing.price)}</span>
              {bundle.pricing.compared_price && (
                <span className="text-sm font-medium text-gray-400 line-through">
                  {formatPrice(bundle.pricing.compared_price)}
                </span>
              )}
            </div>
            {savings && savings > 0 && (
              <p className="text-xs font-semibold text-emerald-600">
                Save {formatPrice(savings)} versus individual courses
              </p>
            )}
            {isPurchased && (
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                You already own this bundle.
              </p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={isInCart || isPurchased}
            className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-5 text-white shadow-lg shadow-orange-200/50 hover:from-amber-500 hover:to-orange-500"
          >
            {isPurchased || isInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {isPurchased ? "Purchased" : isInCart ? "In cart" : "Add to cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}
