// src/components/my-purchases/EnrollmentCard.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ExternalLink, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  BookOpen,
  Calendar,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnrollmentItem, CourseChild } from '@/lib/types/my-purchases';
import { getBundleCourses, getMyCourseRating } from '@/app/actions/my-purchases';
import { RatingModal } from './RatingModal';
import { toast } from 'sonner';
import { formatSeriesLabel } from '@/lib/utils/formatSeriesLabel';

interface EnrollmentCardProps {
  enrollment: EnrollmentItem;
  courseSeries?: string | null;
}

export function EnrollmentCard({ enrollment, courseSeries }: EnrollmentCardProps) {
  const router = useRouter();
  const prefetchRef = useRef<HTMLDivElement | null>(null);
  const [showChildCourses, setShowChildCourses] = useState(false);
  const [childCourses, setChildCourses] = useState<CourseChild[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isRated, setIsRated] = useState(false);

  const isBundle = enrollment.item_type === 'bundle';
  const isExpired = enrollment.is_expired ?? false;
  const detailHref = enrollment.product_slug
    ? `${isBundle ? '/bundle' : '/course'}/${enrollment.product_slug}`
    : undefined;

  // Simplified prefetch on viewport intersection
  useEffect(() => {
    if (!detailHref) return;
    const el = prefetchRef.current;
    if (!el) return;
    
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            router.prefetch(detailHref);
            io.disconnect();
            break;
          }
        }
      });
      io.observe(el);
      return () => io.disconnect();
    }
  }, [detailHref, router]);

  // Direct navigation handler
  const handleDetailClick = () => {
    if (detailHref) {
      router.push(detailHref);
    }
  };

  // Format expiry date
  const getExpiryDate = () => {
    if (!enrollment.expires_at) return 'Updating...';
    const date = new Date(enrollment.expires_at * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    if (!isExpired && daysLeft > 0 && daysLeft <= 30) {
      return `${formattedDate} (${daysLeft} days left)`;
    }
    return formattedDate;
  };

  // Check days remaining for urgency styling
  const getDaysRemaining = () => {
    if (!enrollment.expires_at || isExpired) return null;
    const date = new Date(enrollment.expires_at * 1000);
    const now = new Date();
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysRemaining();
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  // Load child courses for bundles
  const toggleChildCourses = async () => {
    if (!showChildCourses && childCourses.length === 0) {
      setLoadingCourses(true);
      try {
        const courses = await getBundleCourses(enrollment.item_id);
        setChildCourses(courses);
      } catch (error) {
        toast.error('Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    }
    setShowChildCourses(!showChildCourses);
  };

  // Check if course is rated
  React.useEffect(() => {
    if (!isBundle) {
      getMyCourseRating(enrollment.item_id).then(rating => {
        if (rating) setIsRated(true);
      });
    }
  }, [isBundle, enrollment.item_id]);

  return (
    <div ref={prefetchRef}>
      <Card className={`group relative p-0.5 bg-white backdrop-blur-sm border shadow-md hover:shadow-lg transition-all duration-300 ${
        isExpired ? 'opacity-75 border-gray-200' : 'border-gray-200 hover:border-amber-300'
      }`}>
        <CardContent className="p-4 sm:p-5">
          {/* Enhanced Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`text-xs font-semibold ${
                isBundle 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              } text-white border-0`}>
                {isBundle ? (
                  <>
                    <Package className="w-3 h-3 mr-1" />
                    BUNDLE
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3 h-3 mr-1" />
                    COURSE
                  </>
                )}
              </Badge>
              {!isBundle && courseSeries && (
                <Badge className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
                  {formatSeriesLabel(courseSeries)}
                </Badge>
              )}
              {isExpired ? (
                <Badge variant="destructive" className="text-xs">
                  EXPIRED
                </Badge>
              ) : isUrgent ? (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  EXPIRING SOON
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Title with better typography */}
          <h3 className="font-semibold text-gray-900 mb-3 text-base line-clamp-2 group-hover:text-amber-600 transition-colors">
            {enrollment.item_name}
          </h3>

          {/* Expiry info with enhanced styling */}
          <div className={`flex items-center gap-2 mb-4 text-xs ${
            isUrgent ? 'text-orange-600' : 'text-gray-500'
          }`}>
            <Calendar className="w-3 h-3" />
            <span className="font-medium">
              {isExpired ? 'Expired on' : 'Expires'}: {getExpiryDate()}
            </span>
          </div>

          {/* Enhanced Actions with better visual hierarchy */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Primary Access Button */}
            <Button
              size="sm"
              className={`font-medium px-3 min-w-[7.25rem] justify-center ${
                isExpired 
                  ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg'
              } text-white transition-all`}
              disabled={isExpired}
              asChild={!isExpired}
            >
              {isExpired ? (
                <span>Expired</span>
              ) : (
                <a
                  href={
                    isBundle
                      ? 'https://courses.greencardiy.com'
                      : `https://courses.greencardiy.com/path-player?courseid=${enrollment.item_enroll_id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1"
                >
                  Access
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </Button>

            {/* Secondary Actions Container */}
            <div className="flex items-center gap-2">
              {/* Detail button */}
              <Button
                variant="outline"
                size="sm"
                className="px-3 border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-700 hover:bg-amber-50/50"
                disabled={!detailHref}
                onClick={handleDetailClick}
                onMouseEnter={() => {
                  if (detailHref) router.prefetch(detailHref);
                }}
              >
                Detail
              </Button>

              {/* Bundle Courses Button */}
              {isBundle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleChildCourses}
                  className="px-2 border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-700 hover:bg-amber-50/50"
                  title={showChildCourses ? 'Hide courses' : 'Show courses'}
                >
                  {showChildCourses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}

              {/* Rating Button with better state indication */}
              {!isBundle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !isRated && setShowRatingModal(true)}
                  disabled={isRated}
                  className={`px-3 ${
                    isRated 
                      ? 'border-amber-300 bg-amber-50 text-amber-700' 
                      : 'border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-700 hover:bg-amber-50/50'
                  }`}
                  title={isRated ? 'Already rated' : 'Rate this course'}
                >
                  {isRated ? (
                    <>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="ml-1 text-xs">Rated</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-3 h-3" />
                      <span className="ml-1 text-xs">Rate</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced Bundle Child Courses with better styling */}
          {isBundle && showChildCourses && (
            <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200/50">
              {loadingCourses ? (
                <div className="flex justify-center py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-amber-700">Loading courses...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-800 mb-2">
                    {childCourses.length} Courses Included:
                  </p>
                  {childCourses.map((course, index) => (
                    <div 
                      key={course.course_id} 
                      className="flex items-center justify-between p-2 hover:bg-white/60 rounded transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-amber-600 font-medium">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-gray-700 truncate">
                          {course.title}
                        </span>
                      </div>
                      {course.course_slug && (
                        <Link 
                          href={`/course/${course.course_slug}`}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium ml-2 flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Modal */}
      {!isBundle && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          courseId={enrollment.item_id}
          courseName={enrollment.item_name}
          onRatingSubmitted={() => {
            setIsRated(true);
            setShowRatingModal(false);
          }}
        />
      )}
    </div>
  );
}
