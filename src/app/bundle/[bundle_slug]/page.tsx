// src/app/bundle/[bundle_slug]/page.tsx
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getBundleBySlug } from '@/lib/isr/data-isr'
import { supabase } from '@/lib/supabase/server'
import { EnrollmentProvider } from '@/components/providers/EnrollmentProvider'
import BundleDetailClient from './BundleDetailClient'
import type { Metadata } from 'next'

interface BundleDetailPageProps {
  params: Promise<{
    bundle_slug: string
  }>
}

export async function generateMetadata({ params }: BundleDetailPageProps): Promise<Metadata> {
  const { bundle_slug } = await params
  const bundle = await getBundleBySlug(bundle_slug)

  if (!bundle) {
    return {
      title: 'Bundle Not Found - Immigreat.ai',
    }
  }

  return {
    title: `${bundle.title} - Immigreat.ai`,
    description: bundle.subtitle || bundle.description || undefined,
  }
}

export default async function BundleDetailPage({ params }: BundleDetailPageProps) {
  const { bundle_slug } = await params
  const bundle = await getBundleBySlug(bundle_slug)

  if (!bundle) {
    notFound()
  }

  const { userId } = await auth()
  let purchasedProductIds: string[] = []
  let purchasedEnrollIds: string[] = []

  if (userId) {
    const { data } = await supabase
      .from('user_enrollments_test')
      .select('product_id,enroll_id,enrollment_status')
      .eq('clerk_id', userId)

    if (data) {
      const successful = data.filter((record) => record.enrollment_status === 'success')
      purchasedProductIds = Array.from(new Set(successful.map((record) => record.product_id).filter(Boolean)))
      purchasedEnrollIds = Array.from(new Set(successful.map((record) => record.enroll_id).filter(Boolean)))
    }
  }

  return (
    <EnrollmentProvider productIds={purchasedProductIds} enrollIds={purchasedEnrollIds}>
      <BundleDetailClient bundle={bundle} />
    </EnrollmentProvider>
  )
}
