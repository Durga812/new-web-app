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

type CourseProgress = {
  totalUnits: number;
  completedUnits: number;
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

  const enrollmentsWithProgress = await attachProgressData(enrichedEnrollments, {
    learnworldsUserId: userRecord?.learnworlds_user_id ?? null,
    email: userRecord?.email ?? null,
  });

  return <MyEnrollmentsClient enrollments={enrollmentsWithProgress} />;
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

  const sanitizeIdentifier = (value?: string | null): string | null => {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const stripDurationSuffix = (value: string): string | null => {
    const withoutDuration = value.replace(/-(\d+)(m|mo)?$/i, '');
    return withoutDuration !== value ? withoutDuration : null;
  };

  const collectIdentifierVariants = (value?: string | null): string[] => {
    const primary = sanitizeIdentifier(value);
    if (!primary) {
      return [];
    }

    const variants = new Set<string>();
    variants.add(primary);

    const withoutDuration = stripDurationSuffix(primary);
    if (withoutDuration) {
      variants.add(withoutDuration);
    }

    return Array.from(variants);
  };

  const registerIdentifierVariants = (value?: string | null) => {
    for (const variant of collectIdentifierVariants(value)) {
      courseIds.add(variant);
    }
  };

  for (const enrollment of enrollments) {
    registerIdentifierVariants(enrollment.enroll_id);
    registerIdentifierVariants(enrollment.product_id);

    for (const course of enrollment.included_courses ?? []) {
      registerIdentifierVariants(course.lw_bundle_child_id);
      registerIdentifierVariants(course.course_id);
    }
  }

  if (courseIds.size === 0) {
    return enrollments;
  }

  const courseIdList = Array.from(courseIds);

  const { data: unitRows, error: unitError } = await supabase
    .from('lw_course_units')
    .select('lw_course_id, no_of_units')
    .in('lw_course_id', courseIdList);

  if (unitError) {
    console.error("Failed to fetch course unit counts:", unitError);
  }

  const unitsMap = new Map<string, number>();
  const registerUnits = (identifier?: string | null, totalUnits?: number | null) => {
    const parsedTotal = typeof totalUnits === 'number'
      ? totalUnits
      : Number(totalUnits) || 0;

    if (parsedTotal < 0) {
      return;
    }

    for (const variant of collectIdentifierVariants(identifier)) {
      if (!unitsMap.has(variant)) {
        unitsMap.set(variant, parsedTotal);
      }
    }
  };

  for (const row of unitRows ?? []) {
    registerUnits(row.lw_course_id, row.no_of_units);
  }

  // Prefer LW user ID for progress; fallback to email; if both exist, merge with LW as priority
  let progressRows: Array<{ lw_course_id: string; unit_ids: unknown }> = [];
  const progressByCourseId = new Map<string, { lw_course_id: string; unit_ids: unknown }>();

  if (learnworldsUserId) {
    const { data: byUserId, error } = await supabase
      .from('lw_course_progress_track')
      .select('lw_course_id, unit_ids')
      .in('lw_course_id', courseIdList)
      .eq('lw_user_id', learnworldsUserId);
    if (error) {
      console.error('Failed to fetch course progress by lw_user_id:', error);
    } else if (byUserId) {
      for (const row of byUserId) {
        if (row?.lw_course_id) {
          progressByCourseId.set(row.lw_course_id.trim(), row);
        }
      }
    }
  }

  if (normalizedEmail) {
    const { data: byEmail, error } = await supabase
      .from('lw_course_progress_track')
      .select('lw_course_id, unit_ids')
      .in('lw_course_id', courseIdList)
      .eq('email_id', normalizedEmail);
    if (error) {
      console.error('Failed to fetch course progress by email_id:', error);
    } else if (byEmail) {
      for (const row of byEmail) {
        if (!row?.lw_course_id) continue;
        const key = row.lw_course_id.trim();
        // Only set if not already present from lw_user_id (LW ID has priority)
        if (!progressByCourseId.has(key)) {
          progressByCourseId.set(key, row);
        }
      }
    }
  }

  progressRows = Array.from(progressByCourseId.values());

  const parseUnitIds = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter(v => typeof v === 'string' && v.length > 0);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) return [];
      // Try JSON array string first
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(v => typeof v === 'string' && v.length > 0);
        }
      } catch (_) {
        // Not JSON; fall through to comma-separated parsing
      }
      // Fallback: comma-separated list
      return trimmed
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return [];
  };

  const completedUnitsMap = new Map<string, number>();
  const registerCompletedUnits = (identifier?: string | null, completedUnits?: number) => {
    if (typeof completedUnits !== 'number' || completedUnits < 0) {
      return;
    }

    for (const variant of collectIdentifierVariants(identifier)) {
      const current = completedUnitsMap.get(variant) ?? 0;
      if (completedUnits > current) {
        completedUnitsMap.set(variant, completedUnits);
      }
    }
  };

  for (const row of progressRows) {
    const unitIds = parseUnitIds(row.unit_ids);
    const completedUnits = unitIds.length;
    registerCompletedUnits(row.lw_course_id, completedUnits);
  }

  const defaultProgress = (): CourseProgress => ({ totalUnits: 0, completedUnits: 0, percent: 0 });

  const buildProgress = (...identifiers: Array<string | null | undefined>): CourseProgress => {
    const candidateIds = new Set<string>();
    for (const identifier of identifiers) {
      for (const variant of collectIdentifierVariants(identifier)) {
        candidateIds.add(variant);
      }
    }

    if (candidateIds.size === 0) {
      return defaultProgress();
    }

    let totalUnits: number | null = null;
    let completedUnits: number | null = null;

    for (const candidate of candidateIds) {
      if (totalUnits === null && unitsMap.has(candidate)) {
        totalUnits = unitsMap.get(candidate) ?? 0;
      }
      if (completedUnitsMap.has(candidate)) {
        const value = completedUnitsMap.get(candidate) ?? 0;
        completedUnits = completedUnits === null ? value : Math.max(completedUnits, value);
      }
    }

    const safeTotalUnits = totalUnits ?? 0;
    const safeCompletedUnits = Math.max(0, completedUnits ?? 0);

    if (safeTotalUnits <= 0) {
      return {
        totalUnits: safeTotalUnits,
        completedUnits: safeCompletedUnits,
        percent: 0,
      };
    }

    const boundedCompleted = Math.min(safeCompletedUnits, safeTotalUnits);
    const percent = Math.round((boundedCompleted / safeTotalUnits) * 100);

    return {
      totalUnits: safeTotalUnits,
      completedUnits: boundedCompleted,
      percent: Math.min(100, Math.max(0, percent)),
    };
  };

  return enrollments.map(enrollment => {
    const courseProgress = enrollment.product_type === 'course'
      ? buildProgress(enrollment.enroll_id, enrollment.product_id)
      : undefined;

    const enrichedIncludedCourses = enrollment.included_courses?.map(course => ({
      ...course,
      progress: buildProgress(course.lw_bundle_child_id, course.course_id),
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
