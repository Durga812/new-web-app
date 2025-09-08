import { getBundleBySlug ,getCoursesByIds} from '@/lib/isr/data-isr'
export default async function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bundle = await getBundleBySlug(slug)
  const course_ids = bundle?.course_ids || []
  const courses = await getCoursesByIds(course_ids)

  if (!bundle) return <div>Not found</div>
  return (<>
  <pre>{JSON.stringify(bundle, null, 2)}</pre>
    <pre>{JSON.stringify(courses, null, 2)}</pre>
   </>);
}
