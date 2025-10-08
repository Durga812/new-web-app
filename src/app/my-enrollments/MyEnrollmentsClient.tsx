// src/app/my-enrollments/MyEnrollmentsClient.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Clock, BookOpen, Package, Star, ChevronDown, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReviewModal } from "@/components/reviews/ReviewModal";

type EnrichedEnrollment = {
  id: string;
  product_id: string;
  product_type: 'course' | 'bundle';
  enroll_id: string;
  product_title: string;
  category?: string;
  series?: string;
  image_url?: string;
  total_lessons?: number;
  total_duration?: number;
  slug?: string;
  tags?: string[];
  enrolled_at: string;
  expires_at: string;
  included_course_ids?: string[];
  included_courses?: Array<{
    course_id: string;
    title: string;
    image_url?: string;
    lw_bundle_child_id?: string; // ✅ Added
  }>;
  has_reviewed?: boolean;
  user_review?: {
    rating: number;
    feedback?: string;
  };
};

type CategoryConfig = {
  label: string;
  color: string;
  text: string;
  bg: string;
  border: string;
};

type CategoryKey = "eb1a" | "eb2-niw" | "o-1" | "eb5";

const DEFAULT_CATEGORY_STYLE = {
  color: "from-gray-500 to-gray-600",
  text: "text-gray-600",
  bg: "bg-gray-50",
  border: "border-gray-200",
} as const;

