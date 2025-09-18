import 'server-only';
import { supabase } from '@/lib/supabase/server';

export interface CourseBasics {
  course_id: string;
  course_slug: string;
  category: string | null;
  title: string | null;
  series: string | null;
}

export interface CourseBasicsLookup {
  bySlug: Record<string, CourseBasics>;
  byId: Record<string, CourseBasics>;
}

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export async function getCourseBasicsLookup(params: {
  slugs?: Array<string | null | undefined>;
  ids?: Array<string | null | undefined>;
}): Promise<CourseBasicsLookup> {
  const uniqueSlugs = Array.from(
    new Set((params.slugs ?? []).filter(isNonEmptyString))
  );
  const uniqueIds = Array.from(
    new Set((params.ids ?? []).filter(isNonEmptyString))
  );

  if (uniqueSlugs.length === 0 && uniqueIds.length === 0) {
    return { bySlug: {}, byId: {} };
  }

  const map = new Map<string, CourseBasics>();

  if (uniqueSlugs.length > 0) {
    const { data, error } = await supabase
      .from('courses')
      .select('course_id,course_slug,category,title,series')
      .in('course_slug', uniqueSlugs);

    if (error) {
      console.error('Failed to fetch courses by slug:', error.message);
    }

    (data ?? []).forEach((course) => {
      const key = course.course_id ?? course.course_slug;
      if (!key) return;
      map.set(key, {
        course_id: course.course_id,
        course_slug: course.course_slug,
        category: course.category,
        title: course.title,
        series: course.series ?? null,
      });
    });
  }

  const missingIds = uniqueIds.filter((id) => {
    if (!id) return false;
    return !Array.from(map.values()).some((course) => course.course_id === id);
  });

  if (missingIds.length > 0) {
    const { data, error } = await supabase
      .from('courses')
      .select('course_id,course_slug,category,title,series')
      .in('course_id', missingIds);

    if (error) {
      console.error('Failed to fetch courses by id:', error.message);
    }

    (data ?? []).forEach((course) => {
      const key = course.course_id ?? course.course_slug;
      if (!key) return;
      map.set(key, {
        course_id: course.course_id,
        course_slug: course.course_slug,
        category: course.category,
        title: course.title,
        series: course.series ?? null,
      });
    });
  }

  const bySlug: Record<string, CourseBasics> = {};
  const byId: Record<string, CourseBasics> = {};

  map.forEach((course) => {
    if (isNonEmptyString(course.course_slug)) {
      bySlug[course.course_slug] = course;
    }
    if (isNonEmptyString(course.course_id)) {
      byId[course.course_id] = course;
    }
  });

  return { bySlug, byId };
}
