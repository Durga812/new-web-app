// src/app/bundle/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getBundleBySlug, getCoursesByIds } from '@/lib/isr/data-isr'
import { BundleDetailContent } from '@/components/bundles/BundleDetailContent'

export default async function BundleDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const bundle = await getBundleBySlug(slug)
  const course_ids = bundle?.course_ids || []
  const courses = await getCoursesByIds(course_ids)

  if (!bundle) {
    notFound()
  }
  
  return <BundleDetailContent bundle={bundle} courses={courses} />
}