const CATEGORY_CONFIG: Record<CategoryKey, CategoryConfig> = {
  eb1a: { label: "EB-1A", color: "from-orange-500 to-amber-500", text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  "eb2-niw": { label: "EB2-NIW", color: "from-yellow-500 to-amber-500", text: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  "o-1": { label: "O-1", color: "from-pink-500 to-rose-500", text: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  eb5: { label: "EB-5", color: "from-green-500 to-emerald-500", text: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
};

const isKnownCategory = (category: string): category is CategoryKey =>
  category in CATEGORY_CONFIG;

const formatSeriesName = (series: string) => {
  if (series === 'general') return 'General';
  return series
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type MainTabType = 'course' | 'bundle';

export default function MyEnrollmentsClient({ 
  enrollments
}: { 
  enrollments: EnrichedEnrollment[];
}) {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('course');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    productId: string;
    productTitle: string;
  }>({
    isOpen: false,
    productId: "",
    productTitle: "",
  });

  // Get unique categories from enrollments based on active main tab
  const availableCategories = useMemo<string[]>(() => {
    const categories = new Set<string>();
    enrollments
      .filter(e => e.product_type === activeMainTab)
      .forEach(enrollment => {
        if (enrollment.category) {
          categories.add(enrollment.category);
        }
      });
    return ['all', ...Array.from(categories)];
  }, [enrollments, activeMainTab]);

  // Get available series for the active category and main tab
  const availableSeries = useMemo<string[]>(() => {
    const series = new Set<string>();
    enrollments
      .filter(e => e.product_type === activeMainTab)
      .filter(e => activeCategory === 'all' || e.category === activeCategory)
      .forEach(enrollment => {
        if (enrollment.series) {
          series.add(enrollment.series);
        }
      });
    
    return Array.from(series);
  }, [enrollments, activeMainTab, activeCategory]);

  // Get available tags (tag[0]) for the active category and main tab
  const availableTags = useMemo<string[]>(() => {
    const tags = new Set<string>();
    enrollments
      .filter(e => e.product_type === activeMainTab)
      .filter(e => activeCategory === 'all' || e.category === activeCategory)
      .forEach(enrollment => {
        if (enrollment.tags && enrollment.tags.length > 0) {
          tags.add(enrollment.tags[0]);
        }
      });
    
    return Array.from(tags);
  }, [enrollments, activeMainTab, activeCategory]);

  // Initialize selected series and tags when they change
  useEffect(() => {
    setSelectedSeries(new Set());
    setSelectedTags(new Set());
  }, [availableSeries, availableTags]);

  // Filter enrollments
  const filteredEnrollments = useMemo(() => {
    let filtered = enrollments;

    // Filter by main tab (course or bundle)
    filtered = filtered.filter(e => e.product_type === activeMainTab);

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(e => e.category === activeCategory);
    }

    // Filter by series (only if some series are selected)
    if (selectedSeries.size > 0) {
      filtered = filtered.filter(e => e.series && selectedSeries.has(e.series));
    }

    // Filter by tags (only if some tags are selected)
    if (selectedTags.size > 0) {
      filtered = filtered.filter(e => e.tags && e.tags.length > 0 && selectedTags.has(e.tags[0]));
    }

    // Sort by latest purchase date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.enrolled_at).getTime();
      const dateB = new Date(b.enrolled_at).getTime();
      return dateB - dateA;
    });

    return sorted;
  }, [enrollments, activeMainTab, activeCategory, selectedSeries, selectedTags]);

  const openReviewModal = (productId: string, productTitle: string) => {
    setReviewModal({
      isOpen: true,
      productId,
      productTitle,
    });
  };

  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      productId: "",
      productTitle: "",
    });
  };

  const getCategoryConfig = (category: string): CategoryConfig => {
    if (isKnownCategory(category)) {
      return CATEGORY_CONFIG[category];
    }

    const normalizedLabel = category
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Other";

    return {
      label: normalizedLabel,
      ...DEFAULT_CATEGORY_STYLE,
    };
  };

  // Handle main tab change - reset category and filters
  const handleMainTabChange = (tab: MainTabType) => {
    setActiveMainTab(tab);
    setActiveCategory('all');
    setSelectedSeries(new Set());
    setSelectedTags(new Set());
    setIsFilterExpanded(false);
  };

  // Handle category change - reset filters
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSelectedSeries(new Set());
    setSelectedTags(new Set());
  };

  // Toggle series selection
  const toggleSeries = (series: string) => {
    setSelectedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(series)) {
        newSet.delete(series);
      } else {
        newSet.add(series);
      }
      return newSet;
    });
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSeries(new Set());
    setSelectedTags(new Set());
  };

  // Get count of active filters
  const activeFilterCount = selectedSeries.size + selectedTags.size;

  // Group courses by series for series-based view (always for courses tab)
  const shouldShowSeriesGrouped = activeMainTab === 'course';
  
  const groupedBySeries = useMemo(() => {
    if (!shouldShowSeriesGrouped) return {};
    
    const grouped: Record<string, EnrichedEnrollment[]> = {};
    filteredEnrollments.forEach(enrollment => {
      const seriesKey = enrollment.series || 'other';
      if (!grouped[seriesKey]) {
        grouped[seriesKey] = [];
      }
      grouped[seriesKey].push(enrollment);
    });
    
    return grouped;
  }, [filteredEnrollments, shouldShowSeriesGrouped]);

  // Get grid column class based on number of series
  const getSeriesGridClass = (seriesCount: number) => {
    if (seriesCount === 1) return 'grid-cols-1';
    if (seriesCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (seriesCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  // Get card grid class based on number of series (for cards within each series column)
  const getCardGridClass = (seriesCount: number) => {
    if (seriesCount === 1) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'; // 4 cards per row for single series
    if (seriesCount === 2) return 'grid-cols-1 sm:grid-cols-2'; // 2 cards per series = 4 total per row
    if (seriesCount === 3) return 'grid-cols-1'; // 1 card per series = 3 total per row
    return 'grid-cols-1'; // 1 card per series = 4 total per row
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-8">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                My Enrollments
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {enrollments.length} {enrollments.length === 1 ? 'item' : 'items'} enrolled
              </p>
            </div>

            {/* Main Type Selector: Courses | Bundles (Button Style) */}
            <div className="mb-0">
              <div className="inline-flex items-center bg-gray-100 rounded-t-lg p-1 gap-1">
                <button
                  onClick={() => handleMainTabChange('course')}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all
                    ${activeMainTab === 'course' 
                      ? 'bg-emerald-50 text-emerald-900 shadow-sm border border-emerald-200' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Courses</span>
                  <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${
                    activeMainTab === 'course' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {enrollments.filter(e => e.product_type === 'course').length}
                  </span>
                </button>
                <button
                  onClick={() => handleMainTabChange('bundle')}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all
                    ${activeMainTab === 'bundle' 
                      ? 'bg-sky-50 text-sky-900 shadow-sm border border-sky-200' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Package className="h-4 w-4" />
                  <span>Bundles</span>
                  <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${
                    activeMainTab === 'bundle' 
                      ? 'bg-sky-100 text-sky-700' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {enrollments.filter(e => e.product_type === 'bundle').length}
                  </span>
                </button>
              </div>
            </div>

            {/* Section Container with themed background */}
            <div className={`rounded-b-lg rounded-tr-lg p-4 ${
              activeMainTab === 'course' 
                ? 'bg-emerald-50/40 border border-emerald-100' 
                : 'bg-sky-50/40 border border-sky-100'
            }`}>
              {/* Category Tabs */}
              <div className="border-b border-gray-300/50">
                <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
                  {availableCategories.map((category) => {
                    const isActive = activeCategory === category;
                    const config = category === 'all' ? null : getCategoryConfig(category);
                    const count = category === 'all' 
                      ? enrollments.filter(e => e.product_type === activeMainTab).length 
                      : enrollments.filter(e => e.product_type === activeMainTab && e.category === category).length;

                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`
                          relative px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all
                          ${isActive 
                            ? 'text-gray-900' 
                            : 'text-gray-600 hover:text-gray-900'
                          }
                        `}
                      >
                        <span className="relative z-10">
                          {category === 'all' ? 'All' : config?.label || category.toUpperCase()}
                          <span className={`ml-2 text-xs font-normal ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                            ({count})
                          </span>
                        </span>
                        {isActive && (
                          <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config?.color || 'from-gray-700 to-gray-900'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Section */}
              {(availableSeries.length > 0 || availableTags.length > 0) && (
                <div className="mt-4">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium transition-all ${
                      activeMainTab === 'course'
                        ? 'border border-emerald-200 text-emerald-800 hover:border-emerald-300'
                        : 'border border-sky-200 text-sky-800 hover:border-sky-300'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <Badge className={`text-white text-xs px-2 py-0.5 ${
                        activeMainTab === 'course' ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}>
                        {activeFilterCount}
                      </Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expandable Filter Panel */}
                  {isFilterExpanded && (
                    <div className={`mt-3 p-4 bg-white rounded-lg ${
                      activeMainTab === 'course'
                        ? 'border border-emerald-200'
                        : 'border border-sky-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Filter by</h3>
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-3 w-3" />
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Series Filter */}
                      {availableSeries.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-700 mb-2">Series</p>
                          <div className="flex flex-wrap gap-2">
                            {availableSeries.map((series) => {
                              const isSelected = selectedSeries.has(series);
                              const config = activeCategory !== 'all' ? getCategoryConfig(activeCategory) : null;
                              
                              return (
                                <button
                                  key={series}
                                  onClick={() => toggleSeries(series)}
                                  className={`
                                    px-3 py-1.5 text-xs font-medium rounded-md transition-all
                                    ${isSelected
                                      ? config 
                                        ? `${config.bg} ${config.text} border ${config.border}`
                                        : activeMainTab === 'course'
                                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                          : 'bg-sky-100 text-sky-700 border border-sky-300'
                                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                                    }
                                  `}
                                >
                                  {formatSeriesName(series)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tags Filter */}
                      {availableTags.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {availableTags.map((tag) => {
                              const isSelected = selectedTags.has(tag);
                              const config = activeCategory !== 'all' ? getCategoryConfig(activeCategory) : null;
                              
                              return (
                                <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={`
                                    px-3 py-1.5 text-xs font-medium rounded-md transition-all
                                    ${isSelected
                                      ? config 
                                        ? `${config.bg} ${config.text} border ${config.border}`
                                        : activeMainTab === 'course'
                                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                          : 'bg-sky-100 text-sky-700 border border-sky-300'
                                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                                    }
                                  `}
                                >
                                  {tag.replace(/-/g, ' ')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content - Cards with themed background */}
          <div className={`rounded-lg p-4 mt-4 ${
            activeMainTab === 'course' 
              ? 'bg-emerald-50/30' 
              : 'bg-sky-50/30'
          }`}>
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-20">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                  activeMainTab === 'course' ? 'bg-emerald-100' : 'bg-sky-100'
                }`}>
                  {activeMainTab === 'course' ? (
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <Package className="w-8 h-8 text-sky-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No {activeMainTab === 'course' ? 'courses' : 'bundles'} found
                </h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : shouldShowSeriesGrouped ? (
              // Series-grouped view for courses (always on courses tab)
              <div className={`grid gap-6 ${getSeriesGridClass(Object.keys(groupedBySeries).length)}`}>
                {Object.entries(groupedBySeries).map(([seriesKey, seriesCourses]) => (
                  <div key={seriesKey} className="flex flex-col">
                    {/* Series Header - Sticky */}
                    <div className="sticky top-16 z-20 mb-4 bg-gradient-to-r from-emerald-50 to-white backdrop-blur-sm border-b-2 border-emerald-500 pb-2 pt-2 -mx-2 px-2 rounded-t-lg shadow-sm">
                      <h2 className="text-xl font-bold text-gray-900 capitalize">
                        {formatSeriesName(seriesKey)}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {seriesCourses.length} {seriesCourses.length === 1 ? 'course' : 'courses'}
                      </p>
                    </div>
                    
                    {/* Course Cards for this series */}
                    <div className={`grid gap-4 ${getCardGridClass(Object.keys(groupedBySeries).length)}`}>
                      {seriesCourses.map(enrollment => (
                        <EnrollmentCard
                          key={enrollment.id}
                          enrollment={enrollment}
                          onOpenReview={openReviewModal}
                          categoryConfig={getCategoryConfig(enrollment.category || 'other')}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Responsive 2-column grid for bundles on larger screens
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {filteredEnrollments.map(enrollment => (
                  <BundleEnrollmentCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    categoryConfig={getCategoryConfig(enrollment.category || 'other')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={closeReviewModal}
        productId={reviewModal.productId}
        productTitle={reviewModal.productTitle}
      />
    </>
  );
}

function EnrollmentCard({ 
  enrollment, 
  onOpenReview,
  categoryConfig
}: { 
  enrollment: EnrichedEnrollment;
  onOpenReview: (productId: string, productTitle: string) => void;
  categoryConfig: CategoryConfig;
}) {
  const [showBundleTooltip, setShowBundleTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipTriggerRef = useRef<HTMLButtonElement | null>(null);
  const isBundle = enrollment.product_type === 'bundle';
  const isCourse = enrollment.product_type === 'course';
  const enrolledDate = new Date(enrollment.enrolled_at);
  const expiryDate = new Date(enrollment.expires_at);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  
  useEffect(() => {
    if (!showBundleTooltip) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (tooltipRef.current?.contains(target)) return;
      if (tooltipTriggerRef.current?.contains(target)) return;
      setShowBundleTooltip(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBundleTooltip]);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const trimmedEnrollId = enrollment.enroll_id.trim();
  const courseAccessUrl = trimmedEnrollId
    ? `https://courses.greencardiy.com/path-player?courseid=${trimmedEnrollId}&learningProgramId=${trimmedEnrollId}`
    : null;
  const detailPageUrl = isBundle 
    ? `/bundle/${enrollment.slug || enrollment.product_id}` 
    : `/course/${enrollment.slug || enrollment.product_id}`;
  const canAccessCourse = isCourse && Boolean(courseAccessUrl);

  return (
    <Card className="group relative flex h-full flex-col overflow-visible transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-gray-200 bg-white">
      {/* Image */}
      <div className="relative h-36 overflow-hidden">
        {enrollment.image_url ? (
          <Image
            src={enrollment.image_url}
            alt={enrollment.product_title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className={`flex h-full items-center justify-center bg-gradient-to-br ${categoryConfig.color}`}>
            {isBundle ? (
              <Package className="h-12 w-12 text-white opacity-60" />
            ) : (
              <BookOpen className="h-12 w-12 text-white opacity-60" />
            )}
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          {/* Series Badge - Top Left */}
          {enrollment.series && (
            <Badge className="border-0 bg-gray-900/80 backdrop-blur-sm text-xs text-white shadow-lg">
              {formatSeriesName(enrollment.series)}
            </Badge>
          )}
          
          <div className="ml-auto flex flex-col gap-1.5 items-end">
            {/* Review Badge */}
            {isCourse && enrollment.has_reviewed && enrollment.user_review && (
              <Badge className="border-0 bg-amber-500/95 backdrop-blur-sm text-xs text-white flex items-center gap-1 shadow-lg">
                <Star className="h-3 w-3 fill-white" />
                {enrollment.user_review.rating}
              </Badge>
            )}
            
            {/* Expiry Badge */}
            {isExpiringSoon && (
              <Badge className="border-0 bg-red-500/95 backdrop-blur-sm text-xs text-white shadow-lg">
                {daysUntilExpiry}d left
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom Badges - Type Badge (left) and Tags (right) */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
          {/* Type Badge - Left */}
          <Badge className={`border-0 ${categoryConfig.bg} ${categoryConfig.text} backdrop-blur-sm text-xs font-semibold shadow-md`}>
            {isBundle ? 'Bundle' : 'Course'}
          </Badge>
          
          {/* Tags - Right */}
          {enrollment.tags && enrollment.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 justify-end">
              {enrollment.tags.slice(0, 2).map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/90 backdrop-blur-sm text-gray-700 shadow-md"
                >
                  {tag.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2">
        {/* Title - Reduced padding */}
        <h3 className="mb-2 text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-amber-600 transition-colors">
          <Link
            href={detailPageUrl}
            className="transition-colors hover:text-amber-600"
          >
            {enrollment.product_title}
          </Link>
        </h3>

        {/* Meta Info - Justify Between */}
        <div className="mb-1.5">
          {!isBundle && (enrollment.total_lessons || enrollment.total_duration) && (
            <div className="flex items-center justify-between text-xs text-gray-600">
              {enrollment.total_lessons !== undefined && enrollment.total_lessons > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-lg ${categoryConfig.bg} flex items-center justify-center flex-shrink-0`}>
                    <BookOpen className={`h-3.5 w-3.5 ${categoryConfig.text}`} />
                  </div>
                  <span className="font-medium">{enrollment.total_lessons} lessons</span>
                </div>
              )}
              
              {enrollment.total_duration !== undefined && enrollment.total_duration > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-lg ${categoryConfig.bg} flex items-center justify-center flex-shrink-0`}>
                    <Clock className={`h-3.5 w-3.5 ${categoryConfig.text}`} />
                  </div>
                  <span className="font-medium">{formatDuration(enrollment.total_duration)}</span>
                </div>
              )}
            </div>
          )}
          
          {isBundle && enrollment.included_course_ids && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className={`w-7 h-7 rounded-lg ${categoryConfig.bg} flex items-center justify-center flex-shrink-0`}>
                <Package className={`h-3.5 w-3.5 ${categoryConfig.text}`} />
              </div>
              <span className="font-medium">{enrollment.included_course_ids.length} courses included</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="mb-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Purchased</span>
            <span className="font-medium text-gray-700">{formatDate(enrolledDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Expires</span>
            <span className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>
              {formatDate(expiryDate)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-2">
          {canAccessCourse && courseAccessUrl && (
            <a
              href={courseAccessUrl}
              
              className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${categoryConfig.color} px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span>Access Course</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={detailPageUrl}
              className="flex items-center justify-center rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              View Details
            </Link>
            
            {/* Review Button - Only for courses */}
            {isCourse && !enrollment.has_reviewed && (
              <button
                onClick={() => onOpenReview(enrollment.product_id, enrollment.product_title)}
                className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-400"
              >
                <Star className="h-3.5 w-3.5" />
                Rate
              </button>
            )}

            {/* Already Reviewed */}
            {isCourse && enrollment.has_reviewed && (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 cursor-not-allowed opacity-75"
              >
                <Star className="h-3.5 w-3.5 fill-green-700" />
                Rated
              </button>
            )}

            {/* Included Courses Button + Tooltip - Only for bundles */}
            {isBundle && enrollment.included_courses && enrollment.included_courses.length > 0 && (
              <div className="relative">
                <button
                  ref={tooltipTriggerRef}
                  onClick={() => setShowBundleTooltip(prev => !prev)}
                  aria-expanded={showBundleTooltip}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-400"
                >
                  Included Courses
                </button>
                {showBundleTooltip && (
                  <div
                    ref={tooltipRef}
                    className="absolute right-0 bottom-full z-30 mb-2 w-72 rounded-2xl border border-gray-200 bg-white/95 p-4 text-xs text-gray-600 shadow-xl ring-1 ring-black/5"
                  >
                    <div className="absolute -bottom-2 right-6 h-3 w-3 rotate-45 border border-gray-200 bg-white/95" aria-hidden="true" />
                    <p className="text-sm font-semibold text-gray-900">Courses in this bundle</p>
                    <ul className="mt-2 space-y-1">
                      {enrollment.included_courses.map((course, idx) => {
                        const courseUrl = course.lw_bundle_child_id
                          ? `https://courses.greencardiy.com/path-player?courseid=${course.lw_bundle_child_id}&learningProgramId=${enrollment.enroll_id}`
                          : null;
                        return (
                          <li key={`${enrollment.id}-${course.course_id}-${idx}`} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                            {courseUrl ? (
                              <a
                                href={courseUrl}
                                
                                className="text-gray-700 hover:text-amber-600 hover:underline transition-colors flex items-start gap-1 group"
                              >
                                <span>{course.title}</span>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                              </a>
                            ) : (
                              <span className="text-gray-500">{course.title}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function BundleEnrollmentCard({
  enrollment,
  categoryConfig,
}: {
  enrollment: EnrichedEnrollment;
  categoryConfig: CategoryConfig;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expiryDate = new Date(enrollment.expires_at);
  const enrolledDate = new Date(enrollment.enrolled_at);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  const detailPageUrl = `/bundle/${enrollment.slug || enrollment.product_id}`;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Card className="relative overflow-hidden border-gray-200 bg-white">
      <div className="flex flex-col md:flex-row">
        {/* Media */}
        <div className="relative h-40 w-full md:h-auto md:w-48 flex-shrink-0">
          {enrollment.image_url ? (
            <Image
              src={enrollment.image_url}
              alt={enrollment.product_title}
              fill
              className="object-cover"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${categoryConfig.color}`}>
              <Package className="h-10 w-10 text-white/80" />
            </div>
          )}
          {enrollment.series && (
            <div className="absolute left-2 top-2">
              <Badge className="border-0 bg-gray-900/80 text-xs text-white shadow">{formatSeriesName(enrollment.series)}</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
              <Link href={detailPageUrl} className="hover:text-amber-600 transition-colors">
                {enrollment.product_title}
              </Link>
            </h3>
            <Badge className={`${categoryConfig.bg} ${categoryConfig.text} border ${categoryConfig.border} text-xs font-semibold`}>Bundle</Badge>
          </div>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
            {enrollment.included_course_ids && (
              <span className="inline-flex items-center gap-1">
                <Package className={`h-4 w-4 ${categoryConfig.text}`} />
                {enrollment.included_course_ids.length} courses included
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
              <span className="text-gray-500">Purchased</span>
              <span className="font-medium text-gray-700">{formatDate(enrolledDate)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
              <span className="text-gray-500">Expires</span>
              <span className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(expiryDate)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={detailPageUrl}
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              View Details
            </Link>
            {enrollment.included_courses && enrollment.included_courses.length > 0 && (
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                  isExpanded
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
                }`}
              >
                {isExpanded ? 'Hide courses' : `Show courses (${enrollment.included_courses.length})`}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Included courses list */}
          {isExpanded && enrollment.included_courses && enrollment.included_courses.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white">
              <ul className="divide-y divide-gray-100">
                {enrollment.included_courses.map((course, idx) => {
                  const courseUrl = course.lw_bundle_child_id
                    ? `https://courses.greencardiy.com/path-player?courseid=${course.lw_bundle_child_id}&learningProgramId=${enrollment.enroll_id}`
                    : null;
                  return (
                    <li key={`${enrollment.id}-${course.course_id}-${idx}`} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm text-gray-800 line-clamp-2">{course.title}</span>
                      {courseUrl ? (
                        <a
                          href={courseUrl}
                          className="inline-flex items-center justify-center rounded-lg border-2 border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400"
                        >
                          Watch
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Not available</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
