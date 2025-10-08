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

            {/* Main Tabs: Courses | Bundles */}
            <div className="mb-6">
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => handleMainTabChange('course')}
                  className={`
                    relative px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all
                    ${activeMainTab === 'course' 
                      ? 'text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Courses
                    <span className={`text-xs font-normal ${activeMainTab === 'course' ? 'text-gray-600' : 'text-gray-500'}`}>
                      ({enrollments.filter(e => e.product_type === 'course').length})
                    </span>
                  </span>
                  {activeMainTab === 'course' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  )}
                </button>
                <button
                  onClick={() => handleMainTabChange('bundle')}
                  className={`
                    relative px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all
                    ${activeMainTab === 'bundle' 
                      ? 'text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Bundles
                    <span className={`text-xs font-normal ${activeMainTab === 'bundle' ? 'text-gray-600' : 'text-gray-500'}`}>
                      ({enrollments.filter(e => e.product_type === 'bundle').length})
                    </span>
                  </span>
                  {activeMainTab === 'bundle' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="border-b border-gray-200">
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
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition-all"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expandable Filter Panel */}
                {isFilterExpanded && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
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
                                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
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

          {/* Content - No Category/Series Headers, Just Cards */}
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEnrollments.map(enrollment => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  onOpenReview={openReviewModal}
                  categoryConfig={getCategoryConfig(enrollment.category || 'other')}
                />
              ))}
            </div>
          )}
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
