// src/app/api/catalog/cart-products/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

type ProductRequest = {
  id: string;
  type: 'course' | 'bundle';
};

type ProductResponse = {
  id: string;
  type: 'course' | 'bundle';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  category: string;
  pricing?: Record<string, { price?: number; compared_price?: number; validity_duration?: number; validity_type?: string }>;
  includedCourseIds: string[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const products: unknown = body?.products

    if (!Array.isArray(products)) {
      return NextResponse.json({ products: [] })
    }

    const normalizedProducts = products
      .map((item): ProductRequest | null => {
        if (typeof item !== 'object' || !item) return null;
        const { id, type } = item as { id?: unknown; type?: unknown };
        if (typeof id !== 'string' || !id.trim()) return null;
        if (type !== 'course' && type !== 'bundle') return null;
        return { id: id.trim(), type };
      })
      .filter((item): item is ProductRequest => Boolean(item));

    if (normalizedProducts.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const courseIds = normalizedProducts.filter(p => p.type === 'course').map(p => p.id);
    const bundleIds = normalizedProducts.filter(p => p.type === 'bundle').map(p => p.id);

    const results: ProductResponse[] = [];

    // Fetch courses
    if (courseIds.length > 0) {
      console.log('Fetching courses for cart enrichment:', courseIds);
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('course_id, title, subtitle, image_url, category, pricing')
        .in('course_id', courseIds);

      if (courseError) {
        console.error('Failed to fetch courses:', courseError);
      } else {
        console.log('Found courses:', courses?.length || 0);
        courses?.forEach(course => {
          console.log('Processing course:', course.course_id, course.title);
          results.push({
            id: course.course_id,
            type: 'course',
            title: course.title || `Course ${course.course_id}`, // Fallback title
            subtitle: course.subtitle,
            imageUrl: course.image_url,
            category: course.category || 'General',
            pricing: course.pricing,
            includedCourseIds: [] // Courses don't have included courses
          });
        });
      }
    }

    // Fetch bundles
    if (bundleIds.length > 0) {
      console.log('Fetching bundles for cart enrichment:', bundleIds);
      const { data: bundles, error: bundleError } = await supabase
        .from('bundles')
        .select('bundle_id, title, subtitle, image_url, category, pricing, included_course_ids')
        .in('bundle_id', bundleIds);

      if (bundleError) {
        console.error('Failed to fetch bundles:', bundleError);
      } else {
        console.log('Found bundles:', bundles?.length || 0);
        bundles?.forEach(bundle => {
          console.log('Processing bundle:', bundle.bundle_id, bundle.title);
          results.push({
            id: bundle.bundle_id,
            type: 'bundle',
            title: bundle.title || `Bundle ${bundle.bundle_id}`, // Fallback title
            subtitle: bundle.subtitle,
            imageUrl: bundle.image_url,
            category: bundle.category || 'General',
            pricing: bundle.pricing,
            includedCourseIds: bundle.included_course_ids || []
          });
        });
      }
    }

    return NextResponse.json({ products: results })
  } catch (error) {
    console.error('Unexpected error while fetching cart products:', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
