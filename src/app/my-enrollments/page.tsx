// src/app/my-enrollments/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import {
  aggregateWatchedByCourse,
  AggregatedCourseProgress,
  RawVideoProgressRow,
} from "@/lib/learnworlds/progress-utils";
import { getSeriesMetadata } from "@/lib/isg/data-isr";
import type { RawSeriesMetadata } from "@/types/catalog";
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

type CourseProgress = {
  totalDurationSeconds: number;
  watchedDurationSeconds: number;
  percent: number;
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
    lw_bundle_child_id?: string; //  Still optional (course might not have mapping)
    progress?: CourseProgress;
  }>;
  has_reviewed?: boolean;
  user_review?: {
    rating: number;
    feedback?: string;
  };
  progress?: CourseProgress;
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
  lw_bundle_children: Record<string, string>; //  Not nullable
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

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('learnworlds_user_id, email')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (userError) {
    console.error("Failed to fetch user record for progress tracking:", userError);
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

  const courseCategoriesForOrdering = Array.from(
    new Set(
      enrichedEnrollments
        .filter(enrollment => enrollment.product_type === 'course' && enrollment.category)
        .map(enrollment => enrollment.category as string)
    )
  );

  let seriesOrderByCategory: Record<string, Record<string, number>> = {};

  if (courseCategoriesForOrdering.length > 0) {
    const seriesOrderEntries = await Promise.all(
      courseCategoriesForOrdering.map(async category => {
        const metadata = await getSeriesMetadata(category);
        const orderMap = (metadata as RawSeriesMetadata[] | null | undefined)?.reduce<Record<string, number>>(
          (acc, item) => {
            if (!item?.slug) {
              return acc;
            }
            const orderValue =
              typeof item.display_order === 'number' && Number.isFinite(item.display_order)
                ? item.display_order
                : 999;
            acc[item.slug] = orderValue;
            return acc;
          },
          {}
        ) ?? {};

        return [category, orderMap] as const;
      })
    );

    seriesOrderByCategory = Object.fromEntries(seriesOrderEntries);
  }

  const enrollmentsWithProgress = await attachProgressData(enrichedEnrollments, {
    learnworldsUserId: userRecord?.learnworlds_user_id ?? null,
    email: userRecord?.email ?? null,
  });

  return (
    <MyEnrollmentsClient
      enrollments={enrollmentsWithProgress}
      seriesOrderByCategory={seriesOrderByCategory}
    />
  );
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
      .select('bundle_id, title, category, series, image_url, tags, included_course_ids,lw_bundle_children, slug')
      .in('bundle_id', bundleIds);

    const typedBundles: RawBundleRow[] = Array.isArray(bundles) ? (bundles as RawBundleRow[]) : [];

    for (const enrollment of enrollments.filter(e => e.product_type === 'bundle')) {
      const bundleData = typedBundles.find(b => b.bundle_id === enrollment.product_id);
      
      if (bundleData) {
      let includedCourses: Array<{ 
        course_id: string; 
        title: string; 
        image_url?: string;
        lw_bundle_child_id?: string;
      }> = [];
      
      if (bundleData.included_course_ids && bundleData.included_course_ids.length > 0) {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('course_id, title, image_url')
          .in('course_id', bundleData.included_course_ids);
        
        // ✅ No need for || {} since it's not nullable
        const lwMappings = bundleData.lw_bundle_children;
        includedCourses = (coursesData || []).map(course => ({
          ...course,
          lw_bundle_child_id: lwMappings[course.course_id]
        }));
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

async function attachProgressData(
  enrollments: EnrichedEnrollment[],
  params: { learnworldsUserId?: string | null; email?: string | null }
): Promise<EnrichedEnrollment[]> {
  if (!enrollments.length) {
    return enrollments;
  }

  const { learnworldsUserId, email } = params;
  const normalizedEmail = email?.trim();
  const courseIds = new Set<string>();
  const addCourseId = (value?: string | null) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      courseIds.add(trimmed);
    }
  };

  for (const enrollment of enrollments) {
    addCourseId(enrollment.enroll_id);

    for (const course of enrollment.included_courses ?? []) {
      addCourseId(course.lw_bundle_child_id);
    }
  }

  if (courseIds.size === 0) {
    return enrollments;
  }

  const courseIdList = Array.from(courseIds);
  console.log('[MyEnrollments] Aggregated LW course IDs:', courseIdList);

  const { data: durationRows, error: durationError } = await supabase
    .from('lw_course_units')
    .select('lw_course_id, duration')
    .in('lw_course_id', courseIdList);

  if (durationError) {
    console.error('Failed to fetch course durations:', durationError);
  } else {
    console.log('[MyEnrollments] Duration rows:', durationRows);
  }

  const courseDurationMap = new Map<string, number>();
  for (const row of durationRows ?? []) {
    if (!row) continue;
    const courseId = typeof row.lw_course_id === 'string' ? row.lw_course_id.trim() : '';
    if (!courseId) continue;
    const duration =
      typeof row.duration === 'number'
        ? row.duration
        : Number(row.duration) || 0;
    const existing = courseDurationMap.get(courseId) ?? 0;
    courseDurationMap.set(courseId, Math.max(0, existing + Math.max(0, duration)));
  }
  console.log(
    '[MyEnrollments] Course duration map:',
    Object.fromEntries(courseDurationMap.entries())
  );

  const aggregatedProgress = new Map<string, AggregatedCourseProgress>();
  const adoptProgressRows = (
    rows: RawVideoProgressRow[] | null | undefined,
    { overwrite }: { overwrite: boolean }
  ) => {
    const aggregated = aggregateWatchedByCourse(rows);
    for (const [courseId, summary] of aggregated.entries()) {
      if (!overwrite && aggregatedProgress.has(courseId)) {
        continue;
      }
      aggregatedProgress.set(courseId, summary);
    }
  };

  if (learnworldsUserId) {
    const { data: byUserId, error } = await supabase
      .from('video_progress')
      .select('course_id, unit_id, video_id, video_duration, covered_segments')
      .in('course_id', courseIdList)
      .eq('user_id', learnworldsUserId);

    if (error) {
      console.error('Failed to fetch video progress by user_id:', error);
    } else {
      console.log('[MyEnrollments] Video progress rows (user_id):', byUserId);
      adoptProgressRows(byUserId, { overwrite: true });
    }
  }

  if (normalizedEmail) {
    const { data: byEmail, error } = await supabase
      .from('video_progress')
      .select('course_id, unit_id, video_id, video_duration, covered_segments')
      .in('course_id', courseIdList)
      .eq('user_email', normalizedEmail);

    if (error) {
      console.error('Failed to fetch video progress by email:', error);
    } else {
      console.log('[MyEnrollments] Video progress rows (email):', byEmail);
      adoptProgressRows(byEmail, { overwrite: false });
    }
  }

  console.log(
    '[MyEnrollments] Aggregated progress summaries:',
    Object.fromEntries(
      Array.from(aggregatedProgress.entries()).map(([courseId, summary]) => [
        courseId,
        summary,
      ])
    )
  );

  const defaultProgress = (): CourseProgress => ({
    totalDurationSeconds: 0,
    watchedDurationSeconds: 0,
    percent: 0,
  });

  const buildProgress = (courseId?: string | null): CourseProgress => {
    const trimmedId = courseId?.trim();
    if (!trimmedId) {
      return defaultProgress();
    }

    const summary = aggregatedProgress.get(trimmedId);
    const watchedSeconds = summary?.watchedSeconds ?? 0;
    const fallbackTotal = summary?.availableSeconds ?? 0;
    const registeredTotal = courseDurationMap.get(trimmedId) ?? 0;
    const totalDurationSeconds = Math.max(
      0,
      Math.round(registeredTotal > 0 ? registeredTotal : fallbackTotal)
    );

    if (totalDurationSeconds <= 0) {
      return {
        totalDurationSeconds,
        watchedDurationSeconds: Math.max(0, Math.round(watchedSeconds)),
        percent: 0,
      };
    }

    const boundedWatched = Math.max(
      0,
      Math.round(Math.min(watchedSeconds, totalDurationSeconds))
    );
    const percent = Math.round((boundedWatched / totalDurationSeconds) * 100);

    return {
      totalDurationSeconds,
      watchedDurationSeconds: boundedWatched,
      percent: Math.min(100, Math.max(0, percent)),
    };
  };

  const progressDebugSummary = enrollments.map(enrollment => ({
    enrollmentId: enrollment.id,
    productId: enrollment.product_id,
    enrollId: enrollment.enroll_id,
    totalDurationSeconds:
      courseDurationMap.get(enrollment.enroll_id?.trim() ?? '') ?? null,
    watchedDurationSeconds:
      aggregatedProgress.get(enrollment.enroll_id?.trim() ?? '')?.watchedSeconds ??
      null,
    progress:
      enrollment.product_type === 'course'
        ? buildProgress(enrollment.enroll_id)
        : null,
    includedCourses: (enrollment.included_courses ?? []).map(course => ({
      courseId: course.course_id,
      lwBundleChildId: course.lw_bundle_child_id,
      totalDurationSeconds:
        courseDurationMap.get(course.lw_bundle_child_id?.trim() ?? '') ?? null,
      watchedDurationSeconds:
        aggregatedProgress.get(course.lw_bundle_child_id?.trim() ?? '')
          ?.watchedSeconds ?? null,
      progress: buildProgress(course.lw_bundle_child_id),
    })),
  }));
  console.log('[MyEnrollments] Progress debug summary:', progressDebugSummary);

  return enrollments.map(enrollment => {
    const courseProgress = enrollment.product_type === 'course'
      ? buildProgress(enrollment.enroll_id)
      : undefined;

    const enrichedIncludedCourses = enrollment.included_courses?.map(course => ({
      ...course,
      progress: buildProgress(course.lw_bundle_child_id),
    }));

    return {
      ...enrollment,
      ...(courseProgress ? { progress: courseProgress } : {}),
      ...(enrichedIncludedCourses ? { included_courses: enrichedIncludedCourses } : {}),
    };
  });
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 mb-6 shadow-lg">
          <svg className="h-12 w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">No enrollments yet</h1>
        <p className="text-gray-600 mb-8 text-lg">Start your immigration journey by enrolling in our expert-curated courses</p>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105"
        >
          Browse Courses
        </Link>
      </div>
    </div>
  );
}
