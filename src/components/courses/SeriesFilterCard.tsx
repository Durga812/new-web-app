// src/components/courses/SeriesFilterCard.tsx
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SeriesFilterCardProps {
  series: string;
  title: string;
  description: string;
  color: string;
  isActive: boolean;
  courseCount: number;
  onToggle: () => void;
}

export function SeriesFilterCard({
  series,
  title,
  description,
  color,
  isActive,
  courseCount,
  onToggle
}: SeriesFilterCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1 mb-2">
            {description}
          </p>
          <Badge
            variant="outline"
            className="text-xs px-2 py-0.5"
            style={{
              borderColor: isActive ? color : '#e5e7eb',
              color: isActive ? color : '#6b7280',
            }}
          >
            {courseCount} {courseCount === 1 ? 'course' : 'courses'}
          </Badge>
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isActive 
              ? 'bg-amber-500 focus:ring-amber-500' 
              : 'bg-gray-200 focus:ring-gray-500'
          }`}
          style={{
            backgroundColor: isActive ? color : '#e5e7eb'
          }}
        >
          <span className="sr-only">Toggle {title}</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default SeriesFilterCard;