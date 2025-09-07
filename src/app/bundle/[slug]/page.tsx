import { getBundleBySlug } from '@/lib/isr/data-isr'
export default async function BundleDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const bundle = await getBundleBySlug(slug)
  if (!bundle) return <div>Not found</div>
  return <pre>{JSON.stringify(bundle, null, 2)}</pre>
}