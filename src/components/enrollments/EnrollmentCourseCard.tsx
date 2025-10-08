// src/components/enrollments/EnrollmentCourseCard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Clock, BookOpen, Package, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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

const formatSeriesName = (series: string) => {
  if (series === 'general') return 'General';
  return series
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface EnrollmentCourseCardProps {
  enrollment: EnrichedEnrollment;
  onOpenReview: (productId: string, productTitle: string) => void;
  categoryConfig: CategoryConfig;
}

export function EnrollmentCourseCard({ 
  enrollment, 
  onOpenReview,
  categoryConfig
}: EnrollmentCourseCardProps) {
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
            prefetch={true}
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
              prefetch={true}
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