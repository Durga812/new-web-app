// src/lib/data/purchase_data.ts
import 'server-only';
import { supabase } from '@/lib/supabase/server';

export type ActiveEnrollmentItem = {
  item_name: string;
  item_type: 'course' | 'bundle';   // matches public.enrollment_item_type
  product_id: string;               // 8-char code (bundle or course id)
  product_slug: string | null;      // new column
  enroll_id: string | null;         // nullable in schema
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
    .from('user_enrollments')
    .select('item_name,item_type,product_id,product_slug,enroll_id')
    .eq('clerk_user_id', clerkUserId)
    .eq('is_expired', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch active enrollments: ${error.message}`);
  }

  return (data ?? []) as ActiveEnrollmentItem[];
}
