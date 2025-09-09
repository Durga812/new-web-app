// lib/isr/data-isr.ts
import 'server-only'
import { supabase } from '../supabase/server'
import { unstable_cache } from 'next/cache'

const REVALIDATE_SECONDS = Number(process.env.REVALIDATE_TIME ?? 3600)

// -------------------------------
// COURSES
// -------------------------------

async function _fetchCoursesByCatSlug(slug: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      course_id,
      name,
      course_slug,
      category_slug,
      series_slug,
      rating,
      is_active,
      validity,
      tags,
      description,
      content,
      price,
      highlight,
      urls,
      enroll_ids,
      metadata,
      created_at,
      updated_at
    `)
    .eq('category_slug', slug)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`)
  return data ?? []
}

export async function getcoursesbyslug(slug: string) {
  const cached = unstable_cache(
    () => _fetchCoursesByCatSlug(slug),
    ['courses', slug],
    { revalidate: REVALIDATE_SECONDS, tags: ['course', `course:${slug}`] }
  )
  return cached()
}

async function _fetchCourseDetail(course_slug: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      course_id,
      name,
      course_slug,
      category_slug,
      rating,
      is_active,
      validity,
      tags,
      description,
      content,
      price,
      highlight,
      urls,
      enroll_ids,
      metadata,
      created_at,
      updated_at
    `)
    .eq('course_slug', course_slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch course detail: ${error.message}`)
  return data ?? null
}

export async function getCourseDetail(course_slug: string) {
  const cached = unstable_cache(
    () => _fetchCourseDetail(course_slug),
    ['course-detail', course_slug],
    { revalidate: REVALIDATE_SECONDS, tags: ['course', `course:${course_slug}`] }
  )
  return cached()
}

// -------------------------------
// BUNDLES
// -------------------------------

async function _fetchAllBundles() {
  const { data, error } = await supabase
    .from('bundles') // <-- change if your table name differs
    .select(`
      bundle_id,
      course_ids,
      name,
      bundle_slug,
      category_slug,
      rating,
      is_active,
      validity,
      tags,
      description,
      content,
      price,
      highlight,
      urls,
      bundle_enroll_id,
      metadata,
      created_at,
      updated_at
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch bundles: ${error.message}`)
  return data ?? []
}

export async function getBundles() {
  const cached = unstable_cache(
    () => _fetchAllBundles(),
    ['bundles:all'],
    { revalidate: REVALIDATE_SECONDS, tags: ['bundle'] }
  )
  return cached()
}

async function _fetchBundleBySlug(bundle_slug: string) {
  const { data, error } = await supabase
    .from('bundles') // <-- change if needed
    .select(`
      bundle_id,
      course_ids,
      name,
      bundle_slug,
      category_slug,
      rating,
      is_active,
      validity,
      tags,
      description,
      content,
      price,
      highlight,
      urls,
      bundle_enroll_id,
      metadata,
      created_at,
      updated_at
    `)
    .eq('bundle_slug', bundle_slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch bundle detail: ${error.message}`)
  return data ?? null
}

export async function getBundleBySlug(bundle_slug: string) {
  const cached = unstable_cache(
    () => _fetchBundleBySlug(bundle_slug),
    ['bundle-detail', bundle_slug],
    { revalidate: REVALIDATE_SECONDS, tags: ['bundle', `bundle:${bundle_slug}`] }
  )
  return cached()
}


async function _fetchCoursesByIds(ids: string[]) {
  if (!ids || ids.length === 0) return []

  const { data, error } = await supabase
    .from('courses')
    .select(`
      course_id,
      name,
      course_slug,
      rating,
      description
    `)
    .eq('is_active', true)
    .in('course_id', ids)

  if (error) throw new Error(`Failed to fetch courses by ids: ${error.message}`)
  return data ?? []
}


export async function getCoursesByIds(ids: string[]) {
  // Sort for a stable cache key regardless of input order
  const key = ['courses-by-ids', ...[...ids].sort()]

  const cached = unstable_cache(
    () => _fetchCoursesByIds(ids),
    key,
    {
      revalidate: REVALIDATE_SECONDS,
      tags: ['course', 'bundle'], // either tag will refresh this cache
    }
  )

  return cached()
}
