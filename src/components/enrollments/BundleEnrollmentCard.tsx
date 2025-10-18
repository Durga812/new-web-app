// src/components/enrollments/BundleEnrollmentCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ChevronDown, Calendar, Clock, MoreVertical, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RefundModal } from '@/app/my-enrollments/RefundModal';

type CourseProgress = {
  totalDurationSeconds: number;
  watchedDurationSeconds: number;
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

const formatSeriesName = (series: string) => {
  if (series === 'general') return 'General';
  return series
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface BundleEnrollmentCardProps {
  enrollment: EnrichedEnrollment;
  categoryConfig: CategoryConfig;
}

export function BundleEnrollmentCard({
  enrollment,
  categoryConfig,
}: BundleEnrollmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
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

  const formatSeconds = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.round(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (parts.length === 0) {
      parts.push(`${secs}s`);
    }

    return parts.join(" ");
  };

  const describeProgress = (progress: CourseProgress) => {
    const watched = Math.max(0, progress.watchedDurationSeconds);
    const total = Math.max(0, progress.totalDurationSeconds);

    if (watched <= 0) {
      return "No progress yet";
    }

    if (total > 0) {
      return `${formatSeconds(watched)} of ${formatSeconds(total)} watched`;
    }

    return `${formatSeconds(watched)} watched`;
  };

  const includedCourses = enrollment.included_courses || [];
  const displayedCourses = isExpanded ? includedCourses : includedCourses.slice(0, 3);

  return (
    <Card className="group relative overflow-hidden border-gray-200 bg-white transition-all duration-300 hover:shadow-xl">
      {/* Three-dot menu - Top Right */}
      <div className="absolute top-2 right-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white">
            <DropdownMenuItem onClick={() => setShowRefundModal(true)}>
              <Undo2 className="mr-2 h-4 w-4"/>
              Request Refund
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content Section */}
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail - Optimized size */}
        <div className="relative h-44 w-full sm:h-40 sm:w-48 md:w-56 flex-shrink-0 overflow-hidden">
          {enrollment.image_url ? (
            <Image
              src={enrollment.image_url}
              alt={enrollment.product_title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${categoryConfig.color}`}>
              <Package className="h-10 w-10 text-white/70" />
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Series Badge */}
          {enrollment.series && (
            <div className="absolute left-2 top-2">
              <Badge className="border-0 bg-gray-900/80 backdrop-blur-sm text-xs text-white shadow-lg">
                {formatSeriesName(enrollment.series)}
              </Badge>
            </div>
          )}

          {/* Expiry Warning Badge */}
          {isExpiringSoon && (
            <div className="absolute right-2 top-2 sm:right-2 sm:top-2">
              <Badge className="border-0 bg-red-500/95 backdrop-blur-sm text-xs text-white shadow-lg">
                {daysUntilExpiry}d left
              </Badge>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0 pr-8">
              <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-amber-600 transition-colors">
                <Link href={detailPageUrl} prefetch={true}>
                  {enrollment.product_title}
                </Link>
              </h3>
              
              {/* Meta Info */}
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <Package className={`h-3.5 w-3.5 ${categoryConfig.text}`} />
                <span className="font-medium">{enrollment.included_course_ids?.length || 0} courses</span>
              </div>
            </div>
            
            <Badge className={`${categoryConfig.bg} ${categoryConfig.text} border ${categoryConfig.border} text-xs font-semibold flex-shrink-0 h-fit`}>
              Bundle
            </Badge>
          </div>

          {/* Dates - Compact horizontal layout */}
          <div className="flex items-center gap-4 text-xs mb-4">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(enrolledDate)}</span>
            </div>
            <div className="h-3 w-px bg-gray-300" />
            <div className={`flex items-center gap-1.5 ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>Expires {formatDate(expiryDate)}</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Link
              href={detailPageUrl}
              prefetch={true}
              className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-r ${categoryConfig.color} px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
            >
              View Bundle Details
            </Link>
          </div>
        </div>
      </div>

      {/* Included Courses Section */}
      {includedCourses.length > 0 && (
        <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
          {/* Course List */}
          <ul className="divide-y divide-gray-100">
            {displayedCourses.map((course, idx) => {
              const courseUrl = course.lw_bundle_child_id
                ? `https://courses.greencardiy.com/path-player?courseid=${course.lw_bundle_child_id}&learningProgramId=${enrollment.enroll_id}`
                : null;
              const fallbackProgress: CourseProgress = { totalDurationSeconds: 0, watchedDurationSeconds: 0, percent: 0 };
              const courseProgress = course.progress ?? fallbackProgress;
              const progressPercent = Math.max(0, Math.min(100, courseProgress?.percent ?? 0));
              return (
                <li 
                  key={`${enrollment.id}-${course.course_id}-${idx}`} 
                  className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-blue-50/50 transition-colors group/item"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 line-clamp-1">{course.title}</span>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] font-medium text-gray-500">
                        <span>{describeProgress(courseProgress)}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${categoryConfig.color}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {courseUrl ? (
                    <a
                      href={courseUrl}
                      className="inline-flex items-center justify-center rounded-md bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-all flex-shrink-0 shadow-sm hover:shadow-md"
                    >
                      Watch
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic flex-shrink-0">Unavailable</span>
                  )}
                </li>
              );
            })}
          </ul>
          
          {/* Expand/Collapse Button */}
          {includedCourses.length > 3 && (
            <div className="px-4 py-3">
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
              >
                {isExpanded ? (
                  <>
                    Show Less
                    <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                  </>
                ) : (
                  <>
                    Show All Courses
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 ml-1">
                      +{includedCourses.length - 3}
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Refund Modal */}
      <RefundModal
        enrollment={enrollment}
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
      />
    </Card>
  );
}
