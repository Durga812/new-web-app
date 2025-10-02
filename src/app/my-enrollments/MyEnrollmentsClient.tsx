// src/app/my-enrollments/MyEnrollmentsClient.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, Calendar, Clock, BookOpen, Package, Star } from "lucide-react";
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
  eb1a: { label: "EB1A", color: "from-orange-500 to-amber-500" },
  "eb2-niw": { label: "EB2-NIW", color: "from-yellow-500 to-amber-500" },
  "o-1": { label: "O-1", color: "from-pink-500 to-rose-500" },
  eb5: { label: "EB5", color: "from-green-500 to-emerald-500" },
};

export default function MyEnrollmentsClient({ 
  enrollments
}: { 
  enrollments: EnrichedEnrollment[];
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_CONFIG))
  );
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

  // Group enrollments by category
  const groupedEnrollments = useMemo(() => {
    const groups: Record<string, EnrichedEnrollment[]> = {};
    
    enrollments.forEach(enrollment => {
      const category = enrollment.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(enrollment);
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

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">My Enrollments</h1>
          <p className="mt-2 text-sm text-gray-600">
            Access your enrolled courses and track your progress
          </p>
        </header>

        {/* Category Sections */}
        <div className="space-y-6">
          {Object.entries(groupedEnrollments).map(([category, items]) => {
            const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
            const isExpanded = expandedCategories.has(category);
            
            return (
              <section key={category} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center justify-between p-6 text-left transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${config?.color || 'from-gray-500 to-gray-600'}`}>
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {config?.label || category.toUpperCase()}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {/* Enrollment Cards */}
                {isExpanded && (
                  <div className="grid gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-3">
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
              </section>
            );
          })}
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

  const courseUrl = `https://courses.greencardiy.com/program/${enrollment.enroll_id}`;
  const detailPageUrl = isBundle 
    ? `/bundle/${enrollment.slug || enrollment.product_id}` 
    : `/course/${enrollment.slug || enrollment.product_id}`;

  return (
    <Card className="group flex h-full pt-0 flex-col overflow-hidden transition-all hover:shadow-lg">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
        {enrollment.image_url ? (
          <Image
            src={enrollment.image_url}
            alt={enrollment.product_title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {isBundle ? (
              <Package className="h-12 w-12 text-amber-500" />
            ) : (
              <BookOpen className="h-12 w-12 text-amber-500" />
            )}
          </div>
        )}
        
        {/* Expiry Badge */}
        {isExpiringSoon && (
          <div className="absolute right-2 top-2">
            <Badge className="border-0 bg-orange-500 text-xs text-white">
              Expires in {daysUntilExpiry} days
            </Badge>
          </div>
        )}

        {/* Review Badge (if already reviewed) */}
        {isCourse && enrollment.has_reviewed && enrollment.user_review && (
          <div className="absolute left-2 top-2">
            <Badge className="border-0 bg-amber-500 text-xs text-white flex items-center gap-1">
              <Star className="h-3 w-3 fill-white" />
              {enrollment.user_review.rating}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Type Badge */}
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {isBundle ? 'Bundle' : 'Course'}
          </Badge>
          {enrollment.category && (
            <Badge variant="outline" className="text-xs">
              {CATEGORY_CONFIG[enrollment.category as keyof typeof CATEGORY_CONFIG]?.label || enrollment.category}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-base font-semibold text-gray-900 line-clamp-2">
          {enrollment.product_title}
        </h3>

        {/* Meta Info */}
        <div className="mb-4 space-y-2 text-xs text-gray-600">
          {!isBundle && enrollment.total_lessons !== undefined && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{enrollment.total_lessons} lessons</span>
            </div>
          )}
          
          {!isBundle && enrollment.total_duration !== undefined && enrollment.total_duration > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(enrollment.total_duration)}</span>
            </div>
          )}
          
          {isBundle && enrollment.included_course_ids && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <span>{enrollment.included_course_ids.length} courses</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Purchased {formatDate(enrolledDate)}</span>
          </div>
          
          <div className={`flex items-center gap-1.5 ${isExpiringSoon ? 'font-semibold text-orange-600' : ''}`}>
            <Calendar className="h-3.5 w-3.5" />
            <span>Expires {formatDate(expiryDate)}</span>
          </div>
        </div>

        {/* Tags */}
        {enrollment.tags && enrollment.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {enrollment.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Bundle Included Courses */}
        {isBundle && enrollment.included_courses && enrollment.included_courses.length > 0 && (
          <div className="mb-4">
            <button
              onClick={onToggle}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
            >
              <span>Included Courses ({enrollment.included_courses.length})</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && (
              <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                {enrollment.included_courses.map(course => (
                  <div key={course.course_id} className="flex items-start gap-2 text-xs">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-gray-700">{course.title}</span>
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
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-orange-600"
          >
            Access Course
            <ExternalLink className="h-4 w-4" />
          </a>
          
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={detailPageUrl}
              className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View Details
            </Link>
            
            {/* Review Button - Only for courses */}
            {isCourse && !enrollment.has_reviewed && (
              <button
                onClick={() => onOpenReview(enrollment.product_id, enrollment.product_title)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
              >
                <Star className="h-3.5 w-3.5" />
                Rate Course
              </button>
            )}

            {/* Already Reviewed Button - Show rating */}
            {isCourse && enrollment.has_reviewed && (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 cursor-not-allowed"
              >
                <Star className="h-3.5 w-3.5 fill-green-700" />
                Rated {enrollment.user_review?.rating}/5
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}