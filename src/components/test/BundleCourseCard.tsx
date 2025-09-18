// src/components/courses/BundleCourseCard.tsx
'use client';

import React from 'react';
import { Check, Tag } from 'lucide-react';
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
  owned?: boolean;
}

export function BundleCourseCard({
  course,
  twelveMonthOption,
  selected,
  onToggle,
  effectivePrice,
  discountPct,
  hasDiscount,
  seriesColor,
  owned = false
}: BundleCourseCardProps) {
  const originalPrice = twelveMonthOption.price;
  const isSelected = selected && !owned;
  
  return (
    <div
      onClick={() => {
        if (owned) return;
        onToggle();
      }}
      className={`
        relative w-full p-4 rounded-lg border-2 transition-all duration-200
        ${owned
          ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-75'
          : isSelected
            ? 'bg-blue-50 border-blue-500 shadow-sm cursor-pointer'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer'
        }
      `}
      style={{ borderColor: isSelected ? seriesColor : undefined }}
      aria-disabled={owned}
    >
      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <div className="flex-shrink-0 mt-1">
          <div
            className={`
              w-6 h-6 rounded-md border-2 flex items-center justify-center
              transition-all duration-200
              ${isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'bg-white border-gray-300 hover:border-gray-400'
              }
            `}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Course Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Tags Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="text-base font-medium text-gray-900 line-clamp-2 flex-1">
              {course.title}
            </h4>
            
            {/* Price Display - Clean and Clear */}
            <div className="flex-shrink-0 text-right">
              {owned ? (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs px-2 py-0.5">
                  Already owned
                </Badge>
              ) : hasDiscount ? (
                <div>
                  <div className="text-sm text-gray-400 line-through">
                    ${originalPrice}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    ${Math.round(effectivePrice)}
                  </div>
                  <Badge className="text-[10px] bg-green-100 text-green-700 border-0 px-1 py-0">
                    Save {Math.round(discountPct)}%
                  </Badge>
                </div>
              ) : (
                <div className="text-lg font-bold text-gray-900">
                  ${originalPrice}
                </div>
              )}
            </div>
          </div>

          {/* Tags - Clean Display */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {course.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
                {course.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{course.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Course Description - Optional */}
          {course.description?.short && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-1">
              {course.description.short}
            </p>
          )}

          {/* Access Duration Badge */}
          <div className="mt-2">
            <Badge variant="outline" className="text-xs border-gray-300">
              12 months access
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
