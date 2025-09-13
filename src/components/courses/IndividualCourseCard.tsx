// src/components/courses/IndividualCourseCard.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEnrollmentStore } from '@/lib/stores/useEnrollmentStore';
import type { Course } from '@/lib/types/course';
import { useCartStore } from '@/lib/stores/useCartStore';
import Link from 'next/link';

interface IndividualCourseCardProps {
  course: Course;
  categoryColor: string;
  seriesColor: string;
}

interface SelectedOption {
  validity_months: number;
  price: number;
  original_price?: number;
  course_id: string;
  enroll_id: string;
  title: string;
}

export function IndividualCourseCard({ course, categoryColor, seriesColor }: IndividualCourseCardProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('right');
  
  // Get course options from the database structure
  const courseOptions = course.course_options || [];
  
  // State for selected option index
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  
  // Get the selected option
  const selectedOption: SelectedOption = courseOptions[selectedOptionIndex] ? {
    validity_months: courseOptions[selectedOptionIndex].validity || 3,
    price: courseOptions[selectedOptionIndex].price || 299,
    original_price: courseOptions[selectedOptionIndex].original_price,
    course_id: course.course_id,
    enroll_id: courseOptions[selectedOptionIndex].course_enroll_id || courseOptions[selectedOptionIndex].variant_code || 'default',
    title: course.title || 'Course'
  } : {
    validity_months: 3,
    price: 299,
    original_price: undefined,
    course_id: course.course_id,
    enroll_id: 'default',
    title: course.title || 'Course'
  };

  const hasEnrollment = useEnrollmentStore(state => state.hasEnrollment);
  // Consider both the course id (item_id) and the selected option's enroll id (item_enroll_id)
  const isEnrolled = hasEnrollment(course.course_id, selectedOption.enroll_id);

   const { addItem, hasItem } = useCartStore();
   const cartHydrated = useCartStore(state => state.hasHydrated);
   const isInCart = cartHydrated ? hasItem(course.course_id) : false;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive]')) {
      return;
    }
    router.push(`/course/${course.course_slug}`);
  };

 const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isInCart) return;

    // Use the currently selected option (not the default)
    const option = (course.course_options || [])[selectedOptionIndex];
    const cartItem = {
      product_id: course.course_id,
      product_type: 'course' as const,
      product_slug: course.course_slug,
      variant_code: option?.variant_code,
      product_enroll_id: option?.course_enroll_id ?? option?.variant_code,
      title: course.title,
      original_price: option?.original_price ?? option?.price ?? 0,
      price: option?.price ?? 0,
      currency: option?.currency ?? 'USD',
      thumbnail_url: course.urls?.thumbnail_url,
    };

    await addItem(cartItem);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const cardCenter = rect.left + rect.width / 2;
    setTooltipPosition(cardCenter > windowWidth / 2 ? 'left' : 'right');
    setShowTooltip(true);
  };

  const formatPrice = (price: number): string => {
    return `$${price}`;
  };

  const getValidityLabel = (months: number): string => {
    if (months === 12) return '12 months';
    if (months === 6) return '6 months';
    if (months === 3) return '3 months';
    if (months === 1) return '1 month';
    return `${months} months`;
  };

  const getDiscountPercentage = (original: number, current: number): number => {
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <Card
        className="group cursor-pointer transition-all duration-300 hover:shadow-xl bg-white border border-gray-200 overflow-hidden h-full py-0"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <CardContent className="p-0">
          {/* Image Section with fixed aspect ratio */}
          <div className="relative aspect-[16/10] w-full">
            <img
              src={course.urls?.thumbnail_url || "https://uutgcpvxpdgmnfdudods.supabase.co/storage/v1/object/public/Immigreat%20site%20assets/thumbnail.png"}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            
            {/* Badges Overlay */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
              <Badge
                className="text-[10px] font-medium text-white border-0 shadow px-2 py-0.5"
                style={{ backgroundColor: seriesColor }}
              >
                {(course.series || 'general').replace(/-/g, ' ').toUpperCase()}
              </Badge>
              {course.tags?.[0] && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium bg-white/90 text-gray-700 border-0 shadow px-2 py-0.5"
                >
                  {course.tags[0].toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Rating Badge */}
            {course.rating && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-amber-500 text-white border-0 shadow flex items-center gap-1 px-1.5 py-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-medium">{course.rating}</span>
                  {course.rating_count && (
                    <span className="text-[10px] opacity-90">({course.rating_count})</span>
                  )}
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-bold text-sm lg:text-base text-gray-900 line-clamp-2 min-h-[2.5rem]">
              {course.title}
            </h3>

            {/* Description */}
            <p className="text-xs lg:text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
              {course.description?.short}
            </p>

            {/* Validity Options */}
            {courseOptions.length > 0 && (
              <div className="space-y-2" data-interactive>
                <p className="text-xs font-medium text-gray-700">Access Period:</p>
                <div className="flex gap-2">
                  {courseOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOptionIndex(idx);
                      }}
                      className={`flex-1 py-2 px-2 rounded-lg border-2 transition-all duration-200 ${
                        selectedOptionIndex === idx
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-[10px] font-medium text-gray-600">
                          {getValidityLabel(option.validity || 3)}
                        </div>
                        <div className="text-sm font-bold" style={{ color: selectedOptionIndex === idx ? categoryColor : '#374151' }}>
                          {formatPrice(option.price || 0)}
                        </div>
                        {option.original_price && option.original_price > option.price && (
                          <div className="space-y-0.5">
                            <div className="text-xs text-gray-400 line-through">
                              {formatPrice(option.original_price)}
                            </div>
                            <Badge className="text-[9px] px-1 py-0 bg-red-500 text-white h-4">
                              -{getDiscountPercentage(option.original_price, option.price)}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Single Price Display if no options */}
            {courseOptions.length === 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold" style={{ color: categoryColor }}>
                        $299
                      </span>
                      <span className="text-xs text-gray-500">3 months access</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-auto">
    {isEnrolled ? (
      <Link href="/my-purchases" passHref>
        <Button
          variant="outline"
          className="w-full border-green-600 text-green-700 bg-green-50 hover:bg-green-100 font-medium shadow-none hover:shadow-none transition-all duration-300 text-xs py-1.5 h-8"
        >
          Already purchased
        </Button>
      </Link>
    ) : (
      <Button
        data-cart-button
        onClick={handleAddToCart}
        disabled={cartHydrated ? isInCart : false}
        className={`w-full font-medium shadow-md hover:shadow-lg transition-all duration-300 text-xs py-1.5 h-8 ${
          (cartHydrated ? isInCart : false)
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
        }`}
      >
        <ShoppingCart className="w-3 h-3 mr-1.5" />
        {(cartHydrated ? isInCart : false) ? 'Added' : 'Add to Cart'}
      </Button>
    )}
  </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip */}
      {showTooltip && course.highlights && (
        <div
          className={`absolute top-4 z-50 w-72 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-2xl animate-in fade-in duration-200 ${
            tooltipPosition === 'left' ? 'right-full mr-3' : 'left-full ml-3'
          }`}
        >
          <div
            className={`absolute top-6 w-3 h-3 bg-white/95 border-l border-t border-gray-200/50 rotate-45 ${
              tooltipPosition === 'left' ? 'right-[-6px]' : 'left-[-6px]'
            }`}
          />
          
          <div className="relative">
            <h4 className="font-bold text-sm text-gray-900 mb-2" style={{ color: seriesColor }}>
              {course.highlights.title}
            </h4>
            <ul className="space-y-1.5">
              {course.highlights.highlights.slice(0, 4).map((highlight, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span 
                    className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" 
                    style={{ backgroundColor: seriesColor }}
                  />
                  <span className="line-clamp-2">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndividualCourseCard;
