// src/components/courses/IndividualCoursesSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { SeriesColumn } from "./SeriesColumn";
import type { NormalizedSeriesMetadata } from "@/types/catalog";
import { useCartStore } from "@/stores/cart-store";
import { calculateCartDiscounts } from "@/lib/pricing/discounts";

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
};

interface IndividualCoursesSectionProps {
  category: string;
  courses: Course[];
  seriesMetadata: Record<string, NormalizedSeriesMetadata>;
}

export function IndividualCoursesSection({
  courses,
  seriesMetadata: seriesMetadataMap,
}: IndividualCoursesSectionProps) {
  // Get series metadata for this category
  const categorySeriesInfo = seriesMetadataMap;
  
  // Extract unique series and tags from courses
  const seriesOptions = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(course => {
      if (course.series) {
        set.add(course.series);
      }
    });
    return Array.from(set).sort((a, b) => {
      const orderA = categorySeriesInfo[a]?.order ?? 999;
      const orderB = categorySeriesInfo[b]?.order ?? 999;
      return orderA - orderB;
    });
  }, [courses, categorySeriesInfo]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    courses.forEach(course => {
      course.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [courses]);

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSeries, setActiveSeries] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Cart-based discount summary for showing tier beside Filters button
  const cartItems = useCartStore(state => state.items);
  const discountSummary = useMemo(() => calculateCartDiscounts(cartItems), [cartItems]);
  const { qualifyingCount, discountRate, currentTier } = discountSummary;
  const discountPercent = Math.round(discountRate * 100);

  // Initialize with all series when component mounts
  useEffect(() => {
    if (activeSeries.length === 0 && seriesOptions.length > 0) {
      setActiveSeries([...seriesOptions]);
    }
  }, [activeSeries.length, seriesOptions]);

  // Group and filter courses
  const { coursesBySeries, totalFilteredCount } = useMemo(() => {
    // First apply search filter
    let filtered = courses;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = courses.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.series?.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(course =>
        course.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Group by series
    const grouped: Record<string, Course[]> = {};
    let count = 0;

    filtered.forEach(course => {
      if (course.series && activeSeries.includes(course.series)) {
        if (!grouped[course.series]) {
          grouped[course.series] = [];
        }
        grouped[course.series].push(course);
        count++;
      }
    });

    // Sort courses within each series by position
    Object.keys(grouped).forEach(series => {
      grouped[series].sort((a, b) => (a.position || 999) - (b.position || 999));
    });

    return { coursesBySeries: grouped, totalFilteredCount: count };
  }, [courses, searchQuery, activeSeries, selectedTags]);

  const toggleSeries = (series: string) => {
    setActiveSeries(prev =>
      prev.includes(series) 
        ? prev.filter(s => s !== series)
        : [...prev, series]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setActiveSeries([...seriesOptions]);
    setSelectedTags([]);
    setSearchQuery("");
  };

  const hasActiveFilters = 
    activeSeries.length !== seriesOptions.length || 
    selectedTags.length > 0 ||
    searchQuery.length > 0;

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative mx-auto max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title, series, or tags..."
            className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200/50"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                Active
              </span>
            )}
          </button>
          {qualifyingCount > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {currentTier?.name ? `${currentTier.name}` : 'add 5 courses to get discount'}
              <span className="text-emerald-600/80">•</span>
              {qualifyingCount} {qualifyingCount === 1 ? 'course' : 'courses'}
              {discountPercent > 0 && (
                <span className="text-emerald-600/80">• {discountPercent}% off</span>
              )}
            </span>
          )}
        </div>

        {/* Expandable Filters */}
        {isFilterOpen && (
          <div className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Filter courses</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Series Filter */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-gray-700">By Series</p>
              <div className="flex flex-wrap gap-2">
                {seriesOptions.map(series => {
                  const isActive = activeSeries.includes(series);
                  const metadata = categorySeriesInfo[series];
                  return (
                    <button
                      key={series}
                      onClick={() => toggleSeries(series)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {metadata?.displayName || series}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Filter */}
            {tagOptions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-700">By Criteia</p>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {tag.replace(/-/g, ' ').split(' ').map(w => 
                          w.charAt(0).toUpperCase() + w.slice(1)
                        ).join(' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{totalFilteredCount}</span> courses
          {hasActiveFilters && " (filtered)"}
        </p>
      </div>

      {/* Column Layout */}
      {totalFilteredCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <p className="text-base font-semibold text-gray-800">No courses found</p>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your filters or search query
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Desktop: Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-2">
            {seriesOptions
              .filter(series => activeSeries.includes(series))
              .map((series, index) => {
                const metadata = categorySeriesInfo[series];
                const seriesCourses = coursesBySeries[series] || [];
                
                if (seriesCourses.length === 0) return null;

                return (
                  <div key={series} className="relative">
                    {/* Column separator */}
                    {index > 0 && (
                      <div className="absolute -left-1 top-0 h-full w-px bg-gradient-to-b from-gray-200 to-transparent" />
                    )}
                    <SeriesColumn
                      series={series}
                      metadata={metadata}
                      courses={seriesCourses}
                    />
                  </div>
                );
              })}
          </div>

          {/* Tablet: 2 Columns */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-4 lg:hidden">
            {seriesOptions
              .filter(series => activeSeries.includes(series))
              .map(series => {
                const metadata = categorySeriesInfo[series];
                const seriesCourses = coursesBySeries[series] || [];
                
                if (seriesCourses.length === 0) return null;

                return (
                  <SeriesColumn
                    key={series}
                    series={series}
                    metadata={metadata}
                    courses={seriesCourses}
                  />
                );
              })}
          </div>

          {/* Mobile: Single Column */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {seriesOptions
              .filter(series => activeSeries.includes(series))
              .map(series => {
                const metadata = categorySeriesInfo[series];
                const seriesCourses = coursesBySeries[series] || [];
                
                if (seriesCourses.length === 0) return null;

                return (
                  <SeriesColumn
                    key={series}
                    series={series}
                    metadata={metadata}
                    courses={seriesCourses}
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
