// src/components/courses/IndividualCoursesContent.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, Sparkles, Search, X, ShoppingCart } from 'lucide-react';
import { IndividualCourseCard } from './IndividualCourseCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/stores/useCartStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Course } from '@/lib/types/course';
import type { Category } from '@/lib/data/categories';

interface IndividualCoursesContentProps {
  courses: Course[];
  category: Category;
}

// Series metadata with descriptions
const seriesMetadata: Record<string, { title: string; description: string; color: string }> = {
  criteria: {
    title: 'Criteria',
    description: 'Master EB1A eligibility criteria',
    color: '#f59e0b', // amber
  },
  rfe: {
    title: 'RFE',
    description: 'Handle Request for Evidence',
    color: '#3b82f6', // blue
  },
  'final-merit': {
    title: 'Final Merit',
    description: 'Build compelling final merits',
    color: '#10b981', // emerald
  },
  'comparable-evidence': {
    title: 'Comparable Evidence',
    description: 'Present alternative evidence',
    color: '#8b5cf6', // violet
  },
};

export function IndividualCoursesContent({ courses, category }: IndividualCoursesContentProps) {
  const { addItem, hasItem } = useCartStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [addingAllSeries, setAddingAllSeries] = useState<string | null>(null);

  // State for active series filters - all active by default
  const [activeSeries, setActiveSeries] = useState<Set<string>>(
    new Set(['criteria', 'rfe', 'final-merit', 'comparable-evidence'])
  );

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // State for global variant selection (0 = first option, 1 = second option, etc.)
  const [globalVariantIndex, setGlobalVariantIndex] = useState<number>(0);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    courses.forEach((course) => {
      const primaryTag = course.tags?.[0];
      if (primaryTag) {
        tagSet.add(primaryTag);
      }
    });
    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    if (selectedTags.size === 0) {
      return tags;
    }
    const selected = tags.filter((tag) => selectedTags.has(tag));
    const unselected = tags.filter((tag) => !selectedTags.has(tag));
    return [...selected, ...unselected];
  }, [courses, selectedTags]);

  // Filter courses based on search query, tags, and series
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // First check if course has active series
      const courseSeries = course.series || 'uncategorized';
      if (!activeSeries.has(courseSeries)) {
        return false;
      }

      // Then check tag filter
      const primaryTag = course.tags?.[0];
      if (selectedTags.size > 0) {
        if (!primaryTag || !selectedTags.has(primaryTag)) {
          return false;
        }
      }

      // Finally check search query
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();

      // Search in title
      if (course.title?.toLowerCase().includes(query)) return true;

      // Search in series
      if (course.series?.toLowerCase().includes(query)) return true;

      // Search in tags
      if (course.tags?.some((tag) => tag.toLowerCase().includes(query))) return true;

      // Search in descriptions
      if (course.description?.short?.toLowerCase().includes(query)) return true;
      if (course.description?.long?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [courses, searchQuery, selectedTags, activeSeries]);

  // Group all courses by series (for counting in sidebar)
  const allCoursesBySeries = useMemo(() => {
    const grouped: Record<string, Course[]> = {};

    courses.forEach((course) => {
      const series = course.series || 'uncategorized';
      if (!grouped[series]) {
        grouped[series] = [];
      }
      grouped[series].push(course);
    });

    return grouped;
  }, [courses]);

  // Group filtered courses by series for display
  const coursesBySeries = useMemo(() => {
    const grouped: Record<string, Course[]> = {};

    filteredCourses.forEach((course) => {
      const series = course.series || 'uncategorized';
      if (!grouped[series]) {
        grouped[series] = [];
      }
      grouped[series].push(course);
    });

    // Sort courses within each series
    Object.keys(grouped).forEach((series) => {
      grouped[series].sort((a, b) => {
        const aTag = a.tags?.[0] || '';
        const bTag = b.tags?.[0] || '';
        return aTag.localeCompare(bTag) || (a.title || '').localeCompare(b.title || '');
      });
    });

    return grouped;
  }, [filteredCourses]);

  // Get available series from filtered data for display
  const availableSeries = Object.keys(coursesBySeries);

  // Toggle series filter
  const toggleSeries = (series: string) => {
    setActiveSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(series)) {
        newSet.delete(series);
      } else {
        newSet.add(series);
      }
      return newSet;
    });
  };

  // Get active series that have courses
  const activeSeriesList = availableSeries.filter((s) => activeSeries.has(s));

  // Calculate grid columns based on active series count
  const getContainerClass = () => {
    const count = activeSeriesList.length;
    switch (count) {
      case 1:
        return '';
      case 2:
        return 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';
      case 4:
      default:
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8';
    }
  };

  const getLightColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Count total filtered courses in active series
  const totalFilteredCourses = activeSeriesList.reduce(
    (acc, s) => acc + (coursesBySeries[s]?.length || 0),
    0
  );

  // Function to add all courses from a series to cart
  const handleAddAllToCart = async (series: string) => {
    setAddingAllSeries(series);
    const seriesCourses = allCoursesBySeries[series] || [];
    let addedCount = 0;

    seriesCourses.forEach((course) => {
      if (!hasItem(course.course_id)) {
        const option =
          (course.course_options || [])[globalVariantIndex] || course.course_options?.[0];
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
        addItem(cartItem);
        addedCount++;
      }
    });

    // Show added state for 2 seconds
    setTimeout(() => {
      setAddingAllSeries(null);
    }, 2000);
  };

  // Determine max number of course options available
  const maxOptionsCount = useMemo(() => {
    let max = 0;
    courses.forEach((course) => {
      const optionsCount = course.course_options?.length || 0;
      if (optionsCount > max) max = optionsCount;
    });
    return max;
  }, [courses]);

  // Filter sidebar content for Desktop (WITHOUT search)
  const FilterContentDesktop = () => (
    <>
      {/* Global Variant Selection */}
      {maxOptionsCount > 1 && (
        <div className="">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Default Course Option</h3>
          <div className="relative bg-gray-100 rounded-full p-1 flex">
            <div
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out"
              style={{
                width: `calc(${100 / maxOptionsCount}% - 4px)`,
                transform: `translateX(calc(${globalVariantIndex * 100}% + ${globalVariantIndex * 4}px))`,
              }}
            />
            {Array.from({ length: maxOptionsCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setGlobalVariantIndex(i)}
                className={`flex-1 relative z-10 px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-300 ${
                  globalVariantIndex === i ? 'text-amber-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Option {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Series Filter */}
      <div className="">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Series</h3>
        <div className="space-y-3">
          {Object.keys(seriesMetadata).map((series) => {
            const metadata = seriesMetadata[series];
            const courseCount = allCoursesBySeries[series]?.length || 0;

            return (
              <div key={series} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: metadata.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{metadata.title}</p>
                    <p className="text-xs text-gray-500">
                      {courseCount} {courseCount === 1 ? 'course' : 'courses'}
                    </p>
                  </div>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={() => toggleSeries(series)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    activeSeries.has(series) ? 'bg-amber-500 focus:ring-amber-500' : 'bg-gray-200 focus:ring-gray-500'
                  }`}
                  style={{
                    backgroundColor: activeSeries.has(series) ? metadata.color : '#e5e7eb',
                  }}
                >
                  <span className="sr-only">Toggle {metadata.title}</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      activeSeries.has(series) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by criteria</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTags(new Set())}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                selectedTags.size === 0
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              All
            </button>
            {availableTags.map((tag) => {
              const isActive = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTags((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag)) {
                        next.delete(tag);
                      } else {
                        next.add(tag);
                      }
                      return next;
                    });
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  // Filter sidebar content for Mobile (excludes search since it's at the top)
  const FilterContentMobile = () => (
    <>
      {/* Global Variant Selection */}
      {maxOptionsCount > 1 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Course Validity</h3>
          <div className="relative bg-gray-100 rounded-full p-1 flex">
            <div
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out"
              style={{
                width: `calc(${100 / maxOptionsCount}% - 4px)`,
                transform: `translateX(calc(${globalVariantIndex * 100}% + ${globalVariantIndex * 4}px))`,
              }}
            />
            {Array.from({ length: maxOptionsCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setGlobalVariantIndex(i)}
                className={`flex-1 relative z-10 px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-300 ${
                  globalVariantIndex === i ? 'text-amber-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Option {i + 1} 
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Series Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Series</h3>
        <div className="space-y-3">
          {Object.keys(seriesMetadata).map((series) => {
            const metadata = seriesMetadata[series];
            const courseCount = allCoursesBySeries[series]?.length || 0;

            return (
              <div key={series} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: metadata.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{metadata.title}</p>
                    <p className="text-xs text-gray-500">
                      {courseCount} {courseCount === 1 ? 'course' : 'courses'}
                    </p>
                  </div>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={() => toggleSeries(series)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    activeSeries.has(series) ? 'bg-amber-500 focus:ring-amber-500' : 'bg-gray-200 focus:ring-gray-500'
                  }`}
                  style={{
                    backgroundColor: activeSeries.has(series) ? metadata.color : '#e5e7eb',
                  }}
                >
                  <span className="sr-only">Toggle {metadata.title}</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      activeSeries.has(series) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Tag</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTags(new Set())}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                selectedTags.size === 0
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              All
            </button>
            {availableTags.map((tag) => {
              const isActive = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTags((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag)) {
                        next.delete(tag);
                      } else {
                        next.add(tag);
                      }
                      return next;
                    });
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-100/30 via-orange-50/20 to-transparent">
        <div className="absolute inset-0 bg-grid-gray-100/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/courses" className="text-gray-600 hover:text-amber-600 transition-colors">
              Courses
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href={`/courses/${category.cat_slug}`}
              className="hover:text-amber-600 transition-colors"
              style={{ color: category.color }}
            >
              {category.title}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">Individual Courses</span>
          </div>

          {/* Page Title */}
          <div className="text-center mb-0">
            <Badge className="mb-3 px-4 py-1.5 text-white font-medium" style={{ backgroundColor: category.color }}>
              <Sparkles className="w-4 h-4 mr-2" />
              INDIVIDUAL COURSES
            </Badge>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {category.title} Individual Courses
            </h1>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Master specific aspects of your {category.title} petition
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Search Section */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-md p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, series, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 bg-white border-gray-300 focus:border-amber-400 focus:ring-amber-400 text-base"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Search: &quot;{searchQuery}&quot;
              </Badge>
              <span className="text-sm text-gray-600">
                Found {totalFilteredCourses} {totalFilteredCourses === 1 ? 'course' : 'courses'}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Mobile Filter Info */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-gray-700">
                {activeSeriesList.length} series • {selectedTags.size > 0 ? `${selectedTags.size} tags` : 'All tags'}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSidebarOpen(true)}
              className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Modify Filters
            </Button>
          </div>
        </div>

        {/* Desktop Layout with Filter Sidebar */}
        <div className="lg:flex lg:gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <Card className="bg-white border border-gray-200 shadow-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h2>
                <Badge variant="outline" className="text-xs">
                  {totalFilteredCourses} courses
                </Badge>
              </div>
              <FilterContentDesktop />
            </Card>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button className="rounded-full w-14 h-14 shadow-lg bg-amber-500 hover:bg-amber-600">
                  <Filter className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-white overflow-y-auto px-6">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
                </SheetHeader>
                <div className="pb-6">
                  <FilterContentMobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Course Grid */}
          <div className="flex-1">
            {/* Desktop Search Bar - At the top of content area */}
            <div className="hidden lg:block mb-4">
              <Card className="bg-white border border-gray-200 shadow-lg p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by title, series, tags, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-white border-gray-300 focus:border-amber-400 focus:ring-amber-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Search: &quot;{searchQuery}&quot;
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Found {totalFilteredCourses} {totalFilteredCourses === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                )}
              </Card>
            </div>

            {/* Course Display */}
            {totalFilteredCourses === 0 && searchQuery ? (
              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-600 mb-4">
                    No courses found matching <span>&quot;{searchQuery}&quot;</span>
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Clear Search
                  </Button>
                </div>
              </Card>
            ) : activeSeriesList.length === 0 ? (
              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Series Selected</h3>
                  <p className="text-gray-600">Please select at least one series from the filters</p>
                </div>
              </Card>
            ) : activeSeriesList.length === 1 ? (
              // Single series - show cards in responsive grid
              <div className="space-y-4">
                {activeSeriesList.map((series) => {
                  const seriesCourses = coursesBySeries[series] || [];
                  const metadata = seriesMetadata[series] || {
                    title: series.replace(/-/g, ' ').toUpperCase(),
                    color: '#6b7280',
                  };

                  if (seriesCourses.length === 0) return null;

                  return (
                    <div key={series}>
                      {/* Series Header with Add All Button */}
                      <div
                        className="bg-white/90 backdrop-blur-md rounded-lg p-3 mb-4 border shadow-sm flex items-center justify-between"
                        style={{
                          borderColor: `${metadata.color}40`,
                          backgroundColor: getLightColor(metadata.color),
                        }}
                      >
                        <div>
                          <h3 className="font-bold text-lg" style={{ color: metadata.color }}>
                            {metadata.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {seriesCourses.length} {seriesCourses.length === 1 ? 'course' : 'courses'}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddAllToCart(series)}
                          size="sm"
                          disabled={addingAllSeries === series}
                          className={`transition-all ${
                            addingAllSeries === series
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                          } text-white`}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {addingAllSeries === series ? 'Added!' : 'Add All to Cart'}
                        </Button>
                      </div>

                      {/* Course Cards in responsive grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {seriesCourses.map((course) => (
                          <IndividualCourseCard
                            key={course.course_id}
                            course={course}
                            categoryColor={category.color}
                            seriesColor={metadata.color}
                            defaultVariantIndex={globalVariantIndex}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Multiple series - show in columns
              <div className={getContainerClass()}>
                {activeSeriesList.map((series) => {
                  const seriesCourses = coursesBySeries[series] || [];
                  const metadata = seriesMetadata[series] || {
                    title: series.replace(/-/g, ' ').toUpperCase(),
                    color: '#6b7280',
                  };

                  if (seriesCourses.length === 0) return null;

                  return (
                    <div key={series} className="space-y-4">
                      {/* Series Header with Add All Button */}
                      <div
                        className="sticky top-16 z-10 bg-white/90 backdrop-blur-md rounded-lg p-3 border shadow-sm"
                        style={{
                          borderColor: `${metadata.color}40`,
                          backgroundColor: getLightColor(metadata.color),
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-base lg:text-lg" style={{ color: metadata.color }}>
                            {metadata.title}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs lg:text-sm text-gray-600">
                            {seriesCourses.length} {seriesCourses.length === 1 ? 'course' : 'courses'}
                          </p>
                          <Button
                            onClick={() => handleAddAllToCart(series)}
                            size="sm"
                            disabled={addingAllSeries === series}
                            className={`transition-all text-xs px-2 py-1 h-7 ${
                              addingAllSeries === series
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                            } text-white`}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            {addingAllSeries === series ? 'Added!' : 'Add All'}
                          </Button>
                        </div>
                      </div>

                      {/* Course Cards - responsive grid within column */}
                      <div className={`grid gap-4 ${activeSeriesList.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                        {seriesCourses.map((course) => (
                          <IndividualCourseCard
                            key={course.course_id}
                            course={course}
                            categoryColor={category.color}
                            seriesColor={metadata.color}
                            defaultVariantIndex={globalVariantIndex}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndividualCoursesContent;
