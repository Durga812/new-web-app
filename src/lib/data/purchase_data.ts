// src/lib/data/purchase_data.ts
import 'server-only';
import { supabase } from '@/lib/supabase/server';

export type ActiveEnrollmentItem = {
  item_name: string;
  item_type: 'course' | 'bundle';   // matches public.enrollment_item_type
  item_id: string;               // 8-char code (bundle or course id)
  product_slug: string | null;      // new column
  item_enroll_id: string | null;         // nullable in schema
}; 

/**
 * Fetch active (non-expired) enrollments for a Clerk user.
 * Returns: [{ item_name, item_type, product_id, product_slug, enroll_id }, ...]
 */
export async function getActiveEnrollmentsByClerkId(
  clerkUserId: string
): Promise<ActiveEnrollmentItem[]> {
  if (!clerkUserId) return [];

  const { data, error } = await supabase
    .from('user_enrollment')
    .select('item_name,item_type,item_id,product_slug,item_enroll_id')
    .eq('clerk_user_id', clerkUserId)
    .eq('is_expired', false)
    .order('created_at', { ascending: false });

  if (error) {
    // Gracefully handle missing table or other read errors by returning no enrollments
    console.warn('Warning: getActiveEnrollmentsByClerkId failed:', error.message);
    return [];
  }

  return (data ?? []) as ActiveEnrollmentItem[];
}
