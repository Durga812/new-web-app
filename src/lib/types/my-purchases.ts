// src/lib/types/my-purchases.ts
export interface EnrollmentItem {
  id: string;
  clerk_user_id: string;
  purchase_order_id: string | null;
  item_id: string;
  item_name: string;
  item_type: 'course' | 'bundle';
  product_slug: string | null;
  item_enroll_id: string;
  enroll_status: string;
  expires_at: number | null;
  is_expired: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface OrderHistoryItem {
  id: string;
  payment_intent_id: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
}

export interface CourseChild {
  course_id: string;
  title: string;
  course_slug: string;
}

export interface CourseRating {
  id: string;
  course_id: string;
  course_rating: number;
  feedback: string | null;
}