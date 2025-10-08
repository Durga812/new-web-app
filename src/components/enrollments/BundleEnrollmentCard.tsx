// src/components/enrollments/BundleEnrollmentCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Package, ChevronDown } from "lucide-react";
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

interface BundleEnrollmentCardProps {
  enrollment: EnrichedEnrollment;
  categoryConfig: CategoryConfig;
}

export function BundleEnrollmentCard({
  enrollment,
  categoryConfig,
}: BundleEnrollmentCardProps) {
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

  const includedCourses = enrollment.included_courses || [];
  const previewCourses = includedCourses.slice(0, 3);
  const remainingCount = includedCourses.length - 3;

  return (
    <div className="flex flex-col">
      <Card className="relative overflow-hidden border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row md:h-48">
          {/* Media - Fixed height on desktop */}
          <div className="relative h-40 w-full md:h-48 md:w-52 flex-shrink-0">
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
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                  <Link href={detailPageUrl} className="hover:text-amber-600 transition-colors">
                    {enrollment.product_title}
                  </Link>
                </h3>
                <Badge className={`${categoryConfig.bg} ${categoryConfig.text} border ${categoryConfig.border} text-xs font-semibold flex-shrink-0`}>Bundle</Badge>
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
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5 border border-gray-100">
                  <span className="text-gray-500">Purchased</span>
                  <span className="font-medium text-gray-700">{formatDate(enrolledDate)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5 border border-gray-100">
                  <span className="text-gray-500">Expires</span>
                  <span className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(expiryDate)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={detailPageUrl}
                className="inline-flex items-center justify-center rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview courses - Fixed display (first 3) */}
      {previewCourses.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm">
          <ul className="divide-y divide-gray-100">
            {previewCourses.map((course, idx) => {
              const courseUrl = course.lw_bundle_child_id
                ? `https://courses.greencardiy.com/path-player?courseid=${course.lw_bundle_child_id}&learningProgramId=${enrollment.enroll_id}`
                : null;
              return (
                <li key={`${enrollment.id}-${course.course_id}-${idx}`} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-sm text-gray-800 line-clamp-1 flex-1">{course.title}</span>
                  {courseUrl ? (
                    <a
                      href={courseUrl}
                      className="inline-flex items-center justify-center rounded-lg border-2 border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 flex-shrink-0"
                    >
                      Watch
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 flex-shrink-0">Not available</span>
                  )}
                </li>
              );
            })}
          </ul>
          
          {/* Expand button if more than 3 courses */}
          {remainingCount > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-300"
              >
                {isExpanded ? 'Show less' : `Expand all (${remainingCount} more)`}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expanded courses - Remaining courses */}
      {isExpanded && remainingCount > 0 && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {includedCourses.slice(3).map((course, idx) => {
              const courseUrl = course.lw_bundle_child_id
                ? `https://courses.greencardiy.com/path-player?courseid=${course.lw_bundle_child_id}&learningProgramId=${enrollment.enroll_id}`
                : null;
              return (
                <li key={`${enrollment.id}-${course.course_id}-expanded-${idx}`} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-sm text-gray-800 line-clamp-1 flex-1">{course.title}</span>
                  {courseUrl ? (
                    <a
                      href={courseUrl}
                      className="inline-flex items-center justify-center rounded-lg border-2 border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 flex-shrink-0"
                    >
                      Watch
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 flex-shrink-0">Not available</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}