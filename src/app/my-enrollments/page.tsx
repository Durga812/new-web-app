// src/app/my-enrollments/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import Link from "next/link";
import MyEnrollmentsClient from "./MyEnrollmentsClient";

type EnrollmentRow = {
  id: string;
  clerk_user_id: string;
  order_id: string;
  product_id: string;
  product_type: 'course' | 'bundle';
  lw_product_type: string;
  enroll_id: string;
  product_title: string;
  validity_duration: number;
  validity_type: string;
  enrolled_at: string;
  expires_at: string;
  enrollment_status: string;
  status: string;
  created_at: string;
};

type EnrichedEnrollment = EnrollmentRow & {
  category?: string;
  series?: string;
  image_url?: string;
  total_lessons?: number;
  total_duration?: number;
  slug?: string;
  tags?: string[];
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

type RawCourseRow = {
  course_id: string;
  title: string;
  category?: string | null;
  series?: string | null;
  image_url?: string | null;
  tags?: string[] | null;
  details?: unknown;
  slug?: string | null;
};

type RawBundleRow = {
  bundle_id: string;
  title: string;
  category?: string | null;
  series?: string | null;
  image_url?: string | null;
  tags?: string[] | null;
  included_course_ids?: string[] | null;
  slug?: string | null;
};

export const metadata = {
  title: "My Enrollments - Immigreat.ai",
  description: "View and access your enrolled courses and bundles",
};

export default async function MyEnrollmentsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/my-enrollments");
  }

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('enrollment_status', 'success')
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch enrollments:", error);
    throw new Error("Failed to load enrollments");
  }

  if (!enrollments || enrollments.length === 0) {
    return <EmptyState />;
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('product_id, rating, feedback')
    .eq('clerk_user_id', userId);

  const reviewsMap = new Map(
    (reviews || []).map(r => [r.product_id, { rating: r.rating, feedback: r.feedback }])
  );

  const enrichedEnrollments = await enrichEnrollments(
    enrollments as EnrollmentRow[],
    reviewsMap
  );

  return <MyEnrollmentsClient enrollments={enrichedEnrollments} />;
}

async function enrichEnrollments(
  enrollments: EnrollmentRow[],
  reviewsMap: Map<string, { rating: number; feedback?: string }>
): Promise<EnrichedEnrollment[]> {
  const courseIds = enrollments
    .filter(e => e.product_type === 'course')
    .map(e => e.product_id);
  
  const bundleIds = enrollments
    .filter(e => e.product_type === 'bundle')
    .map(e => e.product_id);

  const enriched: EnrichedEnrollment[] = [];

  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('course_id, title, category, series, image_url, tags, details, slug')
      .in('course_id', courseIds);

    const typedCourses: RawCourseRow[] = Array.isArray(courses) ? (courses as RawCourseRow[]) : [];

    for (const enrollment of enrollments.filter(e => e.product_type === 'course')) {
      const courseData = typedCourses.find(c => c.course_id === enrollment.product_id);
      const userReview = reviewsMap.get(enrollment.product_id);
      
      if (courseData) {
        type CourseDetails = {
          curriculum?: {
            totalLessons?: number;
            totalDuration?: number;
          }
        } | null;
        const details = (courseData.details as CourseDetails) || null;
        const curriculum = details?.curriculum || {};
        
        enriched.push({
          ...enrollment,
          category: courseData.category ?? undefined,
          series: courseData.series ?? undefined,
          image_url: courseData.image_url ?? undefined,
          total_lessons: curriculum.totalLessons || 0,
          total_duration: curriculum.totalDuration || 0,
          slug: courseData.slug || undefined,
          tags: courseData.tags || [],
          has_reviewed: !!userReview,
          user_review: userReview,
        });
      } else {
        enriched.push({
          ...enrollment,
          has_reviewed: !!userReview,
          user_review: userReview,
        });
      }
    }
  }

  if (bundleIds.length > 0) {
    const { data: bundles } = await supabase
      .from('bundles')
      .select('bundle_id, title, category, series, image_url, tags, included_course_ids, slug')
      .in('bundle_id', bundleIds);

    const typedBundles: RawBundleRow[] = Array.isArray(bundles) ? (bundles as RawBundleRow[]) : [];

    for (const enrollment of enrollments.filter(e => e.product_type === 'bundle')) {
      const bundleData = typedBundles.find(b => b.bundle_id === enrollment.product_id);
      
      if (bundleData) {
        let includedCourses: Array<{ course_id: string; title: string; image_url?: string }> = [];
        
        if (bundleData.included_course_ids && bundleData.included_course_ids.length > 0) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('course_id, title, image_url')
            .in('course_id', bundleData.included_course_ids);
          
          includedCourses = coursesData || [];
        }
        
        enriched.push({
          ...enrollment,
          category: bundleData.category ?? undefined,
          series: bundleData.series ?? undefined,
          image_url: bundleData.image_url ?? undefined,
          slug: bundleData.slug || undefined,
          tags: bundleData.tags || [],
          included_course_ids: bundleData.included_course_ids || [],
          included_courses: includedCourses,
        });
      } else {
        enriched.push(enrollment);
      }
    }
  }

  return enriched;
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-32 text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 mb-6 shadow-lg">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">No enrollments yet</h1>
      <p className="text-gray-600 mb-10 text-lg">Start your immigration journey by enrolling in courses</p>
      <Link
        href="/courses"
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
      >
        Browse Courses
      </Link>
    </div>
  );
}