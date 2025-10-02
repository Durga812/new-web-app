export type ReviewProductType = 'course' | 'bundle';

export type ReviewRow = {
  id: string;
  user_id?: string | null;
  clerk_user_id?: string | null;
  product_id: string;
  product_type: ReviewProductType;
  rating: number;
  feedback?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
