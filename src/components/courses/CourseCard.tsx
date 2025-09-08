// src/components/courses/CourseCard.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Course } from '@/lib/types/course';

interface CourseCardProps {
  course: Course;
  categoryColor: string;
}

export function CourseCard({ course, categoryColor }: CourseCardProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('right');

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the add to cart button
    if ((e.target as HTMLElement).closest('[data-cart-button]')) {
      return;
    }
    router.push(`/course/${course.course_slug}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', course.course_id);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const cardCenter = rect.left + rect.width / 2;
    
    // Position tooltip based on card position
    setTooltipPosition(cardCenter > windowWidth / 2 ? 'left' : 'right');
    setShowTooltip(true);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: course.price.currency || 'USD',
    }).format(price);
  };

  return (
    <div className="relative">
      <Card
        className="group py-0 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 overflow-hidden h-full flex flex-col"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image Container - Fixed 400x250 size, touching top border */}
          <div className="relative w-full">
            <img
              src="https://uutgcpvxpdgmnfdudods.supabase.co/storage/v1/object/public/Immigreat%20site%20assets/thumbnail.png"
              alt={course.name}
              className="w-full object-cover"
              style={{ height: '250px', aspectRatio: '400/250' }}
            />
            
            {/* Badges Overlay */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-4rem)]">
              <Badge
                className="text-xs font-medium text-white border-0 shadow-lg px-2 py-1"
                style={{ backgroundColor: categoryColor }}
              >
                {course.series_slug.replace(/-/g, ' ').toUpperCase()}
              </Badge>
              {course.tags[0] && (
                <Badge
                  variant="secondary"
                  className="text-xs font-medium bg-white/90 text-gray-700 border-0 shadow-lg px-2 py-1"
                >
                  {course.tags[0].toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Rating Badge */}
            <div className="absolute top-2 right-2">
              <Badge className="bg-amber-500 text-white border-0 shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs">{course.rating}</span>
              </Badge>
            </div>
          </div>

          {/* Content - Compact padding */}
          <div className="p-3 sm:p-4 flex flex-col flex-grow">
            {/* Title */}
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
              {course.name}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed flex-grow">
              {course.description.short}
            </p>

            {/* Price Section */}
            <div className="mb-3">
              <div className="flex items-center gap-2 justify-start">
                <span className="text-lg sm:text-xl font-bold" style={{ color: categoryColor }}>
                  {formatPrice(course.price.current)}
                </span>
                {course.price.original > course.price.current && (
                  <span className="text-sm sm:text-base text-gray-400 line-through">
                    {formatPrice(course.price.original)}
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart Button - Reduced size */}
            <Button
              data-cart-button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 mt-auto text-xs py-1.5 h-8"
            >
              <ShoppingCart className="w-3 h-3 mr-1.5" />
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`absolute top-4 z-50 w-80 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-2xl animate-in fade-in duration-200 ${
            tooltipPosition === 'left' ? 'right-full mr-4' : 'left-full ml-4'
          }`}
        >
          {/* Arrow */}
          <div
            className={`absolute top-6 w-3 h-3 bg-white/95 border-l border-t border-gray-200/50 rotate-45 ${
              tooltipPosition === 'left' ? 'right-[-6px]' : 'left-[-6px]'
            }`}
          />
          
          <div className="relative">
            <h4 className="font-bold text-gray-900 mb-3" style={{ color: categoryColor }}>
              {course.highlight.title}
            </h4>
            <ul className="space-y-2">
              {course.highlight.highlights.map((highlight, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}