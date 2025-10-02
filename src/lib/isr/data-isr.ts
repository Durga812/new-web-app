// src/lib/isr/data-isr.ts
import 'server-only'
import { supabase } from '../supabase/server'
import { unstable_cache } from 'next/cache'
import type { CourseDetail, CourseFAQ, CourseModule, CourseReview } from '@/types/course-detail'
import type { BundleCourseSummary, BundleDetail } from '@/types/bundle-detail'
import type { ReviewRow } from '@/types/reviews'

const REVALIDATE_SECONDS = Number(process.env.REVALIDATE_TIME ?? 3600)

// =====================================================
// SERIES METADATA
// =====================================================

async function _fetchSeriesMetadata(category?: string) {
  let query = supabase
    .from('series_metadata')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch series metadata: ${error.message}`)
  return data ?? []
}

export async function getSeriesMetadata(category?: string) {
  const cacheKey = category ? ['series-metadata', category] : ['series-metadata:all']

  const cached = unstable_cache(
    () => _fetchSeriesMetadata(category),
    cacheKey,
    { revalidate: REVALIDATE_SECONDS, tags: ['series'] }
  )
  return cached()
}

// =====================================================
// COURSES
// =====================================================

async function _fetchCoursesByCategory(category: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`)
  return data ?? []
}

export async function getCoursesByCategory(category: string) {
  const cached = unstable_cache(
    () => _fetchCoursesByCategory(category),
    ['courses', category],
    { revalidate: REVALIDATE_SECONDS, tags: ['course'] }
  )
  return cached()
}

