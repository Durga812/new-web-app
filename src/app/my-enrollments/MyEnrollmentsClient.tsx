// src/app/my-enrollments/MyEnrollmentsClient.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, Calendar, Clock, BookOpen, Package, Star, Layers } from "lucide-react";
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

const CATEGORY_CONFIG = {
  eb1a: { label: "EB1A", color: "from-orange-500 to-amber-500", bg: "bg-orange-50" },
  "eb2-niw": { label: "EB2-NIW", color: "from-yellow-500 to-amber-500", bg: "bg-yellow-50" },
  "o-1": { label: "O-1", color: "from-pink-500 to-rose-500", bg: "bg-pink-50" },
  eb5: { label: "EB5", color: "from-green-500 to-emerald-500", bg: "bg-green-50" },
};

export default function MyEnrollmentsClient({ 
  enrollments
}: { 
  enrollments: EnrichedEnrollment[];
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_CONFIG))
  );
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    productId: string;
    productTitle: string;
  }>({
    isOpen: false,
    productId: "",
    productTitle: "",
  });

  // Group enrollments by category and then by series
  const groupedEnrollments = useMemo(() => {
    const groups: Record<string, Record<string, EnrichedEnrollment[]>> = {};
    
    enrollments.forEach(enrollment => {
      const category = enrollment.category || 'other';
      const series = enrollment.series || 'general';
      
      if (!groups[category]) {
        groups[category] = {};
      }
      if (!groups[category][series]) {
        groups[category][series] = [];
      }
      groups[category][series].push(enrollment);
    });
    
    return groups;
  }, [enrollments]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleSeries = (seriesKey: string) => {
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesKey)) {
        newSet.delete(seriesKey);
      } else {
        newSet.add(seriesKey);
      }
      return newSet;
    });
  };

  const toggleBundle = (enrollmentId: string) => {
    setExpandedBundles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(enrollmentId)) {
        newSet.delete(enrollmentId);
      } else {
        newSet.add(enrollmentId);
      }
      return newSet;
    });
  };

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
    if (series === 'general') return 'General Courses';
    return series.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Enrollments
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {enrollments.length} {enrollments.length === 1 ? 'course' : 'courses'} • Access and track your progress
                </p>
              </div>
            </div>
          </header>

          {/* Category Sections */}
          <div className="space-y-6">
            {Object.entries(groupedEnrollments).map(([category, seriesGroups]) => {
              const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
              const isExpanded = expandedCategories.has(category);
              const totalItems = Object.values(seriesGroups).flat().length;
              
              return (
                <section 
                  key={category} 
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex w-full items-center justify-between p-5 sm:p-6 text-left transition-colors hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${config?.color || 'from-gray-500 to-gray-600'} shadow-lg`}>
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                          {config?.label || category.toUpperCase()}
                        </h2>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {totalItems} {totalItems === 1 ? 'item' : 'items'} • {Object.keys(seriesGroups).length} {Object.keys(seriesGroups).length === 1 ? 'series' : 'series'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${config?.bg || 'bg-gray-100'} border-0 text-gray-700 hidden sm:flex`}>
                        {totalItems} enrolled
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Series Sections */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30">
                      {Object.entries(seriesGroups).map(([series, items]) => {
                        const seriesKey = `${category}-${series}`;
                        const isSeriesExpanded = expandedSeries.has(seriesKey);
                        
                        return (
                          <div key={seriesKey} className="border-b border-gray-100 last:border-b-0">
                            {/* Series Header */}
                            <button
                              onClick={() => toggleSeries(seriesKey)}
                              className="flex w-full items-center justify-between px-5 sm:px-6 py-4 text-left transition-colors hover:bg-white/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                  <Layers className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900">
                                    {formatSeriesName(series)}
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {items.length} {items.length === 1 ? 'course' : 'courses'}
                                  </p>
                                </div>
                              </div>
                              {isSeriesExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </button>

                            {/* Enrollment Cards */}
                            {isSeriesExpanded && (
                              <div className="grid gap-4 px-5 sm:px-6 pb-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {items.map(enrollment => (
                                  <EnrollmentCard
                                    key={enrollment.id}
                                    enrollment={enrollment}
                                    isExpanded={expandedBundles.has(enrollment.id)}
                                    onToggle={() => toggleBundle(enrollment.id)}
                                    onOpenReview={openReviewModal}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
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
  isExpanded, 
  onToggle,
  onOpenReview 
}: { 
  enrollment: EnrichedEnrollment;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenReview: (productId: string, productTitle: string) => void;
}) {
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
    <Card className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-gray-200 bg-white">
      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
        {enrollment.image_url ? (
          <Image
            src={enrollment.image_url}
            alt={enrollment.product_title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {isBundle ? (
              <Package className="h-10 w-10 text-amber-500 opacity-40" />
            ) : (
              <BookOpen className="h-10 w-10 text-amber-500 opacity-40" />
            )}
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Expiry Badge */}
        {isExpiringSoon && (
          <div className="absolute right-2 top-2">
            <Badge className="border-0 bg-orange-500/95 backdrop-blur-sm text-xs text-white shadow-lg">
              {daysUntilExpiry}d left
            </Badge>
          </div>
        )}

        {/* Review Badge */}
        {isCourse && enrollment.has_reviewed && enrollment.user_review && (
          <div className="absolute left-2 top-2">
            <Badge className="border-0 bg-amber-500/95 backdrop-blur-sm text-xs text-white flex items-center gap-1 shadow-lg">
              <Star className="h-3 w-3 fill-white" />
              {enrollment.user_review.rating}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Type Badge */}
        <div className="mb-2.5 flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-amber-200 text-amber-700 bg-amber-50">
            {isBundle ? 'Bundle' : 'Course'}
          </Badge>
          {enrollment.category && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {CATEGORY_CONFIG[enrollment.category as keyof typeof CATEGORY_CONFIG]?.label || enrollment.category}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2.5 text-sm font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
          {enrollment.product_title}
        </h3>

        {/* Meta Info */}
        <div className="mb-3 space-y-1.5 text-[11px] text-gray-600">
          {!isBundle && enrollment.total_lessons !== undefined && enrollment.total_lessons > 0 && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-gray-400" />
              <span>{enrollment.total_lessons} lessons</span>
            </div>
          )}
          
          {!isBundle && enrollment.total_duration !== undefined && enrollment.total_duration > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-gray-400" />
              <span>{formatDuration(enrollment.total_duration)}</span>
            </div>
          )}
          
          {isBundle && enrollment.included_course_ids && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3 w-3 text-gray-400" />
              <span>{enrollment.included_course_ids.length} courses</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span>{formatDate(enrolledDate)}</span>
          </div>
          
          <div className={`flex items-center gap-1.5 ${isExpiringSoon ? 'font-semibold text-orange-600' : ''}`}>
            <Calendar className="h-3 w-3" />
            <span>Expires {formatDate(expiryDate)}</span>
          </div>
        </div>

        {/* Tags */}
        {enrollment.tags && enrollment.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {enrollment.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200">
                {tag.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Bundle Included Courses */}
        {isBundle && enrollment.included_courses && enrollment.included_courses.length > 0 && (
          <div className="mb-3">
            <button
              onClick={onToggle}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-2 text-[11px] font-medium text-gray-700 transition hover:bg-gray-100/50 hover:border-gray-300"
            >
              <span className="flex items-center gap-1.5">
                <Package className="h-3 w-3" />
                {enrollment.included_courses.length} courses
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            
            {isExpanded && (
              <div className="mt-2 space-y-1.5 rounded-lg border border-gray-200 bg-white p-2.5">
                {enrollment.included_courses.map(course => (
                  <div key={course.course_id} className="flex items-start gap-1.5 text-[11px]">
                    <div className="mt-1 h-1 w-1 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-gray-700 leading-snug">{course.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto space-y-2">
          <a
            href={courseUrl}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-semibold text-white transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-lg"
          >
            Access Course
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={detailPageUrl}
              className="flex items-center justify-center rounded-lg border border-gray-300 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-400"
            >
              Details
            </Link>
            
            {/* Review Button - Only for courses */}
            {isCourse && !enrollment.has_reviewed && (
              <button
                onClick={() => onOpenReview(enrollment.product_id, enrollment.product_title)}
                className="flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 transition hover:bg-amber-100 hover:border-amber-400"
              >
                <Star className="h-3 w-3" />
                Rate
              </button>
            )}

            {/* Already Reviewed */}
            {isCourse && enrollment.has_reviewed && (
              <button
                disabled
                className="flex items-center justify-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-[11px] font-medium text-green-700 cursor-not-allowed"
              >
                <Star className="h-3 w-3 fill-green-700" />
                {enrollment.user_review?.rating}/5
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
