
// src/app/course/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getCourseDetail } from '@/lib/isr/data-isr'
import { CourseDetailContent } from '@/components/courses/CourseDetailContent'

export default async function CourseDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const course = await getCourseDetail(slug)
  if (!course) {
    notFound()
  }
  
  return <CourseDetailContent course={course} />
}