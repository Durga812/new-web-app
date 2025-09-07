import { getCourseDetail } from '@/lib/isr/data-isr'

export default async function CourseDetailPage({ params }:  { params: Promise<{
    slug: string;
  }> }) {
  const { slug } = await params
  const course = await getCourseDetail(slug)
  if (!course) return <div>Not found</div>
  return <pre>{JSON.stringify(course, null, 2)}</pre>
}
