// src/components/courses/CompactCourseCard.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Check, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useEnrollmentStore } from "@/stores/enrollment-store";
import type { NormalizedSeriesMetadata } from "@/types/catalog";

type CoursePricing = {
  price: number;
  compared_price?: number;
  validity_duration: number;
  validity_type: string;
};

type Course = {
  title: string;
  slug?: string;
  course_slug?: string;
  course_id: string;
  enroll_id: string;
  type: string;
  category: string;
  series?: string;
  tags?: string[];
  ratings?: number;
  position?: number;
  pricing?: {
    price1?: CoursePricing;
    price2?: CoursePricing;
    price3?: CoursePricing;
  };
  image_url?: string;
};

interface CompactCourseCardProps {
  course: Course;
  metadata?: NormalizedSeriesMetadata;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatLabel = (value?: string) => {
  if (!value) return "";
  return value
    .split("-")
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

type PricingKey = keyof NonNullable<Course["pricing"]>;
const pricingKeys: PricingKey[] = ["price1", "price2", "price3"];

export function CompactCourseCard({
  course,
  metadata,
}: CompactCourseCardProps) {
  // Pricing options
  const pricingOptions = useMemo(() => {
    return pricingKeys
      .map(key => {
        const pricing = course.pricing?.[key];
        if (!pricing) return undefined;
        return {
          key,
          price: pricing.price,
          compared_price: pricing.compared_price,
          validity_duration: pricing.validity_duration,
          validity_type: pricing.validity_type,
        };
      })
      .filter(Boolean) as Array<{
        key: PricingKey;
        price: number;
        compared_price?: number;
        validity_duration: number;
        validity_type: string;
      }>;
  }, [course.pricing]);

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const selectedOption = pricingOptions[selectedOptionIndex];

  // Cart state
  const cartItem = useCartStore(state =>
    state.items.find(item => item.productId === course.course_id && item.type === "course")
  );
  const addItemToCart = useCartStore(state => state.addItem);
  const isInCart = Boolean(cartItem);

  // Purchase state
  const isProductPurchased = useEnrollmentStore(state => state.isProductPurchased);
  const isEnrollPurchased = useEnrollmentStore(state => state.isEnrollPurchased);

  const isPurchased = useMemo(() => {
    return isProductPurchased(course.course_id) || isEnrollPurchased(course.enroll_id);
  }, [course.course_id, course.enroll_id, isEnrollPurchased, isProductPurchased]);

  const detailHref = `/course/${course.course_slug || course.slug || course.course_id}`;

  const handleAddToCart = () => {
    if (!selectedOption || isInCart || isPurchased) return;

    addItemToCart({
      id: course.course_id,
      productId: course.course_id,
      type: "course",
      productType: course.type,
      title: course.title,
      price: selectedOption.price,
      currency: "USD",
      comparedPrice: selectedOption.compared_price,
      imageUrl: course.image_url,
      accessPeriodLabel: `${selectedOption.validity_duration} ${formatLabel(selectedOption.validity_type)} access`,
      validityDuration: selectedOption.validity_duration,
      validityType: selectedOption.validity_type,
      category: course.category,
      pricingKey: selectedOption.key,
      enrollId: course.enroll_id,
    });
  };

  // Clean title by removing series name if it appears at the start
//   const cleanTitle = useMemo(() => {
//     const seriesWords = course.series?.split(" ") || [];
//     let title = course.title;
    
//     // Remove "EB1A" prefix if present
//     title = title.replace(/^EB1A\s+/i, "");
    
//     // Remove "Self-petition" if present
//     title = title.replace(/\s*Self-petition\s*/i, " ");
    
//     // Remove series words from the end
//     seriesWords.forEach(word => {
//       const regex = new RegExp(`\\s*${word}\\s*$`, 'i');
//       title = title.replace(regex, "");
//     });
    
//     return title.trim();
//   }, [course.title, course.series]);

  return (
    <div className={`group rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${
      isPurchased ? 'border-emerald-200' : 'border-gray-200'
    }`}>
      {/* Card Header with Image */}
      <Link
        href={detailHref}
        className="relative block h-36 overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-50"
        aria-label={`View ${course.title}`}
      >
        {course.image_url ? (
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className={`text-xs font-semibold ${metadata?.accentColor || 'text-gray-500'}`}>
              {course.tags?.[0] ? formatLabel(course.tags[0]) : 'Course'}
            </span>
          </div>
        )}
        
        {/* Status Badges */}
        <div className="absolute right-2 top-2 flex gap-1">
          {isPurchased && (
            <Badge className="h-5 border-0 bg-emerald-500/90 text-xs text-white backdrop-blur-sm">
              <Check className="mr-0.5 h-3 w-3" />
              Owned
            </Badge>
          )}
          {course.ratings && (
            <Badge className="h-5 border-0 bg-white/90 text-xs backdrop-blur-sm">
              <Star className="mr-0.5 h-3 w-3 fill-amber-400 text-amber-400" />
              {course.ratings.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Tag Badge */}
        {course.tags?.[0] && (
          <div className="absolute bottom-2 left-2">
            <Badge 
              variant="outline" 
              className={`border-white/50 bg-white/90 text-xs backdrop-blur-sm ${metadata?.accentColor || 'text-gray-700'}`}
            >
              #{formatLabel(course.tags[0])}
            </Badge>
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-3">
        {/* Title */}
        <h3 className="mb-2 h-10 text-sm font-semibold text-gray-900">
          <Link
            href={detailHref}
            className="line-clamp-2 transition-colors duration-200 hover:text-amber-600"
          >
            {course.title}
          </Link>
        </h3>

        {/* Pricing Options */}
        {pricingOptions.length > 0 && (
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Select access period</span>
            </div>
            
            <div className={`grid gap-1 ${
              pricingOptions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {pricingOptions.map((option, index) => {
                const isSelected = index === selectedOptionIndex;
                const monthLabel = option.validity_duration === 1 ? 'mo' : 'mos';
                
                return (
                  <button
                    key={option.key}
                    onClick={() => setSelectedOptionIndex(index)}
                    disabled={isPurchased}
                    className={`relative rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                      isPurchased
                        ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">
                      {option.validity_duration}{monthLabel}
                    </div>
                    <div className="text-[10px] opacity-90">
                      {formatPrice(option.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price Display */}
        {selectedOption && (
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(selectedOption.price)}
              </div>
              {selectedOption.compared_price && selectedOption.compared_price > selectedOption.price && (
                <div className="text-xs text-gray-500 line-through">
                  {formatPrice(selectedOption.compared_price)}
                </div>
              )}
            </div>
            {selectedOption.compared_price && selectedOption.compared_price > selectedOption.price && (
              <div className="text-xs font-semibold text-emerald-600">
                Save {Math.round((1 - selectedOption.price / selectedOption.compared_price) * 100)}%
              </div>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={!selectedOption || isInCart || isPurchased}
          size="sm"
          className={`w-full h-8 text-xs font-medium transition-all ${
            isPurchased || isInCart
              ? 'bg-gray-100 text-gray-500'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
          }`}
        >
          {isPurchased ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Purchased
            </>
          ) : isInCart ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              In Cart
            </>
          ) : (
            <>
              <ShoppingCart className="mr-1 h-3 w-3" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
