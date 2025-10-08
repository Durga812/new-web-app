// src/components/courses/SeriesColumn.tsx
"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { NormalizedSeriesMetadata } from "@/types/catalog";
import { CompactCourseCard } from "./CompactCourseCard";

type CoursePricing = {
  price: number;
  compared_price?: number;
  validity_duration: number;
  validity_type: string;
};

type Course = {
  title: string;
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
  subtitle?: string;
  keyBenefits?: string[];
  details?: Record<string, unknown>;
};

interface SeriesColumnProps {
  series: string;
  metadata?: NormalizedSeriesMetadata;
  courses: Course[];
  desktopColumnIndex?: number;
}

export function SeriesColumn({
  series,
  metadata,
  courses,
  desktopColumnIndex,
}: SeriesColumnProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipSide = desktopColumnIndex !== undefined && desktopColumnIndex >= 2 ? 'left' : 'right';

  return (
    <div
      className={`flex h-full flex-col rounded-xl ${
        metadata?.bgColor || 'bg-gray-50/50'
      }`}
    >
      {/* Column Header */}
      <div className="sticky z-20 border-b border-gray-200/50 bg-white px-3 py-3 backdrop-blur-md rounded-t-xl shadow-md top-[calc(var(--nav-offset,4rem)+var(--category-discount-height,0px))]">
        {/* Gradient overlay to fade cards scrolling under */}
        <div className="absolute inset-x-0 -bottom-12 h-12 bg-gradient-to-b from-white via-white/60 to-transparent pointer-events-none z-10" aria-hidden="true" />
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`text-sm font-bold ${metadata?.accentColor || 'text-gray-800'}`}>
              {metadata?.displayName || series}
            </h3>
            <p className="mt-0.5 text-xs text-gray-600">
              {metadata?.subtitle || `${courses.length} courses`}
            </p>
          </div>

          {/* Info Button with Tooltip */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                metadata?.accentColor || 'text-gray-600'
              } border-current/20 bg-white text-xs hover:bg-current/10 transition-colors`}
              aria-label={`Info about ${metadata?.displayName || series}`}
            >
              <Info className="h-3 w-3" />
            </button>

            {/* Tooltip */}
            {showTooltip && metadata?.tooltipContent && (
              <div className="absolute right-0 top-7 z-40 w-56 animate-fade-in">
                <div className="relative rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
                  <div className="absolute -top-2 right-2 h-4 w-4 rotate-45 border-l border-t border-gray-200 bg-white" />
                  <p className="text-xs leading-relaxed text-gray-700">
                    {metadata.tooltipContent}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="relative space-y-2 px-2 pb-2 pt-3">
        {courses.map(course => (
          <CompactCourseCard
            key={course.course_id}
            course={course}
            metadata={metadata}
            tooltipSide={tooltipSide}
          />
        ))}
      </div>
    </div>
  );
}
