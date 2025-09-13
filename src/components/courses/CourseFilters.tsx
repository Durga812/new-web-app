// src/components/courses/CourseFilters.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Course, FilterState } from '@/lib/types/course';

interface CourseFiltersProps {
  courses: Course[];
  categoryColor: string;
  filters: FilterState;
}

export function CourseFilters({ courses, categoryColor, filters }: CourseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extract unique series and tags from courses
  const availableSeries = Array.from(new Set(courses.map(course => course.series).filter((slug): slug is string => !!slug))).sort();
  const availableTags = Array.from(new Set(courses.flatMap(course => course.tags))).sort();

  // Toggle a value inside a comma-separated query param list
  const toggleFilterValue = (key: 'series' | 'tags', value: string) => {
    const params = new URLSearchParams(searchParams);
    const raw = params.get(key) || '';
    const list = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const idx = list.indexOf(value);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(value);
    }

    if (list.length === 0) {
      params.delete(key);
    } else {
      params.set(key, list.join(','));
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url);
  };

  const clearFilterKey = (key: 'series' | 'tags') => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters =
    (filters.series?.length ?? 0) > 0 || (filters.tags?.length ?? 0) > 0;

  const formatSeriesName = (series: string): string => {
    return series
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTagName = (tag: string): string => {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  };

  // UI helpers
  const activeBtnStyles: React.CSSProperties = {
    background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
    color: '#fff',
  };

  const baseBtnClasses =
    'h-9 px-3 rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50';

  const groupWrapClasses =
    'flex flex-wrap gap-2';

  return (
    <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg">
      <CardContent className="p-6">
        {/* Clickable Filter Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" style={{ color: categoryColor }} />
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
              Filter Courses
            </h3>
            {isFilterOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Collapsible Filter Content */}
        {isFilterOpen && (
          <div className="mt-6 space-y-6">
            {/* Optional: tiny category accent bar for visual continuity */}
            <div
              className="h-1 w-16 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />

            {/* Series Filter Buttons (no dropdown) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">Series</h4>
                <a
                  href="#"
                  className="text-xs text-blue-600 hover:text-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Navigate to help page or open modal
                    console.log('Help Me Choose the EB1A Series?');
                  }}
                >
                  Help Me Choose the right EB1A Series?
                </a>
              </div>

              <div className={groupWrapClasses}>
                {/* All Series */}
                <button
                  onClick={() => clearFilterKey('series')}
                  className={baseBtnClasses}
                  style={filters.series.length === 0 ? activeBtnStyles : {}}
                >
                  All Series
                </button>

                {availableSeries.map((series) => {
                  const isActive = filters.series.includes(series);
                  return (
                    <button
                      key={series}
                      onClick={() => toggleFilterValue('series', series)}
                      className={baseBtnClasses}
                      style={isActive ? activeBtnStyles : {}}
                    >
                      {formatSeriesName(series)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Filter Buttons (no dropdown) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">Tags</h4>
                <a
                  href="#"
                  className="text-xs text-blue-600 hover:text-blue-700 "
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Navigate to help page or open modal
                    console.log('Help Me Choose which eb1a criteria is right for me?');
                  }}
                >
                  Help Me Choose the righteb1a criteria?
                </a>
              </div>

              <div className={groupWrapClasses}>
                {/* All Tags */}
                <button
                  onClick={() => clearFilterKey('tags')}
                  className={baseBtnClasses}
                  style={filters.tags.length === 0 ? activeBtnStyles : {}}
                >
                  All Tags
                </button>

                {availableTags.map((tag) => {
                  const isActive = filters.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleFilterValue('tags', tag)}
                      className={baseBtnClasses}
                      style={isActive ? activeBtnStyles : {}}
                    >
                      {formatTagName(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.series.map(series => (
                <Badge
                  key={`series-${series}`}
                  variant="secondary"
                  className="flex items-center gap-1 rounded-md"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  Series: {formatSeriesName(series)}
                  <X
                    className="w-3 h-3 cursor-pointer hover:bg-black/10 rounded-full"
                    onClick={() => toggleFilterValue('series', series)}
                  />
                </Badge>
              ))}
              {filters.tags.map(tag => (
                <Badge
                  key={`tag-${tag}`}
                  variant="secondary"
                  className="flex items-center gap-1 rounded-md"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  Tag: {formatTagName(tag)}
                  <X
                    className="w-3 h-3 cursor-pointer hover:bg-black/10 rounded-full"
                    onClick={() => toggleFilterValue('tags', tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
