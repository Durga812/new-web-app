// src/app/actions/bundles.ts
'use server';

import { getBundleChildCourses } from '@/lib/data/my-purchases';

export async function getBundleIncludedCourses(bundleId: string) {
  if (!bundleId) {
    return [];
  }

  try {
    return await getBundleChildCourses(bundleId);
  } catch (error) {
    console.error('Failed to fetch bundle courses for cart:', error);
    throw error;
  }
}