type SupabaseCourseRow = {
  course_id: string
  enroll_id: string
  slug: string
  product_type?: string | null
  lw_product_type?: string | null
  category: string
  series?: string | null
  tags?: string[] | null
  title: string
  subtitle?: string | null
  description?: string | null
  image_url?: string | null
  pricing?: Record<string, unknown> | null
  ratings?: number | null
  total_reviews?: number | null
  position?: number | null
  details?: Record<string, unknown> | null
  related_course_ids?: string[] | null
  related_bundle_ids?: string[] | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

type SupabaseBundleRow = {
  bundle_id: string
  enroll_id: string
  slug: string
  product_type?: string | null
  lw_product_type?: string | null
  category: string
  series?: string | null
  tags?: string[] | null
  title: string
  subtitle?: string | null
  description?: string | null
  image_url?: string | null
  included_course_ids?: string[] | null
  pricing?: Record<string, unknown> | null
  position?: number | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

const defaultPricingUnit = {
  price: 0,
  compared_price: undefined as number | undefined,
  validity_duration: 0,
  validity_type: 'months',
}

const defaultBundlePricingUnit = {
  price: 0,
  compared_price: undefined as number | undefined,
  validity_duration: 0,
  validity_type: 'months',
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {}
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

function firstNonEmptyStringArray(...candidates: unknown[]): string[] {
  for (const candidate of candidates) {
    const arr = toStringArray(candidate)
    if (arr.length > 0) {
      return arr
    }
  }
  return []
}

function normalizeIncludes(rawIncludes: unknown): { icon?: string; text: string }[] {
  if (!Array.isArray(rawIncludes)) {
    return []
  }

  return rawIncludes
    .map((item) => {
      if (typeof item === 'string') {
        return { text: item }
      }

      if (isPlainObject(item)) {
        const maybeIcon = item.icon
        const maybeText = item.text
        const text = typeof maybeText === 'string' ? maybeText : ''
        return text ? { text, icon: typeof maybeIcon === 'string' ? maybeIcon : undefined } : null
      }

      return null
    })
    .filter((item): item is { icon?: string; text: string } => Boolean(item && item.text))
}

function normalizeFaqs(rawFaqs: unknown): CourseFAQ[] {
  if (!Array.isArray(rawFaqs)) {
    return []
  }

  return rawFaqs
    .map((faq, idx) => {
      if (!isPlainObject(faq)) {
        return null
      }

      const question = typeof faq.question === 'string' ? faq.question : ''
      const answer = typeof faq.answer === 'string' ? faq.answer : ''

      if (!question || !answer) {
        return null
      }

      const id = typeof faq.id === 'string' ? faq.id : `faq-${idx}`

      return {
        id,
        question,
        answer,
      }
    })
    .filter((faq): faq is CourseFAQ => Boolean(faq))
}

function normalizeLessons(moduleId: string, rawLessons: unknown): CourseModule['lessons'] {
  if (!Array.isArray(rawLessons)) {
    return []
  }

  return rawLessons.map((lesson, lessonIdx) => {
    if (!isPlainObject(lesson)) {
      return {
        id: `${moduleId}-lesson-${lessonIdx}`,
        title: '',
        duration: 0,
      }
    }

    const durationValue = lesson.duration

    return {
      id: typeof lesson.id === 'string' ? lesson.id : `${moduleId}-lesson-${lessonIdx}`,
      title: typeof lesson.title === 'string' ? lesson.title : '',
      duration: toNumber(durationValue, 0),
      isPreview: Boolean(lesson.isPreview ?? false),
    }
  })
}

function normalizeModules(rawModules: unknown): CourseModule[] {
  if (!Array.isArray(rawModules)) {
    return []
  }

  return rawModules.map((module, idx) => {
    if (!isPlainObject(module)) {
      const generatedId = `module-${idx}`
      return {
        id: generatedId,
        title: '',
        description: '',
        lessons: [],
        totalDuration: 0,
        outcome: '',
      }
    }

    const moduleId = typeof module.id === 'string' ? module.id : `module-${idx}`

    return {
      id: moduleId,
      title: typeof module.title === 'string' ? module.title : '',
      description: typeof module.description === 'string' ? module.description : '',
      lessons: normalizeLessons(moduleId, module.lessons),
      totalDuration: toNumber(module.totalDuration, 0),
      outcome: typeof module.outcome === 'string' ? module.outcome : '',
    }
  })
}

function normalizeReviews(rawReviews: unknown): CourseReview[] | undefined {
  if (!Array.isArray(rawReviews)) {
    return undefined
  }

  return rawReviews
    .map((review, idx): CourseReview | null => {
      if (!isPlainObject(review)) {
        return null
      }

      const userNameCandidate = typeof review.userName === 'string'
        ? review.userName
        : typeof review.user_name === 'string'
          ? review.user_name
          : ''

      const comment = typeof review.comment === 'string' ? review.comment : ''

      if (!userNameCandidate && !comment) {
        return null
      }

      return {
        id: typeof review.id === 'string' ? review.id : `review-${idx}`,
        userName: userNameCandidate || 'Anonymous',
        userAvatar:
          typeof review.userAvatar === 'string'
            ? review.userAvatar
            : typeof review.user_avatar === 'string'
              ? review.user_avatar
              : undefined,
        rating: toNumber(review.rating, 0),
        date: typeof review.date === 'string' ? review.date : '',
        comment,
        verified: Boolean(review.verified ?? false),
      }
    })
    .filter((review): review is CourseReview => review !== null)
}

function formatReviewDate(timestamp: string | null | undefined): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

function normalizeReviewRows(rows: ReviewRow[]): CourseReview[] {
  return rows
    .map((row, idx): CourseReview | null => {
      if (!row || typeof row !== 'object') {
        return null
      }

      const rating = toNumber(row.rating, 0)
      const commentRaw = typeof row.feedback === 'string' ? row.feedback.trim() : ''

      const comment = commentRaw || 'Rated without additional comments.'

      const clerkId = typeof row.clerk_user_id === 'string' ? row.clerk_user_id.trim() : ''
      const userId = typeof row.user_id === 'string' ? row.user_id.trim() : ''
      const identifier = clerkId || userId
      const userSuffix = identifier ? identifier.slice(-4) : ''
      const userName = userSuffix ? `User ${userSuffix}` : 'Verified Learner'

      return {
        id: row.id || `review-${idx}`,
        userName,
        rating,
        date: formatReviewDate(row.created_at ?? row.updated_at),
        comment,
        verified: true,
      }
    })
    .filter((review): review is CourseReview => review !== null)
}

function normalizeBundleCourseSummary(record: Record<string, unknown> | null | undefined): BundleCourseSummary | null {
  if (!record) {
    return null
  }

  const courseId = typeof record['course_id'] === 'string' ? record['course_id'] : ''
  if (!courseId) {
    return null
  }

  const tags = toStringArray(record['tags'])
  const pricing = toRecord(record['pricing'])

  const price1 = normalizeCoursePricingSlot(toRecord(pricing['price1']))
  const price2 = normalizeCoursePricingSlot(toRecord(pricing['price2']))
  const price3 = normalizeCoursePricingSlot(toRecord(pricing['price3']))

  const normalizedPricing = {
    ...(price1 ? { price1 } : {}),
    ...(price2 ? { price2 } : {}),
    ...(price3 ? { price3 } : {}),
  }

  const hasPricing = Object.keys(normalizedPricing).length > 0

  return {
    course_id: courseId,
    slug: typeof record['slug'] === 'string' && record['slug'] ? (record['slug'] as string) : courseId,
    title: typeof record['title'] === 'string' ? (record['title'] as string) : courseId,
    subtitle: typeof record['subtitle'] === 'string' ? (record['subtitle'] as string) : undefined,
    category: typeof record['category'] === 'string' ? (record['category'] as string) : '',
    series: typeof record['series'] === 'string' ? (record['series'] as string) : undefined,
    tags,
    image_url: typeof record['image_url'] === 'string' ? (record['image_url'] as string) : undefined,
    pricing: hasPricing ? (normalizedPricing as BundleCourseSummary['pricing']) : undefined,
    ratings: toNumber(record['ratings'], 0),
  }
}

function normalizeBundleDetail(record: SupabaseBundleRow | null): BundleDetail | null {
  if (!record) {
    return null
  }

  const pricing = toRecord(record.pricing)

  const includedCourseIds = Array.isArray(record.included_course_ids)
    ? record.included_course_ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []

  return {
    bundle_id: record.bundle_id,
    enroll_id: record.enroll_id,
    slug: record.slug,
    title: record.title,
    subtitle: record.subtitle ?? undefined,
    description: record.description ?? undefined,
    image_url: record.image_url ?? undefined,
    category: record.category,
    series: record.series ?? undefined,
    tags: Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    pricing: {
      price: toNumber(pricing['price'], defaultBundlePricingUnit.price),
      compared_price:
        pricing['compared_price'] !== undefined
          ? toNumber(pricing['compared_price'], defaultBundlePricingUnit.compared_price ?? 0)
          : undefined,
      validity_duration: toNumber(pricing['validity_duration'], defaultBundlePricingUnit.validity_duration),
      validity_type:
        typeof pricing['validity_type'] === 'string'
          ? (pricing['validity_type'] as string)
          : defaultBundlePricingUnit.validity_type,
    },
    includedCourseIds,
    includedCourses: [],
    lastUpdated: record.updated_at ?? record.created_at ?? '',
  }
}

function normalizeCourseDetail(record: SupabaseCourseRow | null): CourseDetail | null {
  if (!record) {
    return null
  }

  const details = toRecord(record.details)
  const hero = toRecord(details['hero'])
  const preview = toRecord(details['preview'])
  const curriculum = toRecord(details['curriculum'])

  const modules = normalizeModules(curriculum['modules'])
  const totalLessonsFromModules = modules.reduce((total, module) => total + module.lessons.length, 0)
  const totalDurationFromModules = modules.reduce((total, module) => total + Number(module.totalDuration ?? 0), 0)

  const pricing = toRecord(record.pricing)

  const normalizePrice = (slot: Record<string, unknown> | undefined) => ({
    ...defaultPricingUnit,
    price: toNumber(slot?.price, 0),
    compared_price:
      slot?.compared_price !== undefined
        ? toNumber(slot?.compared_price, defaultPricingUnit.compared_price ?? 0)
        : undefined,
    validity_duration: toNumber(slot?.validity_duration, defaultPricingUnit.validity_duration),
    validity_type: typeof slot?.validity_type === 'string' ? slot.validity_type : defaultPricingUnit.validity_type,
  })

  const keyBenefits = firstNonEmptyStringArray(hero['keyBenefits'], details['keyBenefits'])

  const relatedCourseIds = Array.isArray(record.related_course_ids)
    ? record.related_course_ids
    : []

  const relatedBundleIds = Array.isArray(record.related_bundle_ids)
    ? record.related_bundle_ids
    : []

  return {
    title: record.title ?? '',
    course_id: record.course_id,
    course_slug: record.slug ?? record.course_id,
    enroll_id: record.enroll_id,
    type: record.product_type ?? 'course',
    category: record.category ?? '',
    series: record.series ?? '',
    tags: Array.isArray(record.tags) ? record.tags : [],
    ratings: Number(record.ratings ?? 0),
    totalReviews: Number(record.total_reviews ?? 0),
    position: Number(record.position ?? 0),
    pricing: {
      price1: normalizePrice(toRecord(pricing['price1'])),
      price2: normalizePrice(toRecord(pricing['price2'])),
      price3: normalizePrice(toRecord(pricing['price3'])),
    },
    image_url: record.image_url ?? '',

    subtitle: record.subtitle ?? (typeof details['subtitle'] === 'string' ? (details['subtitle'] as string) : ''),
    keyBenefits,

    previewVideoUrl:
      typeof preview['videoUrl'] === 'string'
        ? (preview['videoUrl'] as string)
        : typeof preview['videoURL'] === 'string'
          ? (preview['videoURL'] as string)
          : '',
    previewThumbnail: typeof preview['thumbnail'] === 'string' ? (preview['thumbnail'] as string) : undefined,

    description:
      record.description ?? (typeof details['description'] === 'string' ? (details['description'] as string) : ''),
    whoIsFor: toStringArray(details['whoIsFor']),
    whoIsNotFor: toStringArray(details['whoIsNotFor']),

    highlights: toStringArray(details['highlights']),

    requirements: toStringArray(details['requirements']),

    learningOutcomes: toStringArray(details['learningOutcomes']),

    modules,
    totalModules: toNumber(curriculum['totalModules'], modules.length),
    totalLessons: toNumber(curriculum['totalLessons'], totalLessonsFromModules),
    totalDuration: toNumber(curriculum['totalDuration'], totalDurationFromModules),

    includes: normalizeIncludes(details['includes']),

    faqs: normalizeFaqs(details['faqs']),

    reviews: normalizeReviews(details['reviews']) ?? [],

    relatedCourseIds,
    relatedBundleIds,

    lastUpdated: record.updated_at ?? record.created_at ?? '',
  }
}

function normalizeCoursePricingSlot(slot: Record<string, unknown> | undefined) {
  if (!slot) {
    return undefined
  }

  const price = toNumber(slot['price'], 0)
  const compared = slot['compared_price'] !== undefined ? toNumber(slot['compared_price'], 0) : undefined
  const validityDuration = toNumber(slot['validity_duration'], 0)
  const validityType = typeof slot['validity_type'] === 'string' ? (slot['validity_type'] as string) : 'months'

  if (price === 0 && compared === undefined && validityDuration === 0 && !slot['validity_type']) {
    return undefined
  }

  return {
    price,
    compared_price: compared,
    validity_duration: validityDuration,
    validity_type: validityType,
  }
}

async function _fetchCourseBySlug(course_slug: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', course_slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch course detail: ${error.message}`)
  const course = normalizeCourseDetail(data as SupabaseCourseRow | null)

  if (!course) {
    return null
  }

  const reviews = await _fetchCourseReviews(course.course_id)
  const reviewCount = reviews.length

  const averageRating = reviewCount > 0
    ? Math.round((reviews.reduce((total, review) => total + review.rating, 0) / reviewCount) * 10) / 10
    : course.ratings

  return {
    ...course,
    reviews,
    totalReviews: reviewCount > 0 ? reviewCount : course.totalReviews,
    ratings: reviewCount > 0 ? averageRating : course.ratings,
  }
}

export async function getCourseBySlug(course_slug: string) {
  const cached = unstable_cache(
    () => _fetchCourseBySlug(course_slug),
    ['course-detail', course_slug],
    { revalidate: REVALIDATE_SECONDS, tags: ['course'] }
  )
  return cached()
}

async function _fetchCourseReviews(courseId: string) {
  if (!courseId) {
    return []
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', courseId)
    .eq('product_type', 'course')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch reviews: ${error.message}`)

  return normalizeReviewRows((data ?? []) as ReviewRow[])
}

export async function getCourseReviews(courseId: string) {
  const cached = unstable_cache(
    () => _fetchCourseReviews(courseId),
    ['course-reviews', courseId],
    { revalidate: REVALIDATE_SECONDS, tags: ['review'] }
  )
  return cached()
}

async function _fetchRelatedCourses(course_ids: string[]) {
  if (!course_ids || course_ids.length === 0) return []

  const { data, error } = await supabase
    .from('courses')
    .select(`
      course_id,
      slug,
      title,
      subtitle,
      category,
      series,
      tags,
      ratings,
      image_url,
      pricing
    `)
    .in('course_id', course_ids)
    .eq('is_active', true)

  if (error) throw new Error(`Failed to fetch related courses: ${error.message}`)
  return data ?? []
}

export async function getRelatedCourses(course_ids: string[]) {
  const sortedIds = [...course_ids].sort()
  const cached = unstable_cache(
    () => _fetchRelatedCourses(course_ids),
    ['related-courses', ...sortedIds],
    { revalidate: REVALIDATE_SECONDS, tags: ['course'] }
  )
  return cached()
}

// =====================================================
// BUNDLES
// =====================================================

async function _fetchBundlesByCategory(category: string) {
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to fetch bundles: ${error.message}`)
  return data ?? []
}

export async function getBundlesByCategory(category: string) {
  const cached = unstable_cache(
    () => _fetchBundlesByCategory(category),
    ['bundles', category],
    { revalidate: REVALIDATE_SECONDS, tags: ['bundle'] }
  )
  return cached()
}

async function _fetchBundleBySlug(bundle_slug: string): Promise<BundleDetail | null> {
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('slug', bundle_slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch bundle detail: ${error.message}`)
  const bundle = normalizeBundleDetail(data as SupabaseBundleRow | null)

  if (!bundle) {
    return null
  }

  let includedCourses: BundleCourseSummary[] = []

  if (bundle.includedCourseIds.length > 0) {
    const rawCourses = await _fetchRelatedCourses(bundle.includedCourseIds)
    const courseMap = new Map<string, BundleCourseSummary>()

    rawCourses.forEach((rawCourse) => {
      const summary = normalizeBundleCourseSummary(rawCourse as Record<string, unknown>)
      if (summary) {
        courseMap.set(summary.course_id, summary)
      }
    })

    includedCourses = bundle.includedCourseIds
      .map((id) => courseMap.get(id))
      .filter((course): course is BundleCourseSummary => Boolean(course))
  }

  return {
    ...bundle,
    includedCourses,
  }
}

export async function getBundleBySlug(bundle_slug: string): Promise<BundleDetail | null> {
  const cached = unstable_cache(
    () => _fetchBundleBySlug(bundle_slug),
    ['bundle-detail', bundle_slug],
    { revalidate: REVALIDATE_SECONDS, tags: ['bundle'] }
  )
  return cached()
}

async function _fetchRelatedBundles(bundle_ids: string[]) {
  if (!bundle_ids || bundle_ids.length === 0) return []

  const { data, error } = await supabase
    .from('bundles')
    .select(`
      bundle_id,
      slug,
      title,
      subtitle,
      category,
      series,
      tags,
      image_url,
      pricing,
      included_course_ids
    `)
    .in('bundle_id', bundle_ids)
    .eq('is_active', true)

  if (error) throw new Error(`Failed to fetch related bundles: ${error.message}`)
  return data ?? []
}

export async function getRelatedBundles(bundle_ids: string[]) {
  const sortedIds = [...bundle_ids].sort()
  const cached = unstable_cache(
    () => _fetchRelatedBundles(bundle_ids),
    ['related-bundles', ...sortedIds],
    { revalidate: REVALIDATE_SECONDS, tags: ['bundle'] }
  )
  return cached()
}

// =====================================================
// COMBINED QUERIES
// =====================================================

async function _fetchCoursesAndBundlesByCategory(category: string) {
  const [courses, bundles, seriesMetadata] = await Promise.all([
    _fetchCoursesByCategory(category),
    _fetchBundlesByCategory(category),
    _fetchSeriesMetadata(category)
  ])

  return { courses, bundles, seriesMetadata }
}

export async function getCoursesAndBundlesByCategory(category: string) {
  const cached = unstable_cache(
    () => _fetchCoursesAndBundlesByCategory(category),
    ['catalog', category],
    { 
      revalidate: REVALIDATE_SECONDS, 
      tags: ['course', 'bundle', 'series'] 
    }
  )
  return cached()
}
