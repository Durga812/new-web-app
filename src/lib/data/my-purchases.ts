// src/lib/data/my-purchases.ts
import 'server-only';
import { supabase } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/stripe_client';
import { 
  EnrollmentItem, 
  OrderHistoryItem, 
  CourseChild, 
  CourseRating 
} from '@/lib/types/my-purchases';

/**
 * Fetch user's enrollments
 */
export async function getUserEnrollments(clerkUserId: string): Promise<EnrollmentItem[]> {
  const { data, error } = await supabase
    .from('user_enrollment')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch enrollments: ${error.message}`);
  }

  return (data || []) as EnrollmentItem[];
}

/**
 * Fetch user's order history
 */
export async function getUserOrderHistory(clerkUserId: string): Promise<OrderHistoryItem[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, payment_intent_id, status, total_amount, currency, created_at')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch order history: ${error.message}`);
  }

  return (data || []) as OrderHistoryItem[];
}

/**
 * Fetch child courses for a bundle using child_course_ids column
 */
export async function getBundleChildCourses(bundleId: string): Promise<CourseChild[]> {
  // Get bundle's child_course_ids
  const { data: bundle, error: bundleError } = await supabase
    .from('bundles')
    .select('child_course_ids')
    .eq('bundle_id', bundleId)
    .single();

  if (bundleError) {
    throw new Error(`Failed to fetch bundle: ${bundleError.message}`);
  }

  const courseIds = bundle?.child_course_ids || [];
  
  if (courseIds.length === 0) {
    return [];
  }

  // Fetch course details
  const { data, error } = await supabase
    .from('courses')
    .select('course_id, name, course_slug')
    .in('course_id', courseIds);

  if (error) {
    throw new Error(`Failed to fetch courses: ${error.message}`);
  }

  return (data || []).map(course => ({
    course_id: course.course_id,
    title: course.name,
    course_slug: course.course_slug
  }));
}

/**
 * Check if user has rated a course
 */
export async function getUserCourseRating(
  clerkUserId: string, 
  courseId: string
): Promise<CourseRating | null> {
  const { data, error } = await supabase
    .from('course_ratings')
    .select('id, course_id, course_rating, feedback')
    .eq('clerk_user_id', clerkUserId)
    .eq('course_id', courseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return null;
  }

  return data as CourseRating | null;
}

/**
 * Submit course rating (one-time only)
 */
export async function submitCourseRating(
  clerkUserId: string,
  courseId: string,
  rating: number,
  feedback: string
): Promise<CourseRating> {
  // Check if already rated
  const existing = await getUserCourseRating(clerkUserId, courseId);
  if (existing) {
    throw new Error('Course already rated');
  }

  const { data, error } = await supabase
    .from('course_ratings')
    .insert({
      clerk_user_id: clerkUserId,
      course_id: courseId,
      course_rating: rating,
      feedback: feedback || null
    })
    .select('id, course_id, course_rating, feedback')
    .single();

  if (error) {
    throw new Error(`Failed to submit rating: ${error.message}`);
  }

  return data as CourseRating;
}

/**
 * Create Stripe billing portal session
 */
export async function createBillingPortalSession(clerkUserId: string): Promise<string> {
  const { data: user, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !user?.stripe_customer_id) {
    throw new Error('User not found or no Stripe customer ID');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/my-purchases`,
  });

  return session.url;
}