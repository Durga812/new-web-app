import { categories, getCategoryBySlug } from '@/lib/data/categories';
import type { CourseBasicsLookup } from '@/lib/data/course_lookup';

export interface CourseCategoryGroup<T> {
  slug: string;
  label: string;
  color?: string;
  enrollments: T[];
}

const slugOrder = Object.values(categories).map((category) => category.cat_slug);

const normalizeLabel = (slug: string, fallback?: string | null) => {
  if (slug === 'uncategorized') return 'Other';
  if (fallback && fallback.trim().length > 0) return fallback;
  return slug.replace(/-/g, ' ').toUpperCase();
};

export function groupCourseEnrollmentsByCategory<Enrollment extends {
  item_id: string;
  product_slug: string | null | undefined;
}>(
  enrollments: Enrollment[],
  lookup: CourseBasicsLookup
): CourseCategoryGroup<Enrollment>[] {
  const groups = new Map<string, CourseCategoryGroup<Enrollment>>();

  enrollments.forEach((enrollment) => {
    const course = (enrollment.product_slug && lookup.bySlug[enrollment.product_slug])
      || lookup.byId[enrollment.item_id];

    const slug = course?.category ?? 'uncategorized';
    const category = getCategoryBySlug(slug);
    const key = category?.cat_slug ?? slug;
    const label = normalizeLabel(key, category?.title ?? course?.category);

    if (!groups.has(key)) {
      groups.set(key, {
        slug: key,
        label,
        color: category?.color,
        enrollments: [],
      });
    }

    groups.get(key)!.enrollments.push(enrollment);
  });

  const indexForSlug = (slug: string) => {
    const index = slugOrder.indexOf(slug);
    return index === -1 ? slugOrder.length : index;
  };

  return Array.from(groups.values()).sort((a, b) => {
    const orderDiff = indexForSlug(a.slug) - indexForSlug(b.slug);
    if (orderDiff !== 0) return orderDiff;
    return a.label.localeCompare(b.label);
  });
}
