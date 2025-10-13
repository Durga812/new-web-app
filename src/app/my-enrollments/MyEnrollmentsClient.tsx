// src/app/my-enrollments/MyEnrollmentsClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Package, Filter, X, ChevronDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { EnrollmentCourseCard } from "@/components/enrollments/EnrollmentCourseCard";
import { BundleEnrollmentCard } from "@/components/enrollments/BundleEnrollmentCard";

type CourseProgress = {
  totalUnits: number;
  completedUnits: number;
  percent: number;
};

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
    lw_bundle_child_id?: string;
    progress?: CourseProgress;
  }>;
  has_reviewed?: boolean;
  user_review?: {
    rating: number;
    feedback?: string;
  };
  progress?: CourseProgress;
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

// Helper function to calculate number of refreshes based on item count
const calculateRefreshTimes = (itemCount: number): number => {
  if (itemCount <= 10) return 1;
  if (itemCount <= 20) return 2;
  if (itemCount <= 30) return 3;
  if (itemCount <= 40) return 4;
  return 5; // Max 5 refreshes for 50+ items
};

export default function MyEnrollmentsClient({ 
  enrollments
}: { 
  enrollments: EnrichedEnrollment[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Banner state management
  const [showBanner, setShowBanner] = useState(false);
  const [expectedItems, setExpectedItems] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [maxRefreshCount, setMaxRefreshCount] = useState(0);
  const [redirectTimestamp, setRedirectTimestamp] = useState<number>(0);
  const [currentOrderEnrollments, setCurrentOrderEnrollments] = useState(0);
  const [hasAddedExtraRefresh, setHasAddedExtraRefresh] = useState(false);
  
  // Initialize activeMainTab from URL query parameter
  const getInitialTab = (): MainTabType => {
    const enrollmentType = searchParams.get('enrollment-type');
    if (enrollmentType === 'bundle') return 'bundle';
    return 'course'; // Default to 'course' for both 'course' and no parameter
  };
  
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>(getInitialTab);
  const [activeCategory, setActiveCategory] = useState<string>('');
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

  // Initialize banner state from URL params (runs once)
  useEffect(() => {
    const purchaseStatus = searchParams.get('purchased');
    const itemsParam = searchParams.get('items');
    const redirectTsParam = searchParams.get('redirect_ts');
    
    // Only run if coming from purchase success
    if (purchaseStatus !== 'recently' || !itemsParam || !redirectTsParam) {
      return;
    }

    const items = parseInt(itemsParam, 10);
    const redirectTs = parseInt(redirectTsParam, 10);
    const initialMaxRefreshes = calculateRefreshTimes(items);
    
    // Initialize state (only if not already initialized to prevent re-runs)
    setShowBanner(true);
    setExpectedItems(items);
    setRedirectTimestamp(redirectTs);
    setRefreshCount(0);
    setMaxRefreshCount(initialMaxRefreshes);
    setHasAddedExtraRefresh(false);
    setCurrentOrderEnrollments(0);
  }, [searchParams]);

  // Set up auto-refresh interval when banner is shown
  useEffect(() => {
    if (!showBanner || expectedItems === 0) {
      return;
    }

    // Set up interval for auto-refresh
    const intervalId = setInterval(() => {
      router.refresh();
      
      setRefreshCount((prev) => prev + 1);
    }, 5000); // 5 seconds

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [showBanner, expectedItems, router]);

  // Handle max refresh check and extra refresh logic
  useEffect(() => {
    if (!showBanner || refreshCount === 0) return;
    
    // Check if we've reached max refreshes
    if (refreshCount >= maxRefreshCount) {
      // Count current order enrollments
      const redirectDate = new Date(redirectTimestamp);
      const currentOrderCount = enrollments.filter(enrollment => {
        const enrolledDate = new Date(enrollment.enrolled_at);
        return enrolledDate >= redirectDate;
      }).length;
      
      setCurrentOrderEnrollments(currentOrderCount);
      
      // If not all items loaded and haven't added extra refresh yet
      if (currentOrderCount < expectedItems && !hasAddedExtraRefresh) {
        setHasAddedExtraRefresh(true);
        setMaxRefreshCount(prev => prev + 1); // Add 1 extra refresh
        console.log(`Added extra refresh. Current: ${currentOrderCount}/${expectedItems}`);
      }
    }
  }, [refreshCount, maxRefreshCount, showBanner, hasAddedExtraRefresh, expectedItems, redirectTimestamp, enrollments]);

  // Auto-hide banner when all items are loaded
  useEffect(() => {
    if (showBanner && expectedItems > 0 && redirectTimestamp > 0) {
      // Count enrollments from current order only
      const redirectDate = new Date(redirectTimestamp);
      const currentOrderCount = enrollments.filter(enrollment => {
        const enrolledDate = new Date(enrollment.enrolled_at);
        return enrolledDate >= redirectDate;
      }).length;
      
      setCurrentOrderEnrollments(currentOrderCount);
      
      // Hide banner if all expected items are enrolled
      if (currentOrderCount >= expectedItems) {
        setShowBanner(false);
        // Clean URL params
        router.replace('/my-enrollments', { scroll: false });
      }
    }
  }, [showBanner, expectedItems, enrollments, redirectTimestamp, router]);

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
    return Array.from(categories);
  }, [enrollments, activeMainTab]);

  // Get available series for the active category and main tab
  const availableSeries = useMemo<string[]>(() => {
    const series = new Set<string>();
    enrollments
      .filter(e => e.product_type === activeMainTab)
      .filter(e => !activeCategory || e.category === activeCategory)
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
      .filter(e => !activeCategory || e.category === activeCategory)
      .forEach(enrollment => {
        if (enrollment.tags && enrollment.tags.length > 0) {
          tags.add(enrollment.tags[0]);
        }
      });
    
    return Array.from(tags);
  }, [enrollments, activeMainTab, activeCategory]);

  // Initialize first category when categories change
  useEffect(() => {
    if (availableCategories.length > 0 && !activeCategory) {
      setActiveCategory(availableCategories[0]);
    }
  }, [availableCategories, activeCategory]);

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
    if (activeCategory) {
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

  // Handle main tab change - reset category and filters and update URL
  const handleMainTabChange = (tab: MainTabType) => {
    setActiveMainTab(tab);
    setActiveCategory('');
    setSelectedSeries(new Set());
    setSelectedTags(new Set());
    setIsFilterExpanded(false);
    
    // Update URL with query parameter
    if (tab === 'bundle') {
      router.push('/my-enrollments?enrollment-type=bundle', { scroll: false });
    } else {
      // For 'course' tab, navigate to base URL without query params
      router.push('/my-enrollments', { scroll: false });
    }
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
    if (seriesCount === 1) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (seriesCount === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (seriesCount === 3) return 'grid-cols-1';
    return 'grid-cols-1';
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          
          {/* Enrollment Processing Banner */}
          {showBanner && (
            <div className="mb-6 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-6 w-6 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
                    <h3 className="text-lg font-bold text-blue-900">
                      Enrolling Your Courses...
                    </h3>
                  </div>
                  <p className="text-sm text-blue-800 mb-2 font-medium">
                    Your courses are being enrolled. This takes about 1 minute.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span className="font-semibold">Progress:</span>
                    <span className="px-2 py-1 bg-blue-100 rounded-md font-mono text-xs">
                      {currentOrderEnrollments} / {expectedItems}
                    </span>
                    {refreshCount < maxRefreshCount && (
                      <span className="text-xs text-blue-600">
                        • Auto-refreshing ({refreshCount}/{maxRefreshCount}{hasAddedExtraRefresh ? '+1' : ''})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.refresh()}
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Now
                  </button>
                  <button
                    onClick={() => {
                      setShowBanner(false);
                      router.replace('/my-enrollments', { scroll: false });
                    }}
                    className="text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  
                  <span> individual Courses</span>
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
                  
                  <span>Curated Bundles</span>
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
            <div className={`rounded-b-lg rounded-tr-lg ${
              activeMainTab === 'course' 
                ? 'bg-emerald-50/40 border border-emerald-100' 
                : 'bg-sky-50/40 border border-sky-100'
            }`}>
              {/* Category Tabs */}
              {availableCategories.length > 0 && (
                <div className="border-b border-gray-200/50">
                  <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide px-4 pt-4">
                    {availableCategories.map((category) => {
                      const isActive = activeCategory === category;
                      const config = getCategoryConfig(category);
                      const count = enrollments.filter(e => e.product_type === activeMainTab && e.category === category).length;

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
                            {config.label}
                            <span className={`ml-2 text-xs font-normal ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                              ({count})
                            </span>
                          </span>
                          {isActive && (
                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.color}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filter Section */}
              {(availableSeries.length > 0 || availableTags.length > 0) && (
                <div className="p-4">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className={`flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow ${
                      activeMainTab === 'course'
                        ? 'border-2 border-emerald-200 text-emerald-800 hover:border-emerald-300'
                        : 'border-2 border-sky-200 text-sky-800 hover:border-sky-300'
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
                    <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expandable Filter Panel */}
                  {isFilterExpanded && (
                    <div className={`mt-3 p-4 bg-white rounded-lg shadow-sm ${
                      activeMainTab === 'course'
                        ? 'border-2 border-emerald-200'
                        : 'border-2 border-sky-200'
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
                          <p className="text-xs font-semibold text-gray-700 mb-2.5">Series</p>
                          <div className="flex flex-wrap gap-2">
                            {availableSeries.map((series) => {
                              const isSelected = selectedSeries.has(series);
                              const config = activeCategory ? getCategoryConfig(activeCategory) : null;
                              
                              return (
                                <button
                                  key={series}
                                  onClick={() => toggleSeries(series)}
                                  className={`
                                    px-3 py-2 text-xs font-medium rounded-lg transition-all border-2
                                    ${isSelected
                                      ? config 
                                        ? `${config.bg} ${config.text} ${config.border} shadow-sm`
                                        : activeMainTab === 'course'
                                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm'
                                          : 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
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
                          <p className="text-xs font-semibold text-gray-700 mb-2.5">Criteria</p>
                          <div className="flex flex-wrap gap-2">
                            {availableTags.map((tag) => {
                              const isSelected = selectedTags.has(tag);
                              const config = activeCategory ? getCategoryConfig(activeCategory) : null;
                              
                              return (
                                <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={`
                                    px-3 py-2 text-xs font-medium rounded-lg transition-all border-2
                                    ${isSelected
                                      ? config 
                                        ? `${config.bg} ${config.text} ${config.border} shadow-sm`
                                        : activeMainTab === 'course'
                                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm'
                                          : 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
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
                        <EnrollmentCourseCard
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
