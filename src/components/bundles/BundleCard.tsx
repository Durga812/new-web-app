// src/components/bundles/BundleCard.tsx
'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Star, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bundle } from '@/lib/types/bundle';
import { useEnrollmentStore } from '@/lib/stores/useEnrollmentStore';

interface BundleCardProps {
  bundle: Bundle;
  categoryColor: string;
}

export function BundleCard({ bundle, categoryColor }: BundleCardProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('right');
   const hasEnrollment = useEnrollmentStore((state) => state.hasEnrollment);
    const isEnrolled = hasEnrollment(bundle.bundle_id);
  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('[data-cart-button]')) {
      router.push(`/bundle/${bundle.bundle_slug}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Adding bundle to cart:', bundle.bundle_id);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    setTooltipPosition(cardCenter > window.innerWidth / 2 ? 'left' : 'right');
    setShowTooltip(true);
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const courseCount = bundle.metadata.course_count || bundle.course_ids.length;

  return (
    <div className="relative">
      <Card
        className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 overflow-hidden h-full flex flex-col py-0"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image */}
          <div className="relative w-full">
            <img
              src="https://uutgcpvxpdgmnfdudods.supabase.co/storage/v1/object/public/Immigreat%20site%20assets/thumbnail.png"
              alt={bundle.name}
              className="w-full object-cover"
              style={{ height: '250px', aspectRatio: '400/250' }}
            />
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              <Badge className="text-xs text-white border-0 shadow-lg px-2 py-1 flex items-center gap-1" style={{ backgroundColor: categoryColor }}>
                <Package className="w-3 h-3" />
                BUNDLE
              </Badge>
              {bundle.tags[0] && (
                <Badge variant="secondary" className="text-xs bg-white/90 text-gray-700 border-0 shadow-lg px-2 py-1">
                  {bundle.tags[0].toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Rating */}
            {/* <div className="absolute top-2 right-2">
              <Badge className="bg-amber-500 text-white border-0 shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs">{bundle.rating}</span>
              </Badge>
            </div> */}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 flex flex-col flex-grow">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
              {bundle.name}
            </h3>

            <div className="mb-3 flex-grow flex items-center">
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-4 h-4" style={{ color: categoryColor }} />
                <span className="text-sm font-medium">{courseCount} {courseCount === 1 ? 'Course' : 'Courses'}</span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold" style={{ color: categoryColor }}>
                  {formatPrice(bundle.price.current)}
                </span>
                {bundle.price.original > bundle.price.current && (
                  <span className="text-sm sm:text-base text-gray-400 line-through">
                    {formatPrice(bundle.price.original)}
                  </span>
                )}
              </div>
            </div>
           {isEnrolled ? (
                <Link href="/my-purchases" passHref>
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 bg-green-50 hover:bg-green-100 font-medium shadow-none hover:shadow-none transition-all duration-300 text-xs py-1.5 h-8"
                  >
                    Go to Course
                  </Button>
                </Link>
              ) : 
            (<Button
              data-cart-button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 mt-auto text-xs py-1.5 h-8"
            >
              <ShoppingCart className="w-3 h-3 mr-1.5" />
              Add to Cart
            </Button>)}
          </div>
        </CardContent>
      </Card>

      {/* Tooltip */}
      {showTooltip && (
        <div className={`absolute top-4 z-50 w-80 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-2xl animate-in fade-in duration-200 ${tooltipPosition === 'left' ? 'right-full mr-4' : 'left-full ml-4'}`}>
          <div className={`absolute top-6 w-3 h-3 bg-white/95 border-l border-t border-gray-200/50 rotate-45 ${tooltipPosition === 'left' ? 'right-[-6px]' : 'left-[-6px]'}`} />
          <div className="relative">
            <h4 className="font-bold text-gray-900 mb-3" style={{ color: categoryColor }}>
              {bundle.highlight.title}
            </h4>
            <ul className="space-y-2">
              {bundle.highlight.courses.map((course, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  {course}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}