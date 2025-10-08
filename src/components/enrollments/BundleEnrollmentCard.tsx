// src/components/enrollments/BundleEnrollmentCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ChevronDown } from "lucide-react";
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
  const displayedCourses = isExpanded ? includedCourses : includedCourses.slice(0, 3);

  return (
    <Card className="relative overflow-hidden border-gray-200 bg-white flex flex-col">
      <div className="flex flex-col md:flex-row">
        {/* Media - More width on larger screens */}
        <div className="relative h-48 w-full md:h-auto md:w-80 lg:w-96 flex-shrink-0">
          {enrollment.image_url ? (
            <Image
              src={enrollment.image_url}
              alt={enrollment.product_title}
              fill
              className="object-cover"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${categoryConfig.color}`}>
              <Package className="h-12 w-12 text-white/80" />
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

            {/* Dates - Stacked on separate lines */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
                <span className="text-gray-500">Purchased</span>
                <span className="font-medium text-gray-700">{formatDate(enrolledDate)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
                <span className="text-gray-500">Expires</span>
                <span className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(expiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={detailPageUrl}
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Included Courses Section - Now part of the card */}
      {includedCourses.length > 0 && (
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-100">
            {displayedCourses.map((course, idx) => {
              const courseUrl = course.lw_bundle_child_id
                ? `https://courses.greencardiy.com/path-player?courseid=${course.lw_bundle_child_id}&learningProgramId=${enrollment.enroll_id}`
                : null;
              return (
                <li key={`${enrollment.id}-${course.course_id}-${idx}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-800 line-clamp-1 flex-1">{course.title}</span>
                  {courseUrl ? (
                    <a
                      href={courseUrl}
                      className="inline-flex items-center justify-center rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all flex-shrink-0"
                    >
                      Watch
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 flex-shrink-0">Not available</span>
                  )}
                </li>
              );
            })}
          </ul>
          
          {/* Show All/Show Less Button */}
          {includedCourses.length > 3 && (
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-50 hover:border-blue-300"
              >
                {isExpanded ? 'Show Less' : `Show All Courses (${includedCourses.length})`}
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}