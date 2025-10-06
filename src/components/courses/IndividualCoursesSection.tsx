// src/components/courses/IndividualCoursesSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { SeriesColumn } from "./SeriesColumn";
import type { NormalizedSeriesMetadata } from "@/types/catalog";
import { useCartStore } from "@/stores/cart-store";
import { calculateCartDiscounts, DISCOUNT_TIERS } from "@/lib/pricing/discounts";

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
  const {
    qualifyingCount,
    discountRate,
    currentTier,
    qualifyingSubtotal,
    discountAmount,
    upcomingTier,
  } = discountSummary;

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }),
    []
  );

  const coursesSubtotalAfterDiscount = Math.max(0, qualifyingSubtotal - discountAmount);
  const averageCoursePriceAfterDiscount = qualifyingCount > 0 ? coursesSubtotalAfterDiscount / qualifyingCount : 0;
  const discountPercentLabel = discountRate > 0 ? `~${(discountRate * 100).toFixed(0)}%` : "0%";

  const formattedDiscountAmount = currencyFormatter.format(discountAmount);
  const formattedAverageCoursePriceAfterDiscount = currencyFormatter.format(averageCoursePriceAfterDiscount);
  const formattedCoursesSubtotalAfterDiscount = currencyFormatter.format(coursesSubtotalAfterDiscount);

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
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Filters active
            </span>
          )}
        </div>

        {qualifyingCount > 0 ? (
          <div className="mx-auto mt-2 w-full max-w-3xl rounded-full border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-4 py-2 text-xs text-gray-600 shadow-sm sm:px-6 sm:text-sm">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center sm:text-left">
              <span>
                Discount tier applied
                <span className="ml-1 font-semibold text-gray-900">{currentTier?.name ?? 'Active discount'}</span>
              </span>
              <span className="hidden text-gray-300 sm:inline">•</span>
              <span>
                Total
                <span className="ml-1 font-semibold text-gray-900">{formattedCoursesSubtotalAfterDiscount}</span>
                <span className="ml-1 text-gray-400">(≈ {formattedAverageCoursePriceAfterDiscount} / course)</span>
              </span>
              <span className="hidden text-gray-300 sm:inline">•</span>
              <span>
                Discount
                <span className="ml-1 font-semibold text-gray-900">- {formattedDiscountAmount} ({discountPercentLabel})</span>
              </span>
              <a
                href="#discount-tier-benefits"
                className="ml-1 inline-flex items-center text-emerald-600 underline-offset-2 transition hover:text-emerald-700 hover:underline"
              >
                Know more
              </a>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-2 w-full max-w-3xl rounded-full border border-dashed border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-4 py-2 text-center text-xs text-emerald-700 sm:px-6 sm:text-sm">
            <span>Add courses to your bundle to unlock tiered discounts.</span>
            <a
              href="#discount-tier-benefits"
              className="ml-2 inline-flex items-center text-emerald-600 underline-offset-2 hover:text-emerald-700 hover:underline"
            >
              Know more
            </a>
          </div>
        )}

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
                      desktopColumnIndex={index}
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

      <section id="discount-tier-benefits" className="mt-12">
        <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/80 to-orange-50/70 p-6 shadow-sm sm:p-8">
          <div className="absolute -top-10 right-8 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-12 left-6 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Tier benefits</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">How the discount tiers work</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Combine courses across categories. Your savings automatically increase as you cross each threshold.
                </p>
              </div>
              <div className="rounded-full border border-amber-200 bg-white/80 px-4 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                Currently added: {qualifyingCount} {qualifyingCount === 1 ? 'course' : 'courses'}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {DISCOUNT_TIERS.map(tier => {
                const isUnlocked = qualifyingCount >= tier.threshold;
                const isNextTier = !isUnlocked && upcomingTier?.name === tier.name;
                const coursesToUnlock = Math.max(0, tier.threshold - qualifyingCount);
                return (
                  <div
                    key={tier.name}
                    className={`relative rounded-2xl border p-5 transition ${
                      isUnlocked
                        ? 'border-emerald-300 bg-white shadow-md'
                        : isNextTier
                        ? 'border-amber-300 bg-white/90 shadow-sm'
                        : 'border-white/70 bg-white/70'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                      <span className={isUnlocked ? 'text-emerald-600' : isNextTier ? 'text-amber-500' : 'text-gray-400'}>
                        {tier.name}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                        isUnlocked
                          ? 'bg-emerald-50 text-emerald-600'
                          : isNextTier
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isUnlocked ? 'Unlocked' : isNextTier ? 'Next up' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{(tier.rate * 100).toFixed(0)}% off</p>
                    <p className="mt-2 text-sm text-gray-600">Add {tier.threshold}+ qualifying courses</p>
                    <ul className="mt-4 space-y-2 text-xs text-gray-500">
                      <li>Applies automatically at checkout</li>
                      {isUnlocked ? (
                        <li className="font-semibold text-emerald-600">Savings active now</li>
                      ) : coursesToUnlock > 0 ? (
                        <li className="font-semibold text-amber-600">
                          Add {coursesToUnlock} more {coursesToUnlock === 1 ? 'course' : 'courses'} to unlock
                        </li>
                      ) : (
                        <li>Build your bundle to reach this tier</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
