// src/app/course/[course_slug]/page.tsx
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCourseBySlug, getRelatedCourses, getRelatedBundles } from '@/lib/isr/data-isr'
import { supabase } from '@/lib/supabase/server'
import { EnrollmentProvider } from '@/components/providers/EnrollmentProvider'
import CourseDetailClient from './CourseDetailClient'

interface CourseDetailPageProps {
  params: Promise<{
    course_slug: string
  }>
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { course_slug } = await params
  const course = await getCourseBySlug(course_slug)

  if (!course) {
    return { title: 'Course Not Found - Immigreat.ai' }
  }

  return {
    title: `${course.title} - Immigreat.ai`,
    description: course.subtitle || course.description,
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { course_slug } = await params
  const course = await getCourseBySlug(course_slug)

  if (!course) {
    notFound()
  }

  // Fetch related content
  const relatedCourseIds = course.relatedCourseIds || []
  const relatedBundleIds = course.relatedBundleIds || []

  const [relatedCourses, relatedBundles] = await Promise.all([
    getRelatedCourses(relatedCourseIds),
    getRelatedBundles(relatedBundleIds)
  ])

  // Get user enrollments
  const { userId } = await auth()
  let purchasedProductIds: string[] = []
  let purchasedEnrollIds: string[] = []

  if (userId) {
    const { data } = await supabase
      .from('user_enrollments_test')
      .select('product_id,enroll_id,enrollment_status')
      .eq('clerk_id', userId)

    if (data) {
      const successful = data.filter(r => r.enrollment_status === 'success')
      purchasedProductIds = Array.from(new Set(
        successful.map(r => r.product_id).filter(Boolean)
      ))
      purchasedEnrollIds = Array.from(new Set(
        successful.map(r => r.enroll_id).filter(Boolean)
      ))
    }
  }

  return (
    <EnrollmentProvider
      productIds={purchasedProductIds}
      enrollIds={purchasedEnrollIds}
    >
      <CourseDetailClient 
        course={course}
        relatedCourses={relatedCourses}
        relatedBundles={relatedBundles}
      />
    </EnrollmentProvider>
  )
}
