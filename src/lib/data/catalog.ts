// app/(lib)/data/catalog.ts
import 'server-only';
import { supabase } from '@/lib/supabase/server';

export const discounts = {
  offer1: { quantity: 5, discount: 15 }, // 13% → 15%
  offer2: { quantity: 10, discount: 20 }, // 16% → 20%
} as const;

export function getDiscountInfo() {
  return discounts;
}

type CourseOut = {
  name: string;
  enroll_ids: string[];
  current_price: number;
  category_slug: string;
  course_slug: string;
};

type BundleOut = {
  name: string;
  enroll_id: string;
  current_price: number;
  category_slug: string;
  bundle_slug: string;
};

/**
 * Fetch courses & bundles with all details
 */
export async function getCoursesAndBundlesDetails(
  course_ids: (string | number)[] = [],
  bundle_ids: (string | number)[] = []
): Promise<{ courses: CourseOut[]; bundles: BundleOut[] }> {
  if (!course_ids.length && !bundle_ids.length) {
    return { courses: [], bundles: [] };
  }

  const [courseRes, bundleRes] = await Promise.all([
    course_ids.length
      ? supabase
          .from('courses')
          .select('name,enroll_ids,current_price,category_slug,course_slug')
          .in('id', course_ids)
      : Promise.resolve({ data: [] as CourseOut[], error: null }),
    bundle_ids.length
      ? supabase
          .from('bundles')
          .select('name,enroll_id,current_price,category_slug,bundle_slug')
          .in('id', bundle_ids)
      : Promise.resolve({ data: [] as BundleOut[], error: null }),
  ]);

  if (courseRes.error || bundleRes.error) {
    throw new Error(
      `Supabase query failed: ${
        courseRes.error?.message ?? ''
      } ${bundleRes.error?.message ?? ''}`
    );
  }

  return {
    courses: (courseRes.data ?? []) as CourseOut[],
    bundles: (bundleRes.data ?? []) as BundleOut[],
  };
}

type CourseInfo = {
  name: string;
  course_slug: string;
  category_slug: string;
};

/**
 * Fetch minimal course info for given IDs
 */
export async function getCoursesInfoByIds(
  course_ids: (string | number)[] = []
): Promise<CourseInfo[]> {
  if (!course_ids.length) return [];

  const { data, error } = await supabase
    .from('courses')
    .select('name,course_slug,category_slug')
    .in('id', course_ids);

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return (data ?? []) as CourseInfo[];
}
