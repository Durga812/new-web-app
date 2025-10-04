// src/app/courses/[category]/page.tsx
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCoursesAndBundlesByCategory } from '@/lib/isg/data-isr'
import type { NormalizedSeriesMetadata, RawSeriesMetadata, SeriesMetadataMap } from '@/types/catalog'
import { IndividualCoursesSection } from '@/components/courses/IndividualCoursesSection'
import { CuratedBundlesSection } from '@/components/courses/CuratedBundlesSection'
import { supabase } from '@/lib/supabase/server'
import { EnrollmentProvider } from '@/components/providers/EnrollmentProvider'

const toUniqueStrings = (values: Array<string | null>) => {
  return Array.from(
    new Set(
      values
        .map(value => value?.trim())
        .filter((value): value is string => Boolean(value && value.length > 0)),
    ),
  );
};

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
  searchParams?: Promise<{
    'course-type'?: string
  }>
}

const validCategories = ['eb1a', 'eb2-niw', 'o-1', 'eb5']

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params
  
  if (!validCategories.includes(category)) {
    return { title: 'Category Not Found - Immigreat.ai' }
  }

  return {
    title: `${category.toUpperCase()} Courses - Immigreat.ai`,
    description: `Explore ${category.toUpperCase()} immigration courses and bundles`,
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params
  const resolvedSearchParams = await searchParams
  const courseType = resolvedSearchParams?.['course-type'] || 'individual-courses'
  
  if (!validCategories.includes(category)) {
    notFound()
  }

  // Fetch data with ISR caching
  const { courses, bundles, seriesMetadata } = await getCoursesAndBundlesByCategory(category)

  const toOptionalString = (value: unknown) => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  const normalizedSeriesMetadata: SeriesMetadataMap = (seriesMetadata as RawSeriesMetadata[]).reduce(
    (acc, raw) => {
      if (!raw?.slug) {
        return acc
      }

      const slug = raw.slug
      const normalized: NormalizedSeriesMetadata = {
        slug,
        displayName: toOptionalString(raw.display_name) ?? slug,
        subtitle: toOptionalString(raw.subtitle),
        tooltipContent: toOptionalString(raw.tooltip_content),
        order: typeof raw.display_order === 'number' ? raw.display_order : 999,
        bgColor: toOptionalString(raw.bg_color),
        accentColor: toOptionalString(raw.accent_color),
      }

      acc[slug] = normalized
      return acc
    },
    {} as SeriesMetadataMap
  )

  // Get user enrollments
  const { userId } = await auth()
  let purchasedProductIds: string[] = []
  let purchasedEnrollIds: string[] = []

  if (userId) {
    type _EnrollmentIdRow = {
      product_id: string | null
      enroll_id: string | null
      enrollment_status: string | null
      status: string | null
    }

    const { data } = await supabase
      .from('enrollments')
      .select('product_id,enroll_id,enrollment_status,status')
      .eq('clerk_user_id', userId)
      .eq('status', 'active')

    if (data) {
      const typedData = data as _EnrollmentIdRow[]
      const successful = typedData.filter(r => r.enrollment_status === 'success')
      purchasedProductIds = toUniqueStrings(successful.map(r => r.product_id))
      purchasedEnrollIds = toUniqueStrings(successful.map(r => r.enroll_id))
    }
  }

  // Convert series metadata array to object for component
  return (
    <EnrollmentProvider
      productIds={purchasedProductIds}
      enrollIds={purchasedEnrollIds}
    >
      <div className="min-h-screen bg-gradient-to-b from-amber-50/20 to-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
          <section className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-transparent lg:text-4xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text">
              Explore {category.toUpperCase()} courses
            </h1>
            <p className="text-sm text-gray-600">
              Master your immigration journey with comprehensive courses
            </p>
          </section>

          <div className="mb-6 flex justify-center">
            <CourseTypeTabs category={category} activeType={courseType} />
          </div>

          {courseType === 'curated-bundle-courses' ? (
            <CuratedBundlesSection
              category={category}
              bundles={bundles}
            />
          ) : (
            <IndividualCoursesSection
              category={category}
              courses={courses}
              seriesMetadata={normalizedSeriesMetadata}
            />
          )}
        </div>
      </div>
    </EnrollmentProvider>
  )
}

function CourseTypeTabs({ category, activeType }: { category: string; activeType: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-200/80 bg-white/90 p-1 shadow-sm backdrop-blur-sm">
      <a
        href={`/courses/${category}`}
        className={`relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
          activeType === 'individual-courses'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Individual Courses / Build your own bundle
      </a>
      <a
        href={`/courses/${category}?course-type=curated-bundle-courses`}
        className={`relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
          activeType === 'curated-bundle-courses'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Curated Bundles
      </a>
    </div>
  )
}
