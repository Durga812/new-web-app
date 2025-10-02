// src/app/actions/review.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitReview(productId: string, rating: number, feedback?: string) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Check if user has already reviewed this product
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingReview) {
      return { success: false, error: 'You have already reviewed this course' };
    }

    // Insert review
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        clerk_user_id: clerkUserId,
        product_id: productId,
        product_type: 'course',
        rating: rating,
        feedback: feedback || null,
      });

    if (insertError) {
      console.error('Failed to submit review:', insertError);
      return { success: false, error: 'Failed to submit review' };
    }

    // Revalidate the enrollments page
    revalidatePath('/my-enrollments');

    return { success: true };
    
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}