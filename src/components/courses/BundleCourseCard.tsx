// src/components/courses/BundleCourseCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CourseOption, CourseWithTwelveMonthOption } from '@/lib/types/course';

interface BundleCourseCardProps {
  course: CourseWithTwelveMonthOption;
  twelveMonthOption: CourseOption;
  selected: boolean;
  onToggle: () => void;
  effectivePrice: number;
  discountPct: number;
  hasDiscount: boolean;
  seriesColor: string;
}

export function BundleCourseCard({
  course,
  twelveMonthOption,
  selected,
  onToggle,
  effectivePrice,
  discountPct,
  hasDiscount,
  seriesColor
}: BundleCourseCardProps) {
  const originalPrice = twelveMonthOption.price;
  
  return (
    <div
      className={`relative w-full rounded-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${
        selected 
          ? 'shadow-sm' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{
        borderColor: selected ? seriesColor : undefined,
        backgroundColor: selected ? `${seriesColor}08` : 'white',
      }}
      onClick={onToggle}
    >
      {/* Checkbox overlay */}
      <div
        className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all bg-white/90 backdrop-blur-sm ${
          selected 
            ? '' 
            : 'border-gray-400'
        }`}
        style={{
          backgroundColor: selected ? seriesColor : 'rgba(255,255,255,0.9)',
          borderColor: selected ? seriesColor : undefined,
        }}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Image - Full width at top */}
      <div className="relative w-full h-32 lg:h-24">
        <img
          src={course.urls?.thumbnail_url || "https://uutgcpvxpdgmnfdudods.supabase.co/storage/v1/object/public/Immigreat%20site%20assets/thumbnail.png"}
          alt={course.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-1 line-clamp-2 min-h-[2rem]">
          {course.title}
        </h4>

        {/* Tags - Show first tag only */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">
              {course.tags[0]}
            </span>
            {course.tags.length > 1 && (
              <span className="text-[10px] text-gray-500">
                +{course.tags.length - 1}
              </span>
            )}
          </div>
        )}

        {/* View Details Link */}
        <Link 
          href={`/course/${course.course_slug}`}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View details
        </Link>

        {/* Pricing */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
            ${twelveMonthOption.validity} months
          </Badge>
          
          {hasDiscount ? (
            <>
              <span className="text-[10px] text-gray-400 line-through">
                ${originalPrice}
              </span>
              <span className="text-xs font-bold" style={{ color: seriesColor }}>
                ${Math.round(effectivePrice)}
              </span>
              <Badge className="text-[10px] px-1 py-0 h-4 bg-green-100 text-green-700 border-0">
                -{Math.round(discountPct)}%
              </Badge>
            </>
          ) : (
            <span className="text-xs font-bold text-gray-900">
              ${originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
