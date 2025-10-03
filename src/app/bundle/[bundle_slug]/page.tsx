// src/app/bundle/[bundle_slug]/page.tsx
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getBundleBySlug } from '@/lib/isr/data-isr'
import { supabase } from '@/lib/supabase/server'
import { EnrollmentProvider } from '@/components/providers/EnrollmentProvider'
import BundleDetailClient from './BundleDetailClient'
import type { Metadata } from 'next'

const toUniqueStrings = (values: Array<string | null>) => {
  return Array.from(
    new Set(
      values
        .map(value => value?.trim())
        .filter((value): value is string => Boolean(value && value.length > 0)),
    ),
  );
};

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
      const successful = typedData.filter((record) => record.enrollment_status === 'success')
      purchasedProductIds = toUniqueStrings(successful.map((record) => record.product_id))
      purchasedEnrollIds = toUniqueStrings(successful.map((record) => record.enroll_id))
    }
  }

  return (
    <EnrollmentProvider productIds={purchasedProductIds} enrollIds={purchasedEnrollIds}>
      <BundleDetailClient bundle={bundle} />
    </EnrollmentProvider>
  )
}
