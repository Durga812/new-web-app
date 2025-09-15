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
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnrollmentItem, CourseChild } from '@/lib/types/my-purchases';
import { getBundleCourses, getMyCourseRating } from '@/app/actions/my-purchases';
import { RatingModal } from './RatingModal';
import { toast } from 'sonner';

interface EnrollmentCardProps {
  enrollment: EnrollmentItem;
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
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

  // Direct navigation handler (like individual courses)
  const handleDetailClick = () => {
    if (detailHref) {
      router.push(detailHref);
    }
  };

  // Format expiry date
  const getExpiryDate = () => {
    if (!enrollment.expires_at) return 'Updating...';
    const date = new Date(enrollment.expires_at * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          {/* Header with badges */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${isBundle ? 'bg-emerald-500' : 'bg-blue-500'} text-white`}>
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
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  EXPIRED
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {getExpiryDate()}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-3 text-sm line-clamp-1">
            {enrollment.item_name}
          </h3>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Access Button */}
            <Button
              size="sm"
              className={`flex-1 ${
                isExpired 
                  ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              } text-white`}
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
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </Button>

            {/* Detail button - SIMPLIFIED with direct navigation */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 px-3 border-amber-300 text-amber-700 hover:bg-amber-50"
              disabled={!detailHref}
              onClick={handleDetailClick}
              onMouseEnter={() => {
                // Prefetch on hover for better UX
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
                className="px-3 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {showChildCourses ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            )}

            {/* Rating Button */}
            {!isBundle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => !isRated && setShowRatingModal(true)}
                disabled={isRated}
                className="px-3 border-amber-300 text-amber-700 hover:bg-amber-50"
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

          {/* Bundle Child Courses */}
          {isBundle && showChildCourses && (
            <div className="mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200/30">
              {loadingCourses ? (
                <div className="flex justify-center py-2">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {childCourses.map((course) => (
                    <div key={course.course_id} className="flex items-center justify-between py-1 text-xs">
                      <span className="text-gray-700 truncate">{course.title}</span>
                      {course.course_slug && (
                        <Link 
                          href={`/course/${course.course_slug}`}
                          className="text-amber-600 hover:text-amber-700 ml-2"
                        >
                          View
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