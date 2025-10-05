// src/app/my-enrollments/MyEnrollmentsClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Clock, BookOpen, Package, Star, ChevronDown, X } from "lucide-react";
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

type SortOption = 'latest' | 'oldest';
type TypeFilter = 'all' | 'course' | 'bundle';

export default function MyEnrollmentsClient({ 
  enrollments
}: { 
  enrollments: EnrichedEnrollment[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    productId: string;
    productTitle: string;
  }>({
    isOpen: false,
    productId: "",
    productTitle: "",
  });

  // Get unique categories from enrollments
  const availableCategories = useMemo<string[]>(() => {
    const categories = new Set<string>();
    enrollments.forEach(enrollment => {
      if (enrollment.category) {
        categories.add(enrollment.category);
      }
    });
    return ['all', ...Array.from(categories)];
  }, [enrollments]);

  // Get available series for the active category (excluding 'all')
  const availableSeries = useMemo<string[]>(() => {
    if (activeCategory === 'all') return [];
    
    const series = new Set<string>();
    enrollments
      .filter(e => e.category === activeCategory)
      .forEach(enrollment => {
        if (enrollment.series) {
          series.add(enrollment.series);
        }
      });
    
    return Array.from(series);
  }, [enrollments, activeCategory]);

  // Initialize selected series when available series change
  useEffect(() => {
    if (availableSeries.length > 0) {
      setSelectedSeries(new Set(availableSeries));
    } else {
      setSelectedSeries(new Set());
    }
  }, [availableSeries]);

  // Filter and sort enrollments
  const filteredEnrollments = useMemo(() => {
    let filtered = enrollments;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(e => e.category === activeCategory);
    }

    // Filter by series (only if some series are selected)
    if (selectedSeries.size > 0 && activeCategory !== 'all') {
      filtered = filtered.filter(e => e.series && selectedSeries.has(e.series));
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.product_type === typeFilter);
    }

    // Sort by date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.enrolled_at).getTime();
      const dateB = new Date(b.enrolled_at).getTime();
      return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [enrollments, activeCategory, selectedSeries, typeFilter, sortBy]);

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

  const formatSeriesName = (series: string) => {
    if (series === 'general') return 'General';
    return series.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  // Reset series filter when category changes
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-8">
            {/* Title and Filters - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  My Enrollments
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {enrollments.length} {enrollments.length === 1 ? 'course' : 'courses'} enrolled
                </p>
              </div>

              {/* Filters - Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Type Filter */}
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                    className="w-full sm:w-auto appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="course">Individual Courses</option>
                    <option value="bundle">Curated Bundles</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Sort Filter */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full sm:w-auto appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="latest">Latest Purchase</option>
                    <option value="oldest">Oldest Purchase</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
                {availableCategories.map((category) => {
                  const isActive = activeCategory === category;
                  const config = category === 'all' ? null : getCategoryConfig(category);
                  const count = category === 'all' 
                    ? enrollments.length 
                    : enrollments.filter(e => e.category === category).length;

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
                        {category === 'all' ? 'All Categories' : config?.label || category.toUpperCase()}
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

            {/* Series Filter Buttons - Multi-select, smaller size */}
            {activeCategory !== 'all' && availableSeries.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {availableSeries.map((series) => {
                  const isSelected = selectedSeries.has(series);
                  const config = getCategoryConfig(activeCategory);
                  
                  return (
                    <button
                      key={series}
                      onClick={() => toggleSeries(series)}
                      className={`
                        px-2.5 py-1 text-xs font-medium rounded-md transition-all
                        ${isSelected
                          ? `${config.bg} ${config.text} border ${config.border}`
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {formatSeriesName(series)}
                    </button>
                  );
                })}
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
  const isBundle = enrollment.product_type === 'bundle';
  const isCourse = enrollment.product_type === 'course';
  const enrolledDate = new Date(enrollment.enrolled_at);
  const expiryDate = new Date(enrollment.expires_at);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  
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

  const courseUrl = `https://courses.greencardiy.com/program-player?program=${enrollment.enroll_id}`;
  const detailPageUrl = isBundle 
    ? `/bundle/${enrollment.slug || enrollment.product_id}` 
    : `/course/${enrollment.slug || enrollment.product_id}`;

  return (
    <Card className="group relative flex h-full p-0 flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-gray-200 bg-white">
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
              {enrollment.series.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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

        {/* Type Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge className={`border-0 ${categoryConfig.bg} ${categoryConfig.text} backdrop-blur-sm text-xs font-semibold shadow-md`}>
            {isBundle ? 'Bundle' : 'Course'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Type Badge and Tags - Same Line */}
        {enrollment.tags && enrollment.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {enrollment.tags.slice(0, 2).map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600"
              >
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Title - Reduced padding */}
        <h3 className="mb-2 text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-amber-600 transition-colors">
          {enrollment.product_title}
        </h3>

        {/* Meta Info - Justify Between */}
        <div className="mb-3">
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
          <a
            href={courseUrl}
            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${categoryConfig.color} px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
          >
            <span>Access Course</span>
            <ExternalLink className="h-4 w-4" />
          </a>
          
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={detailPageUrl}
              className="flex items-center justify-center rounded-lg border-2 border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              View Details
            </Link>
            
            {/* Review Button - Only for courses */}
            {isCourse && !enrollment.has_reviewed && (
              <button
                onClick={() => onOpenReview(enrollment.product_id, enrollment.product_title)}
                className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-400"
              >
                <Star className="h-3.5 w-3.5" />
                Rate
              </button>
            )}

            {/* Already Reviewed */}
            {isCourse && enrollment.has_reviewed && (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 cursor-not-allowed opacity-75"
              >
                <Star className="h-3.5 w-3.5 fill-green-700" />
                Rated
              </button>
            )}

            {/* Included Courses Button - Only for bundles */}
            {isBundle && enrollment.included_courses && enrollment.included_courses.length > 0 && (
              <button
                onClick={() => setShowBundleTooltip(!showBundleTooltip)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-400"
              >
                <Package className="h-3.5 w-3.5" />
                Included
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bundle Tooltip - Centered in Card */}
      {isBundle && showBundleTooltip && enrollment.included_courses && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={() => setShowBundleTooltip(false)}
          />
          
          {/* Tooltip Content - Centered */}
          <div className="absolute inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 border border-gray-700 max-w-sm w-full pointer-events-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Included Courses ({enrollment.included_courses.length})
                </div>
                <button
                  onClick={() => setShowBundleTooltip(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {enrollment.included_courses.map((course, idx) => (
                  <div key={course.course_id} className="flex items-start gap-2 text-xs">
                    <span className="text-amber-400 font-medium flex-shrink-0 mt-0.5">{idx + 1}.</span>
                    <span className="text-gray-200 leading-relaxed">{course.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}